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
    return match ? match[1].trim() : fallback;
  } catch {
    return fallback;
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
 * Belirtilen klasörü tarayarak dinamik VitePress sidebar yapısı oluşturur.
 */
export function generateDynamicSidebar(
  scanPath: string,
  basePath: string
): DefaultTheme.SidebarItem[] {
  const absolutePath = path.resolve(process.cwd(), scanPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items: DefaultTheme.SidebarItem[] = [];

  // Dosya ve klasör adlarını doğal sıralama (0-9, A-Z) ile oku
  const files = fs
    .readdirSync(absolutePath)
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

  for (const file of files) {
    // index.md veya gizli dosyaları listeye ekleme, doğrudan atla
    if (file.toLowerCase() === "index.md" || file.startsWith(".")) continue;

    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subItems = generateDynamicSidebar(
        path.join(scanPath, file),
        `${basePath}${file}/`
      );

      // Eğer alt klasörün içi boşsa sidebar'a ekleme yapma
      if (subItems.length > 0) {
        const subIndexFullPath = path.join(fullPath, "index.md");
        const folderTitle = fs.existsSync(subIndexFullPath)
          ? getTitleFromMarkdown(subIndexFullPath, cleanMenuText(file))
          : cleanMenuText(file);

        items.push({
          text: folderTitle,
          link: `${basePath}${file}/`,
          collapsible: true,
          collapsed: false,
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

  return items;
}

