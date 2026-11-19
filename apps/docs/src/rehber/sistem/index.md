# 1 Sistem
1. Sunucu Hazırlığı ve Güvenli Ağ (AlmaLinux & Tailscale)

• İşletim Sistemi: AlmaLinux kurulumu, sistem güncellemeleri (dnf update) ve güvenlik duvarı (firewalld) temel ayarları.

• Özel Ağ (VPN): Tailscale kurulumu ve sunucuya kalıcı özel IP (100.x.y.z) atanması.

2. Konteyner Altyapısı ve Geliştirme Ortamı (Docker & Node.js)

• Docker Engine: AlmaLinux üzerinde Docker ve Docker Compose kurulumu, SELinux izin yapılandırması.

• Monorepo & Node.js: Node.js, Turborepo kurulumu ve proje dizin yapısının (apps/, gateway/, infra/) oluşturulması.

3. Alan Adı ve SSL Sertifika Otomasyonu (DuckDNS & Certbot)

• DNS Eşleme: DuckDNS üzerinde alan adının (pr2cloud.duckdns.org) oluşturulup Tailscale IP adresine yönlendirilmesi.

• Wildcard SSL: Docker üzerinden certbot_dns_duckdns ile DNS-01 doğrulaması yapılarak *.pr2cloud.duckdns.org sertifikasının alınması ve Cron yenileme betiğinin tanımlanması.

4. Ağ Geçidi ve Ters Vekil (Nginx Gateway)

• SSL ve Proxy Kurulumu: Üretilen sertifikaların SELinux uyumlu (:ro,z) şekilde Nginx konteynerine bağlanması.

• Yönlendirme Kuralları: Kök alan adı karşılama sayfasının ve alt alan adlarının (docs., git., dashboardq.) ilgili portlara yönlendirilmesi.

5. Çekirdek Altyapı Servisleri (Veritabanı, Git & E-Posta)

• MariaDB: Uygulamalar için merkezi ilişkisel veritabanı konteynerinin ayağa kaldırılması.

• Gitea: Self-hosted Git sunucusu ve Container Registry kurulumu.

• Mailcow: Kurumsal e-posta sunucusu entegrasyonu ve DNS (MX, SPF, DKIM) kayıtları.

6. Uygulama Katmanı ve Yayınlama (NestJS, Vite & VitePress)

• Backend (NestJS): Modüler API servislerinin Docker ile derlenip devreye alınması.

• Frontend & Dokümantasyon: Vite uygulamalarının ve VitePress rehber sitesinin yayınlanıp Nginx üzerinden dış dünyaya açılması.
