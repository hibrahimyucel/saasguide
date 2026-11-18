---
tarih: 2026-11-17
saat: 23:44
konu: "Dex: OpenID Connect (OIDC) ve Merkezi SSO Kimlik Sağlayıcısı (Tanıtım, Referans ve Sözlük)"
baglam: "apps/docs / Kimlik Doğrulama ve Erişim Yönetimi (SSO / OIDC Provider)"
durum: "Tamamlandı"
etiketler: [dex, sso, oidc, oauth2, identity-provider, authentication, lexical-database, referans]
---

# Dex (OIDC - SSO)

* **Üretici / Geliştirici:** CoreOS (Kurucu) & Cloud Native Computing Foundation (CNCF Sandbox Projesi)
* **Resmi Web Sitesi:** [dexidp.io](https://dexidp.io)

::: info CONCEPT MATRICES
* **Domain:** Identity and Access Management (IAM) & Single Sign-On (SSO)
* **Superordinate Concept:** Federated OpenID Connect (OIDC) Identity Provider (IdP)
* **Implementation Language:** Go (Golang) — Stateless Connector Architecture
* **Supported Protocols & Connectors:** OAuth 2.0, OpenID Connect (OIDC), LDAP, GitHub, Google, SAML 2.0, Local Password DB
:::

## 1. Tanıtım

**Dex**, Go diliyle geliştirilmiş açık kaynaklı bir **OpenID Connect (OIDC)** kimlik sağlayıcısıdır.
 (Identity Provider); farklı kimlik kaynaklarını (GitHub, Google, LDAP veya yerel kullanıcı veritabanı) tek bir standart OIDC arayüzü arkasında birleştirerek tüm uygulamalara merkezi Tek Oturum Açma (**SSO Single Sing On**) altyapısı sunar.

---

## 2. Mimari Rolü ve Temel Prensipleri

 Kullanıcıların **Gitea**, **MinIO Konsolu** ve geliştirdiğimiz uygulamalara ayrı ayrı şifrelerle girmesi yerine tek bir merkezi kimlik kapısından (`auth.projeadi.duckdns.org`) oturum açmasını sağlar. 

 Google ve Github gibi diğer servis sağlayıcıları üzerinden kimlik doğrulaması yapabildiği için sadece servisleriniz ile kullanıcı hesaplarını köprüleyecek şekilde yapılandırabilirsiniz. 
 
 Hesap yönetimi ve diğer gelişmiş özellikleri sisteminize eklemek için kendi servisinizle değiştirmelisiniz. 

---

## 3. Sözlük Veritabanı (Lexical Database)

| Terim | Teknik Karşılığı | Tanım ve Bağlam |
| :--- | :--- | :--- |
| **SSO (Single Sign-On)** | Tek Oturum Açma | Kullanıcının tek bir kimlik doğrulama işlemiyle yetkili olduğu tüm uygulamalara (Gitea, MinIO, SaaS App) tekrar şifre girmeden erişebilmesi. |
| **OIDC (OpenID Connect)** | Kimlik Doğrulama Katmanı | OAuth 2.0 yetkilendirme protokolünün üzerine inşa edilen ve uygulamaların kullanıcı kimliğini doğrulamasını sağlayan modern standart. |
| **IdP (Identity Provider)** | Kimlik Sağlayıcı | Kullanıcı kimliklerini doğrulayan ve istemci uygulamalara güvenilir kimlik jetonları üreten merkezi otorite (Dex). |
| **Connector** | Kimlik Bağlayıcısı | Dex'in arka planda kullanıcı doğrulaması için bağlandığı kaynak modül (GitHub OAuth, LDAP, Google veya yerleşik `local` veritabanı). |
| **Static Client** | Kayıtlı İstemci Uygulama | Dex yapılandırma dosyasında (`config.yaml`) tanımlanan, `client_id`, `client_secret` ve geri dönüş adresine (`redirectURI`) sahip hedef uygulama. |
| **ID Token (JWT)** | Kimlik Jetonu | Kullanıcının kimlik bilgilerini (claims) barındıran ve Dex'in özel anahtarıyla imzalanmış JSON Web Token belgesi. |
| **Discovery Endpoint** | Keşif Uç Noktası | İstemci uygulamaların Dex'in açık anahtarlarını ve yetkilendirme adreslerini otomatik öğrendiği `/.well-known/openid-configuration` adresi. |

---

## 4. Temel Kullanım Referansı (Cheatsheet)

### OIDC Yapılandırma Doğrulama
```bash
# Dex OIDC Discovery uç noktasının ayakta olduğunu ve uç noktaları yayınladığını test eder
curl -s https://duckdns.org | jq .

# Dex konteynerinin yapılandırma hatalarını ve kimlik doğrulama loglarını izler
docker logs -f dex-sso
```

### Örnek Statik İstemci (Gitea / MinIO Entegrasyon Şablonu)
```yaml
staticClients:
  - id: gitea-client
    redirectURIs:
      - 'https://git.example.duckdns.org'
    name: 'Gitea SSO'
    secret: 'GIZLI_CLIENT_SECRET_ANAHTARI'
```


## 5. Google OAuth 2.0 Bağlayıcı (Connector) Entegrasyonu

Dex kimlik sağlayıcısı (`auth.projeadi.duckdns.org`), kullanıcı veritabanını kendi üzerinde tutmak yerine **Google OAuth 2.0** altyapısını bir üst kimlik sağlayıcı (Upstream IdP) olarak kullanabilir. Bu entegrasyon sayesinde tüm iç servisler (`Gitea`, `MinIO` vb.) tek bir Google oturumu üzerinden yetkilendirilir.

### Mimari ve Ağ Çalışma Prensibi
* **Tarayıcı Tabanlı Yönlendirme:** Google OAuth akışında Google sunucuları doğrudan sunucumuza istek göndermez; kimlik doğrulama kodu (`authorization code`) kullanıcının tarayıcısı üzerinden Dex'e iletilir.
* **Erişim Politikası:** DuckDNS alan adınız (`*.projeadi.duckdns.org`) Tailscale IP (`100.x.y.z`) adresine yönlendirilmişse bu giriş akışı yalnızca **Tailscale VPN** ağı içinde çalışır. 

---

### 1. Google Cloud Console Yapılandırması

1. **Google Cloud Console** üzerinde **APIs & Services > OAuth consent screen** adımından uygulama adını, yetkili e-posta adresini ve `openid`, `profile`, `email` kapsamlarını (scopes) tanımlayın.
2. **Credentials > Create Credentials > OAuth client ID** yolunu izleyerek uygulama türünü **Web application** olarak seçin.
3. **Authorized redirect URIs** alanına Dex `issuer` adresinin sonuna `/callback` ekleyerek tanımlayın:
   ```text
   https://auth.example.duckdns.org/callback
   ```
4. Oluşturulan **Client ID** ve **Client Secret** değerlerini güvenli bir şekilde kaydedin.

---

### 2. Ortam Değişkenleri (`.env`)

Docker Compose bulunduğu dizindeki `.env` dosyasını otomatik okur, ancak bu değişkenlerin Dex konteynerinin içine aktarılması için `docker-compose.yml` içinde `env_file` veya `environment` bloğunun tanımlanması şarttır:

```yaml
services:
  dex:
    image: ghcr.io/dexidp/dex:latest
    container_name: dex
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./config.yaml:/etc/dex/config.docker.yaml:ro
      - dex_data:/var/dex
    ports:
      - "127.0.0.1:5556:5556"
```

Hassas kimlik bilgilerini doğrudan yapılandırma dosyalarına yazmamak için Dex konteynerinin okuduğu `.env` dosyasına aşağıdaki değişkenleri ekleyin. Ayrıca `.env` dosyalarının `.gitignore` ve `.dockerignore` dosyalarında tanımlı olduğundan emin olun.  

```env
GOOGLE_CLIENT_ID="google-cloud-uzerinden-alinan-client-id"
GOOGLE_CLIENT_SECRET="google-cloud-uzerinden-alinan-client-secret"
```

---

### 3. Dex Yapılandırması (`config.yaml`)

Dex yapılandırma dosyasındaki `connectors` bloğuna `google` bağlayıcısını ekleyin. Dex, `$` ile başlayan değerleri konteyner ortam değişkenlerinden otomatik olarak okur:

```yaml
issuer: https://duckdns.org

storage:
  type: sqlite3
  config:
    file: /var/dex/dex.db

web:
  http: 0.0.0.0:5556

connectors:
  - type: google
    id: google
    name: Google
    config:
      clientID: $GOOGLE_CLIENT_ID
      clientSecret: $GOOGLE_CLIENT_SECRET
      redirectURI: https://auth.example.duckdns.org/callback
      
      # Opsiyonel: Yalnızca belirli Google Workspace alan adlarına izin vermek için aktif edin
      # hostedDomains:
      #   - sirketalanadiniz.com
```

---

### 4. Servis Yeniden Başlatma ve Doğrulama

Yapılandırma değişikliklerinin geçerli olması için Dex konteynerini yeniden başlatın ve OIDC keşif (discovery) uç noktasını doğrulayın:

```bash
# Dex servisini yeniden başlatma
docker compose restart dex

# OIDC uç noktasının ayakta olduğunu doğrulama
curl -I https://auth.example.duckdns.org/.well-known/openid-configuration
```

**Doğrulama Kriteri:** Komut çıktısında `HTTP/2 200` yanıtı alınmalı ve bağlı bir istemci (örneğin Gitea veya MinIO) üzerinden giriş ekranına gidildiğinde **"Log in with Google"** seçeneği görünmelidir.


## 6. Resmi Kaynaklar ve Referanslar

* **Resmi Dokümantasyon:** [Dex Identity Documentation](https://dexidp.iodocs/)
* **Connector Yapılandırma Rehberi:** [Dex Authentication Connectors](https://dexidp.iodocs/connectors/)
