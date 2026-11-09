// apps/file-info/src/components/PatternForm.tsx
import React, { useState, useEffect } from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { FileInfo } from "./context/fi-types";
import { parseExpression } from "./context/fi-data-helpers";

interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
  onKeyDown,
}) => {
  return (
    <label className="text-theme-text flex cursor-pointer items-center space-x-2 text-sm select-none">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0"
      />
      <span>{label}</span>
    </label>
  );
};

interface FormProps {
  onAdd: (newItem: FileInfo) => boolean;
  onClose: () => void;
  isOpen: boolean;
}

const INPUT_ORDER = [
  "expression",
  "group",
  "description",
  "ignore",
  "extension",
];

export const PatternForm: React.FC<FormProps> = ({
  onAdd,
  onClose,
  isOpen,
}) => {
  if (!isOpen) return null;

  const [newData, setNewData] = useState<FileInfo>({
    expression: "",
    description: "",
    ignore: false,
    extension: false,
    group: "",
  });

  const [testInput, setTestInput] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [generatedRegexStr, setGeneratedRegexStr] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!newData.expression.trim()) {
      setIsMatching(false);
      setGeneratedRegexStr(null);
      return;
    }

    if (newData.extension) {
      setGeneratedRegexStr(null);
      const lowerExpr = newData.expression.toLowerCase();
      setIsMatching(testInput.toLowerCase().endsWith(lowerExpr));
      return;
    }

    const compiled = parseExpression(newData.expression, false);

    if (compiled.kind === "2-regExp" && compiled.regExp) {
      setGeneratedRegexStr(compiled.regExp.toString());
      setIsMatching(compiled.regExp.test(testInput));
    } else {
      setGeneratedRegexStr(null);
      const lowerExpr = newData.expression.toLowerCase();
      setIsMatching(testInput.toLowerCase() === lowerExpr);
    }
  }, [newData.expression, newData.extension, testInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    const currentName = e.currentTarget.name;
    const currentIndex = INPUT_ORDER.indexOf(currentName);

    if (currentIndex === -1) return;

    e.preventDefault();

    if (currentIndex < INPUT_ORDER.length - 1) {
      const nextName = INPUT_ORDER[currentIndex + 1];
      const nextElement = document.querySelector(
        `input[name="${nextName}"]`,
      ) as HTMLInputElement;

      nextElement?.focus();
    } else {
      handleAddAction();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    const key = name as keyof FileInfo;
    const finalValue = type === "checkbox" ? checked : value;

    setNewData((prev) => ({ ...prev, [key]: finalValue }));
  };

  const focusFirst = () => {
    const firstElement = document.querySelector(
      `input[name="${INPUT_ORDER[0]}"]`,
    ) as HTMLInputElement;
    firstElement?.focus();
  };
  const handleAddAction = () => {
    if (!newData.expression.trim()) {
      focusFirst();
      return alert("İfade (Expression) alanı boş bırakılamaz.");
    }

    const isSuccess = onAdd(newData);

    if (isSuccess) {
      alert(`${newData.expression} " : İfade (Expression) kurallara eklendi.`);
      setNewData({
        expression: "",
        description: "",
        ignore: false,
        extension: false,
        group: "",
      });
      setTestInput("");
      setGeneratedRegexStr(null);
      focusFirst();
    }
  };

  // --- 🎨 RENDER YARDIMCILARI (Fonksiyon Gövdesi) ---
  const renderTestResult = () => {
    // 1. Durum: Henüz bir ifade girilmemiş
    if (!newData.expression.trim()) {
      return (
        <span className="text-theme-muted text-center text-[11px]">
          Yukarıya bir ifade girdiğinizde test alanı aktif olacaktır.
        </span>
      );
    }

    // 2. Durum: İfade var ama test edecek metin henüz girilmemiş
    if (!testInput) {
      return (
        <span className="text-theme-muted text-[11px]">
          Eşleşme sonucunu görmek için test metni girin.
        </span>
      );
    }

    // 3. Durum: İfade ve test metni var, eşleşme BAŞARILI
    if (isMatching) {
      return (
        <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400">
          <CheckCircle2 size={16} />
          <span>Eşleşme Başarılı (MATCHED)</span>
        </div>
      );
    }

    // 4. Durum: İfade ve test metni var, eşleşme BAŞARISIZ
    return (
      <div className="text-theme-muted flex items-center space-x-2 text-xs">
        <X size={16} />
        <span>Eşleşme Sağlanamadı.</span>
      </div>
    );
  };

  return (
    <div className="bg-theme-surface/50 border-theme-border/60 flex flex-col justify-center gap-6 rounded-xl border p-5 shadow-xs md:flex-row">
      {/* Sol Taraf: Girdi Alanları */}
      <div className="flex flex-1 flex-col space-y-3">
        <div>
          <div className="flex items-center justify-between px-1">
            <label className="text-theme-muted mt-2 mb-0.5 block text-[10px] font-bold tracking-wider uppercase">
              Dosya Tanımı / İfade
            </label>
            <span className="mt-2 font-mono text-[10px]">
              {newData.extension ? (
                <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-amber-400">
                  Uzantı Eşleşmesi
                </span>
              ) : generatedRegexStr ? (
                <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-emerald-400">
                  RegExp Motoru Active
                </span>
              ) : (
                <span className="rounded bg-blue-400/10 px-1.5 py-0.5 text-blue-400">
                  Tam Metin Eşleşmesi
                </span>
              )}
            </span>
          </div>
          <input
            autoFocus
            type="text"
            name="expression"
            value={newData.expression}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={newData.extension ? ".log" : "a*.doc"}
            className="input-base w-full font-mono"
          />

          {generatedRegexStr && (
            <div className="mt-1 flex flex-col px-1">
              <span className="text-theme-muted text-[9px] font-bold tracking-wide uppercase">
                Generated Regex:
              </span>
              <code className="font-mono text-[11px] tracking-tight break-all text-emerald-400">
                {generatedRegexStr}
              </code>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-theme-muted mb-0.5 block px-1 text-[10px] font-bold tracking-wider uppercase">
              Grup
            </label>
            <input
              type="text"
              name="group"
              value={newData.group}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown} /* 🚀 Paylaşılan klavye dinleyicisi */
              placeholder="UI"
              className="input-base w-full"
            />
          </div>

          <div>
            <label className="text-theme-muted mb-0.5 block px-1 text-[10px] font-bold tracking-wider uppercase">
              Açıklama
            </label>
            <input
              type="text"
              name="description"
              value={newData.description}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Açıklama yazın..."
              className="input-base w-full"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6 pt-1">
          <FormCheckbox
            label="Yoksay ( ignore )"
            name="ignore"
            checked={newData.ignore}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // Klavye yönlendirme dizisinde yer almasını isterseniz aktif kalabilir
          />

          <FormCheckbox
            label="Uzantı ( .* )"
            name="extension"
            checked={newData.extension}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Sağ Taraf: Canlı Regex / String Eşleşme Test Alanı */}
      <div className="border-theme-border/40 flex w-full flex-col justify-between rounded-lg border bg-black/10 p-4 md:w-[320px]">
        <div>
          <label className="text-theme-muted mb-1.5 block text-[10px] font-bold tracking-wider uppercase">
            Canlı Pattern Test Motoru
          </label>
          <input
            type="text"
            name="testInput"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Test etmek için dosya adı/yolu yazın..."
            className="input-base w-full font-mono text-xs"
            disabled={!newData.expression.trim()}
          />
        </div>

        {/* Canlı Sonuç Durum Kartı */}
        <div className="border-theme-border/30 bg-theme-surface/20 mt-3 flex flex-1 items-center justify-center rounded-md border border-dashed p-3">
          {renderTestResult()}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={handleAddAction}
            className="btn-primary flex-1 cursor-pointer text-xs"
          >
            <Plus size={14} />
            <span>Listeye Ekle</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary cursor-pointer text-xs"
          >
            <X size={14} />
            <span>Kapat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
