import fs from "fs";
import path from "path";
import type { DefaultTheme } from "vitepress";

/**
 * Markdown dosyasının ilk satırındaki "# Başlık" kısmını okur.
 */
function getTitleFromMarkdown(filePath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^#\s+(.+)$/m);
    if (!match) return fallback;
    const rawTitle = match[1].trim();
    // Sadece metnin en başındaki hiyerarşi alanındaki ilk iki ters tırnağı bulur ve siler.
    const cleanedTitle = rawTitle.replace(/^`([^`]+)`/, "$1");
    return cleanedTitle;
  } catch {
    return fallback;
  }
}

/**
 * index.md dosyasının başlıktan fazlasını içerip içermediğini kontrol eder.
 * Sadece başlık ve boşluklardan oluşuyorsa `false`, başka içerik varsa `true` döner.
 */
function isIndexRichContent(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Başlık satırını ve tüm boşlukları/yeni satırları temizle
    const cleanContent = content.replace(/^#\s+.+$/m, "").trim();
    
    // Eğer geriye kalan karakter varsa içerik zengindir
    return cleanContent.length > 0;
  } catch {
    return false;
  }
}

/**
 * "01-kurulum-rehberi" gibi dosya adlarının başındaki sayıları ve tireleri temizler,
 * metnin ilk harfini büyütür.
 */
function cleanMenuText(rawText: string): string {
  const clean = rawText.replace(/^\d+[-_]*/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Bir menü elemanının altındaki en derin, klasör olmayan İLK gerçek linki bulur.
 */
function findFirstDeepLink(item: DefaultTheme.SidebarItem): string | undefined {
  if (item.link && (!item.items || item.items.length === 0)) {
    return item.link;
  }
  if (item.items && item.items.length > 0) {
    return findFirstDeepLink(item.items[0]);
  }
  return item.link;
}

/**
 * Sıralama bittikten sonra tüm ağacı gezer ve klasör (index) linklerini
 * en derindeki İLK geçerli döküman linki ile değiştirir.
 * 🎯 YENİ KURAL: Klasörün kendi index.md dosyası zengin içerik barındırıyorsa link DEĞİŞTİRİLMEZ.
 */
function fixIndexLinks(
  menuItems: DefaultTheme.SidebarItem[], 
  scanPath: string
): DefaultTheme.SidebarItem[] {
  for (const item of menuItems) {
    if (item.items && item.items.length > 0) {
      // Önce alt kırılımları kendi içinde çöz (Bottom-up)
      // Alt klasörün taranacak fiziksel yolunu bulabilmek için ilgili klasör adını ekliyoruz
      // Not: item.text temizlenmiş olabileceği için bu yapı klasör adlarının orijinal kalması durumunda en sağlıklı sonucu verir.
      const currentFolder = item.link?.split("/").filter(Boolean).pop() || "";
      const subScanPath = path.join(scanPath, currentFolder);

      fixIndexLinks(item.items, subScanPath);

      // İlgili klasörün index.md yolunu kontrol et
      const indexFilePath = path.join(scanPath, currentFolder, "index.md");

      // Eğer index.md zengin içerik İÇERMİYORSA linki en derindeki ilk sayfaya taşı
      if (!isIndexRichContent(indexFilePath)) {
        const deepLink = findFirstDeepLink(item.items[0]);
        if (deepLink) {
          item.link = deepLink;
        }
      }
    }
  }
  return menuItems;
}

/**
 * Belirtilen klasörü tarayarak dinamik VitePress sidebar yapısı oluşturur.
 * @param scanPath Taranacak klasör yolu
 * @param basePath URL ön eki
 * @param depth Geçerli derinlik seviyesi (Varsayılan: 1 - En dış seviye)
 */
export function generateDynamicSidebar(
  scanPath: string,
  basePath: string,
  depth: number = 1
): DefaultTheme.SidebarItem[] {
  const absolutePath = path.resolve(process.cwd(), scanPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items: DefaultTheme.SidebarItem[] = [];
  const files = fs.readdirSync(absolutePath);

  for (const file of files) {
    if (file.toLowerCase() === "index.md" || file.startsWith(".")) continue;

    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subItems = generateDynamicSidebar(
        path.join(scanPath, file),
        `${basePath}${file}/`,
        depth + 1
      );

      if (subItems.length > 0) {
        const subIndexFullPath = path.join(fullPath, "index.md");
        const folderTitle = fs.existsSync(subIndexFullPath)
          ? getTitleFromMarkdown(subIndexFullPath, cleanMenuText(file))
          : cleanMenuText(file);

        const isCollapsed = depth > 1;

        items.push({
          text: folderTitle,
          link: `${basePath}${file}/`,
          collapsible: true,
          collapsed: isCollapsed,
          items: subItems,
        });
      }
    } else if (file.endsWith(".md")) {
      const nameWithoutExt = path.parse(file).name;
      const fallbackTitle = cleanMenuText(nameWithoutExt);
      const title = getTitleFromMarkdown(fullPath, fallbackTitle);

      items.push({
        text: title,
        link: `${basePath}${nameWithoutExt}`,
      });
    }
  }

  // OLUŞAN LİSTEYİ TÜRKÇE KARAKTERLERE UYGUN SIRALAMA
  items.sort((a, b) => {
    const titleA = a.text || "";
    const titleB = b.text || "";
    return titleA.localeCompare(titleB, "tr", { numeric: true, sensitivity: "base" });
  });

  // Eğer en dış çağrıdaysak (depth === 1) link düzeltme fonksiyonunu çalıştır
  // fixIndexLinks fonksiyonuna başlangıç scanPath yolunu da veriyoruz ki fiziksel dosyaları kontrol edebilsin.
  return depth === 1 ? fixIndexLinks(items, scanPath) : items;
}

