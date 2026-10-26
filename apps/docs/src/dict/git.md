
# Git

## Dağıtık Sürüm Kontrol Sistemi
**Git**, yazılım geliştirme süreçlerinde kaynak kod değişikliklerini zaman damgalı olarak kaydeden, **dağıtık bir sürüm kontrol sistemidir (DVCS)**. Her geliştirici, projenin tüm geçmişini barındıran yerel bir kopyaya (clone) sahiptir; bu da merkezi bir sunucuya bağımlılığı azaltarak çevrimdışı çalışabilmeyi ve yüksek performansı beraberinde getirir.

## Veri Yapısı ve Nesne Modeli
Git, verileri satır bazlı delta farkları yerine **anlık görüntüler (snapshots)** halinde saklar. Dosya içerikleri kriptografik **SHA-1 (veya SHA-256)** özetleme algoritmaları ile imzalanır. Git mimarisi üç temel alandan oluşur:
1.  **Çalışma Dizini (Working Directory):** Dosyaların diskinizde düzenlendiği yerel alan.
2.  **Hazırlık Alanı (Staging Area / Index):** Bir sonraki commit'e dahil edilecek değişikliklerin listelendiği ara katman.
3.  **Yerel Depo (Repository /.git klasörü):** Kalıcı veri tabanının ve commit geçmişinin tutulduğu alan.

## Dallanma (Branching) ve Birleştirme (Merging)
Git'in dallanma modeli, izole özellik (feature) geliştirmeyi kolaylaştırır. `git merge` komutu iki dalı birleştirirken, `git rebase` komutu bir dalın commit geçmişini doğrusal hale getirmek için tabanını başka bir dala taşır.

