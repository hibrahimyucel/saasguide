// apps/yt-client/src/components/VideoDownloader.tsx
import { useState } from "react";

interface VideoDownloaderProps {
  onDownloadSuccess: (videoData: any) => void;
}

export const VideoDownloader = ({
  onDownloadSuccess,
}: VideoDownloaderProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        onDownloadSuccess(result.data);
        setUrl("");
      } else {
        console.log(result);
        alert(result.error || "İndirme başarısız oldu.");
      }
    } catch (error) {
      console.error("API Hatası:", error);
      alert("Sunucuya bağlanılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🟩 CRITICAL FIX: Ensure the JSX structure is explicitly returned here!
  return (
    <form
      onSubmit={handleDownload}
      className="flex gap-2 rounded-lg bg-gray-800 p-4"
    >
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube Video URL (https://...)"
        className="flex-1 rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:bg-indigo-500 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "İndiriliyor..." : "Videoyu İşle"}
      </button>
    </form>
  );
};
