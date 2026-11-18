# 🌐 Gateway (NGINX)

Bu dizin, monorepo ekosistemindeki tüm mikroservislere ve ön yüz (frontend) uygulamalarına gelen istekleri tek bir merkezden karşılayan, yönlendiren ve güvenliğini sağlayan **NGINX API Gateway / Ters Proxy (Reverse Proxy)** yapılandırmasını barındırır.

### 📁 Klasör Yapısı ve Açıklamalar

*   **`conf.d/`**: Mikroservis ve uygulama bazlı yönlendirme kurallarını (`proxy_pass`) içeren bağımsız yapılandırma dosyalarının bulunduğu klasördür.
    *   `auth.conf`: Kimlik doğrulama (auth) servisine giden isteklerin kurallarını içerir.
    *   `api.conf`: Ana backend API servislerine yönlendirme şemalarını barındırır.
    *   `web.conf`: Ön yüz (frontend) uygulamalarına giden trafiği yönetir.
*   **`certs/`** *(veya `ssl/`)*: Güvenli HTTPS bağlantısı için gerekli olan SSL/TLS sertifikalarını (`.crt`) ve özel anahtarları (`.key`) barındıran dizindir.
*   **`nginx.conf`**: Gateway sunucusunun en üst düzey ana konfigürasyon dosyasıdır. Genel HTTP blok ayarları, log formatları, sıkıştırma (gzip) ve bağlantı limitleri burada tanımlanır.
*   **`upstream.conf`**: Monorepo içindeki servislerin veya Docker konteynerlerinin ağ üzerindeki adreslerini gruplayarak yük dengeleme (load balancing) havuzlarını tanımlar.
*   **`Dockerfile`**: NGINX Gateway sunucusunun Docker imajını oluşturan talimatları içerir. Konfigürasyonları imaj içine kopyalar ve `80/443` portlarını dış dünyaya açar.

### 🛠️ Temel Görevleri

1.  **Ters Proxy (Reverse Proxy):** İstemcilerden gelen istekleri mimariyi dışarıya açmadan arkadaki doğru mikroservise iletir.
2.  **Yük Dengeleme (Load Balancing):** Aynı servisin birden fazla replikası varsa, trafiği bu replikalar arasında eşit veya ağırlıklı olarak dağıtır.
3.  **SSL/TLS Sonlandırma:** HTTPS trafiğini burada sonlandırarak arkadaki servislerin SSL yükünü hafifletir ve iç ağda HTTP ile haberleşmelerini sağlar.
4.  **Güvenlik ve Sınırlandırma (Rate Limiting):** API uçlarına gelebilecek DDoS veya kötü niyetli bot saldırılarını engellemek için istek limitleri uygular.

  
  
  
