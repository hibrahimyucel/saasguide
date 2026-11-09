// src/file-info/context/fi-data-helpers.ts
import { FileInfo, FileNode } from "./fi-types";

/**
 *
 * @param schema localstorage, JSON veya varsayılan şema (fi-data.ts)
 * @returns Çalışma zamanı dosya kuralları
 */
export const getPatterns = (schema: any[]): FileInfo[] => {
  const hydrated = schema.map((item) => {
    const expr = item.expression || "";
    const isExtension = item.extension !== undefined ? !!item.extension : false;
    const { regExp, kind } = parseExpression(expr, isExtension);

    return {
      expression: expr,
      description: String(item.description || ""),
      ignore: item.ignore !== undefined ? !!item.ignore : false,
      extension: isExtension,
      group: String(item.group || ""),
      checked: item.checked !== undefined ? !!item.checked : false,
      isActive: item.isActive !== undefined ? !!item.isActive : true,
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

/**
 * İfade regExp ise veya joker karakter içeriyorsa karşılaştırmada kullanılacak regExp ifadesini hazırla
 * @param expr dosya kuralı - çözümlenecek ifade
 * @param isExtensionFlag dosya uzantısı ise hiçbir şekilde regExp oluşturulmaz
 * @returns
 */
export const parseExpression = (
  expr: string,
  isExtensionFlag: boolean,
): { regExp?: RegExp; kind: NonNullable<FileInfo["kind"]> } => {
  const trimmed = expr.trim();

  if (isExtensionFlag) {
    return { kind: "3-ext" };
  }

  // --- hazır regExp kontrolü (2-regExp) ---
  const regexLiteralPattern = /^\/(.+)\/([gimyus]*)$/;
  const match = trimmed.match(regexLiteralPattern);
  if (match) {
    try {
      return { regExp: new RegExp(match[1], match[2]), kind: "2-regExp" };
    } catch {}
  }

  // --- joker karakter kontrolü (2-regExp) ---
  const hasDynamicTokens =
    /[*?+\\^$|[\]{}()]/.test(trimmed) ||
    //   /\d/.test(trimmed) ||
    /(yy|mm|dd|yyyy)/i.test(trimmed);

  if (hasDynamicTokens) {
    try {
      // Önce tüm özel regex karakterlerini güvenli şekilde kaçırıyoruz (escape)
      // Ancak joker olan * ve ? karakterlerini burada kaçırmıyoruz ki daha sonra işleyebilelim.
      let safePattern = trimmed.replace(/[-\/\\^$+.( )|[\]{}]/g, "\\$&");

      // Joker karakterlerini [.*]RegExp diline dönüştürüyoruz
      safePattern = safePattern.replace(/\*/g, ".*").replace(/\?/g, ".");

      // Tarih ifadelerini dönüştürüyoruz
      safePattern = safePattern
        .replace(/yyyy/gi, "\\d{4}")
        .replace(/mm/gi, "\\d{2}")
        .replace(/dd/gi, "\\d{2}");

      // Tam kelime/dosya adı eşleşmesi için sınırları koyuyoruz
      return { regExp: new RegExp(`^${safePattern}$`, "i"), kind: "2-regExp" };
    } catch {}
  }

  // --- (1-regular) varsayılan tip ---
  return { kind: "1-regular" };
};

/**
 * 🚀 YENİ KURAL EKLEME YARDIMCISI
 *
 * Mevcut listede mükerrer kayıt kontrolü yapar ve listeyi sıralı bir şekilde günceller.
 */
export const addPattern = (
  prevPatterns: FileInfo[],
  newItem: Omit<FileInfo, "kind" | "regExp">,
): { updatedList: FileInfo[]; isSuccess: boolean } => {
  if (prevPatterns.some((p) => p.expression === newItem.expression)) {
    alert("Bu kural zaten mevcut!");
    return { updatedList: prevPatterns, isSuccess: false };
  }

  const { regExp, kind } = parseExpression(
    newItem.expression,
    newItem.extension,
  );

  const completedItem: FileInfo = {
    ...newItem,
    kind,
    regExp,
    checked: false,
    isActive: true,
  };

  const updatedList = [...prevPatterns, completedItem].sort((a, b) => {
    const kindCompare = (a.kind || "").localeCompare(b.kind || "");
    if (kindCompare !== 0) return kindCompare;
    return a.expression.localeCompare(b.expression);
  });

  return { updatedList, isSuccess: true };
};

/**
 * 🚀 ÖZYİNELEMELİ ANALİZ MOTORU
 *
 * Ağacı, o an seçili ve aktif olan kurallarla eşleştirerek çalışma zamanında (runtime) baştan aşağı günceller.
 *
 * @param {FileNode} node - Analiz edilecek kök yada alt klasör.
 * @param {FileInfo[]} activeRules - Seçili ve aktif dosya tanımları - patterns.
 * @returns {FileNode} Çözümlenmiş klasör ve alt düğümleri.
 */
/**
 * 🚀 BASİTLEŞTİRİLMİŞ REAKTİF FİLTRE MOTORU (Anayasa v3 Standardı)
 * Pattern filtresi her zaman etkindir. Boyut filtresi aktifse ek kural (AND) olarak uygulanır.
 */
export const ReevaluateTree = (
  node: FileNode,
  activeRules: FileInfo[],
  sizeFilter: { mode: "all" | "greater" | "less"; targetBytes: number },
): FileNode => {
  let matchesPattern = false;

  // 1. ANA KURAL: PATTERN (Her zaman geçerli)
  if (node.match) {
    const nodeMatchLower = node.match.toLowerCase();
    matchesPattern = activeRules.some(
      (rule) =>
        rule?.expression && nodeMatchLower === rule.expression.toLowerCase(),
    );
  }
  // 🚀 Geliştirdiğiniz ve Kusursuzlaştırılan Filtre Mantığı

  // 2. EK KURAL: BOYUT (Sadece aktifse ve dosya ise devreye girer)
  // Tip kontrolünü === ile kesinleştirip, 0 byte değerini de güvene alıyoruz.
  const skipSizeMatch =
    sizeFilter.mode === "all" || node.isDirectory || node.size === undefined;

  let matchesSize = false;

  // node.size !== undefined kontrolü sayesinde 0 byte boyutlu dosyalar da doğru elenir 🏎️
  if (!skipSizeMatch && node.size !== undefined) {
    if (sizeFilter.mode === "greater") {
      matchesSize = node.size >= sizeFilter.targetBytes;
    } else if (sizeFilter.mode === "less") {
      matchesSize = node.size <= sizeFilter.targetBytes;
    }
  }

  // 3. NİHAİ KARAR: Geliştirdiğiniz 3 Boyutlu Esnek Filtre Gövdesi
  const isFiltered =
    (matchesPattern && skipSizeMatch) ||
    (matchesSize && matchesPattern) ||
    (matchesSize && activeRules.length === 0);

  // 4. REKÜRSİF AĞAÇ GEZİNTİSİ
  if (node.isDirectory && node.children) {
    const updatedChildren = node.children.map((child) =>
      ReevaluateTree(child, activeRules, sizeFilter),
    );

    // Üst klasörün otomatik açılması için çocuk kontrolü
    const hasFilteredChild = updatedChildren.some(
      (child) => child.isFiltered || child.hasFilteredChild,
    );

    return {
      ...node,
      isFiltered,
      hasFilteredChild,
      children: updatedChildren,
    };
  }

  return { ...node, isFiltered };
};

/**
 * Yedekleme için dosya kurallarını JSON biçiminde kaydeder.
 *
 * @param patterns
 */
export const JSONExport = (patterns: FileInfo[]) => {
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
};

// apps/file-info/src/components/context/fi-data-helpers.ts

/**
 * 🚀 1. KULLANICI GİRDİSİNİ BAYT'A ÇEVİRİCİ
 * UI'dan gelen (Değer + Birim) ikilisini performanslı sayı karşılaştırması için Byte'a dönüştürür.
 */
export const convertToBytes = (
  value: number,
  unit: "KB" | "MB" | "GB",
): number => {
  if (value <= 0 || isNaN(value)) return 0;

  const multipliers = {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return value * multipliers[unit];
};

/**
 * 🚀 2. INSAN-OKUNABİLİR BOYUT BİÇİMLENDİRİCİ (Human Readable)
 * Ağaçtaki ham 'size' (byte) bilgisini UI'da şık bir şekilde göstermek için kullanılır.
 * Örnek: 1548239 -> "1.48 MB"
 */
export const formatBytes = (bytes: number | undefined): string => {
  if (bytes === undefined || bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  // Logaritma ile sayının hangi birim basamağına (KB, MB vb.) denk geldiğini buluyoruz (Performans dostu)
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Sayıyı ilgili birime bölüp virgülden sonra en fazla 2 basamak bırakıyoruz
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

  return `${formattedValue} ${sizes[i]}`;
};

/**
 * 🚀 BÜYÜK DOSYA ANALİZ MOTORU (Saf Fonksiyon)
 * Ağaç yapısını rekürsif olarak gezerek, belirlenen byte eşiğinin üzerindeki
 * tüm dosyaları düz bir listeye toplar ve büyükten küçüğe sıralar.
 */
export const extractBigFiles = (
  node: FileNode,
  thresholdBytes: number,
): { name: string; path: string; size: number }[] => {
  let results: { name: string; path: string; size: number }[] = [];

  if (
    !node.isDirectory &&
    node.size !== undefined &&
    node.size >= thresholdBytes
  ) {
    results.push({
      name: node.name,
      path: node.path,
      size: node.size,
    });
  }

  if (node.isDirectory && node.children) {
    for (const child of node.children) {
      results = results.concat(extractBigFiles(child, thresholdBytes));
    }
  }

  // Büyükten küçüğe sıralama
  return results.sort((a, b) => b.size - a.size);
};

/**
 * 🚀 MARKDOWN AĞAÇ DÖNÜŞTÜRÜCÜ (Recursive)
 * Klasör yapısını standart terminal şemasına (├── ve └──) çevirir.
 *
 * @param node Gezilen mevcut dosya/klasör düğümü
 * @param prefix Sadece derinliklerdeki dikey çizgileri (│   ) taşır
 */
export const convertTreeToMarkdown = (node: FileNode, prefix = ""): string => {
  // İlk çalıştırmada (Kök dizin) direkt adını yazdırır
  let result = `${node.isDirectory ? "📁 " : "📄 "}${node.name}\n`;

  if (node.isDirectory && node.children && node.children.length > 0) {
    node.children.forEach((child, idx) => {
      const isLast = idx === node.children!.length - 1;

      // 1. Bu seviyedeki dosyanın/klasörün önüne gelecek olan connector
      const connector = isLast ? "└── " : "├── ";

      // 2. Recursive çağrı: Kendi adını, üstten gelen prefix + connector birleşimiyle basar
      const childContent = convertTreeToMarkdown(
        child,
        prefix + (isLast ? "    " : "│   "),
      );

      // Çıktıyı ana ağaca ekle
      result += `${prefix}${connector}${childContent}`;
    });
  }

  return result;
};

/**
 * 🚀 2. TEMİZ JSON STRIPPER
 * Ağaç nesnesini React UI durumlarından (isFiltered, hasFilteredChild vb.)
 * arındırarak sadece saf dosya ve klasör hiyerarşisi olarak dışa aktarır.
 */
export const convertTreeToCleanJSON = (node: FileNode): any => {
  const cleanNode: any = {
    name: node.name,
    path: node.path,
    isDirectory: node.isDirectory,
  };

  if (node.size !== undefined && !node.isDirectory) cleanNode.size = node.size;
  if (node.description) cleanNode.description = node.description;

  if (node.isDirectory && node.children) {
    cleanNode.children = node.children.map((child) =>
      convertTreeToCleanJSON(child),
    );
  }

  return cleanNode;
};
