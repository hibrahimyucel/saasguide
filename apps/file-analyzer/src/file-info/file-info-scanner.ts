import { FileNode } from "../types";

/**
 * 1. Web API Farklılıklarını Eşitleyen Evrensel Alt Yapı Arayüzü
 */
export interface UniversalEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  // Orijinal ham nesneleri taşır
  rawHandle?: any;
  rawEntry?: any;
}

/**
 * 2. ANA TEK REKÜRSİF TARAMA FONKSİYONU
 * Bu fonksiyon giriş kaynağının ne olduğunu önemsemez, UniversalEntry standardını takip eder.
 */
export const scanUniversal = async (
  entry: UniversalEntry,
  currentPath: string,
  depth: number,
  schema: any,
  getDescription: (name: string) => { isIgnored: boolean; desc: string },
): Promise<FileNode> => {
  const check = getDescription(entry.name);
  let nodeSizeStr = "";
  let isIgnored = check.isIgnored;
  let matchedRule = check.desc;

  // A) DOSYA BOYUTU VE KURAL DENETİMİ (Normalize Edilmiş Katman)
  if (entry.isFile) {
    try {
      let fileData: File;
      if (entry.rawHandle) {
        // Tıklama ile gelen FileSystemFileHandle
        fileData = await entry.rawHandle.getFile();
      } else {
        // Sürükle bırak ile gelen FileSystemFileEntry
        fileData = await new Promise((resolve, reject) =>
          entry.rawEntry.file(resolve, reject),
        );
      }

      const sizeInMB = fileData.size / (1024 * 1024);
      nodeSizeStr =
        sizeInMB < 0.1
          ? `${(fileData.size / 1024).toFixed(1)} KB`
          : `${sizeInMB.toFixed(2)} MB`;

      if (sizeInMB > schema.maxFileSizeMB) {
        isIgnored = true;
        matchedRule = `Boyut Sınırı İhlali (> ${schema.maxFileSizeMB}MB)`;
      }
    } catch {}
  }

  // B) DÜĞÜM (NODE) OLUŞTURMA
  const node: FileNode = {
    name: entry.name,
    path: `${currentPath}/${entry.name}`,
    kind: entry.isDirectory ? "directory" : "file",
    depth: depth,
    isDirectory: entry.isDirectory,
    isIgnored: isIgnored,
    size: nodeSizeStr,
    description: matchedRule,
  };

  // C) ALT DİZİN OKUMA (Asenkron Döngü Optimizasyonu)
  if (entry.isDirectory && !node.isIgnored) {
    node.children = [];
    const childrenEntries: UniversalEntry[] = [];

    try {
      if (entry.rawHandle) {
        // Tıklama Akışı: for await iterasyonu
        for await (const val of entry.rawHandle.values()) {
          childrenEntries.push({
            name: val.name,
            isDirectory: val.kind === "directory",
            isFile: val.kind === "file",
            rawHandle: val,
          });
        }
      } else {
        // Sürükle Bırak Akışı: createReader tabanlı Promise çözümlemesi
        const dirReader = entry.rawEntry.createReader();
        const rawEntries: any[] = await new Promise((resolve) =>
          dirReader.readEntries(resolve),
        );
        for (const sub of rawEntries) {
          childrenEntries.push({
            name: sub.name,
            isDirectory: sub.isDirectory,
            isFile: sub.isFile,
            rawEntry: sub,
          });
        }
      }

      // Alt elemanları ardışık olarak tara
      for (const child of childrenEntries) {
        node.children.push(
          await scanUniversal(
            child,
            node.path,
            depth + 1,
            schema,
            getDescription,
          ),
        );
      }
    } catch (err) {
      console.error(`Alt dizin okuma hatası (${node.path}):`, err);
    }

    // D) BOŞ KLASÖR VE SIRALAMA KRİTERLERİ
    if (schema.flagEmptyDirectories && node.children.length === 0) {
      node.isIgnored = true;
      node.description = "⚠️ Boş Klasör Tespit Edildi";
    } else {
      node.children.sort((a, b) => {
        if (a.kind === "directory" && b.kind !== "directory") return -1;
        if (a.kind !== "directory" && b.kind === "directory") return 1;
        return a.name.localeCompare(b.name, "tr");
      });
    }
  }

  return node;
};
