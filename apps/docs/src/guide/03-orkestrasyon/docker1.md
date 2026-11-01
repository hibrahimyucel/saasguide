
# Mimari

Yerel geliştirme ortamınızda ihtiyacınıza göre seçebileceğiniz 2 farklı mimari kurgu ve yapılandırma ile projemizi çalıştıracağız. 

Üçüncü olarak Vitepress için kök dizinden (`http://localhost`) çalışma seçeneği de eklenmiştir.

## Dev Server
 
Bu yöntemde VitePress'in kendi geliştirme sunucusunu (Dev Server) Docker içinde canlı tutarız, Nginx ise sadece bir köprü (Reverse Proxy) görevi görür.

Tam bir yerel geliştirme deneyimi sağlar. Kodda bir dosya kaydettiğiniz anda tarayıcı sayfa yenilenmeden (hot-reload) anında güncellenir.

Konteynerlerin ilk kurulumunda pnpm paketleri Docker içine kurulduğu için ilk build süresi biraz daha uzundur.

## Statik Bağlama

Bu yöntemde yerel makinenizde `pnpm --filter docs build` komutunu çalıştırırsınız, oluşan `apps/docs/.vitepress/dist` klasörünü Nginx konteynerine volume-kaynak olarak bağlarsınız.

İnanılmaz hızlıdır. Docker sadece hafif bir Nginx imajı çalıştırır. Bağımlılıklar (`node_modules`) asla Docker içine girmez. Statik sitelerinizi docker içindeki Nginx servisinize bağlayıp düşük maliyetle erişilebilir tutabilirsiniz.

**Hot Module Reload (HMR)** çalışmaz. Markdown dosyalarınızda bir kelime bile değiştirseniz, değişikliği tarayıcıda görmek için terminale gidip projeyi yerelde her seferinde yeniden build etmek veya `build --watch` betikleriyle sürekli diske statik dosya yazdırmak zorunda kalırsınız. Bu da geliştirme hızını düşürür.

 
## 📊 Yapılandırma Karşılaştırma Tablosu

| Özellik | Klasik Dev-Server | STATIC (Sıfır Docker Yükü) | DEV-LOCALHOST (Portsuz Dev) |
| :--- | :--- | :--- | :--- |
| **Çalışma Modu** | Konteyner içi Geliştirme Sunucusu | Konteyner dışı Statik Klasör | Konteyner içi Geliştirme Sunucusu |
| **Erişim Adresi** | `http://localhost/saasguide/` | `http://localhost` | **`http://localhost`** |
| **Hot-Reload (HMR)**| 🔄 **Aktif** (Anlık Güncellenir) | ❌ Pasif (Yeniden Build Gerekir) | 🔄 **Aktif** (Anlık Güncellenir) |
| **Docker Build Süresi**| Orta (İlk seferde paketleri kurar) | ⚡ **Anında** (Build Süresi Yoktur) | Orta (İlk seferde paketleri kurar) |
| **Yerel Disk Yükü** | Düşük | Düşük | Düşük |
| **En Uygun Senaryo** | Monorepoda çoklu mikro-frontend geliştirme | Hızlı önizleme ve production testi | Yalın ve konforlu dokümantasyon yazımı |

---

