// apps/backend-api/src/services/youtube-download-service.ts
import fs from "fs";
import path from "path";
// Örnek olarak hafif ve güncel bir youtube indirme kütüphanesi kullanıldığını varsayıyoruz
import ytdl from "@distube/ytdl-core";

export const downloadYoutubeVideo = async (
  videoUrl: string,
): Promise<{ videoId: string; filePath: string; title: string }> => {
  const info = await ytdl.getInfo(videoUrl);
  const videoId = info.videoDetails.videoId;
  const title = info.videoDetails.title;

  // Güvenli dosya adı oluşturma (kebab-case)
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const fileName = `${videoId}-${safeTitle}.mp4`;

  // Bağımsız Docker volume veya statik klasör yolu
  const storageDir = path.join(__dirname, "../../public/videos");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const filePath = path.join(storageDir, fileName);

  return new Promise((resolve, reject) => {
    ytdl(videoUrl, { quality: "highestvideo", filter: "audioandvideo" })
      .pipe(fs.createWriteStream(filePath))
      .on("finish", () => {
        // Dışarı servis edilecek statik url rotasını dönüyoruz
        resolve({ videoId, filePath: `/static/videos/${fileName}`, title });
      })
      .on("error", (error) => reject(error));
  });
};
