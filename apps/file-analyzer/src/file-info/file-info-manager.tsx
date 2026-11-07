import React, { useState, useRef, useMemo, useEffect } from "react";
import { Download, Upload } from "lucide-react";
import { EditableCell, ActionCell } from "../components/edit-cell";
import { NewPatternForm } from "../patternForm";
import { FileInfo } from "./file-info-types";
import { usePatterns } from "./file-info-dataprovider";

export const FileInfoManager: React.FC = () => {
  const {
    patterns,
    addPattern,
    updatePattern,
    removePattern,
    exportToJSON,
    importFromJSON,
  } = usePatterns();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingExpression, setEditingExpression] = useState<string | null>(
    null,
  );
  const [editData, setEditData] = useState<FileInfo | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  type FilterType = "all" | "ignore" | "extension";
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const processedPatterns = useMemo(() => {
    return patterns.filter((p) => {
      if (activeFilter === "ignore" && !p.ignore) return false;
      if (activeFilter === "extension" && !p.extension) return false;

      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        p.expression.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.group && p.group.toLowerCase().includes(searchLower))
      );
    });
  }, [patterns, debouncedSearchTerm, activeFilter]);

  const handleAdd = (newData: FileInfo) => {
    const isSuccess = addPattern(newData);
    if (isSuccess) {
      setIsNewFormOpen(false);
    }
    return isSuccess;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await importFromJSON(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, type } = e.target;
    const key = name as keyof FileInfo;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setEditData((d) => (d ? { ...d, [key]: value } : null));
  };

  return (
    <div className="text-theme-text bg-theme-surface/30 border-theme-border flex flex-col space-y-4 overflow-hidden rounded-xl border p-4 shadow-xs">
      <div className="border-theme-border/60 flex shrink-0 items-center justify-between border-b pb-3">
        <h2 className="text-theme-muted text-xs font-bold tracking-wider whitespace-nowrap uppercase">
          Desen Kuralları Yönetimi
        </h2>
        <div className="relative ml-4 w-full max-w-md">
          <input
            type="text"
            placeholder="Expression, grup veya açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-theme-surface w-full rounded border border-gray-300 py-1.5 pr-10 pl-3 text-xs focus:border-indigo-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      <div className="mb-1 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "Hepsi", count: patterns.length },
            {
              id: "ignore",
              label: "Yoksayılanlar",
              count: patterns.filter((p) => p.ignore).length,
            },
            {
              id: "extension",
              label: "Uzantılar",
              count: patterns.filter((p) => p.extension).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as FilterType)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}{" "}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${activeFilter === tab.id ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToJSON}
            className="bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors duration-150"
          >
            <Download size={13} />
            <span>JSON İndir</span>
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-theme-surface hover:bg-theme-surface-hover text-theme-text border-theme-border flex cursor-pointer items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors duration-150"
          >
            <Upload size={13} />
            <span>JSON Yükle</span>
          </button>
          {!isNewFormOpen && (
            <button
              onClick={() => setIsNewFormOpen(true)}
              className="flex cursor-pointer items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500"
            >
              <span>+ Yeni Kural Ekle</span>
            </button>
          )}
        </div>
        <NewPatternForm
          isOpen={isNewFormOpen}
          onClose={() => setIsNewFormOpen(false)}
          onSave={handleAdd}
        />
      </div>

      <div className="border-theme-border/30 custom-scrollbar max-h-[65vh] overflow-x-auto overflow-y-auto rounded-lg border">
        <table className="divide-theme-border/40 text-theme-text min-w-full table-fixed divide-y text-left text-xs">
          <thead className="bg-theme-surface text-theme-muted sticky top-0 z-10 font-bold tracking-wider uppercase shadow-2xs">
            <tr>
              <th className="bg-theme-surface w-1/4 px-5 py-3">expression</th>
              <th className="bg-theme-surface w-1/6 px-5 py-3">Group</th>
              <th className="bg-theme-surface w-1/3 px-5 py-3">description</th>
              <th className="bg-theme-surface w-1/12 px-5 py-3 text-center">
                Ignore
              </th>
              <th className="bg-theme-surface w-1/12 px-5 py-3 text-center">
                isExt
              </th>
              <th className="bg-theme-surface w-1/6 px-5 py-3 text-right">
                Aksiyonlar
              </th>
            </tr>
          </thead>
          <tbody className="divide-theme-border/30 bg-theme-surface/5 divide-y">
            {processedPatterns.length > 0 ? (
              processedPatterns.map((p) => {
                const isEditing = editingExpression === p.expression;
                return (
                  <tr
                    key={p.expression}
                    className="hover:bg-theme-surface/50 transition-colors duration-150"
                  >
                    <td className="text-theme-primary px-5 py-2 font-mono font-medium break-all">
                      {p.expression}
                    </td>
                    <td className="px-5 py-2 text-left">
                      <EditableCell
                        isEditing={isEditing}
                        type="text"
                        name="group"
                        editValue={editData?.group}
                        normalValue={p.group}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td className="px-5 py-2 text-left">
                      <EditableCell
                        isEditing={isEditing}
                        type="text"
                        name="description"
                        editValue={editData?.description}
                        normalValue={p.description}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td className="px-5 py-2 text-center">
                      <EditableCell
                        isEditing={isEditing}
                        type="checkbox"
                        name="ignore"
                        editValue={editData?.ignore}
                        normalValue={p.ignore}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td className="px-5 py-2 text-center">
                      <EditableCell
                        isEditing={isEditing}
                        type="checkbox"
                        name="extension"
                        editValue={editData?.extension}
                        normalValue={p.extension}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td className="px-5 py-2 text-right font-medium">
                      <ActionCell
                        isEditing={isEditing}
                        onSave={() => {
                          if (editData) {
                            updatePattern(editData);
                            setEditingExpression(null);
                          }
                        }}
                        onCancel={() => {
                          setEditingExpression(null);
                        }}
                        onStartEdit={() => {
                          setEditingExpression(p.expression);
                          setEditData({ ...p });
                        }}
                        onDelete={() => removePattern(p.expression)}
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-theme-muted px-5 py-8 text-center text-sm"
                >
                  Arama kriterlerine uygun kural bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
