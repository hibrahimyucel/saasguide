// apps/yt-client/src/components/PlaylistSidebar.tsx
import { Playlist } from "../App";

interface PlaylistSidebarProps {
  playlists: Playlist[];
  activePlaylistId: string;
  onSelectPlaylist: (id: string) => void;
}

export const PlaylistSidebar = ({
  playlists,
  activePlaylistId,
  onSelectPlaylist,
}: PlaylistSidebarProps) => {
  return (
    <div className="flex-shrink-0 rounded-lg border border-gray-800 bg-gray-900 p-3">
      <label
        htmlFor="playlist-select"
        className="mb-1.5 block text-xs font-semibold text-gray-300"
      >
        Oynatma Listesi Seçin
      </label>

      <div className="relative">
        <select
          id="playlist-select"
          value={activePlaylistId}
          onChange={(e) => onSelectPlaylist(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-md border border-gray-800 bg-gray-950 px-3 py-2.5 pr-8 text-xs font-medium text-white transition-colors hover:border-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          {playlists.map((pl) => (
            <option
              key={pl.id}
              value={pl.id}
              className="bg-gray-900 text-gray-100"
            >
              📁 {pl.name} ({pl.videos.length} Video)
            </option>
          ))}
        </select>

        {/* Özel Açılır Ok İkonu */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
