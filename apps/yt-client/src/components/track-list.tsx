// apps/yt-client/src/components/TrackList.tsx
import { VideoItem, Playlist } from "../App";

interface TrackListProps {
  activePlaylist: Playlist;
  currentVideo: VideoItem | null;
  onSelectVideo: (video: VideoItem) => void;
  onDeleteVideo: (e: React.MouseEvent, id: string) => void;
}

export const TrackList = ({
  activePlaylist,
  currentVideo,
  onSelectVideo,
  onDeleteVideo,
}: TrackListProps) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-2 flex-shrink-0 text-sm font-semibold text-gray-200">
        🎯 {activePlaylist.name} — Parça Listesi
      </h2>

      {activePlaylist.videos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded border-2 border-dashed border-gray-800 p-6 text-center">
          <p className="text-xs text-gray-500">
            Bu listede henüz indirilmiş parça bulunmuyor.
          </p>
        </div>
      ) : (
        <div className="custom-scrollbar relative z-20 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {activePlaylist.videos.map((vid, idx) => (
            <div
              key={`${vid.videoId}-${idx}`}
              onClick={() => onSelectVideo(vid)}
              className={`group relative z-30 flex cursor-pointer items-center justify-between rounded border p-2.5 transition-all ${
                currentVideo?.videoId === vid.videoId
                  ? "border-indigo-500/50 bg-indigo-950/40 font-medium text-indigo-200"
                  : "border-gray-800/80 bg-gray-950 text-gray-300 hover:border-gray-700"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3 pr-4">
                <span className="font-mono text-[10px] text-gray-500">
                  {(idx + 1).toString().padStart(2, "0")}
                </span>
                <p className="truncate text-xs">{vid.title}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-[10px] text-gray-400">
                  {Math.floor(Number(vid.duration) / 60)}:
                  {(Number(vid.duration) % 60).toString().padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={(e) => onDeleteVideo(e, vid.videoId)}
                  className="cursor-pointer rounded border border-red-900/60 bg-red-950/40 p-1 text-[10px] font-bold text-red-400 opacity-0 transition-all group-hover:opacity-100 hover:border-red-500 hover:bg-red-600 hover:text-white"
                  title="Listeden Kaldır"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
