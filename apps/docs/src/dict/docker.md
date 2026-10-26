
# Docker

## Konteynerleştirme Teknolojisi
**Docker**, uygulamaları ve onların bağımlı olduğu tüm kütüphaneleri, yapılandırma dosyalarını tek bir paket haline getiren açık kaynaklı bir **konteynerleştirme (containerization)** platformudur. Geleneksel Sanal Makinelerden (VM) farklı olarak hypervisor katmanına ihtiyaç duymaz; ana bilgisayarın işletim sistemi çekirdeğini (kernel) paylaşarak daha hafif, hızlı ve verimli çalışır.

## Çekirdek Bileşenler
*   **Dockerfile:** Bir Docker imajının nasıl oluşturulacağını adım adım belirten bildirimsel (declarative) bir metin dosyasıdır.
*   **Docker Image (İmaj):** Uygulamanın çalışması için gerekli kod, çalışma zamanı kütüphaneleri ve ortam değişkenlerini içeren salt okunur (read-only) şablonlardır. Katmanlı dosya sistemi (UnionFS) mimarisine sahiptir.
*   **Docker Container (Konteyner):** Docker imajlarının izole edilmiş, çalıştırılabilir canlı örnekleridir (runtime instances). Linux `namespaces` ve `cgroups` teknolojilerini kullanarak süreç bazlı izolasyon sağlar.

