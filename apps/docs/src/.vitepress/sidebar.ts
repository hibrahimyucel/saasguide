import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { DefaultTheme } from "vitepress";

interface SidebarFrontMatter {
  index?: number;
  isContent?: boolean;
  link?: string;
  sidebarTitle?: string;
  hidden?: boolean;
  collapsed?: boolean;
}

interface ExtendedSidebarItem extends DefaultTheme.SidebarItem {
  _index: number;
  _isContent?: boolean;
  _hasExplicitLink?: boolean;
  items?: ExtendedSidebarItem[];
}

function parseMarkdownMetadata(
  filePath: string,
  fallbackTitle: string,
): { title: string; meta: SidebarFrontMatter } {
  try {
    if (!fs.existsSync(filePath)) {
      return { title: fallbackTitle, meta: {} };
    }

    const rawFile = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(rawFile);
    const meta = data as SidebarFrontMatter;

    if (meta.sidebarTitle) {
      return { title: meta.sidebarTitle.trim(), meta };
    }

    const match = content.match(/^#\s+(.+)$/m);
    if (!match) {
      return { title: fallbackTitle, meta };
    }

    const cleanedTitle = match[1].trim().replace(/^`([^`]+)`/, "$1");
    return { title: cleanedTitle, meta };
  } catch {
    return { title: fallbackTitle, meta: {} };
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
function resolveFolderLinks(
  menuItems: ExtendedSidebarItem[],
): DefaultTheme.SidebarItem[] {
  return menuItems.map((item) => {
    if (item.items && item.items.length > 0) {
      item.items = resolveFolderLinks(item.items) as ExtendedSidebarItem[];

      // Açıkça symlink (link) tanımlanmamışsa ve içerik barındırmıyorsa (isContent !== true) ilk alt düğüme yönlendir
      if (!item._hasExplicitLink && item._isContent !== true) {
        const deepLink = findFirstDeepLink(item.items[0]);
        if (deepLink) {
          item.link = deepLink;
        }
      }
    }

    // VitePress çıktısını kirletmemek için iç yardımcı alanları temizle
    const { _index, _isContent, _hasExplicitLink, ...cleanItem } = item;
    return cleanItem;
  });
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
  depth: number = 1,
): DefaultTheme.SidebarItem[] {
  const absolutePath = path.resolve(process.cwd(), scanPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items: ExtendedSidebarItem[] = [];
  const files = fs.readdirSync(absolutePath);

  for (const file of files) {
    if (file.toLowerCase() === "index.md" || file.startsWith(".")) continue;

    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subIndexFullPath = path.join(fullPath, "index.md");
      const { title: folderTitle, meta } = parseMarkdownMetadata(
        subIndexFullPath,
        cleanMenuText(file),
      );

      // Klasörün index.md dosyasında hidden: true varsa tüm alt ağacı atla
      if (meta.hidden === true) continue;

      const subItems = generateDynamicSidebar(
        path.join(scanPath, file),
        `${basePath}${file}/`,
        depth + 1,
      ) as ExtendedSidebarItem[];

      const hasExplicitLink = Boolean(meta.link);

      // Alt öğesi varsa VEYA sembolik menü olarak açık link verilmişse ağaca ekle
      if (subItems.length > 0 || hasExplicitLink) {
        const node: ExtendedSidebarItem = {
          text: folderTitle,
          link: meta.link || `${basePath}${file}/`,
          _index: meta.index ?? Number.MAX_SAFE_INTEGER,
          _isContent: meta.isContent,
          _hasExplicitLink: hasExplicitLink,
        };

        if (subItems.length > 0) {
          node.collapsed = meta.collapsed ?? depth > 1;
          node.items = subItems;
        }

        items.push(node);
      }
    } else if (file.endsWith(".md")) {
      const nameWithoutExt = path.parse(file).name;
      const { title, meta } = parseMarkdownMetadata(
        fullPath,
        cleanMenuText(nameWithoutExt),
      );

      if (meta.hidden === true) continue;

      items.push({
        text: title,
        link: meta.link || `${basePath}${nameWithoutExt}`,
        _index: meta.index ?? Number.MAX_SAFE_INTEGER,
      });
    }
  }

  // 1. Öncelik: Front Matter 'index' değeri | 2. Öncelik: Türkçe alfabetik sıralama
  items.sort((a, b) => {
    if (a._index !== b._index) {
      return a._index - b._index;
    }
    return (a.text || "").localeCompare(b.text || "", "tr", {
      numeric: true,
      sensitivity: "base",
    });
  });

  return depth === 1 ? resolveFolderLinks(items) : items;
}
