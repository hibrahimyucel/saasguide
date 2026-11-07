/*
 * File Analyzer temel veri tipleri
 */

// Şema tanımı
export interface FileInfo {
  expression: string;
  description: string;
  ignore: boolean;
  extension: boolean;
  group: string;
  regExp?: RegExp;
  checked?: boolean;
  kind?: "1-regular" | "2-regExp" | "3-ext";
}
/*
 * Dosya arama ve listelemede kullanılacak tip. filtered alanı özel filtreleme (FileInfo.checked) için kısayol olarak kullanılacak
 */
export interface FileNode {
  name: string;
  path: string; // Kök dizine göre göreceli yol (relative path)
  isDirectory: boolean;
  children?: FileNode[]; // Eğer klasörse alt elemanları
  filtered?: boolean;
}
