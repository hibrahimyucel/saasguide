<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useId } from "vue";
import { STORAGE_KEY } from "./dynamic-snippet-defaults";

// --- 🚀 1. CONSTANTS & REFS ---
const snippetUid = useId();

interface Props {
  defaults?: Record<string, string>;
  title?: string;
  /** İsteğe bağlı: Panel varsayılan olarak açık gelsin mi? (Varsayılan: false) */
  defaultOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  defaults: () => ({}),
  title: "Yapılandırma Parametreleri",
  defaultOpen: false,
});

const isOpen = ref(props.defaultOpen);

// --- 🚀 1. CONSTANTS & REFS ---
const SYNC_EVENT = "pr2-snippet-sync";
const TOKEN_REGEX = /<-([A-Z0-9_]+)->/g;

interface TextSegment {
  node: Text;
  originalText: string;
}

const slotWrapper = ref<HTMLElement | null>(null);
const placeholders = ref<string[]>([]);
const values = ref<Record<string, string>>({});
let textSegments: TextSegment[] = [];

// --- 🎛️ 2. STORAGE & CROSS-COMPONENT SYNC ---
const readStorage = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStorage = (updated: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch (err) {
    console.error("localStorage yazma hatası:", err);
  }
};

const syncFromStorage = () => {
  const stored = readStorage();
  for (const key of placeholders.value) {
    values.value[key] = stored[key] ?? props.defaults[key] ?? "";
  }
  updateCodeOutput();
};

// --- 🛠️ 3. TEXT NODE NORMALIZATION & LIVE UPDATE ---
/**
 * Shiki'nin <span> etiketlerine böldüğü <DOMAIN> parçalarını tek Text düğümünde birleştirir
 */
const collectAndNormalizeTextNodes = (root: HTMLElement) => {
  const lines = root.querySelectorAll(".line");

  lines.forEach((lineEl) => {
    const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT);
    const lineNodes: Text[] = [];
    let current: Node | null;

    while ((current = walker.nextNode())) {
      lineNodes.push(current as Text);
    }

    // Satırın toplam metninde '<-' yoksa bu satıra hiç dokunma (<< veya > bozulmaz)
    const fullLineText = lineNodes.map((n) => n.nodeValue ?? "").join("");
    if (!fullLineText.includes("<-")) {
      for (const node of lineNodes) {
        textSegments.push({ node, originalText: node.nodeValue ?? "" });
      }
      return;
    }

    // Satırda '<-' varsa, yalnızca '<-' ile '->' arasındaki bölünmüş düğümleri birleştir
    let buffer = "";
    let bufferNodes: Text[] = [];
    let isInsideToken = false;

    const flush = () => {
      const firstNode = bufferNodes.at(0);
      if (!firstNode) return;

      if (bufferNodes.length > 1) {
        firstNode.nodeValue = buffer;
        for (let i = 1; i < bufferNodes.length; i++) {
          const extraNode = bufferNodes.at(i);
          if (extraNode) extraNode.nodeValue = "";
        }
      }

      textSegments.push({
        node: firstNode,
        originalText: firstNode.nodeValue ?? "",
      });

      buffer = "";
      bufferNodes = [];
      isInsideToken = false;
    };

    for (const node of lineNodes) {
      const text = node.nodeValue ?? "";

      if (isInsideToken) {
        buffer += text;
        bufferNodes.push(node);
        if (buffer.includes("->")) {
          flush();
        }
      } else if (text.includes("<")) {
        // Sadece '<' sonrası '<-' olabilecek bir parça ise tamponu başlat
        const tail = text.slice(text.lastIndexOf("<"));
        if (tail === "<" || tail.startsWith("<-")) {
          isInsideToken = true;
          buffer = text;
          bufferNodes = [node];
          if (buffer.includes("->")) {
            flush();
          }
        } else {
          textSegments.push({ node, originalText: text });
        }
      } else {
        textSegments.push({ node, originalText: text });
      }
    }
    flush();
  });
};

const updateCodeOutput = () => {
  for (const segment of textSegments) {
    if (!segment.originalText.includes("<-")) continue;
    segment.node.nodeValue = segment.originalText.replace(
      TOKEN_REGEX,
      (fullMatch, key: string) => {
        const val = values.value[key]?.trim();
        return val ? val : fullMatch;
      },
    );
  }
};

const handleInput = (key: string, newValue: string) => {
  values.value[key] = newValue;
  const stored = readStorage();

  if (newValue.trim()) {
    stored[key] = newValue;
  } else {
    delete stored[key];
  }

  writeStorage(stored);
  updateCodeOutput();
};

const clearAllValues = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch (err) {
    console.error("localStorage temizleme hatası:", err);
  }
};

// --- 🔄 4. LIFECYCLE ---
onMounted(() => {
  const codeEl = slotWrapper.value?.querySelector(
    "pre code",
  ) as HTMLElement | null;
  if (!codeEl) return;

  collectAndNormalizeTextNodes(codeEl);

  const foundKeys = new Set<string>();
  for (const segment of textSegments) {
    for (const match of segment.originalText.matchAll(TOKEN_REGEX)) {
      if (match[1]) foundKeys.add(match[1]);
    }
  }

  placeholders.value = Array.from(foundKeys);
  syncFromStorage();

  window.addEventListener(SYNC_EVENT, syncFromStorage);
  window.addEventListener("storage", syncFromStorage);
});

onUnmounted(() => {
  window.removeEventListener(SYNC_EVENT, syncFromStorage);
  window.removeEventListener("storage", syncFromStorage);
});
</script>

<template>
  <div class="pr2-snippet-box">
    <!-- Üst Panel: Açılır-Kapanır İnce Başlık Çubuğu -->
    <div v-if="placeholders.length > 0" class="pr2-snippet-controls">
      <div
        class="pr2-snippet-header"
        role="button"
        tabindex="0"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
        @keydown.enter.prevent="isOpen = !isOpen"
        @keydown.space.prevent="isOpen = !isOpen"
      >
        <div class="pr2-header-left">
          <span class="pr2-chevron" :class="{ 'is-open': isOpen }">▸</span>
          <span class="pr2-snippet-title">{{ title }}</span>
          <span class="pr2-param-count"
            >{{ placeholders.length }} parametre</span
          >
        </div>

        <div class="pr2-header-actions" @click.stop>
          <button
            v-if="isOpen"
            type="button"
            class="pr2-reset-btn"
            title="Kaydedilen tüm parametreleri sıfırla"
            @click="clearAllValues"
          >
            Sıfırla
          </button>
          <span class="pr2-snippet-badge">
            {{ isOpen ? "Gizle" : "Düzenle" }}
          </span>
        </div>
      </div>

      <div v-show="isOpen" class="pr2-input-grid">
        <div v-for="key in placeholders" :key="key" class="pr2-input-row">
          <label :for="`${snippetUid}-${key}`" class="pr2-label"
            >&lt;{{ key }}&gt;</label
          >
          <input
            :id="`${snippetUid}-${key}`"
            :value="values[key]"
            type="text"
            :placeholder="`${key} değerini girin...`"
            class="pr2-input"
            @input="handleInput(key, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- Alt Panel: VitePress'in Kendi Renkli Kod Bloğu -->
    <div ref="slotWrapper" class="pr2-slot-wrapper">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pr2-snippet-box {
  margin: 1.25rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background-color: var(--vp-c-bg-soft);
  overflow: hidden;
}

.pr2-snippet-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.pr2-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pr2-reset-btn {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.pr2-reset-btn:hover {
  color: var(--vp-c-danger-1);
  border-color: var(--vp-c-danger-1);
}

.pr2-snippet-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.pr2-input-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: center;
  gap: 0.75rem;
}

.pr2-label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.pr2-input {
  width: 100%;
  padding: 0.4rem 0.7rem;
  font-size: 0.85rem;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  transition: border-color 0.2s;
}

.pr2-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.pr2-slot-wrapper :deep(div[class*="language-"]) {
  margin: 0 !important;
  border-radius: 0 !important;
}

@media (max-width: 640px) {
  .pr2-input-row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

.pr2-snippet-controls {
  padding: 0.45rem 0.9rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.pr2-snippet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  min-height: 28px;
}

.pr2-header-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.pr2-chevron {
  display: inline-block;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  transition: transform 0.18s ease;
}

.pr2-chevron.is-open {
  transform: rotate(90deg);
}

.pr2-param-count {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}

.pr2-input-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px dashed var(--vp-c-divider);
}
</style>
