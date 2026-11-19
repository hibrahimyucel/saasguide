"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileInfoMain = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var file_info_filter_panel_1 = require("./file-info-filter-panel");
var file_info_dataprovider_1 = require("./file-info-dataprovider");
var uni_scanner_1 = require("./uni-scanner");
var FileInfoMain = function () {
    var _a = (0, file_info_dataprovider_1.usePatterns)(), patterns = _a.patterns, addPattern = _a.addPattern, updatePattern = _a.updatePattern, removePattern = _a.removePattern, exportToJSON = _a.exportToJSON, importFromJSON = _a.importFromJSON;
    /*
    const getDescription = (name: string) => {
      const lowerName = name.toLowerCase();
      const customMatch = schema.List.find(
        (d) => d.expression.toLowerCase() === lowerName,
      );
      if (customMatch)
        return { isIgnored: customMatch.ignore, desc: customMatch.description };
  
      const regexMatch = schema.RegExp.find((d) => d.regExp?.test(name));
      if (regexMatch)
        return { isIgnored: regexMatch.ignore, desc: regexMatch.description };
  
      const fileExt = name.includes(".")
        ? name.split(".").pop()?.toLowerCase()
        : "";
  
      if (fileExt) {
        const extensionMatch = schema.Descriptions.find((d) => {
          const exprLower = d.expression.toLowerCase();
          return exprLower === fileExt || exprLower === `.${fileExt}`;
        });
  
        if (extensionMatch)
          return {
            isIgnored: extensionMatch.ignore,
            desc: extensionMatch.description,
          };
      }
  
      return { isIgnored: false, desc: "" };
    };
    
    // A) BUTON TIKLAMA TETİKLEYİCİSİ
    const handleSelectDirectory = async () => {
      try {
        // @ts-ignore
        const directoryHandle = await window.showDirectoryPicker();
        setIsScanning(true);
  
        const root = await scanUniversal(
          {
            name: directoryHandle.name,
            isDirectory: true,
            isFile: false,
            rawHandle: directoryHandle,
          },
          "",
          0,
          schema,
          getDescription,
        );
        setRootNode(root);
      } catch (e) {
        console.error(e);
      } finally {
        setIsScanning(false);
      }
    };
  
    // B) SÜRÜKLE BIRAK TETİKLEYİCİSİ
    const handleDroppedFolder = async (directoryEntry: any) => {
      try {
        setIsScanning(true);
  
        const root = await scanUniversal(
          {
            name: directoryEntry.name,
            isDirectory: true,
            isFile: false,
            rawEntry: directoryEntry,
          },
          "",
          0,
          schema,
          getDescription,
        );
        setRootNode(root);
      } catch (e) {
        console.error("Sürükle bırak tarama hatası:", e);
      } finally {
        setIsScanning(false);
      }
    };
  
    // Seçim Kutularına Tıklandığında Tetiklenecek Fonksiyon (Ana Bileşeni Uyarır)
    const handleToggleExpression = (expression: string) => {
      const updateCategory = (list: any[]) =>
        list.map((item) =>
          item.expression === expression
            ? { ...item, checked: !item.checked }
            : item,
        );
  
      const updatedSchema = {
        ...schema,
        List: updateCategory(schema.List),
        RegExp: updateCategory(schema.RegExp),
        Descriptions: updateCategory(schema.Descriptions),
      };
  
      setSchema(updatedSchema);
  
      // Değişikliği konsolda veya ana ekranda izleyebilirsiniz
      const totalSelected = [
        ...updatedSchema.List,
        ...updatedSchema.RegExp,
        ...updatedSchema.Descriptions,
      ]
        .filter((i) => i.checked)
        .map((i) => i.expression);
  
      console.log("Seçili Kurallar:", totalSelected);
    };
  */
    return ((0, jsx_runtime_1.jsxs)("div", { className: "panel-module", children: [(0, jsx_runtime_1.jsx)(file_info_filter_panel_1.PatternSidebar, {}), (0, jsx_runtime_1.jsx)("div", { className: "min-h-0 flex-1 overflow-auto p-2" }), (0, jsx_runtime_1.jsx)(uni_scanner_1.UniversalFileScanner, {})] }));
};
exports.FileInfoMain = FileInfoMain;
