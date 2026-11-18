# Bilgi İşlem Merkezi: Panelsiz Mail Sunucusu (Mailcow + Docker) Kurulum Rehberi

Bu rehber, **RHEL (Red Hat Enterprise Linux)** mimarinize saf Nginx ve Docker kullanarak, harici panellere bağımlı olmadan çalışan, kurumsal ve tamamen bağımsız bir **MailSunucusu (Mailcow)** entegre etmeniz için gereken tüm adımları içerir.

---

## Adım 1: DNS Katmanı & Spama Düşmeme Ayarları (Cloudflare)

Mail sunucunuzun itibarını korumak ve e-postaların gelen kutusuna düşmesini sağlamak için Cloudflare panelinde ilgili domain için aşağıdaki kayıtları oluşturun:

1. **A Kaydı (Mail Alt Alan Adı):**
   * **Tür (Type):** `A`
   * **İsim (Name):** `mail`
   * **IPv4 adresi:** `VPS_IP_ADRESİNİZ`
   * **Proxy status:**  gray (`Gri Bulut - DNS Only`) ⚠️ *Kritik: Mail port trafiğinin Cloudflare proxy'sine takılmaması için kesinlikle gri olmalıdır.*

2. **MX Kaydı (Mail Değişim Kaydı):**
   * **Tür (Type):** `MX`
   * **İsim (Name):** `@`
   * **Mail Server (Hedef):** `mail.siteniz.com`
   * **Öncelik (Priority):** `10`

3. **SPF Kaydı (TXT):**
   * **Tür (Type):** `TXT`
   * **İsim (Name):** `@`
   * **Değer (Value):** `v=spf1 ip4:VPS_IP_ADRESİNİZ ~all`

4. **DMARC Kaydı (TXT):**
   * **Tür (Type):** `TXT`
   * **İsim (Name):** `_dmarc`
   * **Değer (Value):** `v=DMARC1; p=quarantine; pct=100;`

---

## Adım 2: Hosting.com.tr PTR (Reverse DNS) Talebi

Mail sunucunuzun IP adresi ile alan adınızın uyuşması (FCrDNS) maillerin Gmail/Hotmail tarafından engellenmemesi için en kritik şarttır.

* **Aksiyon:** Hosting.com.tr müşteri panelinizden teknik destek talebi (ticket) açarak şu mesajı iletin:
  > *"Merhaba, firmamız bünyesinde bulunan X.X.X.X IP adresli RHEL VPS sunucumuz üzerine kurumsal bir mail yapısı konumlandırıyoruz. E-postaların spama düşmemesi adına, **X.X.X.X** IP adresimiz için Ters DNS (rDNS / PTR) kaydının **mail.siteniz.com** olarak güncellenmesini rica ederiz."*

---

## Adım 3: RHEL Güvenlik Duvarı (Firewalld) Yapılandırması

Mail sunucusunun dış dünya ile haberleşebilmesi ve e-posta protokollerinin çalışabilmesi için RHEL üzerindeki portları açın:

```bash
# Standart ve güvenli mail servis portlarını kalıcı olarak açın
sudo firewall-cmd --permanent --add-service={smtp,smtp-submission,smtps,imap,imaps}

# Mailcow servislerinin özel iletişim kurduğu sieve portunu açın
sudo firewall-cmd --permanent --add-port=4190/tcp

# Güvenlik duvarını yeniden yükleyin
sudo firewall-cmd --reload

# Sunucunun FQDN (Tam Kapsamlı Alan Adı) tanımını gerçekleştirin
sudo hostnamectl set-hostname mail.siteniz.com
```

---

## Adım 4: Docker & Docker Compose Hazırlığı

Önceki rehberde kurduğunuz Docker altyapısının aktifliğini teyit edin ve projeyi sunucuya çekin:

```bash
# Docker servisinin çalıştığından emin olun
sudo systemctl enable docker --now

# Mailcow repository'sini /opt dizinine klonlayın
git clone https://github.com/mailcow/mailcow-dockerized /opt/mailcow-dockerized
cd /opt/mailcow-dockerized

# Yapılandırma scriptini çalıştırın
./generate_config.sh
```
*Script size hostname sorduğunda **mail.siteniz.com** yazıp enter tuşuna basın. Zaman dilimini (Timezone) ise `Europe/Istanbul` seçebilirsiniz.*

---

## Adım 5: Port Çakışmasını Önleme (Nginx & Mailcow Birlikteliği)

Sunucunuzda halihazırda SaaS web sitelerinizi yöneten saf bir Nginx olduğu için, Mailcow'un dahili Nginx konteynerini arka plandaki boş portlara çekmemiz gerekir.

```bash
# Konfigürasyon dosyasını düzenleyin
nano mailcow.conf
```

Aşağıdaki satırları bulun ve değerleri tam olarak bu şekilde güncelleyin:
```ini
HTTP_PORT=8080
HTTP_BIND=127.0.0.1
HTTPS_PORT=8443
HTTPS_BIND=127.0.0.1
```
*Kaydedip kapatın (`Ctrl+O`, `Enter`, `Ctrl+X`).*

Şimdi Mailcow yığınını (stack) indirip arka planda çalıştırın:
```bash
docker compose pull
docker compose up -d
```

---

## Adım 6: Ana Sunucu Nginx Yapılandırması (Ters Proxy)

Gelen `mail.siteniz.com` isteklerini karşılayıp arka planda 8443 portunda çalışan Mailcow yapısına aktarmak için Nginx konfigürasyonunu hazırlayın. 

*(Not: Bu adım, bir önceki rehberde ürettiğiniz Wildcard SSL sertifikası yollarını kullanır).*

```bash
sudo nano /etc/nginx/conf.d/mail.conf
```

İçerisine şu yapılandırmayı yapıştırın:

```nginx
server {
    listen 80;
    server_name mail.siteniz.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mail.siteniz.com;

    # Önceki rehberde Certbot ile üretilen Wildcard SSL Yolları
    ssl_certificate /etc/letsencrypt/live/siteniz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siteniz.com/privkey.pem;

    # SSL Güvenlik Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass https://127.0.0.1:8443;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # Büyük mail ekleri gönderip alabilmek için sınırı artırın
        client_max_body_size 50m;
    }
}
```

Nginx'i test edin ve yeniden başlatın:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Adım 7: DKIM Kaydını Alıp Cloudflare'e Ekleme

1. Tarayıcınızdan `https://mail.siteniz.com` adresine gidin.
2. Varsayılan kullanıcı adı `admin` ve şifre `moohoo` ile giriş yapın *(Güvenliğiniz için ilk girişte bu şifreyi değiştirin).*
3. Üst menüden **Configuration** > **Mail Setup** sekmesine gelin.
4. **Domains** butonuna basarak domaininizi (`siteniz.com`) sisteme ekleyin.
5. Domain eklendikten sonra sağ tarafında bulunan **ARC/DKIM Key** butonuna tıklayın.
6. Panel size `v=DKIM1; k=rsa; p=MIIB...` şeklinde uzun bir şifreli anahtar üretecektir.
7. Bu anahtarı kopyalayın ve **Cloudflare DNS** panelinizde yeni bir kayıt oluşturun:
   * **Tür:** `TXT`
   * **İsim (Host):** `dkim._domainkey`
   * **Değer (Value):** *Mailcow'dan kopyaladığınız kodun tamamı.*

---

## Adım 8: Sistemin Doğrulanması (İtibar Kontrolü)

Her şeyi tamamladıktan sonra sunucunuzun maillerinin kalitesini ve DNS doğruluğunu test etmek için:
1. [Mail-Tester](https://www.mail-tester.com/) sitesine girin.
2. Size verdiği rastgele test e-posta adresini kopyalayın.
3. Kendi kurduğunuz yeni mail panelinden (`https://mail.siteniz.com`) o adrese deneme bir mail atın.
4. Skorunuzun **10/10** veya buna çok yakın olduğunu, PTR ve SPF doğrulamalarının yeşil yandığını teyit edin. 

Sisteminiz artık tamamen hazır!