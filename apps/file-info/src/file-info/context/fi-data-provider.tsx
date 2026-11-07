import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { initialSchema } from "./fi-data";
import { FileInfo, FileNode } from "./fi-types";

interface PatternContextType {
  patterns: FileInfo[];
  scannedTree: FileNode | null;
  setScannedTree: (tree: FileNode | null) => void;
  addPattern: (newItem: Omit<FileInfo, "kind" | "regExp">) => boolean;
  removePattern: (expression: string) => void;
  updatePattern: (updatedItem: FileInfo) => void;
  toggleChecked: (expression: string) => void;
  toggleActive: (expression: string) => void; // 🚀 Yeni fonksiyon tanımı
  resetPatterns: () => void;
  exportToJSON: () => void;
  importFromJSON: (file: File) => Promise<boolean>;
  applyCurrentPatternsToTree: (rawTree: FileNode) => void;
}

const PatternContext = createContext<PatternContextType | undefined>(undefined);

// --- 1. CORE EXPRESSION PARSER MOTORU ---
export const parseAndCompileExpression = (
  expr: string,
  isExtensionFlag: boolean,
): { regExp?: RegExp; kind: NonNullable<FileInfo["kind"]> } => {
  const trimmed = expr.trim();

  // --- 1. Uzantı Kontrolü (3-ext) ---
  // KESİN KURAL: Uzantı ise hiçbir şekilde RegExp üretmiyoruz, doğrudan dönüyoruz
  if (isExtensionFlag) {
    return { kind: "3-ext" };
  }

  // --- 2. RegExp Literal Kontrolü (/pattern/flags) ---
  const regexLiteralPattern = /^\/(.+)\/([gimyus]*)$/;
  const match = trimmed.match(regexLiteralPattern);
  if (match) {
    try {
      return { regExp: new RegExp(match[1], match[2]), kind: "2-regExp" };
    } catch {}
  }

  // --- 3. Dinamik Token / Joker Karakter Kontrolü (2-regExp) ---
  const hasDynamicTokens =
    /[*?+\\^$|[\]{}()]/.test(trimmed) ||
    /\d/.test(trimmed) ||
    /(yy|mm|dd|yyyy)/i.test(trimmed);

  if (hasDynamicTokens) {
    try {
      // ÇÖZÜM: Önce tüm özel regex karakterlerini güvenli şekilde kaçırıyoruz (escape)
      // Ancak joker olan * ve ? karakterlerini burada kaçırmıyoruz ki daha sonra işleyebilelim.
      let safePattern = trimmed.replace(/[-\/\\^$+.( )|[\]{}]/g, "\\$&");

      // Şimdi * ve ? joker karakterlerini RegExp diline dönüştürüyoruz
      // * başta olduğunda da ( örn: *.log -> ^.*\.log$ ) güvenle çalışır.
      safePattern = safePattern.replace(/\*/g, ".*").replace(/\?/g, ".");

      // Tarih token'larını dönüştür
      safePattern = safePattern
        .replace(/yyyy/gi, "\\d{4}")
        .replace(/mm/gi, "\\d{2}")
        .replace(/dd/gi, "\\d{2}");

      // Tam kelime/dosya adı eşleşmesi için sınırları koyuyoruz
      return { regExp: new RegExp(`^${safePattern}$`, "i"), kind: "2-regExp" };
    } catch {}
  }

  // --- 4. 1-regular: Joker Yoksa Saf Düz Metin ---
  return { kind: "1-regular" };
};

// pipelineInitialize fonksiyonunu isActive alanını destekleyecek şekilde güncelliyoruz
const pipelineInitialize = (schema: any[]): FileInfo[] => {
  const hydrated = schema.map((item) => {
    const expr = item.expression || "";
    const isExtension = item.extension !== undefined ? !!item.extension : false;
    const { regExp, kind } = parseAndCompileExpression(expr, isExtension);

    return {
      expression: expr,
      description: String(item.description || item.desc || ""),
      ignore: item.ignore !== undefined ? !!item.ignore : false,
      extension: isExtension,
      group: String(item.group || item.grp || ""),
      checked: item.checked !== undefined ? !!item.checked : false,
      isActive: item.isActive !== undefined ? !!item.isActive : true, // 🚀 Yeni: Varsayılan olarak aktif gelir
      kind,
      regExp,
    };
  });

  return hydrated.sort((a, b) => {
    const kindCompare = (a.kind || "").localeCompare(b.kind || "");
    if (kindCompare !== 0) return kindCompare;
    return a.expression.localeCompare(b.expression);
  });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 🚀 LOCALSTORAGE ENTEGRASYONU: Sayfa açılışında verileri çeker
  const [patterns, setPatterns] = useState<FileInfo[]>(() => {
    const savedPatterns = localStorage.getItem("saas_file_patterns");
    if (savedPatterns) {
      try {
        return pipelineInitialize(JSON.parse(savedPatterns));
      } catch (e) {
        console.error("LocalStorage yükleme hatası:", e);
      }
    }
    return pipelineInitialize(initialSchema);
  });

  const [scannedTree, setScannedTree] = useState<FileNode | null>(null);

  // 🚀 LOCALSTORAGE SYNC: State değiştikçe kalıcı hafızaya yazar
  useEffect(() => {
    const cleanPatterns = patterns.map(({ regExp, ...rest }) => rest);
    localStorage.setItem("saas_file_patterns", JSON.stringify(cleanPatterns));
  }, [patterns]);

  // autoReevaluateTree fonksiyonu aynı kalıyor... (Mevcut kodunuzdaki gibi)
  const autoReevaluateTree = useCallback(
    (node: FileNode, activeRules: FileInfo[]): FileNode => {
      let isFiltered = false;

      // KESİN ÇÖZÜM: Düğümün match alanı varsa, o kuralın aktif kurallar listesinde olup olmadığını kontrol et
      if (node.match) {
        const nodeMatchLower = node.match.toLowerCase();
        isFiltered = activeRules.some(
          (rule) =>
            rule?.expression &&
            nodeMatchLower === rule.expression.toLowerCase(),
        );
      }

      if (node.isDirectory && node.children) {
        const updatedChildren = node.children.map((child) =>
          autoReevaluateTree(child, activeRules),
        );

        const hasFilteredChild = updatedChildren.some(
          (child) => child.filtered || child.hasFilteredChild,
        );

        return {
          ...node,
          filtered: isFiltered, // Çalışma zamanında güncellenen değer
          hasFilteredChild: hasFilteredChild,
          children: updatedChildren,
        };
      }

      return {
        ...node,
        filtered: isFiltered, // Çalışma zamanında güncellenen değer
      };
    },
    [],
  );

  // 🚀 AUTOMATIC SYNC REACTIVE SIDE EFFECT
  // 🚀 AUTOMATIC SYNC REACTIVE SIDE EFFECT
  useEffect(() => {
    if (!scannedTree) return;

    // Sidebar seçimlerine (toggleChecked veya toggleActive) göre hangi kuralları dikkate alacağınızı buradan seçin:
    // Not: Sidebar'da 'toggleChecked' kullandığınız için patterns.filter(p => p.checked) olarak ayarlandı
    const activeRules = patterns.filter((p) => p.checked);

    setScannedTree((prevTree) => {
      if (!prevTree) return null;
      return autoReevaluateTree(prevTree, activeRules);
    });
  }, [patterns, autoReevaluateTree]);

  const addPattern = useCallback(
    (newItem: Omit<FileInfo, "kind" | "regExp">) => {
      let isSuccess = false;
      setPatterns((prev) => {
        if (prev.some((p) => p.expression === newItem.expression)) {
          alert("Bu kural zaten mevcut!");
          isSuccess = false;
          return prev;
        }
        const { regExp, kind } = parseAndCompileExpression(
          newItem.expression,
          newItem.extension,
        );
        const completedItem: FileInfo = {
          ...newItem,
          kind,
          regExp,
          checked: false, // Hızlı seçim için varsayılan seçilmemiş gelsin
          isActive: true, // Filtre motoru için varsayılan aktif gelsin
        };
        isSuccess = true;
        const updatedList = [...prev, completedItem];
        return updatedList.sort((a, b) => {
          const kindCompare = (a.kind || "").localeCompare(b.kind || "");
          if (kindCompare !== 0) return kindCompare;
          return a.expression.localeCompare(b.expression);
        });
      });
      return isSuccess;
    },
    [],
  );

  const removePattern = useCallback((expression: string) => {
    setPatterns((prev) => prev.filter((p) => p.expression !== expression));
  }, []);

  const updatePattern = useCallback((updatedItem: FileInfo) => {
    setPatterns((prev) =>
      prev.map((p) => {
        if (p.expression !== updatedItem.expression) return p;
        const { regExp, kind } = parseAndCompileExpression(
          updatedItem.expression,
          updatedItem.extension,
        );
        return { ...updatedItem, regExp, kind };
      }),
    );
  }, []);

  // fi-data-provider.tsx

  const applyCurrentPatternsToTree = useCallback(
    (rawTree: FileNode) => {
      const activeRules = patterns.filter((p) => p.isActive && p.checked);

      // Mevcut autoReevaluateTree fonksiyonunuzu kullanarak ağacı 1 kez filtreleyin
      const finalizedTree = autoReevaluateTree(rawTree, activeRules);

      // State'e son hali tek seferde set edin
      setScannedTree(finalizedTree);
    },
    [patterns, autoReevaluateTree],
  ); // 🚀 patterns değiştikçe fonksiyon referansı güvenle güncellenir

  const toggleChecked = useCallback((expression: string) => {
    setPatterns((prev) =>
      prev.map((p) =>
        p.expression === expression ? { ...p, checked: !p.checked } : p,
      ),
    );
  }, []);

  // 🚀 YENİ: Filtre kuralını pasifleştirme / aktifleştirme tetikleyicisi
  const toggleActive = useCallback((expression: string) => {
    setPatterns((prev) =>
      prev.map((p) =>
        p.expression === expression ? { ...p, isActive: !p.isActive } : p,
      ),
    );
  }, []);

  const resetPatterns = useCallback(() => {
    setPatterns((prev) =>
      prev.map((p) => (p.checked ? { ...p, checked: false } : p)),
    );
  }, []);

  const exportToJSON = useCallback(() => {
    const cleanPatterns = patterns.map(({ regExp, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(cleanPatterns, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patterns-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [patterns]);

  const importFromJSON = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string);
            if (!Array.isArray(imported)) {
              alert("Geçersiz JSON yapısı.");
              return resolve(false);
            }

            const dynamicHydration = pipelineInitialize(imported);
            const map = new Map<string, FileInfo>();
            patterns.forEach((p) => map.set(p.expression, p));
            dynamicHydration.forEach((item) => map.set(item.expression, item));

            setPatterns(
              Array.from(map.values()).sort((a, b) => {
                const kindCompare = (a.kind || "").localeCompare(b.kind || "");
                if (kindCompare !== 0) return kindCompare;
                return a.expression.localeCompare(b.expression);
              }),
            );
            resolve(true);
          } catch {
            alert("JSON ayrıştırma hatası.");
            resolve(false);
          }
        };
        reader.readAsText(file);
      });
    },
    [patterns],
  );

  const value = useMemo(
    () => ({
      patterns,
      scannedTree,
      setScannedTree,
      addPattern,
      removePattern,
      updatePattern,
      toggleChecked,
      toggleActive,
      resetPatterns,
      exportToJSON,
      importFromJSON,
      applyCurrentPatternsToTree,
    }),
    [
      patterns,
      scannedTree,
      setScannedTree, // Eğer useCallback ile sarmalanmadıysa eklenmeli
      addPattern,
      removePattern,
      updatePattern,
      toggleChecked,
      toggleActive,
      resetPatterns,
      exportToJSON,
      importFromJSON,
      applyCurrentPatternsToTree,
    ],
  );

  return (
    <PatternContext.Provider value={value}>{children}</PatternContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(PatternContext);
  if (context === undefined) {
    throw new Error(
      "usePatterns mutlaka bir PatternProvider içinde kullanılmalıdır.",
    );
  }
  return context;
};
