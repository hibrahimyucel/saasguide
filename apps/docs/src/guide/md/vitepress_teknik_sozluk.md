# Monorepo, Devops ve VitePress Teknolojileri Sözlüğü

Bu dökümantasyon; modern yazılım mimarilerinde sıklıkla kullanılan paket yönetim sistemleri, sürüm kontrol mekanizmaları, konteynerleştirme teknolojileri ve statik site oluşturucularına ait temel kavramları akademik ve teknik bir perspektifle açıklamaktadır.

---

## 1. Node.js
### 1.1. Tanım ve Mimari
**Node.js**, Chrome'un V8 motoru üzerine inşa edilmiş, açık kaynaklı ve platformlar arası bir **JavaScript çalışma zamanı ortamıdır (runtime environment)**. Geleneksel olarak tarayıcı tarafında (client-side) koşan JavaScript'in, sunucu tarafında (server-side) asenkron ve ölçeklenebilir ağ uygulamaları geliştirmek üzere yürütülmesini sağlar.

### 1.2. Çekirdek Özellikler
*   **Olay Güdümlü ve Engellemeyen Girdi/Çıktı (Event-Driven, Non-Blocking I/O):** Node.js, eşzamanlı (concurrency) işlemleri yönetmek için tek bir iş parçacığı (**Single-Thread**) kullanır. Ağ istekleri veya dosya okuma işlemleri gibi Girdi/Çıktı operasyonları, arka plandaki thread havuzuna (Worker Pool) devredilir ve ana thread engellenmeden (non-blocking) çalışmaya devam eder.
*   **Olay Döngüsü (Event Loop):** Node.js mimarisinin kalbidir. Tamamlanan asenkron işlemlerin geri çağırım fonksiyonlarını (callbacks) sürekli olarak dinleyen ve execution stack boşaldığında bunları sırayla çalıştıran döngüsel bir mekanizmadır.

### 1.3. Paket Yönetimi
Node.js ekosistemi, harici kütüphanelerin ve bağımlılıkların yönetimi için modüler bir yapı sunar. Bu yapının merkezinde, dünyanın en büyük yazılım kayıt defteri (registry) olan **NPM (Node Package Manager)** ile alternatif modern çözümler olan **Yarn** ve **PNPM** yer alır.

---

## 2. Monorepo (Çoklu Paket Yönetimi)
### 2.2. Mimari Yaklaşım
**Monorepo (Monolithic Repository)**, birden fazla bağımsız projenin, mikro servisin veya kütüphanenin mantıksal olarak ayrıştırılmış şekilde **tek bir Git deposu (repository)** içinde barındırıldığı yazılım geliştirme stratejisidir. Geleneksel çoklu depo (Polyrepo) yaklaşımının getirdiği kod tekrarı ve bağımlılık senkronizasyonu sorunlarına çözüm olarak geliştirilmiştir.

### 2.2. Çalışma Alanları (Workspaces)
Monorepo yönetim araçlarının (PNPM Workspaces, Yarn Workspaces, Turborepo) temel bileşenidir. Alt projelerin (`packages/`) bağımlılıklarını izole ederken, birbirlerine yerel sembolik bağlantılarla (**symlink**) bağlanmalarını sağlar. Böylece bir pakette yapılan değişiklik, onu kullanan diğer paket tarafından derleme (build) aşamasında anında referans alınabilir.

### 2.3. Avantaj ve Dezavantaj Analizi
*   **Avantajlar:** Tek bir yapılandırma (CI/CD, Eslint, Prettier) yönetimi, atomik commit'ler (tek commit ile tüm projeleri güncelleyebilme), projeler arası yüksek kod paylaşımı.
*   **Dezavantajlar:** Depo boyutunun aşırı büyümesi (git clone sürelerinin uzaması), karmaşık CI/CD boru hatları (pipeline) gereksinimi ve sıkı erişim yetkilendirmesi zorluğu.

---

## 3. Git
### 3.1. Dağıtık Sürüm Kontrol Sistemi
**Git**, yazılım geliştirme süreçlerinde kaynak kod değişikliklerini zaman damgalı olarak kaydeden, **dağıtık bir sürüm kontrol sistemidir (DVCS)**. Her geliştirici, projenin tüm geçmişini barındıran yerel bir kopyaya (clone) sahiptir; bu da merkezi bir sunucuya bağımlılığı azaltarak çevrimdışı çalışabilmeyi ve yüksek performansı beraberinde getirir.

### 3.2. Veri Yapısı ve Nesne Modeli
Git, verileri satır bazlı delta farkları yerine **anlık görüntüler (snapshots)** halinde saklar. Dosya içerikleri kriptografik **SHA-1 (veya SHA-256)** özetleme algoritmaları ile imzalanır. Git mimarisi üç temel alandan oluşur:
1.  **Çalışma Dizini (Working Directory):** Dosyaların diskinizde düzenlendiği yerel alan.
2.  **Hazırlık Alanı (Staging Area / Index):** Bir sonraki commit'e dahil edilecek değişikliklerin listelendiği ara katman.
3.  **Yerel Depo (Repository /.git klasörü):** Kalıcı veri tabanının ve commit geçmişinin tutulduğu alan.

### 3.3. Dallanma (Branching) ve Birleştirme (Merging)
Git'in dallanma modeli, izole özellik (feature) geliştirmeyi kolaylaştırır. `git merge` komutu iki dalı birleştirirken, `git rebase` komutu bir dalın commit geçmişini doğrusal hale getirmek için tabanını başka bir dala taşır.

---

## 4. GitHub
### 4.1. İşbirlikçi Yazılım Platformu
**GitHub**, Git sürüm kontrol sistemini temel alan, bulut tabanlı bir **kod barındırma ve işbirliği platformudur**. Kod depolarını merkezi bir sunucuda saklamanın ötesinde, açık kaynak ve kurumsal yazılım takımları için sosyal kodlama, kod incelemesi (code review) ve proje yönetimi araçları sunar.

### 4.2. Temel Mekanizmalar
*   **Çekme İsteği (Pull Request - PR):** Bir geliştiricinin kendi dalında (branch) veya çatallanmış (fork) deposunda yaptığı değişiklikleri, ana projeye dahil etmek için açtığı resmi inceleme talebidir. Kod kalitesini artırmak ve akran değerlendirmesi (peer review) sağlamak amacıyla kullanılır.
*   **Fork (Çatallama):** Orijinal kod deposunun, başka bir kullanıcının profiline tam yetkili bağımsız bir kopya olarak aktarılması sürecidir.

### 4.3. Sürekli Entegrasyon ve Dağıtım (CI/CD)
**GitHub Actions**, depo içi olaylar (push, pull request vb.) tetiklendiğinde çalışan otomatik iş akışları (**workflows**) tanımlanmasını sağlar. Testlerin otomatik koşulması, Docker imajlarının basılması ve statik sitelerin otomatik dağıtımı (deployment) bu mekanizma ile yönetilir.

---

## 5. Docker
### 5.1. Konteynerleştirme Teknolojisi
**Docker**, uygulamaları ve onların bağımlı olduğu tüm kütüphaneleri, yapılandırma dosyalarını tek bir paket haline getiren açık kaynaklı bir **konteynerleştirme (containerization)** platformudur. Geleneksel Sanal Makinelerden (VM) farklı olarak hypervisor katmanına ihtiyaç duymaz; ana bilgisayarın işletim sistemi çekirdeğini (kernel) paylaşarak daha hafif, hızlı ve verimli çalışır.

### 5.2. Çekirdek Bileşenler
*   **Dockerfile:** Bir Docker imajının nasıl oluşturulacağını adım adım belirten bildirimsel (declarative) bir metin dosyasıdır.
*   **Docker Image (İmaj):** Uygulamanın çalışması için gerekli kod, çalışma zamanı kütüphaneleri ve ortam değişkenlerini içeren salt okunur (read-only) şablonlardır. Katmanlı dosya sistemi (UnionFS) mimarisine sahiptir.
*   **Docker Container (Konteyner):** Docker imajlarının izole edilmiş, çalıştırılabilir canlı örnekleridir (runtime instances). Linux `namespaces` ve `cgroups` teknolojilerini kullanarak süreç bazlı izolasyon sağlar.

---

## 6. Nginx
### 6.1. Yüksek Performanslı Web Sunucusu
**Nginx**, yüksek eşzamanlılık (concurrency) kapasitesi, düşük hafıza kullanımı ve kararlılığı ile bilinen, açık kaynaklı bir **HTTP web sunucusu** ve **tersine vekil sunucusudur (reverse proxy)**. Apache gibi her isteğe yeni bir iş parçacığı atayan (thread-per-connection) sunucuların aksine, asenkron ve **olay güdümlü (event-driven)** bir mimari kullanır.

### 6.2. Rol ve İşlevler
*   **Tersine Vekil Sunucu (Reverse Proxy):** İstemcilerden gelen talepleri karşılayıp arka plandaki uygulama sunucularına (örneğin Node.js uygulamasına) yönlendiren ve dönen yanıtı istemciye ileten aracı katmandır. Güvenlik ve soyutlama sağlar.
*   **Yük Dengeleme (Load Balancing):** Gelen yoğun trafiği önceden tanımlanmış algoritmalara göre (Round Robin, Least Connections vb.) birden fazla backend sunucusuna dağıtarak sistemin kesintisiz çalışmasını sağlar.
*   **Statik İçerik Sunumu:** VitePress gibi araçlar tarafından derlenen HTML, CSS ve JavaScript dosyalarını diskten doğrudan okuyarak çok düşük gecikme süreleriyle istemciye servis eder.

---

## 7. VitePress
### 7.1. Statik Site Oluşturucu (SSG)
**VitePress**, Vue.js ve Vite tabanlı, özellikle teknik dökümantasyon siteleri oluşturmak için optimize edilmiş modern bir **Statik Site Oluşturucudur (Static Site Generator)**. VuePress'in halefi olarak geliştirilmiş olup, minimalist yapısı ve yüksek derleme hızıyla öne çıkar.

### 7.2. Teknik Mimari ve Avantajlar
*   **Vite Motoru:** Geliştirme esnasında (dev modunda) tarayıcının yerel ES Modülleri (Native ESM) desteğini kullanarak kodları anında (on-demand) yükler. Bu sayede proje boyutu ne kadar büyük olursa olsun anlık güncelleme (HMR - Hot Module Replacement) hızı sabit kalır.
*   **Markdown ve Vue Entegrasyonu:** Dökümantasyon içeriği standart Markdown (.md) dosyaları olarak yazılır. Ancak VitePress, Markdown dosyalarının içinde doğrudan canlı Vue bileşenlerinin (`.vue` component'leri) çalıştırılmasına izin verir.
*   **Üretim Derlemesi ve Single Page Application (SPA):** Derleme (build) aşamasında, her sayfa için tamamen statik HTML dosyaları oluşturulur (SEO dostu). Sayfa tarayıcıya yüklendikten sonra ise arka planda Vue uygulaması canlanır (**hydration**) ve sonraki sayfa geçişleri bir SPA akıcılığında, sayfayı yeniden yüklemeden gerçekleşir.
