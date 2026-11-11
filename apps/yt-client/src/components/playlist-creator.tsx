// apps/yt-client/src/components/PlaylistCreator.tsx
import { useState } from "react";

interface PlaylistCreatorProps {
  onPlaylistCreate: (name: string) => void;
}

export const PlaylistCreator = ({ onPlaylistCreate }: PlaylistCreatorProps) => {
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onPlaylistCreate(newPlaylistName.trim());
    setNewPlaylistName("");
  };

  return (
    <div className="flex-shrink-0 rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-2 text-sm font-semibold text-gray-200">
        Yeni Liste Oluştur
      </h2>
      <form onSubmit={handleSubmit} className="relative z-20 flex gap-2">
        <input
          type="text"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          placeholder="Liste adı..."
          className="flex-1 rounded border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          className="cursor-pointer rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Ekle
        </button>
      </form>
    </div>
  );
};
