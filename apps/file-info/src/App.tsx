import FiMain from "./file-info/fi-main";
import { FiMenuProvider } from "./file-info/context/fi-menu-provider";
import { DataProvider } from "./file-info/context/fi-data-provider";
import { useEffect } from "react";
export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "system" || !savedTheme) {
      // Eğer 'system' seçilmişse veya henüz hiç seçim yapılmadıysa attribute kaldırılır
      document.documentElement.removeAttribute("data-theme");
    } else {
      // Kayıtlı spesifik bir tema varsa o basılır
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  return (
    <FiMenuProvider>
      <DataProvider>
        <div className="panel-app border-theme-primary">
          <FiMain />
          <footer className="border-theme-primary bg-theme-surface h-2 rounded-md border-b" />
        </div>
      </DataProvider>
    </FiMenuProvider>
  );
}
