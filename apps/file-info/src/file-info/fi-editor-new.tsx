import React, { useState, useEffect } from "react";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { FileInfo } from "./context/fi-types";
import { parseAndCompileExpression } from "./context/fi-data-provider"; // Doğru yolu projenize göre kontrol edin

interface FormProps {
  onAdd: (newItem: FileInfo) => boolean;
  onClose: () => void;
  isOpen: boolean;
}

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

  // --- REGEX TEST STATE'LERİ ---
  const [testInput, setTestInput] = useState("");
  const [isRegexValid, setIsRegexValid] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [generatedRegexStr, setGeneratedRegexStr] = useState<string | null>(
    null,
  );

  // Expression veya Uzantı durumu değiştikçe core parser ile kontrol et
  useEffect(() => {
    if (!newData.expression.trim()) {
      setIsRegexValid(true);
      setIsMatching(false);
      setGeneratedRegexStr(null);
      return;
    }

    // 1. Eğer Uzantı (extension) seçiliyse, düz string sonu kontrolü yap (.endsWith)
    if (newData.extension) {
      setIsRegexValid(true);
      setGeneratedRegexStr(null);
      const lowerExpr = newData.expression.toLowerCase();
      setIsMatching(testInput.toLowerCase().endsWith(lowerExpr));
      return;
    }

    // 2. Merkezi CORE EXPRESSION PARSER motorunu çağırıyoruz
    const compiled = parseAndCompileExpression(newData.expression, false);

    if (compiled.kind === "2-regExp" && compiled.regExp) {
      setIsRegexValid(true);
      // Üretilen güncel regex'in string halini arayüzde göstermek üzere state'e alıyoruz
      setGeneratedRegexStr(compiled.regExp.toString());
      setIsMatching(compiled.regExp.test(testInput));
    } else {
      // 3. 1-regular (Saf düz metin) durumu: Tam Eşitlik (Strict Equality)
      setIsRegexValid(true);
      setGeneratedRegexStr(null);
      const lowerExpr = newData.expression.toLowerCase();
      setIsMatching(testInput.toLowerCase() === lowerExpr);
    }
  }, [newData.expression, newData.extension, testInput]);

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

    setNewData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.expression.trim()) {
      return alert("İfade (Expression) alanı boş bırakılamaz.");
    }

    const isSuccess = onAdd(newData);

    if (isSuccess) {
      setNewData({
        expression: "",
        description: "",
        ignore: false,
        extension: false,
        group: "",
      });
      setTestInput("");
      setGeneratedRegexStr(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-theme-surface/50 border-theme-border/60 flex flex-col justify-center gap-6 rounded-xl border p-5 shadow-xs md:flex-row"
    >
      {/* Sol Taraf: Form Bilgileri */}
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
            type="text"
            name="expression"
            required
            value={newData.expression}
            onChange={handleInputChange}
            placeholder={newData.extension ? ".log" : "a*.doc"}
            className="input-base w-full font-mono"
          />

          {/* 🚀 YENİ: Arka planda derlenen RegExp nesnesini kullanıcıya gösteren alan */}
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
              placeholder="Açıklama yazın..."
              className="input-base w-full"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6 pt-1">
          <label className="text-theme-text flex cursor-pointer items-center space-x-2 text-sm select-none">
            <input
              type="checkbox"
              name="ignore"
              checked={newData.ignore}
              onChange={handleInputChange}
              className="border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0"
            />
            <span>{"Yoksay ( ignore )"}</span>
          </label>

          <label className="text-theme-text flex cursor-pointer items-center space-x-2 text-sm select-none">
            <input
              type="checkbox"
              name="extension"
              checked={newData.extension}
              onChange={handleInputChange}
              className="border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0"
            />
            <span>{"Uzantı ( .* )"}</span>
          </label>
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
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Test etmek için dosya adı/yolu yazın..."
            className="input-base w-full font-mono text-xs"
            disabled={!newData.expression.trim()}
          />
        </div>

        {/* Canlı Sonuç Durum Kartı */}
        <div className="border-theme-border/30 bg-theme-surface/20 mt-3 flex flex-1 items-center justify-center rounded-md border border-dashed p-3">
          {!newData.expression.trim() ? (
            <span className="text-theme-muted text-center text-[11px]">
              Yukarıya bir ifade girdiğinizde test alanı aktif olacaktır.
            </span>
          ) : testInput ? (
            isMatching ? (
              <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400">
                <CheckCircle2 size={16} />
                <span>Eşleşme Başarılı (MATCHED)</span>
              </div>
            ) : (
              <div className="text-theme-muted flex items-center space-x-2 text-xs">
                <X size={16} />
                <span>Eşleşme Sağlanamadı.</span>
              </div>
            )
          ) : (
            <span className="text-theme-muted text-[11px]">
              Eşleşme sonucunu görmek için test metni girin.
            </span>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            type="submit"
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
    </form>
  );
};
