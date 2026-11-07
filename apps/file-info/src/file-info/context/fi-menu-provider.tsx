import React, { createContext, useContext, useState, ReactNode } from "react";

// Desteklenen görünüm tipleri
export type ActiveView = "editor" | "explorer";

interface ViewContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const FiMenuContext = createContext<ViewContextType | undefined>(undefined);

export const FiMenuProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>("explorer");

  return (
    <FiMenuContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </FiMenuContext.Provider>
  );
};

// Alt bileşenlerin context'i tüketmesi için güvenli özel kanca (custom hook)
export const useView = () => {
  const context = useContext(FiMenuContext);
  if (!context) {
    throw new Error(
      "useView kancası bir ViewProvider içerisinde tüketilmelidir!",
    );
  }
  return context;
};
