// apps/backend-api/src/controllers/video-controller.ts
import { Request, Response } from 'express';
import { downloadYoutubeTrack } from '../services/youtube-downloader';

export const handleVideoDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      res.status(400).json({ error: 'Geçersiz YouTube URL adresi.' });
      return;
    }

    // Servisi tetikle
    const metaData = await downloadYoutubeTrack(url);

    // Başarılı yanıt dön
    res.status(200).json({
      success: true,
      data: metaData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Video indirilirken bir hata oluştu.'
    });
  }
};

