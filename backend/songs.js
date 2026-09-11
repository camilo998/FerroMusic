const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const songs = [
  {
    id: 1,
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    art: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlyfdUpHaPczryahoVvhV0gm9PaHktEL5bJ4HbqOdW-oxVoigDKHU1UedT8pG-IQwyhCt_Hq0FNACyF2p-VpiG4Y0xGpRLWuaUS137QSKz6s5PGlNiXbYTXh5p_8p9uNeyex8ZBFyHDlA01gr6OE3FvKlzhNOkukQEKVp4Ix9y_DnF5UXIv6a-HCXIowjBmOTVRcUCdcT4lmcipCGmKgP0LbxDIxcT4bgJhffMxEYgaWfK9XJ2POD2",
    duration: 243,
    src: null,
    isLocal: false
  }
];

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "FerroMusic API is running" });
});

app.get("/api/songs", (req, res) => {
  res.json({
    data: songs,
    total: songs.length
  });
});

app.get("/api/songs/:id", (req, res) => {
  const song = songs.find((item) => item.id === Number(req.params.id));

  if (!song) {
    return res.status(404).json({ message: "Canción no encontrada" });
  }

  return res.json({ data: song });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Express escuchando en http://localhost:${PORT}`);
  });
}

module.exports = { app, songs };
