// apps/yt-server/src/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import { handleVideoDownload } from "./controllers/video-controller";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

// 🔀 Static Asset Pipe Layout
// Serves downloaded video files under the "/static/videos" pipeline matching your Vite proxy configs
const staticVideosPath = path.join(__dirname, "../public/videos");
app.use("/static/videos", express.static(staticVideosPath));
// Open up this line right below your video express.static definition mapping:
const staticAudioPath = path.join(__dirname, "../public/audio");
app.use("/static/audio", express.static(staticAudioPath));

// 🎯 API Route Register
app.post("/api/download", handleVideoDownload);

// 🏁 Native Boot Check
app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 SaaS Ar-Ge Multi-Media Engine Booted Successfully`);
  console.log(`📡 Local Network Host: http://localhost:${PORT}`);
  console.log(`📁 Local Storage Engine Mounted: ${staticVideosPath}`);
  console.log(`================================================`);
});
