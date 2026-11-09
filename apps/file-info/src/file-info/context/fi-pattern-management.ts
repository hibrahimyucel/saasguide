// src/file-info/context/hooks/usePatternManagement.ts
import { useState, useEffect, useCallback } from "react";
import { FileInfo } from "./fi-types";
import { initialSchema } from "./fi-data";
import {
  getPatterns,
  addPattern,
  parseExpression,
  JSONExport,
} from "./fi-data-helpers";

export const usePatternManagement = () => {
  const [patterns, setPatterns] = useState<FileInfo[]>(() => {
    const savedPatterns = localStorage.getItem("saas_file_patterns");
    if (savedPatterns) {
      try {
        return getPatterns(JSON.parse(savedPatterns));
      } catch (e) {
        console.error("LocalStorage yükleme hatası:", e);
      }
    }
    return getPatterns(initialSchema);
  });

  useEffect(() => {
    const cleanPatterns = patterns.map(({ regExp, ...rest }) => rest);
    localStorage.setItem("saas_file_patterns", JSON.stringify(cleanPatterns));
  }, [patterns]);

  const exportToJSON = useCallback(() => {
    JSONExport(patterns);
  }, [patterns]);

  const importFromJSON = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string);
            if (!Array.isArray(imported)) return resolve(false);

            const dynamicHydration = getPatterns(imported);
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
            resolve(false);
          }
        };
        reader.readAsText(file);
      });
    },
    [patterns],
  );

  const handleAddPattern = useCallback(
    (newItem: Omit<FileInfo, "kind" | "regExp">) => {
      let successFlag = false;
      setPatterns((prev) => {
        const { updatedList, isSuccess } = addPattern(prev, newItem);
        successFlag = isSuccess;
        return updatedList;
      });
      return successFlag;
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
        const { regExp, kind } = parseExpression(
          updatedItem.expression,
          updatedItem.extension,
        );
        return { ...updatedItem, regExp, kind };
      }),
    );
  }, []);

  const toggleActive = useCallback((expression: string) => {
    setPatterns((prev) =>
      prev.map((p) =>
        p.expression === expression ? { ...p, isActive: !p.isActive } : p,
      ),
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
    setPatterns((prev) =>
      prev.map((p) => (p.checked ? { ...p, checked: false } : p)),
    );
  }, []);

  /**
   * 🚀 FABRİKA AYARLARINA DÖNÜŞ MOTORU
   * Mevcut kuralları JSON olarak indirir, localStorage'ı temizler ve initialSchema'yı yükler.
   */
  const restoreToDefault = useCallback(() => {
    // 1. Önce otomatik güvenlik yedeği al
    JSONExport(patterns);

    // 2. Tarayıcı hafızasını temizle
    localStorage.removeItem("saas_file_patterns");

    // 3. State'i reaktif olarak ilk ayarlara döndür (Sayfa yenilemeye gerek kalmaz)
    setPatterns(getPatterns(initialSchema));
  }, [patterns]);

  return {
    patterns,
    handleAddPattern,
    removePattern,
    updatePattern,
    toggleChecked,
    toggleActive,
    resetPatterns,
    exportToJSON,
    importFromJSON,
    restoreToDefault,
  };
};
