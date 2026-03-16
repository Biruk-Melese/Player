import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const SONGS = [
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd • After Hours', duration: '6:12', cover: 'https://picsum.photos/seed/blinding/100/100', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 2, title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', duration: '7:05', cover: 'https://picsum.photos/seed/stay/100/100', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 3, title: 'Heat Waves', artist: 'Glass Animals • Dreamland', duration: '5:44', cover: 'https://picsum.photos/seed/heat/100/100', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 4, title: 'Levitating', artist: 'Dua Lipa • Future Nostalgia', duration: '5:02', cover: 'https://picsum.photos/seed/levi/100/100', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 5, title: 'Save Your Tears', artist: 'The Weeknd • After Hours', duration: '5:53', cover: 'https://picsum.photos/seed/save/100/100', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 6, title: 'Bad Habits', artist: 'Ed Sheeran • Equals', duration: '5:22', cover: 'https://picsum.photos/seed/bad/100/100', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  ];

  const FOLDERS = [
    { id: 1, name: 'Downloads', path: '/storage/emulated/0/Download', tracks: 128 },
    { id: 2, name: 'WhatsApp Audio', path: '/storage/emulated/0/WhatsApp/Media', tracks: 45 },
    { id: 3, name: 'Music', path: '/storage/emulated/0/Music', tracks: 256 },
    { id: 4, name: 'Telegram Audio', path: '/storage/emulated/0/Telegram/Audio', tracks: 12 },
    { id: 5, name: 'Bluetooth', path: '/storage/emulated/0/Bluetooth', tracks: 5 },
  ];

  app.get("/api/songs", (req, res) => {
    res.json(SONGS);
  });

  app.get("/api/folders", (req, res) => {
    res.json(FOLDERS);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
