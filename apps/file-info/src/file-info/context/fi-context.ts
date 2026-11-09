// src/file-info/context/fi-context.ts
import { createContext, useContext } from "react";
import { FileInfo, FileNode, SizeFilter } from "./fi-types";

export interface PatternContextType {
  patterns: FileInfo[];
  scannedTree: FileNode | null;
  setScannedTree: (tree: FileNode | null) => void;
  sizeFilter: SizeFilter;
  setSizeFilter: React.Dispatch<React.SetStateAction<SizeFilter>>;
  handleAddPattern: (newItem: Omit<FileInfo, "kind" | "regExp">) => boolean;
  removePattern: (expression: string) => void;
  updatePattern: (updatedItem: FileInfo) => void;
  toggleChecked: (expression: string) => void;
  toggleActive: (expression: string) => void;
  resetPatterns: () => void;
  exportToJSON: () => void;
  importFromJSON: (file: File) => Promise<boolean>;
  applyCurrentPatternsToTree: (rawTree: FileNode) => void;
  bigFileThreshold: { value: number; unit: "KB" | "MB" };
  setBigFileThreshold: React.Dispatch<
    React.SetStateAction<{ value: number; unit: "KB" | "MB" }>
  >;
  bigFilesReport: { name: string; path: string; size: number }[];
  restoreToDefault: () => void;
}

// 🚀 Tek bir ortak Context nesnesi
export const PatternContext = createContext<PatternContextType | undefined>(
  undefined,
);

// 🚀 Fast Refresh dostu bağımsız Custom Hook
export const useData = () => {
  const context = useContext(PatternContext);
  if (context === undefined) {
    throw new Error("useData mutlaka bir DataProvider içinde kullanılmalıdır.");
  }
  return context;
};
