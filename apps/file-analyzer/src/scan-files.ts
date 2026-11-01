import { initialSchema } from './file-info.ts';
import { DescPattern, FileInfoSchema, FileNode } from './file-info.ts';

type RegExpDescPattern = Omit<DescPattern, 'expr'> & { expr: RegExp };


// --- GLOBAL DEĞİŞKENLER VE BAŞLANGIÇ DEĞERLERİ ---
let extensionDescriptions: DescPattern[] = [];

let customIgnoreList: DescPattern[] = [];
let regExpIgnoreList: RegExpDescPattern[] = [];

// --- İŞLEM ADIMLARI FONKSİYONLARI ---
function wildcardToRegex(wildcard: string): RegExp | null {
  let pattern = wildcard.trim().replace(/^\/+|\/+$/g, '');
  if (!pattern) return null;

  // Özel regex karakterlerini kaçır (escape)
  pattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // ** ve * kalıplarını regex formatına çevir
  pattern = pattern.replace(/\*\*+/g, '.*').replace(/\*/g, '[^/]*');
  return new RegExp(`^${pattern}$|^${pattern}/|/${pattern}$|/${pattern}/`);
}

const generateDescMap = () => {
  for (const item of Object.values(initialSchema.global_ignore_patterns)) {
    // 1. Destructuring ile 'expr' alanını ayırıp kalan özellikleri 'rest' içine alıyoruz
    const { expr, ...rest } = item;

    const r = wildcardToRegex(expr);

    if (r) {
      // 2. Kalan özellikleri (...rest) ve yeni oluşturulan 'expr: r' değerini birleştiriyoruz
      regExpIgnoreList.push({
        expr: r,
        ...rest
      });
    } else {
      // Regex'e dönüşemiyorsa orijinal item'ı aynen ekliyoruz
      customIgnoreList.push(item);
    }
  }
};


/**
 * 4. Adım: Hiyerarşik Dizin Tarama (Özyinelemeli / Recursive)
 */
function scanDirectoryTree(dirPath: string, relativePath: string = '', regexRules: RegExp[] = []): TreeNode[] {
  const results: TreeNode[] = [];

  try {
    const items = fs.readdirSync(dirPath);

    // Dosya ve klasörleri ayırt et ve durum bilgisini al
    const analyzedItems = items.map((item) => {
      const fullPath = path.join(dirPath, item);
      let isDirectory = false;
      try {
        isDirectory = fs.statSync(fullPath).isDirectory();
      } catch (e) {
        // Hata durumunda varsayılan olarak false kalır
      }
      return { item, isDirectory };
    });

    // Önce klasörleri, sonra dosyaları kendi içlerinde alfabetik sırala
    const folders = analyzedItems.filter((i) => i.isDirectory).sort((a, b) => a.item.localeCompare(b.item));
    const files = analyzedItems.filter((i) => !i.isDirectory).sort((a, b) => a.item.localeCompare(b.item));
    const sortedItems = [...folders, ...files];

    sortedItems.forEach(({ item, isDirectory }) => {
      const currentRelPath = relativePath ? path.join(relativePath, item) : item;

      // Yoksayma kurallarına uyup uymadığını kontrol et (Windows/Linux yol uyumluluğu ile)
      const shouldIgnore = regexRules.some((regex) =>
        regex.test(item) ||
        regex.test(currentRelPath) ||
        regex.test(currentRelPath.replace(/\\/g, '/'))
      );

      if (shouldIgnore) return;

      const fullPath = path.join(dirPath, item);
      const ext = path.extname(item).toLowerCase();

      // Açıklama ataması yap (Özel isim -> Uzantı -> Varsayılan)
      const desc = exactDescriptions[item] || extensionDescriptions[ext] || (isDirectory ? 'Klasör' : 'Dosya');

      const node: TreeNode = {
        type: isDirectory ? 'folder' : 'file',
        name: item,
        desc: desc,
      };

      // Eğer klasörse, alt kırılımları tara ve children dizisine ekle
      if (isDirectory) {
        node.children = scanDirectoryTree(fullPath, currentRelPath, regexRules);
      }

      results.push(node);
    });
  } catch (error: any) {
    console.error(`Hata (${dirPath}):`, error.message);
  }

  return results;
}

/**
 * 5. Adım: Ana Akışı Tetikleme ve Dosya Çıktısı Üretme
 */
export function generateFileTree(): void {
  // 1. Dış konfigürasyonları yükle
  loadExternalConfig();

  // 2. Projedeki .gitignore ve .dockerignore dosyalarını ekle
  loadIgnoreFiles();

  // 3. Tüm yoksayma kalıplarını Regex nesnelerine dönüştür ve filtrele
  const regexRules = ignorePatterns
    .map((p) => wildcardToRegex(p))
    .filter((r): r is RegExp => r !== null);

  // 4. Kök dizinden itibaren ağaç yapısını tara
  const treeData = scanDirectoryTree('.', '', regexRules);

  // 5. Çıktıyı formatlı bir JavaScript modülü olarak diske yaz
  const fileContent = `export const fileTree = ${JSON.stringify(treeData, null, 2)};\n`;
  fs.writeFileSync('fileTree.js', fileContent, 'utf-8');

  console.log('✔ Yeni nesil hiyerarşik "fileTree.js" başarıyla oluşturuldu!');
}

// Betik doğrudan çalıştırıldığında tetiklenmesi için:
generateFileTree();

