
# `9.1.3` Orkestrasyon


İlk projemiz dökümanlarımız için [Vitepress SSG](https://vitepress.dev/) ile hazırlayacağımız statik bir site olacak. İlk adımda sadece temel projeyi oluşturup geliştirme ortamımızı yapılandırcağız.

Bu proje üzerinden geliştirme ortamımızı nasıl yöneteceğimizi göreceğiz. 

---
Önce projeyi `terminal`den `npm` ile çalıştıracağız. 

`docker compose` ile geliştirme servisini ayağa kaldırıp `terminal`'den bağımsız olarak sürekli aktif kalmasını sağlayacağız.

Geliştirme servisimizi (vitepress dev server) Nginx servisimize bağlayacağız.

Sitelerimiz (frontend) için *build* klasörü oluşturup, yayına hazır halini bu klasör içine kopyalatacağız.

Proje dosyalarımız, **docker** ve **Nginx** temel bilgileri




