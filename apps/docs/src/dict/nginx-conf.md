# nginx conf

Bu kurgu, Nginx'in bir trafik polisi, VitePress'in ise içeride üretim yapan bir fabrika gibi çalıştığı bir senaryodur.
1. Trafik Yönlendirme ve Karar Mekanizması
resolver 127.0.0.11 valid=5s;
Anlamı: Docker'ın dahili DNS sunucusudur.
Görevi: Nginx'e "Eğer bir konteyner adına (Örn: vitepress_docs_dev) gitmek istersen, onun o anki IP adresini bu DNS sunucusuna sor ve öğrendiğin IP'yi 5 saniye boyunca hafızanda tut" talimatını verir. Docker konteynerleri yeniden başladığında IP adresleri değiştiği için bu dinamik keşif zorunludur.
map $http_host $backend_target { ... }
Anlamı: Akıllı bir yönlendirme (routing) tablosudur.
Görevi: Tarayıcının adres çubuğuna yazılan domain adına ($http_host) bakar ve trafiğin hangi Docker konteynerine gideceğine karar verir:
Eğer docs.localhost yazdıysan, hedefi http://vitepress_docs_dev:5173 yapar.
Eğer hiçbir kurala uymuyorsa (default), trafiği güvenli bir şekilde 127.0.0.1:80 (kendi HTTP portuna) yönlendirir.
2. HTTP'den HTTPS'e Güvenlik Zorlaması
return 301 https://$host$request_uri;
Anlamı: Kesin ve kalıcı yönlendirmedir (Permanent Redirect).
Görevi: Birisi siteye güvensiz şekilde (http://docs.localhost) girmeye çalışırsa, Nginx onu anında yakalar ve güvenli adrese (https://docs.localhost) fırlatır. Tarayıcı da bunu hafızasına alır.
ssl_certificate ve ssl_certificate_key
Anlamı: Dijital kimlik kartlarıdır (mkcert ile üretilen).
Görevi: Nginx bu dosyaları kullanarak tarayıcıya şunları kanıtlar: "Ben gerçekten senin aradığın localhost'um ve aramızdaki tüm veri akışını şifreliyorum." Tarayıcı da bu sayede güvenli (yeşil kilit) moduna geçer.
3. Canlı Bağlantı ve VitePress Köprüsü (Location /)
VitePress, modern bir JavaScript (Vite) aracıdır ve geliştirme modundayken Hot Module Replacement (HMR) kullanır. Yani sen kod yazıp kaydettiğin an, tarayıcı sayfayı yenilemeden değişiklik ekrana yansır. Aşağıdaki ayarlar tam olarak bu sihrin çalışmasını sağlar:
proxy_pass $backend_target;
Görevi: Trafiği Nginx üzerinden alıp, map tablosunda bulduğu VitePress konteynerine aynen paslar.
proxy_set_header Host $http_host;
Görevi: Tarayıcının orijinal olarak aradığı alan adını (Örn: docs.localhost) bozmadan arkadaki VitePress'e iletir. Eğer bunu iletmezsek VitePress hangi domainden istek geldiğini anlayamaz ve yönlendirme hataları oluşur.
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
Anlamı: WebSocket Tüneli açma komutlarıdır (En Kritik Kısım).
Görevi: Standart web istekleri tek seferliktir (istek atılır, yanıt alınır ve bağlantı kapanır). Ancak VitePress'in canlı güncelleme yapabilmesi için tarayıcıyla arasında sürekli açık kalan bir tünel (WebSocket) olmalıdır. Bu üç satır, Nginx'e "Gelen bağlantıyı kesme, onu bir WebSocket tüneline yükselt (upgrade) ve açık tut" der. Eğer bu satırlar olmazsa, VitePress sürekli hata verir ve canlı kod güncellemesi çalışmaz.
4. Hata Yakalama (Hata Sayfası)
proxy_intercept_errors on;
error_page 502 503 504 = @konteyner_yok;
Görevi: Eğer arkadaki VitePress konteyneri çöktüyse, kapalıysa veya henüz başlatılıyorsa; Nginx tarayıcıya çirkin, beyaz bir "Nginx 502 Bad Gateway" hatası göstermez. Hatayı kendi yakalar (intercept) ve senin alt tarafta tanımladığın temiz, açıklayıcı metin mesajını ekrana basar.

