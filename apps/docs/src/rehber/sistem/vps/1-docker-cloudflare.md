---
title: "Docker Engine, Çift Ağ (Dual-NIC) ve Tüm DNS Kayıtları"
description: "pr2cloud canlı sunucu (prod) için Docker CE kurulumu, pr2_edge_net ve pr2_internal_net izolasyonu, /opt/pr2cloud dizin izinleri, önceden DKIM üretimi ve tek seferde Cloudflare DNS Zone kurulumu."
outline: [2, 3]
sidebarTitle: "Docker, Ağ & Cloudflare DNS"
index: 303
isContent: true
hidden: false
status: "published"
tags: ["pr2cloud", "prod", "docker", "dual-nic", "cloudflare", "dns", "dkim", "spf", "dmarc"]
---

# Docker Engine, Çift Ağ (Dual-NIC) ve Tüm DNS Kayıtları

> **Ön Bilgi:** Bu rehber; AlmaLinux 9 işletim sistemi, Tailscale Mesh VPN ve `firewalld` güvenlik katmanı tamamlandıktan sonra konteyner çalışma zamanını, izole sanal ağları, kalıcı veri dizinlerini ve web + kurumsal e-posta için gerekli **tüm DNS kayıtlarını tek seferde** oluşturma adımlarını içerir.

---

## Adım 1: Docker Engine ve Docker Compose Kurulumu

AlmaLinux 9 üzerinde çakışan eski paketleri temizleyip resmi Docker CE deposunu tanımlayın ve `pr2admin` kullanıcısını `docker` grubuna ekleyin:

```bash
# 1. Çakışan paketleri temizleme
sudo dnf remove -y podman buildah docker docker-engine docker.io containerd runc

# 2. Resmi Docker CE deposunu ekleme ve kurulum
sudo dnf install -y yum-utils
sudo yum-config-manager --add-repo https://docker.com

sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker

sudo usermod -aG docker \$USER
newgrp docker
```

---

## Adım 2: Çift Ağ (Dual-NIC) İzolasyon Ağlarının Oluşturulması

Ters vekil (`Nginx`) ile iç veri katmanını (`MariaDB`, `MinIO`) birbirinden kesin olarak ayırmak için iki adet harici Docker sanal ağı oluşturun:

```bash
# Kenar ağı: Nginx ters vekil ve dışa açık servis uçları için
docker network create pr2_edge_net

# İç ağ: Veritabanı ve iç servis haberleşmesi için (dış internet çıkışı kapalı)
docker network create --internal pr2_internal_net
```

---

## Adım 3: `/opt/pr2cloud` Dizin Hiyerarşisi ve Konteyner İzinleri

Yapılandırma dosyaları (`prod/`) ile çalışma zamanı kalıcı verilerini (`data/`) birbirinden ayırın ve farklı UID ile çalışan konteynerlerin (`MariaDB` UID `999`, `Stalwart` UID `2000`) yazma hatası almaması için sahiplik izinlerini tanımlayın:

```bash
# 1. Ana dizin ağacını oluştur
sudo mkdir -p /opt/pr2cloud/{prod,data,backups}
sudo chown -R pr2admin:pr2admin /opt/pr2cloud

mkdir -p /opt/pr2cloud/prod/{nginx/conf.d,mariadb,scripts}
mkdir -p /opt/pr2cloud/data/{minio,mariadb,stalwart/{etc,data,dkim},snappymail,certs}

# 2. Özel kullanıcı kimliği (UID) ile çalışan servislerin veri dizini sahiplikleri
sudo chown -R 999:999 /opt/pr2cloud/data/mariadb
sudo chmod 750 /opt/pr2cloud/data/mariadb

sudo chown -R 2000:2000 /opt/pr2cloud/data/stalwart
```

---

## Adım 4: Çift DKIM Anahtar Çiftlerinin (RSA + Ed25519) Önceden Üretilmesi

Cloudflare DNS panelini kurulum boyunca **yalnızca bir kez** açıp tüm kayıtları tek seferde aktarmak için **RSA-2048** ve **Ed25519** DKIM anahtarlarını terminalde önceden üretin:

```bash
# 1. Özel anahtarları (Private Key) üret
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /opt/pr2cloud/data/stalwart/dkim/rsa.key 2>/dev/null
openssl genpkey -algorithm Ed25519 -out /opt/pr2cloud/data/stalwart/dkim/ed25519.key 2>/dev/null

sudo chown -R 2000:2000 /opt/pr2cloud/data/stalwart/dkim
chmod 600 /opt/pr2cloud/data/stalwart/dkim/*.key

# 2. Cloudflare DNS için tek satırlık Public Key (p=...) çıktılarını ekrana yazdır
echo "--- RSA PUBLIC KEY ---"
openssl pkey -in /opt/pr2cloud/data/stalwart/dkim/rsa.key -pubout -outform DER 2>/dev/null | base64 -w0 && echo ""

echo "--- ED25519 PUBLIC KEY ---"
openssl pkey -in /opt/pr2cloud/data/stalwart/dkim/ed25519.key -pubout -outform DER 2>/dev/null | tail -c 32 | base64 -w0 && echo ""
```

---

## Adım 5: Tüm Cloudflare DNS Kayıtlarının Tek Seferde Aktarılması

Yukarıda ürettiğiniz iki public key değerini ve sunucu bilgilerinizi aşağıdaki kutulara girin; oluşan BIND Zone çıktısını tek seferde Cloudflare'e aktarabilirsiniz:

<DynamicSnippet title="Cloudflare DNS Zone Oluşturucu">

```bind
;; 1. Temel Alan Adı ve Alt Alan Adı Yönlendirmeleri (A Kayıtları - DNS Only)
<-DOMAIN->. 300 IN A <-VPS_PUBLIC_IP->
*.<-DOMAIN->. 300 IN A <-VPS_PUBLIC_IP->
mail.<-DOMAIN->. 300 IN A <-VPS_PUBLIC_IP->

;; 2. Gelen E-Posta Sunucusu (MX Kaydı)
<-DOMAIN->. 300 IN MX 10 mail.<-DOMAIN->.

;; 3. Gönderici Politikası ve Raporlama (SPF & DMARC)
<-DOMAIN->. 300 IN TXT "v=spf1 a mx ip4:<-VPS_PUBLIC_IP-> ~all"
_dmarc.<-DOMAIN->. 300 IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@<-DOMAIN->; pct=100; adkim=s; aspf=s"

;; 4. Çift DKIM İmzaları (Adım 4'te Üretilen Public Key Değerleri)
v1-rsa._domainkey.<-DOMAIN->. 300 IN TXT "v=DKIM1; k=rsa; p=<-DKIM_RSA_PUBLIC_KEY->"
v1-ed25519._domainkey.<-DOMAIN->. 300 IN TXT "v=DKIM1; k=ed25519; p=<-DKIM_ED25519_PUBLIC_KEY->"
```

</DynamicSnippet>

::: tip Cloudflare Toplu İçe Aktarma (Import) ve Proxy Kuralı
1. **Tek Tıkla İçe Aktarma:** Yukarıdaki bloğu sağ üstteki kopyala butonuyla alıp bilgisayarınızda `dns-records.txt` dosyasına kaydedin. Cloudflare panelinde **DNS › Records › Import and Export › Import DNS records** adımıyla dosyayı yükleyin.
2. **Proxy (Turuncu Bulut) Kuralı:** Yalnızca Tailscale VPN (`allow 100.64.0.0/10;`) üzerinden erişilecek yönetim panellerinin (`db`, `s3-console`, `mail`) `403 Forbidden` hatasına düşmemesi ve SMTP/IMAPS trafiğinin kesilmemesi için tüm kayıtların **DNS Only (Gri Bulut)** olarak kaldığından emin olun.
3. **Ters DNS (PTR / rDNS):** VPS sağlayıcınızın müşteri panelinden `<-VPS_PUBLIC_IP->` adresinin **PTR (Reverse DNS)** kaydını `mail.<-DOMAIN->` olarak tanımlayın veya destek biriminden talep edin. 
:::

---

## Doğrulama Kontrolleri

Sunucunun yerel DNS önbelleğine takılmadan doğrudan `1.1.1.1` üzerinden tüm kayıtların küresel yayılımını doğrulayın:

<DynamicSnippet title="DNS Yayılım Doğrulama Parametreleri">

```bash
sudo dnf install -y bind-utils

# 1. A ve MX Kayıtları
dig @1.1.1.1 +short A <-DOMAIN->
dig @1.1.1.1 +short MX <-DOMAIN->

# 2. SPF, DMARC ve Çift DKIM Kayıtları
dig @1.1.1.1 +short TXT <-DOMAIN->
dig @1.1.1.1 +short TXT _dmarc.<-DOMAIN->
dig @1.1.1.1 +short TXT v1-rsa._domainkey.<-DOMAIN->
dig @1.1.1.1 +short TXT v1-ed25519._domainkey.<-DOMAIN->

# 3. Ters DNS (PTR / rDNS) Kontrolü
dig @1.1.1.1 +short -x <-VPS_PUBLIC_IP->
```

</DynamicSnippet>
