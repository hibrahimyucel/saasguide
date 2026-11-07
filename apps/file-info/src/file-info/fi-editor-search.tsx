import React from "react";

interface SearchProps {
  value: string;
  onChange: (val: string) => void;
}

export const FileInfoSearch: React.FC<SearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative ml-4 w-full max-w-md">
      <input
        type="text"
        placeholder="Expression, grup veya açıklama ara..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base w-full"
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-xs font-semibold text-gray-400 hover:text-gray-600"
        >
          Temizle
        </button>
      )}
    </div>
  );
};
