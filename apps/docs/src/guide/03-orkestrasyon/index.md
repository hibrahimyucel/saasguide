# Orkestrasyon



Chrome Normal Sekme Önbelleğini Temizleme Adımları


1. Sadece O Siteye Ait Önbelleği Hard-Resetleyin

1. Normal sekmede https://docs.localhost adresine git.
2. Klavyenden F12 tuşuna basarak Geliştirici Araçları'nı (Developer Tools) aç.
3. Sol üstteki Yenile (Refresh) butonunun üzerine sağ tıkla.
4. Açılan menüden "Önbelleği Boşalt ve Sert Yeniden Yükle" (Empty Cache and Hard Reload) seçeneğine tıkla.

2. Chrome Yerel HSTS Ayarını Sıfırla

Chrome, yerel domainler için eski SSL yönlendirme kurallarını hafızasında tutar. Bunu silmek için:
1. Chrome adres çubuğuna chrome://net-internals/#hsts yaz ve Enter'a bas.
2. Sayfanın en altındaki "Delete domain security policies" alanına gel.
3. Domain kutusuna sadece localhost yaz ve Delete butonuna bas.
4. Altına docs.localhost yaz ve tekrar Delete butonuna bas.

3. Tarayıcı Soketlerini Kapatıp Aç

1. Adres çubuğuna chrome://net-internals/#sockets yaz.
2. "Flush socket pools" butonuna tıkla.
3. Chrome tarayıcını tamamen kapat (arka planda açık kalmadığından emin ol) ve yeniden aç.


## Docker & Nginx

Uygulama ve servis sayısı arttıkça işlemleri senkronize etmek ve geliştirme sürecinde tüm servisleri çalıştırıp test etmek sorun olabilir.

Bunun önüne geçmek için docker ortamında çalıştırılan, nginx tarafından yönlendirilen bir yapı kullanacağız.
Tüm servisleriniz uygulama geliştirme sırasında çalışır durumda olabilir. Uygulama ve API uçlarına ip:port bilgisi ile değil doğrudan servis adı ile erişebilirsiniz. 

Docker imajlarını kullanarak servislerinizin farklı versiyonlarını aynı anda çalıştırıp test edebilirsiniz. `git pull` ile kodlarınızı tekrar derleyip çalıştırmak yerine stabil sürümlerden birini kullanabilirsiniz. Bu monorepo yapınıza önemli ölçüde derinlik kazandırır.

Veritabanı gibi harici servisleri de yalıtılmış docker ağında çalıştırarak sistem yapılandırma süreçleri ile vakit kaybetmezsiniz.

Docker ile servislerin kaynak kullanımını yöneterek geliştirme ortamınızın yükünü azaltabilirsiniz.

Yayın (Production-Deployment) ortamı ile geliştirme ortamı (Development) farklı şekilde çalışır. Bu aşamada geliştirme ortamında çalışıyoruz.
 
[HMR - Hot Modüle Reload](/dict/hmr)


## Docker Komutları



 Çalışan tüm konteynerleri listelemek için

```bash
docker ps
```
---
 Çalışan tüm konteynerleri tek seferde durdurmak için

```bash
docker stop $(docker ps -a -q)
```
---
 Durdurulan tüm konteynerleri silmek için

```bash
docker rm $(docker ps -a -q)
```
---
 Bir yapılandırmayı hazırlayıp başlatma
```bash
docker compose -f docker-compose.dev.yml up -d --build
```
---

 Bir yapılandırmayı durdurma
```bash
docker compose -f docker-compose.dev.yml down
```

::: info `docker compose` parametreleri
`-f` file : takip eden dosyayı kullan

`-d` detach : kullanmazsanız docker terminalde kalır

`-up` çalıştır

`-down` durdur 

`-build` yeniden hazırla
:::


::: warning `build` sırasında hata alıyorsanız bu muhtemelen dosya yolları ile ilgilidir.

`502 Bad Gateway` hatası, nginx yapılandırması veya servislerin durumu ile ilgilidir. 

Servis adları uyuşmmuyor olabilir.

Servis çalışmıyor olabilir.

Tarayıcı belleğini temizlemeniz gerekebilir. F12 - Geliştirici araçları -> Application -> Storage verilerini silebilirsiniz.
:::

::: danger Eski build'lerden kalan imajlar, kullanılmayan ağlar ve durdurulmuş konteynerler diskinizde yer kaplar ve port çakışmalarına neden olabilir. Docker'ın yerleşik temizlik komutuyla her şeyi sıfırlayabilirsiniz. Sadece geliştirme ortamında kullanın.
 
```bash
docker system prune -a --volumes
```

:::

