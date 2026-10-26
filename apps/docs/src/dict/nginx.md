
# Nginx

## Yüksek Performanslı Web Sunucusu
**Nginx**, yüksek eşzamanlılık (concurrency) kapasitesi, düşük hafıza kullanımı ve kararlılığı ile bilinen, açık kaynaklı bir **HTTP web sunucusu** ve **tersine vekil sunucusudur (reverse proxy)**. Apache gibi her isteğe yeni bir iş parçacığı atayan (thread-per-connection) sunucuların aksine, asenkron ve **olay güdümlü (event-driven)** bir mimari kullanır.

## Rol ve İşlevler
*   **Tersine Vekil Sunucu (Reverse Proxy):** İstemcilerden gelen talepleri karşılayıp arka plandaki uygulama sunucularına (örneğin Node.js uygulamasına) yönlendiren ve dönen yanıtı istemciye ileten aracı katmandır. Güvenlik ve soyutlama sağlar.
*   **Yük Dengeleme (Load Balancing):** Gelen yoğun trafiği önceden tanımlanmış algoritmalara göre (Round Robin, Least Connections vb.) birden fazla backend sunucusuna dağıtarak sistemin kesintisiz çalışmasını sağlar.
*   **Statik İçerik Sunumu:** VitePress gibi araçlar tarafından derlenen HTML, CSS ve JavaScript dosyalarını diskten doğrudan okuyarak çok düşük gecikme süreleriyle istemciye servis eder.

