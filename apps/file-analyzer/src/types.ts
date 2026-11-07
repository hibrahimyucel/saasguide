import { initialSchema } from "./file-info/file-info-data";

/**
 * Klasör tarayıcı tarafından üretilen her bir dosya veya klasör düğümü (node)
 */
export interface FileNode {
  name: string;
  path: string; // Kök dizine göre göreceli yol (relative path)
  isDirectory: boolean;
  children?: FileNode[]; // Eğer klasörse alt elemanları
}

/**
 * file-info.json şeması içindeki özel arama ve filtreleme kalıpları
 */

export interface DescPattern {
  expression: string; // ifade dosya ismi, dosya uzantısı olabilir. wilcard içerebilir (ör: "src/**/*.ts" veya "^node_modules/")
  description: string; // Dosya açıklaması veya metadata bilgisi
  ignore: boolean; // Bu kurala eşleşen dosyalar yoksayılsın mı?
  extension: boolean;
  group: string;
  regExp?: RegExp;
  kind: "3-ext" | "2-regExp" | "1-regular";
}
export type baseDescPattern = Omit<DescPattern, "kind">;
//export type ExtDescPattern = DescPattern & { regExp?: RegExp,kind:'3-ext'|'2-regExp'|'1-regular' };
/**
 * Projenin filtreleme kurallarını ve metadata verilerini barındıran file-info.json şeması
 */
export interface FileInfoSchema {
  List: DescPattern[];
  RegExp: DescPattern[];
  Descriptions: DescPattern[];
  maxFileSizeMB: number;
  flagEmptyDirectories: boolean;
}

export const maxFileSizeMB: number = 10;
export const flagEmptyDirectories: boolean = true;

export interface FileNode {
  name: string;
  path: string;
  depth: number;
  kind: "file" | "directory";
  isIgnored: boolean;
  size?: string;
  description?: string;
  children?: FileNode[];
}

// 1. Bu ifadenin regex gerektirip gerektirmediğini kontrol eder (İçinde * var mı?)
function isWildcardPattern(val: string): boolean {
  return val.includes("*");
}

// 2. Sadece dosya/klasör adları için Joker (*) karakterini Regex'e dönüştürür
function wildcardToRegex(wildcard: string): RegExp | null {
  const trimmed = wildcard.trim();
  if (!trimmed) return null;

  // Regex özel karakterlerini kaçır (\), ancak yıldız (*) karakterlerine dokunma
  let pattern = trimmed.replace(/[.+^${}()|[\]\\]/g, "\\$&");

  // Sadece dosya/klasör adı olduğu için ** ve * aynı anlama gelir: "Herhangi bir karakter dizisi"
  // Büyük/küçük harf duyarsızlığı (case-insensitive) için regex'e 'i' bayrağı ekliyoruz
  pattern = pattern.replace(/\*/g, ".*");

  return new RegExp(`^${pattern}$`, "i");
}

export const generateDescMap = (): FileInfoSchema => {
  let items: DescPattern[] = [];

  for (const item of Object.values(initialSchema)) {
    if (isWildcardPattern(item.expression)) {
      const regex = wildcardToRegex(item.expression);
      if (regex) {
        items.push({
          ...item,
          regExp: regex,
          kind: "2-regExp",
        });
      }
    } else {
      items.push({ ...item, kind: item.extension ? "3-ext" : "1-regular" });
    }
  }
  items = items.sort((a, b) => {
    // 1. Sort by 'kind' alphabetically ('1-regular' -> '2-regExp' -> '3-ext')
    const kindCompare = a.kind?.localeCompare(b.kind || "");

    // If 'kind' is different, return the comparison result
    if (kindCompare !== 0) {
      return kindCompare;
    }

    // 2. If 'kind' is the same, sort by 'expression' alphabetically
    return a.expression.localeCompare(b.expression);
  });

  // 1. Diziyi 'kind' alanına göre 3 gruba ayırıyoruz
  const groupedPatterns = Object.groupBy(items, (item) => item.kind);

  return {
    List: groupedPatterns["1-regular"] || [],
    RegExp: groupedPatterns["2-regExp"] || [],
    Descriptions: groupedPatterns["3-ext"] || [],
    maxFileSizeMB: 10,
    flagEmptyDirectories: true,
  };
};
