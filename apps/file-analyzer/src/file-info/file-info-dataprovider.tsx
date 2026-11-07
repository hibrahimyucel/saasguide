import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { initialSchema } from "./file-info-data";
import { FileInfo, FileNode } from "./file-info-types";

interface PatternContextType {
  patterns: FileInfo[];
  scannedTree: FileNode | null;
  setScannedTree: (tree: FileNode | null) => void;
  addPattern: (newItem: Omit<FileInfo, "kind" | "regExp">) => boolean;
  removePattern: (expression: string) => void;
  updatePattern: (updatedItem: FileInfo) => void;
  toggleChecked: (expression: string) => void;
  resetPatterns: () => void;
  exportToJSON: () => void;
  importFromJSON: (file: File) => Promise<boolean>;
}

const PatternContext = createContext<PatternContextType | undefined>(undefined);

// --- 1. CORE EXPRESSION PARSER MOTORU ---
const parseAndCompileExpression = (
  expr: string,
  isExtensionFlag: boolean,
): { regExp: RegExp; kind: NonNullable<FileInfo["kind"]> } => {
  const trimmed = expr.trim();

  if (isExtensionFlag) {
    const escapedExt = trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    return { regExp: new RegExp(escapedExt, "i"), kind: "3-ext" };
  }

  const regexLiteralPattern = /^\/(.+)\/([gimyus]*)$/;
  const match = trimmed.match(regexLiteralPattern);
  if (match) {
    try {
      return { regExp: new RegExp(match[1], match[2]), kind: "2-regExp" };
    } catch {}
  }

  const hasDynamicTokens =
    /[\*\?\\\+^$\|\[\]\(\)\{\}]/.test(trimmed) ||
    /\d/.test(trimmed) ||
    /(yy|mm|dd|yyyy)/i.test(trimmed);

  if (hasDynamicTokens) {
    try {
      let safePattern = trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, (m) =>
        m === "*" ? ".*" : m === "?" ? "." : `\\${m}`,
      );
      safePattern = safePattern
        .replace(/yyyy/gi, "\\d{4}")
        .replace(/mm/gi, "\\d{2}")
        .replace(/dd/gi, "\\d{2}");
      return { regExp: new RegExp(safePattern, "i"), kind: "2-regExp" };
    } catch {}
  }

  const escapedLiteral = trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  return { regExp: new RegExp(escapedLiteral, "i"), kind: "1-regular" };
};

const pipelineInitialize = (schema: any[]): FileInfo[] => {
  const hydrated = schema.map((item) => {
    const expr = item.expression || item.expr || "";
    const isExtension =
      item.extension !== undefined ? !!item.extension : !!item.isExt;
    const { regExp, kind } = parseAndCompileExpression(expr, isExtension);

    return {
      expression: expr,
      description: String(item.description || item.desc || ""),
      ignore: item.ignore !== undefined ? !!item.ignore : false,
      extension: isExtension,
      group: String(item.group || item.grp || ""),
      checked: item.checked !== undefined ? !!item.checked : false,
      kind,
      regExp,
    };
  });

  return hydrated.sort((a, b) => {
    const kindCompare = (a.kind || "").localeCompare(b.kind || "");
    if (kindCompare !== 0) return kindCompare;
    return a.expression.localeCompare(b.expression);
  });
};

// --- 2. PROVIDER BİLEŞENİ ---
export const PatternProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [patterns, setPatterns] = useState<FileInfo[]>(() =>
    pipelineInitialize(initialSchema),
  );
  const [scannedTree, setScannedTree] = useState<FileNode | null>(null);

  // 🚀 REKÜRSİF RE-EVALUATION ENGINE: Evaluates existing node maps against runtime active schema
  const autoReevaluateTree = useCallback(
    (node: FileNode, activeRules: FileInfo[]): FileNode => {
      let isFiltered = false;

      if (activeRules.length > 0) {
        isFiltered = activeRules.some((rule) => {
          if (!rule.regExp) return false;
          if (rule.extension) {
            return node.name
              .toLowerCase()
              .endsWith(rule.expression.toLowerCase());
          }
          return rule.regExp.test(node.name) || rule.regExp.test(node.path);
        });
      }

      if (node.isDirectory && node.children) {
        return {
          ...node,
          filtered: isFiltered,
          children: node.children.map((child) =>
            autoReevaluateTree(child, activeRules),
          ),
        };
      }

      return {
        ...node,
        filtered: isFiltered,
      };
    },
    [],
  );

  // 🚀 AUTOMATIC SYNC REACTIVE SIDE EFFECT
  useEffect(() => {
    if (!scannedTree) return;

    const activeRules = patterns.filter((p) => p.checked);
    setScannedTree((prevTree) => {
      if (!prevTree) return null;
      // Triggers immediate automatic non-destructive re-filtering pipeline execution
      return autoReevaluateTree(prevTree, activeRules);
    });
  }, [patterns, autoReevaluateTree]);

  const addPattern = useCallback(
    (newItem: Omit<FileInfo, "kind" | "regExp">) => {
      let isSuccess = false;
      setPatterns((prev) => {
        if (prev.some((p) => p.expression === newItem.expression)) {
          alert("Bu kural zaten mevcut!");
          isSuccess = false;
          return prev;
        }
        const { regExp, kind } = parseAndCompileExpression(
          newItem.expression,
          newItem.extension,
        );
        const completedItem: FileInfo = {
          ...newItem,
          kind,
          regExp,
          checked: newItem.checked !== undefined ? !!newItem.checked : false,
        };
        isSuccess = true;
        const updatedList = [...prev, completedItem];
        return updatedList.sort((a, b) => {
          const kindCompare = (a.kind || "").localeCompare(b.kind || "");
          if (kindCompare !== 0) return kindCompare;
          return a.expression.localeCompare(b.expression);
        });
      });
      return isSuccess;
    },
    [],
  );

  const removePattern = useCallback((expression: string) => {
    setPatterns((prev) => prev.filter((p) => p.expression !== expression));
  }, []);

  const updatePattern = useCallback((updatedItem: FileInfo) => {
    setPatterns((prev) =>
      prev.map((p) => {
        if (p.expression !== updatedItem.expression) return p;
        const { regExp, kind } = parseAndCompileExpression(
          updatedItem.expression,
          updatedItem.extension,
        );
        return { ...updatedItem, regExp, kind };
      }),
    );
  }, []);

  const toggleChecked = useCallback((expression: string) => {
    setPatterns((prev) =>
      prev.map((p) =>
        p.expression === expression ? { ...p, checked: !p.checked } : p,
      ),
    );
  }, []);

  const resetPatterns = useCallback(() => {
    setPatterns(() => pipelineInitialize(initialSchema));
    setScannedTree(null);
  }, []);

  const exportToJSON = useCallback(() => {
    const cleanPatterns = patterns.map(({ regExp, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(cleanPatterns, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patterns-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [patterns]);

  const importFromJSON = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string);
            if (!Array.isArray(imported)) {
              alert("Geçersiz JSON yapısı.");
              return resolve(false);
            }

            const dynamicHydration = pipelineInitialize(imported);
            const map = new Map<string, FileInfo>();
            patterns.forEach((p) => map.set(p.expression, p));
            dynamicHydration.forEach((item) => map.set(item.expression, item));

            setPatterns(
              Array.from(map.values()).sort((a, b) => {
                const kindCompare = (a.kind || "").localeCompare(b.kind || "");
                if (kindCompare !== 0) return kindCompare;
                return a.expression.localeCompare(b.expression);
              }),
            );
            resolve(true);
          } catch {
            alert("JSON ayrıştırma hatası.");
            resolve(false);
          }
        };
        reader.readAsText(file);
      });
    },
    [patterns],
  );

  return (
    <PatternContext.Provider
      value={{
        patterns,
        scannedTree,
        setScannedTree,
        addPattern,
        removePattern,
        updatePattern,
        toggleChecked,
        resetPatterns,
        exportToJSON,
        importFromJSON,
      }}
    >
      {children}
    </PatternContext.Provider>
  );
};

export const usePatterns = () => {
  const context = useContext(PatternContext);
  if (context === undefined) {
    throw new Error(
      "usePatterns mutlaka bir PatternProvider içinde kullanılmalıdır.",
    );
  }
  return context;
};
