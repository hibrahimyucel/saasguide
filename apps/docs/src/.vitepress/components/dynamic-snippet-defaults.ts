// --- 🚀 1. CONSTANTS & DEFAULTS ---
export const STORAGE_KEY = "pr2cloud_snippet_vars";

export const DEFAULT_SNIPPET_VARS: Record<string, string> = {
  SOURCE_DIR: "/opt/pr2source",
  DATA_DIR: "/opt/pr2data",
  SSH_PORT: "22",
};

// --- 🛠️ 2. STORAGE OPERATIONS ---

/**
 * localStorage üzerinde kayıtlı değişkenleri getirir; yoksa varsayılanları yazar.
 */
export function initAndGetSnippetVars(): Record<string, string> {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SNIPPET_VARS };
  }

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_SNIPPET_VARS),
      );
      return { ...DEFAULT_SNIPPET_VARS };
    }

    const parsedData = JSON.parse(rawData) as Record<string, string>;
    // Eksik yeni varsayılan anahtarlar varsa mevcut veriyi ezmeden tamamla
    const mergedVars = { ...DEFAULT_SNIPPET_VARS, ...parsedData };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedVars));

    return mergedVars;
  } catch {
    return { ...DEFAULT_SNIPPET_VARS };
  }
}

/**
 * Kullanıcının arayüzden değiştirdiği değişkenleri localStorage'a kaydeder.
 */
export function updateSnippetVar(key: string, value: string): void {
  if (typeof window === "undefined") return;

  const current = initAndGetSnippetVars();
  current[key] = value;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
