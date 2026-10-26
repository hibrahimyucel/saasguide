
# Node.js

## Tanım ve Mimari
**Node.js**, Chrome'un V8 motoru üzerine inşa edilmiş, açık kaynaklı ve platformlar arası bir **JavaScript çalışma zamanı ortamıdır (runtime environment)**. Geleneksel olarak tarayıcı tarafında (client-side) koşan JavaScript'in, sunucu tarafında (server-side) asenkron ve ölçeklenebilir ağ uygulamaları geliştirmek üzere yürütülmesini sağlar.

## Çekirdek Özellikler
*   **Olay Güdümlü ve Engellemeyen Girdi/Çıktı (Event-Driven, Non-Blocking I/O):** Node.js, eşzamanlı (concurrency) işlemleri yönetmek için tek bir iş parçacığı (**Single-Thread**) kullanır. Ağ istekleri veya dosya okuma işlemleri gibi Girdi/Çıktı operasyonları, arka plandaki thread havuzuna (Worker Pool) devredilir ve ana thread engellenmeden (non-blocking) çalışmaya devam eder.
*   **Olay Döngüsü (Event Loop):** Node.js mimarisinin kalbidir. Tamamlanan asenkron işlemlerin geri çağırım fonksiyonlarını (callbacks) sürekli olarak dinleyen ve execution stack boşaldığında bunları sırayla çalıştıran döngüsel bir mekanizmadır.

## Paket Yönetimi
Node.js ekosistemi, harici kütüphanelerin ve bağımlılıkların yönetimi için modüler bir yapı sunar. Bu yapının merkezinde, dünyanın en büyük yazılım kayıt defteri (registry) olan **NPM (Node Package Manager)** ile alternatif modern çözümler olan **Yarn** ve **PNPM** yer alır.


