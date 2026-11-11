// apps/yt-client/src/components/VideoPlayer.tsx
import React, { useState, useEffect } from "react";

interface VideoPlayerProps {
  videoUrl: string | null;
  audioUrl: string | null;
  title: string | null;
  onTrackEnded?: () => void;
}

export const VideoPlayer = React.memo(
  ({ videoUrl, audioUrl, title, onTrackEnded }: VideoPlayerProps) => {
    const [playbackMode, setPlaybackMode] = useState<"video" | "audio">(
      "video",
    );

    useEffect(() => {
      if (!audioUrl && playbackMode === "audio") {
        setPlaybackMode("video");
      }
    }, [audioUrl, playbackMode]);

    if (!videoUrl) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-gray-800 bg-gray-900 p-6 text-center text-gray-400">
          <span className="mb-3 text-4xl opacity-50">🎬</span>
          <p className="text-sm font-medium">
            Oynatılacak bir parça seçin veya yukarıdan yeni bir link indirin.
          </p>
        </div>
      );
    }
    // apps/yt-client/src/components/VideoPlayer.tsx içindeki ilgili bölümü güncelleyin:

    // Adres blob: veya http ile başlıyorsa doğrudan kullan, yoksa sunucu adresini ekle
    const resolveMediaUrl = (url: string | null) => {
      if (!url) return "";
      if (url.startsWith("blob:") || url.startsWith("http")) {
        return url;
      }
      return `http://localhost:3000${url}`;
    };

    const finalVideoSrc = resolveMediaUrl(videoUrl);
    const finalAudioSrc = resolveMediaUrl(audioUrl);

    return (
      <div className="flex h-full min-h-0 w-full flex-col rounded-lg border border-gray-800 bg-gray-900 p-3 md:p-4">
        {/* Üst Başlık ve Mod Seçimi */}
        <div className="mb-3 flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">
              Oynatılıyor
            </span>
            <h3
              className="mt-0.5 truncate text-sm font-semibold text-white md:text-base"
              title={title || ""}
            >
              {title}
            </h3>
          </div>

          {audioUrl && (
            <div className="flex shrink-0 rounded-md border border-gray-800 bg-gray-950 p-1">
              <button
                onClick={() => setPlaybackMode("video")}
                className={`cursor-pointer rounded px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
                  playbackMode === "video"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                🎬 Video
              </button>
              <button
                onClick={() => setPlaybackMode("audio")}
                className={`cursor-pointer rounded px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
                  playbackMode === "audio"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                🎵 Ses
              </button>
            </div>
          )}
        </div>

        {/* Tam Alan Kaplayan Medya Sahnesi */}
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-md bg-black">
          {playbackMode === "video" ? (
            <video
              key={finalVideoSrc}
              src={finalVideoSrc}
              controls
              autoPlay
              onEnded={onTrackEnded}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center space-y-6 bg-gradient-to-b from-gray-900 to-black p-6 text-center">
              <div className="relative flex h-24 w-24 animate-pulse items-center justify-center rounded-full border-2 border-indigo-500/30 bg-indigo-950/40 shadow-2xl">
                <span className="text-4xl">🎵</span>
              </div>

              <div className="w-full max-w-md px-4">
                <audio
                  key={finalAudioSrc}
                  src={finalAudioSrc}
                  controls
                  autoPlay
                  onEnded={onTrackEnded}
                  className="w-full accent-indigo-500"
                />{" "}
              </div>
              <p className="font-mono text-xs text-gray-500">
                Bağımsız yüksek kaliteli ses akışı aktif
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";
