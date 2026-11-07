import React, { createContext, useContext, useState, ReactNode } from "react";
import { FileNode } from "../types";

// Desteklenen görünüm tipleri
export type ActiveView = "editor" | "explorer" | "settings";

interface ViewContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  rootNode: FileNode | null;
  setRootNode: (rootNode: FileNode) => void;
}

const FileInfoContext = createContext<ViewContextType | undefined>(undefined);

export const FileInfoProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>("editor");
  const [rootNode, setRootNode] = useState<FileNode | null>(null);

  return (
    <FileInfoContext.Provider
      value={{ activeView, setActiveView, rootNode, setRootNode }}
    >
      {children}
    </FileInfoContext.Provider>
  );
};

// Alt bileşenlerin context'i tüketmesi için güvenli özel kanca (custom hook)
export const useView = () => {
  const context = useContext(FileInfoContext);
  if (!context) {
    throw new Error(
      "useView kancası bir ViewProvider içerisinde tüketilmelidir!",
    );
  }
  return context;
};
