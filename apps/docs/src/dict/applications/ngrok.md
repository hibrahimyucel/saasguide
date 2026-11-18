---
tarih: 2026-11-17
saat: 23:26
konu: "ngrok: Güvenli Ters Tünel ve Geliştirme Ağ Geçidi (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Ağ ve Tünel Servisleri Referansı (Webhook & Geçici Dış Erişim)"
durum: "Tamamlandı"
etiketler: [ngrok, tunneling, reverse-tunnel, webhook, localhost, lexical-database, referans]
---

# ngrok (Reverse Tunnel)

* **Üretici / Geliştirici:** Alan Shreve (Kurucu) & ngrok Inc.
* **Resmi Web Sitesi:** [ngrok.com](https://ngrok.com)

::: info CONCEPT MATRICES
* **Domain:** Ingress-as-a-Service & Secure Reverse Tunneling
* **Superordinate Concept:** Cloud-Hosted Reverse Proxy & Tunneling Gateway
* **Connection Topology:** Outbound Persistent TLS Tunnel from Local Agent to Cloud Edge
* **Primary Use Cases:** Webhook Testing (GitHub/Stripe/Gitea), Mobile Device Preview, NAT/CGNAT Bypass
:::

## 1. Tanım

**ngrok**, yerel bilgisayarda (`localhost`) veya kapalı bir özel ağ arkasında çalışan web sunucularını ve API servislerini; güvenlik duvarı (firewall) ayarı, port yönlendirme veya statik IP gerektirmeden, şifreli bir ters tünel (reverse tunnel) üzerinden anında genel internette erişilebilir HTTPS adreslerine bağlayan bir ağ tüneli ve giriş (ingress) platformudur.

---

## 2. Mimari Rolü ve Temel Prensipleri

**Tailscale** ve **DuckDNS** kalıcı altyapı erişimini sağlarken; geliştirme aşamasında dış servislerden (örneğin GitHub, Stripe veya harici ödeme/kimlik sağlayıcıları) yerel geliştirme makinemize gelen anlık **Webhook** isteklerini test etmek veya projeyi dış bir istemciye hızlıca göstermek için **ngrok** standart tünel aracı olarak kullanılır.

* **Dışa Doğru Kalıcı Bağlantı (Outbound Reverse Tunnel):** Dış dünyadan içeriye port açılmaz. Yerel makinede çalışan `ngrok` istemcisi (agent), ngrok bulut sunucularına dışa doğru (outbound) şifreli bir TLS bağlantısı kurar ve gelen tüm dış trafiği bu tünel üzerinden yerel porta (`localhost:3000`) aktarır.
* **Otomatik HTTPS ve TLS Sonlandırma:** Tünel açıldığı anda `*.ngrok-free.app` gibi geçerli bir TLS sertifikasına sahip genel bir HTTPS adresi tahsis eder; yerel sunucu yalnızca düz HTTP konuşsa bile dış dünya ile uçtan uca şifreli iletişim kurar.
* **Yerel Trafik İnceleyici (Traffic Inspector):** Tünel üzerinden geçen tüm HTTP isteklerini, başlıklarını (headers) ve gövde verilerini `http://127.0.0.1:4040` adresindeki yerel web arayüzünde canlı olarak gösterir ve tek tıkla isteği tekrar oynatma (Replay) imkanı sunar.

---

## 3. Sözlük

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **Reverse Tunnel** | Ters Tünel | Güvenlik duvarı arkasındaki yerel makinenin dışarıdaki bir bulut sunucusuna bağlantı başlatıp, o bağlantı üzerinden dışarıdan gelen istekleri içeri kabul etmesi tekniği. |
| **Ingress-as-a-Service** | Hizmet Olarak Giriş Kapısı | Uygulama sunucusunun önüne ekstra yük dengeleyici, DNS veya TLS yapılandırması kurmadan bulut üzerinden hazır giriş noktası sunan servis modeli. |
| **Webhook** | Olay Geri Çağırma İsteği | Harici bir sistemde (örneğin ödeme onayı veya Git push) bir olay gerçekleştiğinde, belirlenen genel HTTPS adresine otomatik olarak gönderilen HTTP POST bildirimi. |
| **ngrok Agent** | Yerel Tünel İstemcisi | Geliştirici bilgisayarında veya Docker konteynerinde çalışarak yerel port ile ngrok bulut ağı arasındaki şifreli tüneli ayakta tutan komut satırı yazılımı. |
| **Traffic Inspector** | Trafik Denetleyicisi | Tünelden geçen tüm istek ve yanıtları gerçek zamanlı incelemeye ve hata ayıklamaya (debugging) yarayan yerel geliştirici konsolu (`localhost:4040`). |
| **Authtoken** | Kimlik Doğrulama Anahtarı | Yerel `ngrok` istemcisini kullanıcı hesabına bağlayan ve statik alan adı veya tünel politikalarını yetkilendiren gizli anahtar. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

`ngrok` istemcisini yetkilendirmek ve yerel portları genel HTTPS adreslerine bağlamak için kullanılan temel komut seti:

```bash
# ngrok hesabınıza ait kimlik doğrulama anahtarını (authtoken) yerel sisteme kaydeder
ngrok config add-authtoken <NGROK_AUTHTOKEN>

# Yerel 3000 portunda çalışan uygulamayı genel bir HTTPS adresine tüneller
ngrok http 3000

# Yerel Nginx (80 portu) üzerinden özel Host başlığıyla yönlendirme yapar
ngrok http 80 --host-header=rewrite

# Ücretsiz planda hesaba tanımlı kalıcı statik alan adını kullanarak tünel açar
ngrok http --domain=ornek-proje.ngrok-free.app 3000
```

---

## 5. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [ngrok Documentation](https://ngrok.comdocs)
* **Mimari Genel Bakış:** [How ngrok Works](https://ngrok.comdocs/how-ngrok-works/)
