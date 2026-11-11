// apps/yt-server/src/services/youtube-downloader.ts
import { exec } from "child_process";
import path from "path";
import fs from "fs";

interface DownloadResult {
  videoId: string;
  title: string;
  duration: string;
  videoUrl: string;
  audioUrl: string;
}

const sanitizeYoutubeUrl = (url: string): string => {
  try {
    const cleanUrl = url.trim();
    let videoId: string | null = null;

    if (cleanUrl.includes("v=")) {
      const urlObj = new URL(cleanUrl);
      videoId = urlObj.searchParams.get("v");
    } else if (cleanUrl.includes("youtu.be/")) {
      const urlObj = new URL(cleanUrl);
      videoId = urlObj.pathname.substring(1);
    }

    if (videoId) {
      // Split by any extra parameters to capture the pure 11-char ID string
      const cleanId = videoId.split(/[?#&]/)[0];
      return "https://www.youtube.com/watch?v=" + cleanId;
    }
  } catch (e) {
    console.error("URL optimization parser crash, fallback triggered:", e);
  }
  return url;
};

export const downloadYoutubeTrack = async (
  videoUrl: string,
): Promise<DownloadResult> => {
  return new Promise((resolve, reject) => {
    const cleanUrl = sanitizeYoutubeUrl(videoUrl);

    const videoStoragePath = path.join(__dirname, "../../public/videos");
    const audioStoragePath = path.join(__dirname, "../../public/audio");

    if (!fs.existsSync(videoStoragePath))
      fs.mkdirSync(videoStoragePath, { recursive: true });
    if (!fs.existsSync(audioStoragePath))
      fs.mkdirSync(audioStoragePath, { recursive: true });

    // Explicit string concatenation to bypass literal backtick parsing errors
    const metaCmd = 'yt-dlp --dump-json "' + cleanUrl + '"';

    exec(metaCmd, (err, stdout) => {
      if (err)
        return reject(new Error("Metadata fetch failed: " + err.message));

      try {
        const meta = JSON.parse(stdout);
        const videoId = meta.id;
        const title = meta.title;
        const duration = String(meta.duration || 0);

        const cleanTitle = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const videoFileName = videoId + "-" + cleanTitle + ".mp4";
        const audioFileName = videoId + "-" + cleanTitle + ".mp3";

        const finalVideoPath = path.join(videoStoragePath, videoFileName);
        const finalAudioPath = path.join(audioStoragePath, audioFileName);

        const downloadVideoCmd =
          'yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4 -o "' +
          finalVideoPath +
          '" "' +
          cleanUrl +
          '"';

        exec(downloadVideoCmd, (videoErr) => {
          if (videoErr)
            return reject(
              new Error("Video pipeline failed: " + videoErr.message),
            );

          const downloadAudioCmd =
            'yt-dlp -f "ba" -x --audio-format mp3 --audio-quality 0 -o "' +
            finalAudioPath +
            '" "' +
            cleanUrl +
            '"';

          exec(downloadAudioCmd, (audioErr) => {
            if (audioErr)
              return reject(
                new Error("Audio tracking failed: " + audioErr.message),
              );

            resolve({
              videoId,
              title,
              duration,
              videoUrl: "/static/videos/" + videoFileName,
              audioUrl: "/static/audio/" + audioFileName,
            });
          });
        });
      } catch (parseErr: any) {
        reject(
          new Error("JSON Parse conversion exception: " + parseErr.message),
        );
      }
    });
  });
};
