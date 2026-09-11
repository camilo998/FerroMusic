(function () {
  "use strict";

  // ---------- Datos de ejemplo (playlist simulada) ----------
  const tracks = [
    {
      title: "Midnight City",
      artist: "M83 • Hurry Up, We're Dreaming",
      art: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlyfdUpHaPczryahoVvhV0gm9PaHktEL5bJ4HbqOdW-oxVoigDKHU1UedT8pG-IQwyhCt_Hq0FNACyF2p-VpiG4Y0xGpRLWuaUS137QSKz6s5PGlNiXbYTXh5p_8p9uNeyex8ZBFyHDlA01gr6OE3FvKlzhNOkukQEKVp4Ix9y_DnF5UXIv6a-HCXIowjBmOTVRcUCdcT4lmcipCGmKgP0LbxDIxcT4bgJhffMxEYgaWfK9XJ2POD2",
      duration: 243 // 4:03 en segundos
    },
    {
      title: "Genesis",
      artist: "Justice • †",
      art: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlyfdUpHaPczryahoVvhV0gm9PaHktEL5bJ4HbqOdW-oxVoigDKHU1UedT8pG-IQwyhCt_Hq0FNACyF2p-VpiG4Y0xGpRLWuaUS137QSKz6s5PGlNiXbYTXh5p_8p9uNeyex8ZBFyHDlA01gr6OE3FvKlzhNOkukQEKVp4Ix9y_DnF5UXIv6a-HCXIowjBmOTVRcUCdcT4lmcipCGmKgP0LbxDIxcT4bgJhffMxEYgaWfK9XJ2POD2",
      duration: 197
    },
    {
      title: "Instant Crush",
      artist: "Daft Punk • Random Access Memories",
      art: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlyfdUpHaPczryahoVvhV0gm9PaHktEL5bJ4HbqOdW-oxVoigDKHU1UedT8pG-IQwyhCt_Hq0FNACyF2p-VpiG4Y0xGpRLWuaUS137QSKz6s5PGlNiXbYTXh5p_8p9uNeyex8ZBFyHDlA01gr6OE3FvKlzhNOkukQEKVp4Ix9y_DnF5UXIv6a-HCXIowjBmOTVRcUCdcT4lmcipCGmKgP0LbxDIxcT4bgJhffMxEYgaWfK9XJ2POD2",
      duration: 337
    }
  ];

  let currentIndex = 0;
  let isPlaying = false;
  let currentTime = 0;      // segundos reproducidos de la pista actual
  let isShuffle = false;
  let isRepeat = false;
  let isFavorite = true;    // el corazón ya viene "filled" en el HTML original
  let isMuted = false;
  let volume = 66.6666;     // % (coincide con el ancho inicial del CSS)
  let lastVolume = volume;
  let tickInterval = null;

  // ---------- Referencias al DOM (misma estructura, sin tocar clases) ----------
  const playBtn = document.querySelector(".player-bar__play");
  const playIcon = playBtn.querySelector(".material-symbols-outlined");
  const prevBtn = document.querySelector('[aria-label="Previous"]');
  const nextBtn = document.querySelector('[aria-label="Next"]');
  const shuffleBtn = document.querySelector('[aria-label="Shuffle"]');
  const repeatBtn = document.querySelector('[aria-label="Repeat"]');
  const favoriteBtn = document.querySelector(".player-bar__favorite");
  const favoriteIcon = favoriteBtn.querySelector(".material-symbols-outlined");

  const artEl = document.querySelector(".player-bar__art img");
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
  const lyricsBtn = document.querySelector('[aria-label="Lyrics"]');
  const devicesBtn = document.querySelector('[aria-label="Devices"]');
  const artOverlay = document.querySelector(".player-bar__art-overlay");
  const artWrap = document.querySelector(".player-bar__art");

  const mobileNavItems = document.querySelectorAll(".mobile-nav__item");

  const localFileInput = document.getElementById("localFileInput");
  const localFileNameEl = document.getElementById("localFileName");

  // ---------- Cargar música local ----------
  // Guarda las URLs de objeto creadas para poder liberarlas después
  // (evita fugas de memoria al reemplazar canciones).
  const createdObjectUrls = [];

  function extractTitleArtist(filename) {
    const nameNoExt = filename.replace(/\.[^/.]+$/, "");
    const parts = nameNoExt.split(" - ");
    if (parts.length >= 2) {
      return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
    }
    return { artist: "Música local", title: nameNoExt.trim() };
  }

  function addLocalFiles(fileList) {
    const files = Array.from(fileList).filter(function (f) {
      return f.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name);
    });

    if (files.length === 0) return;

    const newTracks = files.map(function (file) {
      const objectUrl = URL.createObjectURL(file);
      createdObjectUrls.push(objectUrl);
      const meta = extractTitleArtist(file.name);
      return {
        title: meta.title,
        artist: meta.artist,
        art: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlyfdUpHaPczryahoVvhV0gm9PaHktEL5bJ4HbqOdW-oxVoigDKHU1UedT8pG-IQwyhCt_Hq0FNACyF2p-VpiG4Y0xGpRLWuaUS137QSKz6s5PGlNiXbYTXh5p_8p9uNeyex8ZBFyHDlA01gr6OE3FvKlzhNOkukQEKVp4Ix9y_DnF5UXIv6a-HCXIowjBmOTVRcUCdcT4lmcipCGmKgP0LbxDIxcT4bgJhffMxEYgaWfK9XJ2POD2",
        duration: 0, // se completa al cargar los metadatos reales
        src: objectUrl,
        isLocal: true
      };
    });

    const insertAt = tracks.length;
    tracks.push.apply(tracks, newTracks);

    localFileNameEl.textContent =
      files.length === 1
        ? files[0].name
        : files.length + " canciones agregadas";

    // Reproduce automáticamente la primera canción recién agregada
    loadTrack(insertAt, true);
  }

  if (localFileInput) {
    localFileInput.addEventListener("change", function (e) {
      addLocalFiles(e.target.files);
      // Permite volver a seleccionar el mismo archivo más adelante
      localFileInput.value = "";
    });
  }

  // ---------- Utilidades ----------
  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m + ":" + String(rem).padStart(2, "0");
  }

  function loadTrack(index, autoplay) {
    currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    currentTime = 0;

    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    artEl.src = track.art;
    artEl.alt = track.title;

    timeElapsedEl.textContent = "0:00";
    timeTotalEl.textContent = track.duration ? formatTime(track.duration) : "0:00";

    if (track.src) {
      // Pista con audio real (archivo local cargado por el usuario)
      audioEl.src = track.src;
      audioEl.load();
    } else {
      // Pista de demo/simulada: sin audio real
      audioEl.removeAttribute("src");
      audioEl.load();
    }

    updateProgressUI();

    if (autoplay) {
      play();
    } else {
      pause();
    }
  }

  function currentTrackHasAudio() {
    return !!tracks[currentIndex].src;
  }

  function updateProgressUI() {
    const track = tracks[currentIndex];
    const duration = track.duration || 1;
    const pct = Math.min(100, (currentTime / duration) * 100);
    playedBar.style.width = pct + "%";
    timeElapsedEl.textContent = formatTime(currentTime);
  }

  function tick() {
    const track = tracks[currentIndex];
    currentTime += 1;
    if (currentTime >= track.duration) {
      if (isRepeat) {
        currentTime = 0;
      } else {
        goToTrack(currentIndex + 1, true);
        return;
      }
    }
    updateProgressUI();
  }

  const audioEl = document.getElementById("audioPlayer");

  function play() {
    isPlaying = true;
    playIcon.textContent = "pause";
    playBtn.setAttribute("aria-label", "Pause");

    if (currentTrackHasAudio()) {
      audioEl.play().catch(function (err) {
        console.warn("No se pudo reproducir el audio:", err);
      });
    } else {
      clearInterval(tickInterval);
      tickInterval = setInterval(tick, 1000);
    }
  }

  function pause() {
    isPlaying = false;
    playIcon.textContent = "play_arrow";
    playBtn.setAttribute("aria-label", "Play");

    if (currentTrackHasAudio()) {
      audioEl.pause();
    } else {
      clearInterval(tickInterval);
    }
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
    if (isShuffle) {
      if (tracks.length > 1) {
        do {
          nextIdx = Math.floor(Math.random() * tracks.length);
        } while (nextIdx === currentIndex);
      }
    }
    loadTrack(nextIdx, autoplay !== undefined ? autoplay : isPlaying);
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
    if (currentTrackHasAudio()) {
      const duration = isFinite(audioEl.duration) ? audioEl.duration : tracks[currentIndex].duration;
      audioEl.currentTime = (pct / 100) * duration;
      currentTime = audioEl.currentTime;
    } else {
      const track = tracks[currentIndex];
      currentTime = (pct / 100) * track.duration;
    }
    updateProgressUI();
  }

  // ---------- Eventos: transporte ----------
  playBtn.addEventListener("click", togglePlay);
  nextBtn.addEventListener("click", function () {
    goToTrack(currentIndex + 1);
  });
  prevBtn.addEventListener("click", function () {
    // Si lleva más de 3s escuchada, reinicia la pista; si no, va a la anterior
    if (currentTime > 3) {
      currentTime = 0;
      updateProgressUI();
    } else {
      goToTrack(currentIndex - 1);
    }
  });

  shuffleBtn.addEventListener("click", function () {
    isShuffle = !isShuffle;
    shuffleBtn.style.color = isShuffle ? "var(--color-secondary)" : "";
  });

  repeatBtn.addEventListener("click", function () {
    isRepeat = !isRepeat;
    repeatBtn.style.color = isRepeat ? "var(--color-secondary)" : "";
  });

  favoriteBtn.addEventListener("click", function () {
    isFavorite = !isFavorite;
    favoriteIcon.classList.toggle("filled", isFavorite);
    favoriteBtn.style.color = isFavorite ? "var(--color-secondary)" : "";
  });

  // ---------- Eventos: barra de progreso (click y arrastre) ----------
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

  // ---------- Eventos: volumen (click y arrastre) ----------
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

  // ---------- Eventos: utilidades ----------
  if (queueBtn) {
    queueBtn.addEventListener("click", function () {
      queueBtn.style.color = "var(--color-secondary)";
      setTimeout(function () {
        queueBtn.style.color = "";
      }, 300);
      alert("Cola de reproducción:\n" + tracks.map(function (t, i) {
        return (i === currentIndex ? "▶ " : "  ") + t.title + " — " + t.artist;
      }).join("\n"));
    });
  }

  if (lyricsBtn) {
    lyricsBtn.addEventListener("click", function () {
      lyricsBtn.classList.toggle("is-active");
      lyricsBtn.style.color = lyricsBtn.classList.contains("is-active") ? "var(--color-secondary)" : "";
    });
  }

  if (devicesBtn) {
    devicesBtn.addEventListener("click", function () {
      alert("Dispositivos disponibles:\n• Este navegador\n• (No hay otros dispositivos conectados)");
    });
  }

  // Click en la carátula: reproducir/pausar
  if (artWrap) {
    artWrap.addEventListener("click", togglePlay);
  }
  if (artOverlay) {
    artOverlay.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePlay();
    });
  }

  // Navegación móvil: alternar estado activo
  mobileNavItems.forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      mobileNavItems.forEach(function (el) {
        el.classList.remove("mobile-nav__item--active");
      });
      item.classList.add("mobile-nav__item--active");
    });
  });

  // ---------- Atajos de teclado ----------
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && e.target.tagName !== "BUTTON") {
      e.preventDefault();
      togglePlay();
    } else if (e.code === "ArrowRight" && e.shiftKey) {
      goToTrack(currentIndex + 1);
    } else if (e.code === "ArrowLeft" && e.shiftKey) {
      goToTrack(currentIndex - 1);
    }
  });

  // ---------- Sincronización con el audio real (aplica a cualquier pista con src) ----------
  audioEl.addEventListener("loadedmetadata", function () {
    if (isFinite(audioEl.duration) && currentTrackHasAudio()) {
      tracks[currentIndex].duration = audioEl.duration;
      timeTotalEl.textContent = formatTime(audioEl.duration);
    }
  });

  audioEl.addEventListener("timeupdate", function () {
    if (!currentTrackHasAudio()) return;
    currentTime = audioEl.currentTime;
    const duration = isFinite(audioEl.duration) ? audioEl.duration : tracks[currentIndex].duration || 1;
    const pct = Math.min(100, (currentTime / duration) * 100);
    playedBar.style.width = pct + "%";
    timeElapsedEl.textContent = formatTime(currentTime);
  });

  audioEl.addEventListener("ended", function () {
    if (!currentTrackHasAudio()) return;
    if (isRepeat) {
      audioEl.currentTime = 0;
      audioEl.play();
    } else {
      goToTrack(currentIndex + 1, true);
    }
  });

  audioEl.volume = volume / 100;

  // ---------- Estado inicial ----------
  updateVolumeUI();
  updateProgressUI();
  // La pista inicial arranca en pausa, como en el diseño original
  pause();

  // ======================================================================
  // VISUALIZADOR DE FUEGO (reacciona al ritmo de la canción)
  // ======================================================================
  (function initFireVisualizer() {
    const canvas = document.getElementById("fireCanvas");
    if (!canvas) return;

    // Resolución interna baja (el CSS la estira); menor resolución =
    // mejor rendimiento y un fuego con bordes más suaves al escalarse.
    const FIRE_W = 80;
    const FIRE_H = 45;
    canvas.width = FIRE_W;
    canvas.height = FIRE_H;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(FIRE_W, FIRE_H);

    // Paleta clásica de "fuego" (36 tonos, de negro a blanco pasando
    // por rojo, naranja y amarillo).
    const PALETTE = [
      [7, 7, 7], [31, 7, 7], [47, 15, 7], [71, 15, 7], [87, 23, 7],
      [103, 31, 7], [119, 31, 7], [143, 39, 7], [159, 47, 7], [175, 63, 7],
      [191, 71, 7], [199, 71, 7], [223, 79, 7], [223, 87, 7], [223, 87, 7],
      [215, 95, 7], [215, 95, 7], [215, 103, 15], [207, 111, 15], [207, 119, 15],
      [207, 127, 15], [207, 135, 23], [199, 135, 23], [199, 143, 23], [199, 151, 31],
      [191, 159, 31], [191, 159, 31], [191, 167, 39], [191, 167, 39], [191, 175, 47],
      [183, 175, 47], [183, 183, 47], [183, 183, 55], [207, 207, 111], [223, 223, 159],
      [239, 239, 199], [255, 255, 255]
    ];
    const MAX_INTENSITY = PALETTE.length - 1;

    // Cada celda guarda un índice de intensidad (0 = apagado, 36 = blanco)
    const firePixels = new Uint8Array(FIRE_W * FIRE_H);

    // ---------- Análisis de audio real (si la pista tiene src) ----------
    let audioContext = null;
    let analyser = null;
    let frequencyData = null;
    let sourceConnected = false;

    function trySetupRealAudio() {
      if (sourceConnected) return true;
      if (!audioEl || !audioEl.src) return false;
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioEl);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        sourceConnected = true;
        return true;
      } catch (err) {
        console.warn("No se pudo inicializar el análisis de audio real:", err);
        return false;
      }
    }

    // ---------- Nivel de energía por columna (0 a 1) ----------
    // Con audio real: usa el espectro de frecuencias real.
    // Sin audio real (pistas de demo): simula un patrón orgánico.
    let simTime = 0;
    const simPhases = new Array(FIRE_W).fill(0).map(function () {
      return Math.random() * Math.PI * 2;
    });

    function getColumnLevels() {
      const volFactor = isMuted ? 0 : Math.max(0.05, volume / 100);

      if (analyser && frequencyData) {
        analyser.getByteFrequencyData(frequencyData);
        const step = frequencyData.length / FIRE_W;
        const levels = new Array(FIRE_W);
        for (let x = 0; x < FIRE_W; x++) {
          levels[x] = (frequencyData[Math.floor(x * step)] / 255) * volFactor;
        }
        return levels;
      }

      // Modo simulado
      simTime += 1;
      const levels = new Array(FIRE_W);
      for (let x = 0; x < FIRE_W; x++) {
        const base = Math.sin(simTime * 0.06 + simPhases[x]) * 0.5 + 0.5;
        const flicker = Math.random() * 0.3;
        const centerBoost = 1 - Math.abs(x - FIRE_W / 2) / (FIRE_W / 2);
        levels[x] = Math.min(1, (base * 0.6 + flicker + centerBoost * 0.3)) * volFactor;
      }
      return levels;
    }

    // ---------- Alimentar la fila base del fuego (el "combustible") ----------
    function feedFire() {
      const levels = getColumnLevels();
      const bottomRow = (FIRE_H - 1) * FIRE_W;
      const dyingOut = !isPlaying;

      for (let x = 0; x < FIRE_W; x++) {
        if (dyingOut) {
          // Al pausar, el fuego se va apagando gradualmente
          const current = firePixels[bottomRow + x];
          firePixels[bottomRow + x] = current > 0 ? current - 1 : 0;
        } else {
          const intensity = Math.round(levels[x] * MAX_INTENSITY);
          // Suaviza el cambio para que no "parpadee" agresivamente
          const prev = firePixels[bottomRow + x];
          firePixels[bottomRow + x] = Math.round(prev * 0.4 + intensity * 0.6);
        }
      }
    }

    // ---------- Algoritmo clásico de propagación del fuego ----------
    function spreadFire(src) {
      const pixel = firePixels[src];
      if (pixel === 0) {
        firePixels[src - FIRE_W] = 0;
        return;
      }
      const randIdx = Math.floor(Math.random() * 3) & 3;
      const dst = src - randIdx + 1;
      const newIdx = dst - FIRE_W;
      if (newIdx >= 0) {
        firePixels[newIdx] = Math.max(0, pixel - (randIdx & 1));
      }
    }

    function updateFire() {
      for (let x = 0; x < FIRE_W; x++) {
        for (let y = 1; y < FIRE_H; y++) {
          spreadFire(y * FIRE_W + x);
        }
      }
    }

    function renderFire() {
      const data = imageData.data;
      for (let i = 0; i < firePixels.length; i++) {
        const color = PALETTE[firePixels[i]] || PALETTE[0];
        const offset = i * 4;
        data[offset] = color[0];
        data[offset + 1] = color[1];
        data[offset + 2] = color[2];
        data[offset + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    let rafId = null;

    function animationLoop() {
      feedFire();
      updateFire();
      renderFire();

      // Sigue animando mientras haya llama visible, aunque esté en pausa,
      // para que el apagado se vea gradual y no un corte brusco.
      const stillBurning = firePixels.some(function (v) {
        return v > 0;
      });

      if (isPlaying || stillBurning) {
        rafId = requestAnimationFrame(animationLoop);
      } else {
        rafId = null;
      }
    }

    function startVisualizer() {
      trySetupRealAudio();
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }
      if (!rafId) {
        rafId = requestAnimationFrame(animationLoop);
      }
    }

    // Conectar el visualizador al mismo play/pausa del reproductor.
    playBtn.addEventListener("click", function () {
      setTimeout(function () {
        startVisualizer(); // también anima el apagado gradual al pausar
      }, 0);
    });

    if (artWrap) {
      artWrap.addEventListener("click", function () {
        setTimeout(function () {
          startVisualizer();
        }, 0);
      });
    }

    // Primer frame: todo apagado
    renderFire();
  })();
})();