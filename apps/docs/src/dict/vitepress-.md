
# VitePress

## Statik Site Oluşturucu (SSG)
**VitePress**, Vue.js ve Vite tabanlı, özellikle teknik dökümantasyon siteleri oluşturmak için optimize edilmiş modern bir **Statik Site Oluşturucudur (Static Site Generator)**. VuePress'in halefi olarak geliştirilmiş olup, minimalist yapısı ve yüksek derleme hızıyla öne çıkar.

## Teknik Mimari ve Avantajlar
*   **Vite Motoru:** Geliştirme esnasında (dev modunda) tarayıcının yerel ES Modülleri (Native ESM) desteğini kullanarak kodları anında (on-demand) yükler. Bu sayede proje boyutu ne kadar büyük olursa olsun anlık güncelleme (HMR - Hot Module Replacement) hızı sabit kalır.
*   **Markdown ve Vue Entegrasyonu:** Dökümantasyon içeriği standart Markdown (.md) dosyaları olarak yazılır. Ancak VitePress, Markdown dosyalarının içinde doğrudan canlı Vue bileşenlerinin (`.vue` component'leri) çalıştırılmasına izin verir.
*   **Üretim Derlemesi ve Single Page Application (SPA):** Derleme (build) aşamasında, her sayfa için tamamen statik HTML dosyaları oluşturulur (SEO dostu). Sayfa tarayıcıya yüklendikten sonra ise arka planda Vue uygulaması canlanır (**hydration**) ve sonraki sayfa geçişleri bir SPA akıcılığında, sayfayı yeniden yüklemeden gerçekleşir.
