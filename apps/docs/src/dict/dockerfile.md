# dockerfile

Dockerfile içindeki COPY komutu, bilgisayarınızdaki (host machine) dosya veya klasörleri alıp, Docker imajının (container'ın) içerisine kopyalamaya yarar.
Senin Dockerfile.dev dosyan üzerindeki iki farklı COPY kullanımının tam olarak ne yaptığını ve neden bu şekilde yazıldığını adım adım inceleyelim:
1. Aşama: Sadece Bağımlılık Dosyalarını Kopyalamak
dockerfile
COPY ./package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY ./apps/docs/package.json ./apps/docs/
Use code with caution.
Ne yapıyor? Bilgisayarındaki monorepo bağımlılık tanımlarını (package.json, pnpm-workspace.yaml) ve kilit dosyasını (pnpm-lock.yaml) alır; container içindeki çalışma dizinine (/app/) kopyalar. İkinci satır ise sadece docs uygulamasına ait package.json dosyasını konteyner içindeki kendi klasörüne koyar.
Neden kaynak kodlardan önce yapılıyor? Docker'ın önbellek (caching) mekanizmasından yararlanmak için. Eğer kaynak kodlarında (örneğin bir markdown yazısında) değişiklik yaparsan, Docker bu satırların üstündeki ve bu satırdaki dosyaların değişmediğini anlar. Böylece bir alt satırdaki binlerce paketi indiren pnpm install adımını çalıştırmaz, doğrudan hafızadan (cache) getirir. Projenin ayağa kalkma süresi saniyelere düşer.
2. Aşama: Tüm Kaynak Kodları Kopyalamak
dockerfile
COPY . .
Use code with caution.
Ne yapıyor? Sol taraftaki ilk nokta (.), docker-compose.yml dosyasındaki context (bağlam) dizinini temsil eder. Sağ taraftaki ikinci nokta (.) ise container içindeki WORKDIR yani /app dizinini temsil eder.
Senin kurgunda context: ../../ (monorepo kökü) olduğu için, bu komut bilgisayarındaki tüm monorepo kaynak kodlarını (tüm uygulamaları, kodları, infra ayarlarını vb.) alır ve container içindeki /app klasörünün içine birebir kopyalar.
🔥 Geliştirme (Development) Ortamındaki Çok Kritik Detay
"Madem COPY . . ile bütün kodları container içine kopyalıyoruz, neden docker-compose.yml içinde bir de volumes (hacim) tanımlayıp bilgisayardaki klasörü container'a bağlıyoruz?" diye düşünebilirsin.
COPY . . (İmaj Zamanı): İmaj ilk derlenirken (--build yapıldığında) o anki kodların bir fotoğrafını çeker ve container'ın içine gömer.
volumes: - ../../:/app (Çalışma Zamanı): Container ayağa kalktığı an, bilgisayarındaki klasör ile container içindeki /app klasörü arasında canlı bir köprü kurar. Bilgisayarında bir kod değiştirdiğin an, o değişiklik container içine anlık yansır ve VitePress (HMR) sayesinde tarayıcın otomatik yenilenir.
Özetle: COPY . . imajın kendi kendine çalışabilmesi için temel kodları içeri yükler; volumes ise senin lokalde kod yazarken anlık güncellemeleri görebilmeni sağlar.
