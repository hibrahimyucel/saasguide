import React, { useState, useRef, useMemo, useEffect } from "react";
import { EditableCell, ActionCell } from "../components/edit-cell";
import { FileInfo } from "./context/fi-types";
import { useData } from "./context/fi-context";
import { FileInfoSearch } from "./fi-editor-search";
import { FileInfoEditorTabs } from "./fi-editor-tabs";
import { FileInfoActions } from "./fi-editor-actions";
import { PatternForm } from "./fi-editor-new";

export const FileInfoManager: React.FC = () => {
  const {
    patterns,
    handleAddPattern,
    updatePattern,
    removePattern,
    exportToJSON,
    importFromJSON,
  } = useData();

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
    const isSuccess = handleAddPattern(newData);

    return isSuccess;
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
  useEffect(() => {
    // Arama filtresi veya tab değiştiğinde düzenleme modlarını sıfırla
    setEditingExpression(null);
    setEditData(null);
  }, [activeFilter, debouncedSearchTerm]);
  return (
    <div className="text-theme-text bg-theme-surface border-theme-border flex w-full flex-col space-y-4 overflow-hidden rounded-xl border p-2 shadow-xs">
      {!isNewFormOpen && (
        <>
          <div className="border-theme-border/60 flex shrink-0 items-center justify-between border-b pb-1">
            <h2 className="text-theme-muted text-xs font-bold tracking-wider whitespace-nowrap uppercase">
              Dosya Tanımları
            </h2>
            <FileInfoSearch value={searchTerm} onChange={setSearchTerm} />
          </div>

          <div className="mb-1 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <FileInfoEditorTabs
              patterns={patterns}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            <FileInfoActions
              onAddNewClick={() => setIsNewFormOpen(true)}
              isNewFormOpen={isNewFormOpen}
            />
          </div>
          <div className="border-theme-border/30 custom-scrollbar max-h-[77vh] overflow-x-auto overflow-y-auto rounded-lg border">
            <table className="divide-theme-border/40 text-theme-text min-w-full table-fixed divide-y text-left text-xs">
              <thead className="bg-theme-surface text-theme-muted sticky top-0 z-10 font-bold tracking-wider uppercase shadow-2xs">
                <tr>
                  <th className="bg-theme-surface px-5 py-3">Dosya Tanımı</th>
                  <th className="bg-theme-surface px-5 py-3">Grup</th>
                  <th className="bg-theme-surface px-5 py-3">Açıklama</th>
                  <th className="bg-theme-surface px-5 py-3 text-center">
                    Yoksay
                  </th>
                  <th className="bg-theme-surface px-5 py-3 text-center">
                    Uzantı
                  </th>
                  <th className="bg-theme-surface px-5 py-3 text-right">...</th>
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
        </>
      )}
      <PatternForm
        onAdd={handleAdd}
        onClose={() => setIsNewFormOpen(false)}
        isOpen={isNewFormOpen}
      />
    </div>
  );
};
