// apps/yt-client/src/App.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { VideoDownloader } from "./components/video-downloader";
import { VideoPlayer } from "./components/video-player";
import { PlaylistCreator } from "./components/playlist-creator";
import { PlaylistSidebar } from "./components/playlist-sidebar";
import { TrackList } from "./components/track-list";
import { useLocalStorage } from "./hooks/use-localstorage";

export interface VideoItem {
  videoId: string;
  title: string;
  duration: string;
  videoUrl: string;
  audioUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  videos: VideoItem[];
}

export default function App() {
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>(
    "saas_playlists",
    [{ id: "default", name: "Favorilerim", videos: [] }],
  );

  const [activePlaylistId, setActivePlaylistId] = useState<string>("default");
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);

  // 🟩 Sidebar görünürlük durumu (Varsayılan açık)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tarayıcı belleğinde geçici oynatma adresi (Blob URL) oluştur
    const objectUrl = URL.createObjectURL(file);
    const isAudioOnly = file.type.startsWith("audio/");

    const localTrack: VideoItem = {
      videoId: `local-${Date.now()}`,
      title: `💻 ${file.name}`,
      duration: "0",
      videoUrl: objectUrl,
      // Eğer seçilen dosya zaten ses dosyasıysa audioUrl'i doldur, video ise sadece videoUrl kalsın
      audioUrl: isAudioOnly ? objectUrl : "",
    };

    setCurrentVideo(localTrack);

    // Aynı dosyayı tekrar seçebilmek için input değerini sıfırla
    e.target.value = "";

    // Mobilde menüyü otomatik kapat
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const activePlaylist = useMemo(() => {
    return (
      playlists.find((p) => p.id === activePlaylistId) || {
        id: "default",
        name: "Favorilerim",
        videos: [],
      }
    );
  }, [playlists, activePlaylistId]);

  useEffect(() => {
    if (activePlaylist?.videos?.length > 0) {
      setCurrentVideo(activePlaylist.videos[0]);
    } else {
      setCurrentVideo(null);
    }
  }, [activePlaylistId]);

  const handlePlaylistCreate = useCallback(
    (name: string) => {
      const newList: Playlist = {
        id: crypto.randomUUID(),
        name,
        videos: [],
      };
      setPlaylists([...playlists, newList]);
      setActivePlaylistId(newList.id);
    },
    [playlists, setPlaylists],
  );

  const handleDownloadSuccess = useCallback(
    (newVideo: VideoItem) => {
      const updatedPlaylists = playlists.map((pl) => {
        if (pl.id === activePlaylistId) {
          return { ...pl, videos: [...pl.videos, newVideo] };
        }
        return pl;
      });

      setPlaylists(updatedPlaylists);
      setCurrentVideo(newVideo);
    },
    [playlists, activePlaylistId, setPlaylists],
  );

  const handleTrackDelete = useCallback(
    (e: React.MouseEvent, videoIdToKill: string) => {
      e.stopPropagation();

      const updatedPlaylists = playlists.map((pl) => {
        if (pl.id === activePlaylistId) {
          return {
            ...pl,
            videos: pl.videos.filter((v) => v.videoId !== videoIdToKill),
          };
        }
        return pl;
      });

      setPlaylists(updatedPlaylists);

      if (currentVideo?.videoId === videoIdToKill) {
        const remainingTracks = activePlaylist.videos.filter(
          (v) => v.videoId !== videoIdToKill,
        );
        setCurrentVideo(remainingTracks.length > 0 ? remainingTracks[0] : null);
      }
    },
    [playlists, activePlaylistId, currentVideo, activePlaylist, setPlaylists],
  );

  const handleTrackEnded = useCallback(() => {
    if (!currentVideo || !activePlaylist.videos.length) return;

    const currentIndex = activePlaylist.videos.findIndex(
      (v) => v.videoId === currentVideo.videoId,
    );

    if (
      currentIndex !== -1 &&
      currentIndex < activePlaylist.videos.length - 1
    ) {
      setCurrentVideo(activePlaylist.videos[currentIndex + 1]);
    } else {
      setCurrentVideo(activePlaylist.videos[0]);
    }
  }, [currentVideo, activePlaylist.videos]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-950 font-sans text-gray-100 select-none">
      {/* Üst Kontrol Çubuğu (Header) */}
      <header className="z-30 flex flex-shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Sidebar Aç/Kapat Düğmesi */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-gray-700"
            title="Listeleri Göster/Gizle"
          >
            <span>{isSidebarOpen ? "◀ Gizle" : "☰ Listeler"}</span>
          </button>

          <div>
            <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-white md:text-lg">
              <span>🎬</span> SaaS Ar-Ge Multimedya Odası
            </h1>
          </div>
        </div>

        <div className="hidden text-xs text-gray-400 sm:block">
          Aktif Liste:{" "}
          <span className="font-semibold text-indigo-400">
            {activePlaylist.name}
          </span>{" "}
          ({activePlaylist.videos.length} Parça)
        </div>
      </header>

      {/* Ana Çalışma Alanı (Relative kapsayıcı: Mobil overlay için gerekli) */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* 🟩 Mobil / Dar Ekran Karartma Katmanı (Overlay Backdrop) */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* 🟩 Açılır / Kapanır Sol Çekmece (Sidebar) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex h-full w-80 max-w-[85vw] flex-col space-y-3 overflow-hidden border-r border-gray-800 bg-gray-950 p-3 transition-all duration-300 ease-in-out lg:static lg:bg-gray-900/30 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"} `}
        >
          {/* Mobil cihazlar için kapatma başlığı */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-2 lg:hidden">
            <span className="text-xs font-bold text-gray-300">
              Kütüphane ve Listeler
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-sm text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* 1. Bölüm: Yeni Liste Oluştur */}
          <PlaylistCreator onPlaylistCreate={handlePlaylistCreate} />

          {/* 2. Bölüm: Oynatma Listesi Açılır Kutusu (Artık sadece kendi yüksekliği kadar yer kaplar) */}
          <PlaylistSidebar
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={(id) => {
              setActivePlaylistId(id);
            }}
          />

          {/* 3. Bölüm: Aktif Listenin Şarkıları (Geriye kalan tüm dikey alanı kaplar) */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <TrackList
              activePlaylist={activePlaylist}
              currentVideo={currentVideo}
              onSelectVideo={(vid) => {
                setCurrentVideo(vid);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              onDeleteVideo={handleTrackDelete}
            />
          </div>

          {/* 4. Bölüm: Sidebar En Alt Yerel Dosya Seçme Butonu */}
          <div className="flex-shrink-0 border-t border-gray-800 pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLocalFileSelect}
              accept="video/*,audio/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-xs font-semibold text-gray-200 shadow-sm transition-all hover:border-gray-600 hover:bg-gray-700"
            >
              <span>📂</span> Bilgisayardan Dosya Seç ve Çal
            </button>
          </div>
        </aside>

        {/* 🟩 Sağ Ana Sahne (İndirme Çubuğu + Tam Ekran Esnek Video Oynatıcı) */}
        <main className="z-10 flex h-full min-w-0 flex-1 flex-col space-y-3 overflow-hidden p-3 md:p-4">
          {/* Üst İndirme Çubuğu */}
          <div className="flex-shrink-0">
            <VideoDownloader onDownloadSuccess={handleDownloadSuccess} />
          </div>

          {/* Kalan Tüm Ekranı Kaplayan Medya Oynatıcı */}
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <VideoPlayer
              videoUrl={currentVideo?.videoUrl || null}
              audioUrl={currentVideo?.audioUrl || null}
              title={currentVideo?.title || null}
              onTrackEnded={handleTrackEnded}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
