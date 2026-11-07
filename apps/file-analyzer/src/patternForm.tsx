import React, { useState } from "react";
import { Plus } from "lucide-react";
import { baseDescPattern } from "./types";

interface FormProps {
  onAdd: (newItem: baseDescPattern) => boolean;
}

export const PatternForm: React.FC<FormProps> = ({ onAdd }) => {
  const [expr, setExpr] = useState("");
  const [grp, setGrp] = useState("");
  const [desc, setDesc] = useState("");
  const [ignore, setIgnore] = useState(false);
  const [isExt, setIsExt] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expr.trim()) return;

    const success = onAdd({
      expression: expr.trim(),
      ignore,
      description: desc.trim(),
      group: grp.trim(),
      extension: isExt,
    });
    if (success) {
      setExpr("");
      setGrp("");
      setDesc("");
      setIgnore(false);
      setIsExt(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-theme-surface/50 border-theme-border/60 grid grid-cols-1 gap-4 rounded-xl border p-5 shadow-xs md:grid-cols-3"
    >
      <div className="md:col-span-2">
        <label className="text-theme-muted mb-1 block text-[10px] font-bold tracking-wider uppercase">
          Expression (expr) *
        </label>
        <input
          type="text"
          required
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="^src/components/.*"
          className="input-base font-mono" /* @utility input-base kullanıldı */
        />
      </div>
      <div>
        <label className="text-theme-muted mb-1 block text-[10px] font-bold tracking-wider uppercase">
          Group (grp)
        </label>
        <input
          type="text"
          value={grp}
          onChange={(e) => setGrp(e.target.value)}
          placeholder="UI"
          className="input-base"
        />
      </div>
      <div className="md:col-span-3">
        <label className="text-theme-muted mb-1 block text-[10px] font-bold tracking-wider uppercase">
          Description (desc)
        </label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Açıklama yazın..."
          className="input-base"
        />
      </div>
      <div className="flex items-center space-x-6 pt-2">
        <label className="text-theme-text flex cursor-pointer items-center space-x-2 text-sm select-none">
          <input
            type="checkbox"
            checked={ignore}
            onChange={(e) => setIgnore(e.target.checked)}
            className="border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0"
          />
          <span>Ignore</span>
        </label>
        <label className="text-theme-text flex cursor-pointer items-center space-x-2 text-sm select-none">
          <input
            type="checkbox"
            checked={isExt}
            onChange={(e) => setIsExt(e.target.checked)}
            className="border-theme-border bg-theme-bg text-theme-primary h-4 w-4 cursor-pointer rounded-sm focus:ring-0"
          />
          <span>isExt</span>
        </label>
      </div>
      <div className="flex items-end justify-end md:col-span-2">
        <button
          type="submit"
          className="btn-primary w-full cursor-pointer md:w-auto"
        >
          {" "}
          {/* @utility btn-primary kullanıldı */}
          <Plus size={14} />
          <span>Listeye Ekle</span>
        </button>
      </div>
    </form>
  );
};

export interface NewPatternFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newData: baseDescPattern) => void;
}

export const NewPatternForm = ({
  isOpen,
  onClose,
  onSave,
}: NewPatternFormProps) => {
  // Yeni ekleme için boş bir taslak state'i oluşturuyoruz
  const [newData, setNewData] = useState<baseDescPattern>({
    expression: "",
    description: "",
    ignore: false,
    extension: false,
    group: "",
  });

  // Daha önce yazdığımız sıfır parametreli fonksiyonun aynısı (sadece setNewData'yı güncelliyor)
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, type } = e.target;
    const key = name as keyof baseDescPattern;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setNewData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.expression.trim())
      return alert("İfade (Expression) alanı boş bırakılamaz.");

    onSave(newData);
    // Kayıt sonrası formu sıfırlayıp kapatıyoruz
    setNewData({
      expression: "",
      description: "",
      ignore: false,
      extension: false,
      group: "",
    });
    onClose();
  };

  // Eğer form kapalıysa ekrana hiçbir şey basmıyoruz
  if (!isOpen) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fadeIn mb-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-sm transition-all"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-800">
        Yeni Kural Oluştur
      </h3>

      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
        {/* İfade Girişi */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            İfade (Expression)
          </label>
          <input
            type="text"
            name="expression"
            placeholder="src/**/*.ts"
            value={newData.expression}
            onChange={handleInputChange}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Grup Girişi */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Grup
          </label>
          <input
            type="text"
            name="group"
            placeholder="Frontend"
            value={newData.group}
            onChange={handleInputChange}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Seçim Tipi 
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Tip
          </label>
          <select
            name="type"
            value={newData.type}
            onChange={handleInputChange}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="wildcard">Wildcard</option>
            <option value="regex">Regex</option>
          </select>
        </div>
*/}
        {/* Checkbox ve Butonlar Alanı */}
        <div className="h-38px flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center space-x-2 text-sm font-medium text-gray-600 select-none">
            <input
              type="checkbox"
              name="ignore"
              checked={newData.ignore}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Yoksay</span>
          </label>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              İptal
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Ekle
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
