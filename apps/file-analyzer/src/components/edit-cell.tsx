import React from "react";
import { baseDescPattern } from "../types";
import { Check, Edit2, Trash2, X } from "lucide-react";

// Alt Modül 1: Düzenleme Modundaki Form Elementleri (SRP'ye uygun şekilde ayrıştırıldı)
const CellInput = ({ type, name, value, onChange, options }: any) => {
  if (type === "checkbox") {
    return (
      <input
        type="checkbox"
        name={name}
        checked={value ?? false}
        onChange={onChange}
        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    );
  }

  if (type === "select") {
    return (
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      name={name}
      value={value ?? ""}
      onChange={onChange}
      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
    />
  );
};

// Alt Modül 2: Normal Görüntüleme Modu
const CellViewer = ({ type, value }: any) => {
  if (type === "checkbox") {
    return (
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          value ? "bg-blue-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : ""
        }`}
      />
    );
  }
  return <span className="text-sm text-gray-700">{value ?? "-"}</span>;
};

// Ana Orp Orkestratörü: Sadece hangi modun gösterileceğine karar verir (Tam SRP Uyumu)
export interface EditableCellProps {
  /** Hücrenin düzenleme modunda mı yoksa normal görünüm modunda mı olduğunu belirler */
  isEditing: boolean;

  /** Hücrenin render edeceği form elemanının tipi */
  type: "text" | "checkbox" | "select";

  /** Form elemanının 'name' attribute değeri. DescPattern interface'inin anahtarlarından biri olmak zorundadır */
  name: keyof baseDescPattern;

  /** Düzenleme modundaki anlık taslak veri (editData nesnesinden gelen değer) */
  editValue: string | boolean | number | undefined | null;

  /** Normal görünüm modundaki orijinal durağan veri (p nesnesinden gelen değer) */
  normalValue: string | boolean | number | undefined | null;

  /** Form elemanlarında değişiklik yapıldığında tetiklenecek olay yakalayıcı */
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;

  /** Sadece 'select' tipi seçildiğinde açılır menü elemanlarını besleyen opsiyonel dizi */
  options?: {
    value: string;
    label: string;
  }[];
}
export const EditableCell = ({
  isEditing,
  type,
  name,
  editValue,
  normalValue,
  onChange,
  options,
}: EditableCellProps) => {
  if (isEditing) {
    return (
      <CellInput
        type={type}
        name={name}
        value={editValue}
        onChange={onChange}
        options={options}
      />
    );
  }

  return <CellViewer type={type} value={normalValue} />;
};

export interface ActionCellProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

export const ActionCell = ({
  isEditing,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
}: ActionCellProps) => {
  if (isEditing) {
    return (
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={onSave}
          className="flex cursor-pointer items-center space-x-1 text-emerald-500 hover:text-emerald-400"
        >
          <Check size={14} /> <span>Kaydet</span>
        </button>
        <button
          onClick={onCancel}
          className="text-theme-muted hover:text-theme-text flex cursor-pointer items-center space-x-1"
        >
          <X size={14} /> <span>İptal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end space-x-4">
      <button
        onClick={onStartEdit}
        className="text-theme-muted hover:text-theme-text flex cursor-pointer items-center space-x-1"
      >
        <Edit2 size={13} /> <span>Düzenle</span>
      </button>
      <button
        onClick={onDelete}
        className="flex cursor-pointer items-center space-x-1 text-red-500 hover:text-red-400"
      >
        <Trash2 size={13} /> <span>Sil</span>
      </button>
    </div>
  );
};
