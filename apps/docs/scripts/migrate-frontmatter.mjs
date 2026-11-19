import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DOCS_DIR = path.resolve(process.cwd(), "apps/docs/src");
const IS_DRY_RUN = process.argv.includes("--dry-run");

// Klasör adından otomatik etiket üretimi için yardımcı fonksiyon
function extractFolderTags(relativePath) {
  const parts = relativePath.split(path.sep);
  parts.pop(); // dosya adını çıkar
  return parts
    .filter((p) => p && !p.startsWith("."))
    .map((p) => p.toLowerCase());
}

// İçerikten ilk anlamlı paragrafı SEO description olarak çıkarır (max 155 karakter)
function extractDescription(content, fallbackTitle) {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
!l.startsWith("* ") &&
        !l.startsWith("#") &&
        !l.startsWith(":::") &&
        !l.startsWith("-") &&
        !l.startsWith("|") &&
        !l.startsWith("```"),
    );

  if (lines.length === 0) {
    return `${fallbackTitle} - Teknik dokümantasyon ve uygulama rehberi.`;
  }

  // Markdown kalın/italik ve link işaretlerini temizle
  const cleanText = lines[0]
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  return cleanText.length > 155
    ? `${cleanText.slice(0, 152).trim()}...`
    : cleanText;
}

// Markdown içindeki ilk # H1 başlığını bulur
function extractH1Title(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) return fallback;
  return match[1].trim().replace(/^`([^`]+)`/, "$1");
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "public") continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function migrate() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Hedef dizin bulunamadı: ${DOCS_DIR}`);
    process.exit(1);
  }

  const mdFiles = walkDir(DOCS_DIR);
  let updatedCount = 0;

  for (const filePath of mdFiles) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data: existing, content } = matter(raw);
    const relativePath = path.relative(DOCS_DIR, filePath);
    const isIndexFile = path.basename(filePath).toLowerCase() === "index.md";

    const fallbackName = path.parse(filePath).name;
    const resolvedTitle =
      existing.title || extractH1Title(content, fallbackName);
    const resolvedDesc =
      existing.description || extractDescription(content, resolvedTitle);

    // Klasördeki diğer içeriklerden zenginlik kontrolü (isContent için)
    const bodyWithoutH1 = content.replace(/^#\s+.+$/m, "").trim();

    // Standartlaştırılmış Yeni Front Matter Şeması
    const standardizedMeta = {
      title:
        existing.title ||
        existing.konu ||
        extractH1Title(content, fallbackName),
      description: resolvedDesc,
      ...(existing.keywords ? { keywords: existing.keywords } : {}),
      outline: existing.outline ?? [2, 3] ,
      ...(existing.sidebarTitle ? { sidebarTitle: existing.sidebarTitle } : {}),
      ...(typeof existing.index === "number" ? { index: existing.index } : {}),
      ...(isIndexFile
        ? { isContent: existing.isContent ?? bodyWithoutH1.length > 0 }
        : {}),
      ...(typeof existing.hidden === "boolean"
        ? { hidden: existing.hidden }
        : {}),
      ...(existing.link ? { link: existing.link } : {}),
      ...(typeof existing.collapsed === "boolean"
        ? { collapsed: existing.collapsed }
        : {}),

      status: existing.status === "Tamamlandı" ? "published" : (existing.status || "published"),

      tags:
        Array.isArray(existing.etiketler) && existing.etiketler.length > 0
          ? existing.etiketler
          : Array.isArray(existing.tags) && existing.tags.length > 0
            ? existing.tags
            : extractFolderTags(relativePath),
    };

    const updatedFileContent = matter.stringify(content, standardizedMeta);

    if (raw !== updatedFileContent) {
      updatedCount++;
      if (IS_DRY_RUN) {
        console.log(`🔍 [DRY-RUN] Güncellenecek: ${relativePath}`);
      } else {
        fs.writeFileSync(filePath, updatedFileContent, "utf-8");
        console.log(`✅ Güncellendi: ${relativePath}`);
      }
    }
  }

  console.log(
    `\n🎉 İşlem tamamlandı! ${
      IS_DRY_RUN ? "Güncellenecek" : "Güncellenen"
    } dosya sayısı: ${updatedCount} / ${mdFiles.length}`,
  );
}

migrate();
