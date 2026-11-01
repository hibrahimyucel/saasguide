<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  depth: { type: Number, default: 0 },
  parentPath: { type: String, default: '' }
})

const openFolders = ref({})
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

const toggleFolder = (name) => {
  openFolders.value[name] = !openFolders.value[name]
}

// SSR Güvenli Kopyalama Fonksiyonu
const copyPath = (name) => {
  if (!isMounted.value) return
  
  const fullPath = props.parentPath ? `${props.parentPath}/${name}` : name
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullPath)
      .then(() => alert(`Kopyalandı: ${fullPath}`))
      .catch(() => alert('Kopyalama başarısız oldu.'))
  } else {
    // Eski tarayıcılar için fallback
    const textArea = document.createElement('textarea')
    textArea.value = fullPath
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      alert(`Kopyalandı: ${fullPath}`)
    } catch (err) {
      alert('Kopyalama başarısız oldu.')
    }
    document.body.removeChild(textArea)
  }
}

// Uzantılara göre renkler (VitePress temasına uygun yumuşak tonlar)
const extensionStyles = {
  '.js': '#eab308',
  '.json': '#94a3b8',
  '.crt': '#22c55e',
  '.key': '#eab308',
  '.pem': '#10b981',
  '.md': '#3b82f6',
  '.conf': '#f97316'
}

const getFileColor = (filename) => {
  const dotIndex = filename.lastIndexOf('.')
  const ext = dotIndex !== -1 ? filename.substring(dotIndex).toLowerCase() : ''
  return extensionStyles[ext] || '#64748b'
}
</script>

<template>
  <div class="tree-container" :class="{ 'root-level': depth === 0 }">
    <!-- Mac Tarzı Kontrol Penceresi Frame Elemanları -->
    <div v-if="depth === 0" class="frame-header">
      <div class="tree-title">Proje Klasör Yapısı</div>
    </div>
    
    <div v-for="item in items" :key="item.name" class="tree-node">
      
     <!-- KLASÖR SATIRI -->
<div 
  v-if="item.type === 'folder'" 
  class="tree-item folder-item"
  @click="toggleFolder(item.name)"
>
  <!-- Girinti (indent) miktarını grid yapısını bozmamak için bir sarmalayıcıya veriyoruz -->
  <div class="item-content" :style="{ paddingLeft: `${depth * 20}px` }">
    <span class="chevron" :class="{ 'collapsed': openFolders[item.name] }">▼</span>
    <span class="custom-icon folder-icon">📁</span>
    <span class="item-name">{{ item.name }}</span>
  </div>
  <!-- Açıklama grid sayesinde her zaman sağ kolonda kalacak -->
  <span class="item-desc">{{ item.desc }}</span>
</div>

<!-- DOSYA SATIRI -->
<div 
  v-else 
  class="tree-item file-item"
  @click="copyPath(item.name)"
>
  <div class="item-content" :style="{ paddingLeft: `${depth * 20}px` }">
    <span class="chevron-spacer"></span>
    <span class="custom-icon file-icon">📄</span>
    <span class="item-name" :style="{ color: getFileColor(item.name) }">{{ item.name }}</span>
  </div>
  <span class="item-desc">{{ item.desc }}</span>
</div>

      <!-- REKÜRSİF ÇAĞRI -->
      <div v-if="item.type === 'folder' && !openFolders[item.name] && item.children && item.children.length > 0">
        <FileTree 
          :items="item.children" 
          :depth="depth + 1" 
          :parentPath="parentPath ? `${parentPath}/${item.name}` : item.name" 
        />
      </div>

    </div>
  </div>
</template>

<style scoped>

/* ŞIK FRAME TASARIMI */
.root-level {
  background-color: var(--vp-c-bg-soft);
  /* İnce soft bir kenarlık ve sol tarafta VitePress ana renginde şık bir vurgu çizgisi */
  border: 1px solid var(--vp-c-gutter);
  border-left: 2px solid var(--vp-c-brand-1, #3eaf7c); 
  border-radius: 8px;
  padding: 0; /* İçeriği header ile ayırmak için padding'i alt elemanlara dağıtacağız */
  max-width: 100%;
  margin: 24px 0;
  overflow: hidden;
  /* Modern ve derinlik katan hafif bir gölge efekti */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.frame-header {
  background-color: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-gutter);
  padding: 10px 16px;
  display: flex;
  align-items: center;
}
.tree-title {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--vp-c-text-2);
  font-weight: 600;
  font-family: var(--vp-font-family-mono);
}

/* GENEL VE BÜYÜK EKRANLAR İÇİN (Masaüstü / Tablet) */
.tree-item {
  display: grid;
  /* Kolon Dağılımı: İsim alanı esnek (1fr), Açıklama alanı esnek ama içeriğe göre (auto) */
  /* minmax(150px, 300px) kuralı açıklamanın ekran boyutuna göre esnemesini sağlar */
  grid-template-columns: 1fr minmax(150px, 350px); 
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  color: var(--vp-c-text-1);
  transition: background-color 0.15s ease;
  gap: 16px; /* İki kolon arasındaki güvenli boşluk */
}

.item-content {
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name {
  font-size: 14px;
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
}

.item-desc {
  font-size: 12px;
  color: var(--vp-c-text-2);
  font-style: italic;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left; /* Büyük ekranlarda metni en sağa yaslar */
}

/* KÜÇÜK EKRANLAR İÇİN (Mobil / Dar Alanlar - Örn: < 640px) */
@media (max-width: 640px) {
  .tree-item {
    /* Grid yapısını tek sütuna düşürerek elemanları alt alta diziyoruz */
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 8px;
  }

  .item-desc {
    text-align: left; /* Mobilde açıklama alt satıra geçeceği için sola yaslanmalı */
    /* Mobilde dosya isminin altına tam hizalanması için chevron + ikon mesafesi kadar (yaklaşık 36px) boşluk */
    padding-left: calc(36px); 
    color: var(--vp-c-text-3); /* Mobilde hiyerarşiyi bozmamak için rengini biraz daha solduruyoruz */
    white-space: normal; /* Mobilde uzun açıklamalar kırpılmasın, alt satıra sarksın */
  }
}

/* Sabit ikon ve ok stilleri */
.custom-icon {
  margin-right: 8px;
  font-size: 16px;
  flex-shrink: 0;
}
.chevron {
  font-size: 9px;
  margin-right: 8px;
  width: 12px;
  color: var(--vp-c-text-3);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.chevron.collapsed {
  transform: rotate(-90deg);
}
.chevron-spacer {
  width: 20px;
  flex-shrink: 0;
}
</style>

