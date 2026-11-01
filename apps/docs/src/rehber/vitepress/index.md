
# `2.` Dökümantasyon

İlk projemiz dökümanlarımız için [Vitepress SSG](https://vitepress.dev/) ile hazırlayacağımız statik bir site olacak.

Temel işlemleri tamamladığımızda sadece markdown dosyaları oluşturup-düzenleyerek dökümantasyonu güncel tutabileceğiz. 

Sitemizi statik olarak Nginx servisimize bağlayacağız.

Geliştirme ortamımızın Docker entegrasyonunu yapacağız. Kök dizinde `pnpm dev --filter docs` komutu yerine proje klasörümüzde `docker compose up` komutunu kullanabileceğiz.

github-Workflows ile sitemizi github-Pages üzerinde yayınlayacağız.




