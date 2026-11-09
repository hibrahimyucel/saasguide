// src/file-info/context/fi-data-provider.tsx
import React, { useMemo } from "react";
import { PatternContext } from "./fi-context";
import { usePatternManagement } from "./fi-pattern-management";
import { useFileScannerManagement } from "./fi-file-management";

/**
 * 📋 Dosya tanımlarını ve tarama sonuçlarını yöneten ana bileşen
 * İş mantığı tamamen soyut kancalara (custom hooks) bölündüğü için
 * hem okunması kolaydır hem de %100 Vite Fast Refresh uyumludur.
 */
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1. Şema kuralları modülünü çağırıyoruz
  const patternTools = usePatternManagement();

  // 2. Dosya tarama modülünü çağırıyoruz (patterns bağımlılığı paslanıyor)
  const scannerTools = useFileScannerManagement(patternTools.patterns);

  // 3. İki dünyayı tek bir sabit referansta birleştiriyoruz 🤝
  const combinedValue = useMemo(
    () => ({
      ...patternTools,
      ...scannerTools,
    }),
    [patternTools, scannerTools],
  );

  return (
    <PatternContext.Provider value={combinedValue}>
      {children}
    </PatternContext.Provider>
  );
};
