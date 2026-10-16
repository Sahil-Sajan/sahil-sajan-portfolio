import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useButtonSounds } from '../hooks/useButtonSounds';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

const CANVAS_WIDTH  = 1280;
const CANVAS_HEIGHT = 720;

const LEGO_GRID      = 45;
const LEGO_REVEAL_MS = 1200;
const LEGO_BAND_FRAC = 0.30;
const LEGO_FADE_MS   = 350;
const LEGO_JITTER    = LEGO_GRID * 0.65;
const LEGO_LIGHT_ANGLE = Math.atan2(-0.707, -0.707);
const legoClamp = (v) => (v > 255 ? 255 : v < 0 ? 0 : v | 0);
const legoHash  = (ix, iy) => ((Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453) % 1 + 1) % 1;

const drawLegoBrick = (ctx, r, g, b, bx, by, cornerR, studR) => {
  const cx = bx + LEGO_GRID / 2;
  const cy = by + LEGO_GRID / 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, LEGO_GRID, LEGO_GRID, cornerR);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx, by, LEGO_GRID, LEGO_GRID, cornerR);
  ctx.clip();
  const bevel = ctx.createLinearGradient(bx, by, bx + LEGO_GRID, by + LEGO_GRID);
  bevel.addColorStop(0,    "rgba(255,255,255,0.15)");
  bevel.addColorStop(0.35, "rgba(255,255,255,0)");
  bevel.addColorStop(0.65, "rgba(0,0,0,0)");
  bevel.addColorStop(1,    "rgba(0,0,0,0.18)");
  ctx.fillStyle = bevel;
  ctx.fillRect(bx, by, LEGO_GRID, LEGO_GRID);
  if (studR >= 1.5) {
    const shCx = cx + 0.707 * studR * 0.34;
    const shCy = cy + 0.707 * studR * 0.34;
    const sh = ctx.createRadialGradient(shCx, shCy, studR * 0.55, shCx, shCy, studR * 1.25);
    sh.addColorStop(0, "rgba(0,0,0,0.30)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(bx, by, LEGO_GRID, LEGO_GRID);
  }
  ctx.restore();
  if (studR < 1.5) return;
  ctx.beginPath();
  ctx.arc(cx, cy, studR, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${legoClamp(r + 6)},${legoClamp(g + 6)},${legoClamp(b + 6)})`;
  ctx.fill();
  const rim = ctx.createConicGradient(LEGO_LIGHT_ANGLE, cx, cy);
  rim.addColorStop(0,   "rgba(255,255,255,0.58)");
  rim.addColorStop(0.3, "rgba(255,255,255,0)");
  rim.addColorStop(0.5, "rgba(0,0,0,0.30)");
  rim.addColorStop(0.7, "rgba(255,255,255,0)");
  rim.addColorStop(1,   "rgba(255,255,255,0.58)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(0.7, studR * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, studR * 0.93, 0, Math.PI * 2);
  ctx.stroke();
};

const buildLegoCache = (img, w, h) => {
  const cols = Math.ceil(w / LEGO_GRID);
  const rows = Math.ceil(h / LEGO_GRID);
  const samp = document.createElement("canvas");
  samp.width = cols; samp.height = rows;
  const sCtx = samp.getContext("2d");
  sCtx.imageSmoothingEnabled = true;
  sCtx.drawImage(img, 0, 0, cols, rows);
  const { data } = sCtx.getImageData(0, 0, cols, rows);
  const studR   = LEGO_GRID * 0.30;
  const cornerR = Math.max(0.5, LEGO_GRID * 0.12);
  const make = (withStud) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const cCtx = c.getContext("2d");
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = (row * cols + col) * 4;
        drawLegoBrick(cCtx, data[i], data[i + 1], data[i + 2],
          col * LEGO_GRID, row * LEGO_GRID, cornerR, withStud ? studR : 0);
      }
    }
    return c;
  };
  return { studded: make(true), plain: make(false), w, h };
};

const applyLegoRadialClip = (ctx, w, h, threshold) => {
  const cols = Math.ceil(w / LEGO_GRID);
  const rows = Math.ceil(h / LEGO_GRID);
  const cx = w / 2, cy = h / 2;
  ctx.beginPath();
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const dist = Math.max(
        Math.abs((ix + 0.5) * LEGO_GRID - cx),
        Math.abs((iy + 0.5) * LEGO_GRID - cy)
      );
      if (dist < threshold + (legoHash(ix, iy) - 0.5) * LEGO_JITTER)
        ctx.rect(ix * LEGO_GRID, iy * LEGO_GRID, LEGO_GRID, LEGO_GRID);
    }
  }
};

const ProjectImage = ({ src, alt, caption = "" }) => {
  const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
  const playHover = () => _playHover(5);
  const playClick = () => _playClick(5);
  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef(null);
  const hiddenImgRef = useRef(null);
  const legoRafRef = useRef(null);
  const observerRef = useRef(null);
  const legoCacheRef = useRef(null);

  const runLegoReveal = useCallback(() => {
    const canvas = canvasRef.current;
    const cache  = legoCacheRef.current;
    if (!canvas || !cache) return;

    if (legoRafRef.current) cancelAnimationFrame(legoRafRef.current);

    const { studded, plain, w, h } = cache;
    if (canvas.width !== w || canvas.height !== h) return;

    const off    = document.createElement("canvas");
    off.width = w; off.height = h;
    const offCtx = off.getContext("2d");
    const maxR   = Math.max(w, h) / 2 + LEGO_GRID;
    const start  = performance.now();
    const ctx    = canvas.getContext("2d");

    canvas.style.transition = "none";
    canvas.style.opacity    = "1";

    const frame = (now) => {
      const t  = Math.min(1, (now - start) / LEGO_REVEAL_MS);
      const rp = t * (1 + LEGO_BAND_FRAC);

      offCtx.clearRect(0, 0, w, h);
      offCtx.drawImage(studded, 0, 0);

      const plainR = rp * maxR;
      if (plainR > 0) {
        offCtx.save();
        applyLegoRadialClip(offCtx, w, h, plainR);
        offCtx.clip();
        offCtx.drawImage(plain, 0, 0);
        offCtx.restore();
      }

      const imageR = (rp - LEGO_BAND_FRAC) * maxR;
      if (imageR > 0) {
        offCtx.save();
        applyLegoRadialClip(offCtx, w, h, imageR);
        offCtx.clip();
        offCtx.globalCompositeOperation = "destination-out";
        offCtx.fillStyle = "rgba(0,0,0,1)";
        offCtx.fillRect(0, 0, w, h);
        offCtx.globalCompositeOperation = "source-over";
        offCtx.restore();
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(off, 0, 0);

      if (t < 1) {
        legoRafRef.current = requestAnimationFrame(frame);
      } else {
        legoRafRef.current = null;
        canvas.style.transition = `opacity ${LEGO_FADE_MS}ms ease`;
        canvas.style.opacity    = "0";
      }
    };

    legoRafRef.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!imageLoaded) return;

    const canvas = canvasRef.current;
    const img    = hiddenImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    canvas.style.transition = "none";
    canvas.style.opacity    = "1";

    // Immediately cover the real image so it never flashes through
    ctx.fillStyle = "#C2E9E7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Build the lego cache in the next frame (heavy sync work)
    legoRafRef.current = requestAnimationFrame(() => {
      legoRafRef.current = null;
      legoCacheRef.current = buildLegoCache(img, canvas.width, canvas.height);
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(legoCacheRef.current.studded, 0, 0);

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runLegoReveal();
              observerRef.current?.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );

      if (canvas) observerRef.current.observe(canvas);
    });

    return () => {
      observerRef.current?.disconnect();
      if (legoRafRef.current) cancelAnimationFrame(legoRafRef.current);
    };
  }, [imageLoaded, runLegoReveal]);

  const containerStyle = {
    width: "100%",
    padding: "21px",
    boxSizing: "border-box",
    borderRadius: "9px",
    backgroundColor: "var(--off-white)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: "12px",
  };

  const imgWrapperStyle = {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "6px",
    backgroundColor: "var(--light-off-teal)",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.3s ease-in-out",
    border: "1.8px solid var(--off-teal)"
  };

  // Shared style for both the img and canvas so they overlap perfectly
  const fillStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const canvasStyle = {
    ...fillStyle,
    transition: "transform 0.3s ease-in-out",
    zIndex: 1,
  };

  const imgStyle = {
    ...fillStyle,
    zIndex: 0,
    transition: "transform 0.3s ease-in-out"
  };

  const captionStyle = {
    fontWeight: "400",
    fontSize: "15px",
    color: "var(--off-black)",
    width: "100%",
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <style>{`
        .project-image-wrapper:hover canvas {
          transform: scale(1.02);
        }
        .project-image-wrapper:hover .project-image-real {
          transform: scale(1.02);
        }

        .yarl__button:hover {
          background-color: var(--light-off-teal) !important;
          transition: all 0.3s ease !important;
        }
      `}</style>

      {/* Hidden img used only as the canvas draw source */}
      <img
        ref={hiddenImgRef}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={() => setImageLoaded(true)}
        style={{ display: "none" }}
      />

      {caption !== "" && <h3 style={captionStyle}>{caption}</h3>}

      <div
        style={imgWrapperStyle}
        className="project-image-wrapper"
        onClick={() => { setOpen(true); }}
      >
        {/* Layer 0: real image, always present underneath */}
        <img
          src={src}
          alt={alt}
          style={imgStyle}
          className="project-image-real"
          loading="lazy"
          decoding="async"
        />

        {/* Layer 1: canvas overlay — fades to opacity 0 when animation ends */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={canvasStyle}
          aria-hidden="true"
        />
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src }]}
        plugins={[Zoom]}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
        zoom={{ maxZoomPixelRatio: 3 }}
        styles={{
          container: { backgroundColor: "var(--off-white)" },
          button: {
            backgroundColor: "var(--off-white)",
            color: "var(--dark-green)",
            filter: "none",
            borderRadius: "6px",
            border: "1px solid var(--off-teal)",
            margin: "0px 6px",
          },
          slide: { padding: "18px" },
        }}
      />
    </div>
  );
};

export default memo(ProjectImage);
