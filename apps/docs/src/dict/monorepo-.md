
# Monorepo (Çoklu Paket Yönetimi)

## Mimari Yaklaşım
**Monorepo (Monolithic Repository)**, birden fazla bağımsız projenin, mikro servisin veya kütüphanenin mantıksal olarak ayrıştırılmış şekilde **tek bir Git deposu (repository)** içinde barındırıldığı yazılım geliştirme stratejisidir. Geleneksel çoklu depo (Polyrepo) yaklaşımının getirdiği kod tekrarı ve bağımlılık senkronizasyonu sorunlarına çözüm olarak geliştirilmiştir.

## Çalışma Alanları (Workspaces)
Monorepo yönetim araçlarının (PNPM Workspaces, Yarn Workspaces, Turborepo) temel bileşenidir. Alt projelerin (`packages/`) bağımlılıklarını izole ederken, birbirlerine yerel sembolik bağlantılarla (**symlink**) bağlanmalarını sağlar. Böylece bir pakette yapılan değişiklik, onu kullanan diğer paket tarafından derleme (build) aşamasında anında referans alınabilir.

## Avantaj ve Dezavantaj Analizi
*   **Avantajlar:** Tek bir yapılandırma (CI/CD, Eslint, Prettier) yönetimi, atomik commit'ler (tek commit ile tüm projeleri güncelleyebilme), projeler arası yüksek kod paylaşımı.
*   **Dezavantajlar:** Depo boyutunun aşırı büyümesi (git clone sürelerinin uzaması), karmaşık CI/CD boru hatları (pipeline) gereksinimi ve sıkı erişim yetkilendirmesi zorluğu.


