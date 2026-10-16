import { useState, useRef, useEffect } from "react";
import "./PercentageSlider.css";
import { useButtonSounds } from "../../hooks/useButtonSounds";
import PlayIcon from "/icons/Play.svg";
import PauseIcon from "/icons/Pause.svg";

// --- Configuration ---
const FRAME_COUNT = 25;
const BASE_PATH = "";
const FADE_DURATION = 600;
const AUTOPLAY_DURATION = FADE_DURATION;

const currentFrame = (index) =>
  `${BASE_PATH}/about_imgs/${index + 1}.webp`;

// --- Styles ---
const containerStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "15px",
};

const squareStyle = {
  width: "100%",
  aspectRatio: "1 / 1",
  backgroundColor: "var(--off-teal)",
  borderRadius: "6px",
  overflow: "hidden",
};

const canvasStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  boxSizing: "border-box",
  borderRadius: "6px",
  border: "2.4px solid var(--off-teal)",
};

const PercentageSlider = () => {
  const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
  const playButtonHover = () => _playHover(3);
  const playButtonClick = () => _playClick(3);
  const playSliderStep = () => _playHover(1);
  const lastPlayedFrameRef = useRef(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isInView, setIsInView] = useState(true);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const intervalRef = useRef(null);
  const fadeRafRef = useRef(null);
  const prevFrameRef = useRef(null);
  const pendingFrameRef = useRef(null);

  const percentage = (frameIndex / (FRAME_COUNT - 1)) * 100;

  // --- Intersection Observer for visibility ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // --- Pause when out of view ---
  useEffect(() => {
    if (!isInView && isPlaying) {
      setIsPlaying(false);
    }
  }, [isInView, isPlaying]);

  // --- Preload ---
  useEffect(() => {
    let loaded = 0;
    const imgs = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = currentFrame(i);

      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === FRAME_COUNT) setImagesLoaded(true);
      };

      imgs.push(img);
    }

    imagesRef.current = imgs;
  }, []);

  // --- Draw helper ---
  const drawCover = (ctx, img) => {
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;

    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  };

  // --- Fade: run one fade from current to target; when done, process pending ---
  const startFade = (targetIndex) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const fromIndex = prevFrameRef.current;
    const img = imagesRef.current[targetIndex];
    const prevImg = imagesRef.current[fromIndex];

    if (!img || !prevImg || fromIndex === targetIndex) {
      if (fromIndex === targetIndex && pendingFrameRef.current != null) {
        const next = pendingFrameRef.current;
        pendingFrameRef.current = null;
        startFade(next);
      }
      return;
    }

    const start = performance.now();

    const animate = (now) => {
      const t = Math.min(
        (now - start) / (isPlaying ? FADE_DURATION : 1),
        1
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1 - t;
      drawCover(ctx, prevImg);
      ctx.globalAlpha = t;
      drawCover(ctx, img);
      ctx.globalAlpha = 1;

      if (t < 1) {
        fadeRafRef.current = requestAnimationFrame(animate);
        return;
      }

      fadeRafRef.current = null;
      prevFrameRef.current = targetIndex;

      const next = pendingFrameRef.current;
      pendingFrameRef.current = null;
      if (next != null) {
        startFade(next);
      }
    };

    fadeRafRef.current = requestAnimationFrame(animate);
  };

  // --- Fade render ---
  const renderFrame = (index) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = imagesRef.current[index];
    if (!img) return;

    if (prevFrameRef.current === null) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawCover(ctx, img);
      prevFrameRef.current = index;
      return;
    }

    if (index === prevFrameRef.current) {
      const next = pendingFrameRef.current;
      if (next != null) {
        pendingFrameRef.current = null;
        startFade(next);
      }
      return;
    }

    if (fadeRafRef.current != null) {
      pendingFrameRef.current = index;
      return;
    }

    startFade(index);
  };

  // --- Render on frame change ---
  useEffect(() => {
    if (imagesLoaded) renderFrame(frameIndex);
  }, [frameIndex, imagesLoaded]);

  // --- Autoplay ---
  useEffect(() => {
    if (!isPlaying || !imagesLoaded) return;

    intervalRef.current = setInterval(() => {
      setFrameIndex((i) => (i + 1) % FRAME_COUNT);
    }, AUTOPLAY_DURATION);

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, imagesLoaded]);

  const togglePlay = () => { playButtonClick(); setIsPlaying((p) => !p); };

  const handleSliderChange = (e) => {
    const percent = Number(e.target.value);
    const index = Math.round(
      (percent / 100) * (FRAME_COUNT - 1)
    );

    if (index !== lastPlayedFrameRef.current) {
      playSliderStep();
      lastPlayedFrameRef.current = index;
    }

    setFrameIndex(index);
    setIsPlaying(false);
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={squareStyle}>
        <canvas ref={canvasRef} style={canvasStyle} role="img" aria-label="Photo of Sahil" />
      </div>

      <div
        style={{
          display: "flex",
          borderRadius: "6px",
          gap: "6px",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "var(--dark-green)",
          padding: "6px 6px",
          boxSizing: "border-box",
          border: "2.4px solid var(--off-teal)"
        }}
      >
        <div
          id="play-pause-button"
          role="button"
          tabIndex={0}
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          onMouseEnter={playButtonHover}
          onClick={togglePlay}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlay(); } }}
        >
          <img src={isPlaying ? PauseIcon : PlayIcon} alt=""/>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={handleSliderChange}
          className="percentage-slider"
          style={{ "--value": `${percentage}%` }}
          aria-label="Browse photos"
        />
      </div>
    </div>
  );
};

export default PercentageSlider;
