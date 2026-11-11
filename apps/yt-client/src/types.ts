// apps/youtube-player/src/types.ts
export interface VideoItem {
  id: string;
  title: string;
  localUrl: string; // Arka yüzden gelen statik mp4 adresi (Örn: http://saasguide.local...)
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  videos: VideoItem[];
}

