/**
 * @field expression; dosya tanımlaması için temel ifade
 * @field ignore; dosya, tarama sırasında yoksayılır
 *
 */
export interface FileInfo {
  expression: string;
  description: string;
  ignore: boolean;
  extension: boolean;
  group: string;
  isActive?: boolean;
  regExp?: RegExp;
  checked?: boolean;
  kind?: "1-regular" | "2-regExp" | "3-ext";
}

/**
 * Dosya tarama sonuçlarını saklamak için kullanılacak tip.
 *
 * Kök bilgiler : name, path, isDirectory, children
 *
 * Tarama verileri : size, depth, isIgnored, description, match
 *
 * Hesaplanan alanlar :  isFiltered, hasFilteredChild
 */
export interface FileNode {
  name: string;
  path: string; // Kök dizine göre göreceli yol (relative path)
  isDirectory: boolean;
  children?: FileNode[]; // Eğer klasörse alt elemanları
  depth?: number;
  size?: number;
  isIgnored?: boolean;
  description?: string;
  match?: string;
  isFiltered?: boolean;
  hasFilteredChild?: boolean;
}
export interface SizeFilter {
  mode: "all" | "greater" | "less";
  value: number;
  unit: "KB" | "MB";
}
