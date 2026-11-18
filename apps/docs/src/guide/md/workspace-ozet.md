# Workspace Çalışma Prensipleri ve Kurulum Özeti

Bu doküman, yapay zeka ortak çalışma alanının (AI Workspace) kurulumunu, dosya yapısını ve gelecekteki geliştirme süreçlerinde uygulanacak teknik kuralları özetler.

---

## 1. Genel Özet (Rahat Düşünme & Hafıza Kaynağı)
*Bu bölüm, ilerleyen süreçlerde geçmiş kararları hızla hatırlamak ve genel bağlamı koparmadan rahatça düşünebilmek adına bir hafıza referansı olarak kullanılacaktır.*

* **Çalışma Alanı Düzeni:** Google Drive üzerinde `00_AI_Workspace` başta olmak üzere numaralandırılmış modüler bir klasör hiyerarşisi kurulmuştur.
* **Süreklilik Stratejisi:** Tamamlanan kritik sohbetlerin teknik özetleri `.md` dosyası olarak bu alana yüklenecek ve yeni sohbetlerde bağlamı kaybetmemek adına geçmiş referansı olarak çağrılacaktır.
* **Dosya Adlandırma Kuralı:** React bileşenleri haricindeki tüm yardımcı (util), tip (types) ve konfigürasyon dosyaları, React bileşenleriyle karışmaması için **küçük harfle başlayarak** adlandırılacaktır.

---

## 2. Teknik Kod ve Mimari Prensipleri (Ayrıntılı Çalışma Kaynağı)
*Bu bölüm, daha derinlemesine kodlama ve mimari yapılandırma gerektiren durumlarda doğrudan başvurulacak teknik kaynak işlevi görür.*

* **Proje Altyapısı:** `my-saas-monorepo` mimarisi (pnpm workspaces ve Turborepo görev yönetimi).
* **Kod Üretim Modeli:** Tüm dosyayı baştan yazmak yerine, sadece değişen veya refaktör edilmesi gereken fonksiyonları/bileşenleri içeren **küçük, nokta atışı ve modüler refaktör çıktıları** üretilecektir.
* **Dosya Çıktı Standardı:** Sistemden indirme bağlantısı talep edilirken *"indirilebilir bir .md dosyası oluştur"*, *"generate et"* gibi net komut kalıpları kullanılacaktır.

---

## 3. Sonraki Adım (Next Steps)
* **Proje Tanımlamaları:** Bir sonraki aşamada, üzerinde çalışılacak olan spesifik projelerin/görevlerin fonksiyonel özetleri ve detaylı kod tanımlamaları sisteme beslenecektir.
* **Uygulama:** Geliştirilecek fonksiyon, yazılacak entegrasyon ya da çözülecek hata kodları bu yapıya dahil edilerek doğrudan yeni kurallara göre üretim aşamasına geçilecektir.
