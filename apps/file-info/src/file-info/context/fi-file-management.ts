// src/file-info/context/hooks/useFileScannerManagement.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { FileNode, SizeFilter, FileInfo } from "./fi-types";
import { ReevaluateTree, extractBigFiles } from "./fi-data-helpers"; // 🚀 Yeni fonksiyonu ekleyin

export const useFileScannerManagement = (patterns: FileInfo[]) => {
  const [scannedTree, setScannedTree] = useState<FileNode | null>(null);

  // 🚀 BÜYÜK DOSYA RAPORLAMA STATE'LERİ
  // Varsayılan eşik: 5 MB (Byte cinsinden: 5 * 1024 * 1024)
  const [bigFileThreshold, setBigFileThreshold] = useState({
    value: 5,
    unit: "MB" as "KB" | "MB",
  });

  const [sizeFilter, setSizeFilter] = useState<SizeFilter>({
    mode: "all",
    value: 0,
    unit: "KB",
  });

  // Reaktif filtreleme motoru (Mevcut kodunuz)
  useEffect(() => {
    setScannedTree((prevTree) => {
      if (!prevTree) return null;
      const activeRules = patterns.filter((p) => p.checked && p.isActive);
      const multiplier = sizeFilter.unit === "MB" ? 1024 * 1024 : 1024;
      const targetBytes = sizeFilter.value * multiplier;

      const reevaluated = ReevaluateTree(prevTree, activeRules, {
        mode: sizeFilter.mode,
        targetBytes,
      });

      return JSON.stringify(prevTree) === JSON.stringify(reevaluated)
        ? prevTree
        : { ...reevaluated };
    });
  }, [patterns, sizeFilter]);

  // 🚀 REAKTİF RAPOR HESAPLAYICI (useMemo ile yüksek performans)
  const bigFilesReport = useMemo(() => {
    if (!scannedTree) return [];

    const multiplier = bigFileThreshold.unit === "MB" ? 1024 * 1024 : 1024;
    const thresholdBytes = bigFileThreshold.value * multiplier;

    return extractBigFiles(scannedTree, thresholdBytes);
  }, [scannedTree, bigFileThreshold]);

  const applyCurrentPatternsToTree = useCallback(
    (rawTree: FileNode) => {
      const activeRules = patterns.filter((p) => p.isActive && p.checked);
      const multiplier = sizeFilter.unit === "MB" ? 1024 * 1024 : 1024;
      const targetBytes = sizeFilter.value * multiplier;

      const reevaluated = ReevaluateTree(rawTree, activeRules, {
        mode: sizeFilter.mode,
        targetBytes,
      });
      setScannedTree({ ...reevaluated });
    },
    [patterns, sizeFilter],
  );

  return {
    scannedTree,
    setScannedTree,
    sizeFilter,
    setSizeFilter,
    applyCurrentPatternsToTree,
    // 🚀 Yeni dışa aktarılan rapor araçları
    bigFileThreshold,
    setBigFileThreshold,
    bigFilesReport,
  };
};
