import React, { useState, useRef, useEffect } from "react";
import { FileInfo } from "../file-info/context/fi-types";
import { Check, Edit2, Trash2, X, AlertTriangle } from "lucide-react";

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
  name: keyof FileInfo;

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

// components/edit-cell.tsx

interface ActionCellProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

export const ActionCell: React.FC<ActionCellProps> = ({
  isEditing,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  // 🚀 Zamanlayıcı referansını hafızada tutmak için useRef kullanıyoruz
  const timerRef = useRef<number | null>(null);

  const handleStartConfirm = () => {
    setIsConfirming(true);

    // Eğer çalışan bir zamanlayıcı varsa temizle
    if (timerRef.current) window.clearTimeout(timerRef.current);

    // 🚀 window.setTimeout kullanarak tarayıcının yerleşik sayısal ID dönmesini garanti ediyoruz
    timerRef.current = window.setTimeout(() => {
      setIsConfirming(false);
    }, 1500);
  };

  const handleCancelConfirm = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setIsConfirming(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleStartEdit = () => {
    handleCancelConfirm(); // Düzenleme başlayınca onay modunu kapat
    onStartEdit();
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={onSave}
          className="rounded p-1 text-emerald-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
          title="Kaydet"
        >
          <Check size={14} />
        </button>
        <button
          onClick={onCancel}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="İptal"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // 🚀 3 Saniyelik Zaman Ayarlı Onay Ekranı
  if (isConfirming) {
    return (
      <div className="animate-fadeIn flex items-center justify-end space-x-1.5">
        <span className="flex items-center text-[10px] font-semibold tracking-tight text-amber-500">
          <AlertTriangle size={11} className="mr-0.5 shrink-0" /> Emin misiniz?
        </span>
        <button
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onDelete();
            setIsConfirming(false);
          }}
          className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs transition-colors hover:bg-red-500"
        >
          Evet, Sil
        </button>
        <button
          onClick={handleCancelConfirm}
          className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 transition-colors hover:bg-gray-200"
        >
          İptal
        </button>
      </div>
    );
  }

  // 🚀 Standart Görünüm
  return (
    <div className="flex items-center justify-end space-x-2">
      <button
        onClick={handleStartEdit}
        className="rounded p-1 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-500"
        title="Düzenle"
      >
        <Edit2 size={13} />
      </button>
      <button
        onClick={handleStartConfirm} // 3 saniyelik geri sayımı başlatır 🚀
        className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        title="Sil"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
