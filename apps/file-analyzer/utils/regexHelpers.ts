import { DescPattern, FileInfoSchema } from '../types';

/** 
 * Kullanıcının girdiğinde belirttiği wildcard (ör: src/**//*.ts veya *.log) 
 * ifadesini güvenli ve doğru çalışan bir RegExp nesnesine dönüştürür.
 */
export function wildcardToRegex(wildcard: string): RegExp | null {
  let pattern = wildcard.trim().replace(/^\/+|\/+$/g, '');
  if (!pattern) return null;

  // Özel regex karakterlerini kaçır (escape)
  pattern = pattern.replace(/[.+^${}()|[\]\\/]/g, '\\$&');

  // Klasör derinliği ve tekil joker yıldız dönüşümleri
  pattern = pattern.replace(/\*\*+/g, '.*').replace(/\*/g, '[^/]*');

  // Tam eşleşme, alt kırılım veya dizin içi aramaları kapsayacak varyasyon güvenliği
  return new RegExp(`^${pattern}$|^${pattern}/|/${pattern}$|/${pattern}/`);
}

/**
 * Gelen dosya veya klasör yolunu file-info.json şemasına göre test eder.
 * Dosyanın yoksayılıp (ignore) sayılmayacağını ve bir açıklaması olup olmadığını döner.
 */
export function analyzePathWithSchema(
  relativePath: string,
  fileName: string,
  schema: FileInfoSchema
): { isIgnored: boolean; desc?: string } {
  
  // 1. Aşama: Özel Regex / Wildcard Kuralları (customIgnoreList) Kontrolü
  if (schema.customIgnoreList && schema.customIgnoreList.length > 0) {
    for (const rule of schema.customIgnoreList) {
      if (rule.type === 'regex' && rule.expr) {
        try {
          const rx = new RegExp(rule.expr);
          if (rx.test(relativePath)) {
            return { isIgnored: rule.ignore, desc: rule.desc };
          }
        } catch (e) {
          console.error(`Geçersiz regex kuralı: ${rule.expr}`, e);
        }
      } else if (rule.type === 'wildcard' && rule.expr) {
        const rx = wildcardToRegex(rule.expr);
        if (rx && rx.test(relativePath)) {
          return { isIgnored: rule.ignore, desc: rule.desc };
        }
      }
    }
  }

  // 2. Aşama: Dosya Uzantısı Açıklamaları (extensionDescriptions) Kontrolü
  if (schema.extensionDescriptions && schema.extensionDescriptions.length > 0) {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex !== -1) {
      const fileExt = fileName.slice(dotIndex).toLowerCase(); // ör: ".ts"
      
      const extensionMatch = schema.extensionDescriptions.find(
        (d) => d.expr.toLowerCase() === fileExt
      );
      
      if (extensionMatch) {
        return { isIgnored: extensionMatch.ignore, desc: extensionMatch.desc };
      }
    }
  }

  // Eşleşme yoksa varsayılan durum
  return { isIgnored: false };
}
