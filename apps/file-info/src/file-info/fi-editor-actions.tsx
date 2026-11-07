import React from "react";
import { Download, Upload } from "lucide-react";

interface ActionsProps {
  onExport: () => void;
  onImportClick: () => void;
  onAddNewClick: () => void;
  isNewFormOpen: boolean;
  // CHANGE: Change HTMLInputElement | null to just HTMLInputElement
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileInfoActions: React.FC<ActionsProps> = ({
  onExport,
  onImportClick,
  onAddNewClick,
  isNewFormOpen,
  fileInputRef,
  handleImportFile,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={onExport} className="btn-secondary">
        <Download size={13} />
        <span>JSON İndir</span>
      </button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef} // TS Error is now resolved here!
        onChange={handleImportFile}
        className="hidden"
      />
      <button onClick={onImportClick} className="btn-secondary">
        <Upload size={13} />
        <span>JSON Yükle</span>
      </button>
      {!isNewFormOpen && (
        <button onClick={onAddNewClick} className="btn-primary">
          <span>+ Yeni Kural Ekle</span>
        </button>
      )}
    </div>
  );
};
