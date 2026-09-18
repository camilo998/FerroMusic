(function () {
  "use strict";

  // ======================================================================
  // Configuración
  // ======================================================================
  // Cambia esto si tu API corre en otra URL/puerto.
  const API_BASE_URL = "http://localhost:3000";

  // ======================================================================
  // Estado del reproductor
  // ======================================================================
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let isRepeat = false;
  let isFavorite = true; // el corazón ya viene "filled" en el HTML original
  let isMuted = false;
  let volume = 66.6666; // % (coincide con el ancho inicial del CSS)
  let lastVolume = volume;

  // Elemento de audio real. No se inserta en el DOM (no afecta nada visual);
  // basta con que quede referenciado en este closure para poder reproducir.
  const audioEl = new Audio();
  audioEl.volume = volume / 100;

  // ======================================================================
  // Referencias al DOM (mismas clases/atributos que ya existen en index.html,
  // no se agrega ni se quita ningún elemento)
  // ======================================================================
  const playBtn = document.querySelector(".player-bar__play");
  const playIcon = playBtn.querySelector(".material-symbols-outlined");
  const prevBtn = document.querySelector('[aria-label="Previous"]');
  const nextBtn = document.querySelector('[aria-label="Next"]');
  const shuffleBtn = document.querySelector('[aria-label="Shuffle"]');
  const repeatBtn = document.querySelector('[aria-label="Repeat"]');
  const favoriteBtn = document.querySelector(".player-bar__favorite");
  const favoriteIcon = favoriteBtn.querySelector(".material-symbols-outlined");

  const titleEl = document.querySelector(".player-bar__title");
  const artistEl = document.querySelector(".player-bar__artist");

  const timeEls = document.querySelectorAll(".player-bar__time");
  const timeElapsedEl = timeEls[0];
  const timeTotalEl = timeEls[1];

  const progressWrap = document.querySelector(".player-bar__progress");
  const trackBar = document.querySelector(".player-bar__track-bar");
  const playedBar = document.querySelector(".player-bar__played");

  const volumeWrap = document.querySelector(".player-bar__volume");
  const volumeBtn = volumeWrap.querySelector("button");
  const volumeIcon = volumeBtn.querySelector(".material-symbols-outlined");
  const volumeBar = document.querySelector(".player-bar__volume-bar");
  const volumeFill = document.querySelector(".player-bar__volume-fill");

  const queueBtn = document.querySelector('[aria-label="Queue"]');
  const artWrap = document.querySelector(".player-bar__art");

  // ======================================================================
  // Utilidades
  // ======================================================================
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m + ":" + String(rem).padStart(2, "0");
  }

  function updateVolumeUI() {
    volumeFill.style.width = volume + "%";
    if (isMuted || volume === 0) {
      volumeIcon.textContent = "volume_off";
    } else if (volume < 50) {
      volumeIcon.textContent = "volume_down";
    } else {
      volumeIcon.textContent = "volume_up";
    }
  }

  function updateProgressUI() {
    const duration =
      isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : 0;
    const current = audioEl.currentTime || 0;
    const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
    playedBar.style.width = pct + "%";
    timeElapsedEl.textContent = formatTime(current);
    timeTotalEl.textContent = duration ? formatTime(duration) : "0:00";
  }

  // ======================================================================
  // Consumo de la API
  // ======================================================================
  async function fetchSongs() {
    const res = await fetch(API_BASE_URL + "/api/songs");
    if (!res.ok) throw new Error("La API respondió con un error al listar canciones");
    return res.json();
  }

  // ======================================================================
  // Carga y control de pistas
  // ======================================================================
  function loadTrack(index, autoplay) {
    if (tracks.length === 0) return;

    currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[currentIndex];

    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;

    audioEl.src = API_BASE_URL + track.url;
    audioEl.load();

    timeElapsedEl.textContent = "0:00";
    timeTotalEl.textContent = "0:00";
    playedBar.style.width = "0%";

    if (autoplay) {
      play();
    } else {
      pause();
    }
  }

  function play() {
    isPlaying = true;
    playIcon.textContent = "pause";
    playBtn.setAttribute("aria-label", "Pause");
    audioEl.play().catch(function (err) {
      console.warn("No se pudo reproducir el audio:", err);
    });
  }

  function pause() {
    isPlaying = false;
    playIcon.textContent = "play_arrow";
    playBtn.setAttribute("aria-label", "Play");
    audioEl.pause();
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function goToTrack(index, autoplay) {
    let nextIdx = index;
    if (isShuffle && tracks.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * tracks.length);
      } while (nextIdx === currentIndex);
    }
    loadTrack(nextIdx, autoplay !== undefined ? autoplay : isPlaying);
  }

  function setVolumeFromClientX(clientX) {
    const rect = volumeBar.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    volume = pct;
    if (volume > 0) isMuted = false;
    audioEl.volume = volume / 100;
    updateVolumeUI();
  }

  function setProgressFromClientX(clientX) {
    const rect = trackBar.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    const duration = isFinite(audioEl.duration) ? audioEl.duration : 0;
    if (duration) {
      audioEl.currentTime = (pct / 100) * duration;
    }
    updateProgressUI();
  }

  // ======================================================================
  // Eventos: transporte
  // ======================================================================
  playBtn.addEventListener("click", togglePlay);

  nextBtn.addEventListener("click", function () {
    goToTrack(currentIndex + 1, true);
  });

  prevBtn.addEventListener("click", function () {
    // Si lleva más de 3s escuchada, reinicia la pista; si no, va a la anterior
    if (audioEl.currentTime > 3) {
      audioEl.currentTime = 0;
      updateProgressUI();
    } else {
      goToTrack(currentIndex - 1, true);
    }
  });

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", function () {
      isShuffle = !isShuffle;
      shuffleBtn.style.color = isShuffle ? "var(--color-secondary)" : "";
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener("click", function () {
      isRepeat = !isRepeat;
      repeatBtn.style.color = isRepeat ? "var(--color-secondary)" : "";
    });
  }

  favoriteBtn.addEventListener("click", function () {
    isFavorite = !isFavorite;
    favoriteIcon.classList.toggle("filled", isFavorite);
    favoriteBtn.style.color = isFavorite ? "var(--color-secondary)" : "";
  });

  // ======================================================================
  // Eventos: barra de progreso (click y arrastre)
  // ======================================================================
  let draggingProgress = false;

  progressWrap.addEventListener("mousedown", function (e) {
    draggingProgress = true;
    setProgressFromClientX(e.clientX);
  });
  window.addEventListener("mousemove", function (e) {
    if (draggingProgress) setProgressFromClientX(e.clientX);
  });
  window.addEventListener("mouseup", function () {
    draggingProgress = false;
  });
  progressWrap.addEventListener(
    "touchstart",
    function (e) {
      draggingProgress = true;
      setProgressFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  progressWrap.addEventListener(
    "touchmove",
    function (e) {
      if (draggingProgress) setProgressFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  window.addEventListener("touchend", function () {
    draggingProgress = false;
  });

  // ======================================================================
  // Eventos: volumen (click y arrastre)
  // ======================================================================
  let draggingVolume = false;

  volumeBar.addEventListener("mousedown", function (e) {
    draggingVolume = true;
    setVolumeFromClientX(e.clientX);
  });
  window.addEventListener("mousemove", function (e) {
    if (draggingVolume) setVolumeFromClientX(e.clientX);
  });
  window.addEventListener("mouseup", function () {
    draggingVolume = false;
  });
  volumeBar.addEventListener(
    "touchstart",
    function (e) {
      draggingVolume = true;
      setVolumeFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  volumeBar.addEventListener(
    "touchmove",
    function (e) {
      if (draggingVolume) setVolumeFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  window.addEventListener("touchend", function () {
    draggingVolume = false;
  });

  volumeBtn.addEventListener("click", function () {
    isMuted = !isMuted;
    if (isMuted) {
      lastVolume = volume;
      volume = 0;
    } else {
      volume = lastVolume || 50;
    }
    audioEl.volume = volume / 100;
    updateVolumeUI();
  });

  // ======================================================================
  // Eventos: utilidades
  // ======================================================================
  if (queueBtn) {
    queueBtn.addEventListener("click", function () {
      queueBtn.style.color = "var(--color-secondary)";
      setTimeout(function () {
        queueBtn.style.color = "";
      }, 300);
      alert(
        "Cola de reproducción:\n" +
          tracks
            .map(function (t, i) {
              return (i === currentIndex ? "▶ " : "  ") + t.title + " — " + t.artist;
            })
            .join("\n")
      );
    });
  }

  if (artWrap) {
    artWrap.addEventListener("click", togglePlay);
  }

  // ======================================================================
  // Atajos de teclado
  // ======================================================================
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && e.target.tagName !== "BUTTON") {
      e.preventDefault();
      togglePlay();
    } else if (e.code === "ArrowRight" && e.shiftKey) {
      goToTrack(currentIndex + 1, true);
    } else if (e.code === "ArrowLeft" && e.shiftKey) {
      goToTrack(currentIndex - 1, true);
    }
  });

  // ======================================================================
  // Sincronización con el elemento <audio> real
  // ======================================================================
  audioEl.addEventListener("loadedmetadata", updateProgressUI);
  audioEl.addEventListener("timeupdate", updateProgressUI);
  audioEl.addEventListener("ended", function () {
    if (isRepeat) {
      audioEl.currentTime = 0;
      audioEl.play();
    } else {
      goToTrack(currentIndex + 1, true);
    }
  });

  // ======================================================================
  // Inicialización: trae las canciones desde la API y carga la primera
  // ======================================================================
  updateVolumeUI();

  fetchSongs()
    .then(function (songs) {
      tracks = songs;
      if (tracks.length > 0) {
        loadTrack(0, false);
      } else {
        titleEl.textContent = "Sin canciones";
        artistEl.textContent = "Agrega archivos .mp3 a la carpeta backend/songs";
      }
    })
    .catch(function (err) {
      console.error("Error al cargar canciones desde la API:", err);
      titleEl.textContent = "Error al cargar canciones";
      artistEl.textContent = "Verifica que la API esté corriendo en " + API_BASE_URL;
    });
})();
