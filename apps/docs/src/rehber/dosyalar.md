# Dosya ve Klasörler

Aşağıda projemizin güncel klasör hiyerarşisi yer almaktadır. Dosya yollarını kopyalamak için üzerlerine tıklayabilirsiniz.

<script setup>
import { fileTree } from '../.vitepress/components/fileTree.js' // fileTree.js yolunu doğru verin
import FileTree from '../.vitepress/components/FileTree.vue'
</script>

<FileTree :items="fileTree" />

```bash
   git add .
   git commit -m "Docker, Nginx-SSL Testi tamamlandı."
   git push origin
```

