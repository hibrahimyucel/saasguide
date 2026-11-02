import { FileNode } from '../types';

/**
 * Kullanıcıdan showDirectoryPicker aracılığıyla klasör izni ister
 * ve tüm dizini asenkron olarak tarayarak bir ağaç yapısı (FileNode) döner.
 */
export async function scanSelectedDirectory(): Promise<FileNode | null> {
  try {
    // Tarayıcı Directory Picker API tetikleyici
    const dirHandle = await window.showDirectoryPicker();
    
    // Ağacı en üst (root) klasörden başlatarak oluştur
    return await buildFileTree(dirHandle);
  } catch (error) {
    // Kullanıcı iptal ettiğinde veya izin verilmediğinde yakala
    console.error('Klasör tarama işlemi iptal edildi veya başarısız oldu:', error);
    return null;
  }
}

/**
 * Özyinelemeli (Recursive) olarak tüm klasör yapısını tarayan yardımcı fonksiyon
 */
async function buildFileTree(
  handle: FileSystemDirectoryHandle | FileSystemFileHandle,
  currentPath: string = ''
): Promise<FileNode> {
  const relativePath = currentPath ? `${currentPath}/${handle.name}` : handle.name;

  // Temel FileNode Yapısı
  const node: FileNode = {
    name: handle.name,
    path: relativePath,
    isDirectory: handle.kind === 'directory',
    isIgnored:false,
    kind:handle.kind
  };

  if (handle.kind === 'directory') {
    node.children = [];
    
    // Klasör altındaki tüm nesneleri (iteratör) dön
    for await (const entry of (handle as FileSystemDirectoryHandle).values()) {
      // Her bir alt öğeyi özyinelemeli olarak ağaca ekle
      const childNode = await buildFileTree(entry, relativePath);
      node.children.push(childNode);
    }

    // Klasör yapısını önce klasörler, sonra dosyalar gelecek şekilde alfabetik sırala
    node.children.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }

  return node;
}
