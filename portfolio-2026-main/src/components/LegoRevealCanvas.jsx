import { useRef, useEffect } from "react";

const TWO_PI = Math.PI * 2;
const LX = -0.707;
const LY = -0.707;
const LIGHT_ANGLE = Math.atan2(LY, LX);
const clamp255 = (v) => (v > 255 ? 255 : v < 0 ? 0 : v | 0);

const drawBrick = (ctx, r, g, b, bx, by, bw, bh, cornerR, studR, withStud) => {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;

  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, cornerR);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, cornerR);
  ctx.clip();

  const bevel = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  bevel.addColorStop(0,    "rgba(255,255,255,0.15)");
  bevel.addColorStop(0.35, "rgba(255,255,255,0)");
  bevel.addColorStop(0.65, "rgba(0,0,0,0)");
  bevel.addColorStop(1,    "rgba(0,0,0,0.18)");
  ctx.fillStyle = bevel;
  ctx.fillRect(bx, by, bw, bh);

  if (withStud && studR >= 1.5) {
    const shCx = cx - LX * studR * 0.34;
    const shCy = cy - LY * studR * 0.34;
    const shadow = ctx.createRadialGradient(shCx, shCy, studR * 0.55, shCx, shCy, studR * 1.25);
    shadow.addColorStop(0, "rgba(0,0,0,0.30)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.fillRect(bx, by, bw, bh);
  }

  ctx.restore();

  if (!withStud || studR < 1.5) return;

  ctx.beginPath();
  ctx.arc(cx, cy, studR, 0, TWO_PI);
  ctx.fillStyle = `rgb(${clamp255(r + 6)},${clamp255(g + 6)},${clamp255(b + 6)})`;
  ctx.fill();

  const rim = ctx.createConicGradient(LIGHT_ANGLE, cx, cy);
  rim.addColorStop(0,   "rgba(255,255,255,0.58)");
  rim.addColorStop(0.3, "rgba(255,255,255,0)");
  rim.addColorStop(0.5, "rgba(0,0,0,0.30)");
  rim.addColorStop(0.7, "rgba(255,255,255,0)");
  rim.addColorStop(1,   "rgba(255,255,255,0.58)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(0.7, studR * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, studR * 0.93, 0, TWO_PI);
  ctx.stroke();
};

const drawLegoGrid = (targetCtx, img, gridSize, gap, w, h, withStud) => {
  const cols = Math.ceil(w / gridSize);
  const rows = Math.ceil(h / gridSize);
  const sample = document.createElement("canvas");
  sample.width = cols;
  sample.height = rows;
  const sCtx = sample.getContext("2d");
  sCtx.imageSmoothingEnabled = true;
  sCtx.drawImage(img, 0, 0, cols, rows);
  const { data } = sCtx.getImageData(0, 0, cols, rows);

  const bw = gridSize - gap;
  const bh = gridSize - gap;
  const studR = bw * 0.30;
  const cornerR = Math.max(0.5, bw * 0.12);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      drawBrick(targetCtx, r, g, b, col * gridSize, row * gridSize, bw, bh, cornerR, studR, withStud);
    }
  }
};

const hash2 = (ix, iy) => ((Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453) % 1 + 1) % 1;

// Clips to all brick cells whose Y center < threshold (jittered per-cell)
const applyHorizClip = (targetCtx, cw, ch, threshold, blockSize, edgeJitter) => {
  const cols = Math.ceil(cw / blockSize);
  const rows = Math.ceil(ch / blockSize);
  const jitter = blockSize * edgeJitter;
  targetCtx.beginPath();
  for (let iy = 0; iy < rows; iy++) {
    const bcy = (iy + 0.5) * blockSize;
    for (let ix = 0; ix < cols; ix++) {
      const noise = (hash2(ix, iy) - 0.5) * jitter;
      if (bcy < threshold + noise) {
        targetCtx.rect(ix * blockSize, iy * blockSize, blockSize, blockSize);
      }
    }
  }
};

// Clips to all brick cells whose Chebyshev distance from canvas center < threshold (jittered)
const applySquareRadialClip = (targetCtx, cw, ch, threshold, blockSize, edgeJitter) => {
  const cols   = Math.ceil(cw / blockSize);
  const rows   = Math.ceil(ch / blockSize);
  const jitter = blockSize * edgeJitter;
  const cx     = cw / 2;
  const cy     = ch / 2;
  targetCtx.beginPath();
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const dist  = Math.max(Math.abs((ix + 0.5) * blockSize - cx), Math.abs((iy + 0.5) * blockSize - cy));
      const noise = (hash2(ix, iy) - 0.5) * jitter;
      if (dist < threshold + noise) {
        targetCtx.rect(ix * blockSize, iy * blockSize, blockSize, blockSize);
      }
    }
  }
};

// Clips to all brick cells whose X center falls within halfW of bandX (jittered)
const applyVerticalBandClip = (targetCtx, cw, ch, bandX, halfW, blockSize, edgeJitter) => {
  const cols = Math.ceil(cw / blockSize);
  const rows = Math.ceil(ch / blockSize);
  const jitter = blockSize * edgeJitter;
  targetCtx.beginPath();
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const bcx = (ix + 0.5) * blockSize;
      const noise = (hash2(ix, iy) - 0.5) * jitter;
      if (Math.abs(bcx - bandX) <= halfW + noise) {
        targetCtx.rect(ix * blockSize, iy * blockSize, blockSize, blockSize);
      }
    }
  }
};

const DEFAULT_CFG = {
  gridSize:       16,
  brickGap:       0,
  edgeJitter:     0.65,
  revealDuration: 2200,   // ms for the reveal sweep
  bandFraction:   0.28,   // fraction of the sweep range spanned by the studded→plain→image band
  streakDuration: 4200,   // ms for one full left→right streak loop
  streakBandFrac: 0.09,   // half-width of the outer (studded) zone as fraction of canvas width
  streakInnerFrac: 0.45,  // plain zone half-width as fraction of outer half-width
  ioThreshold:    0.25,
  disableLoop:    false,
  revealMode:     "horizontal", // "horizontal" | "square-ripple"
  eagerBuild:     false,        // build cache sync on load so bricks appear immediately
};

export default function LegoRevealCanvas({ imgSrc, config, zIndex = 2, style }) {
  const canvasRef = useRef(null);
  const configKey = JSON.stringify(config);

  useEffect(() => {
    const cfg = { ...DEFAULT_CFG, ...(config ?? {}) };
    const {
      gridSize, brickGap, edgeJitter, revealDuration, bandFraction,
      streakDuration, streakBandFrac, streakInnerFrac, ioThreshold, disableLoop, revealMode, eagerBuild,
    } = cfg;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = imgSrc;

    const off    = document.createElement("canvas");
    const offCtx = off.getContext("2d");

    const cache     = { studded: null, plain: null };
    const cacheSize = { w: 0, h: 0 };

    let phase          = "pre-reveal"; // "pre-reveal" | "revealing" | "post-reveal"
    let revealStart    = null;
    let streakPos      = 0;
    let streakLastTs   = null;
    let raf            = null;
    let buildReady     = false;
    let buildRunning   = false;
    let pendingReveal  = false;

    const sync = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w > 0 && h > 0) { canvas.width = w; canvas.height = h; }
    };
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    sync();

    // Sync build — only called by ensureCache for mid-animation resize.
    const buildCache = (w, h) => {
      if (cache.studded && cacheSize.w === w && cacheSize.h === h) return;
      if (!img.complete || img.naturalWidth === 0 || w === 0 || h === 0) return;
      const make = (withStud) => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        drawLegoGrid(c.getContext("2d"), img, gridSize, brickGap, w, h, withStud);
        return c;
      };
      cache.studded = make(true);
      cache.plain   = make(false);
      cacheSize.w   = w;
      cacheSize.h   = h;
      buildReady    = true;
    };

    const ensureCache = (w, h) => {
      if (w !== cacheSize.w || h !== cacheSize.h) buildCache(w, h);
    };

    // Starts the reveal once both the cache is ready and IO has fired.
    const tryBeginReveal = () => {
      if (!buildReady || !pendingReveal || phase !== "pre-reveal") return;
      pendingReveal = false;
      ctx.drawImage(cache.studded, 0, 0);
      phase = "revealing";
      revealStart = null;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Chunked async build — renders ROWS_PER_FRAME rows per animation frame so
    // the main thread is never blocked. Calls tryBeginReveal when done.
    const ROWS_PER_FRAME = 6;
    const startBuildChunked = (w, h) => {
      if (!img.complete || img.naturalWidth === 0 || w === 0 || h === 0) return;
      if (buildReady && cacheSize.w === w && cacheSize.h === h) { tryBeginReveal(); return; }
      if (buildRunning) return;
      buildRunning = true;

      const studdedC = document.createElement("canvas");
      studdedC.width = w; studdedC.height = h;
      const sCtx2 = studdedC.getContext("2d");

      const plainC = document.createElement("canvas");
      plainC.width = w; plainC.height = h;
      const pCtx = plainC.getContext("2d");

      const cols = Math.ceil(w / gridSize);
      const rows = Math.ceil(h / gridSize);

      const sample = document.createElement("canvas");
      sample.width = cols; sample.height = rows;
      const sampCtx = sample.getContext("2d");
      sampCtx.imageSmoothingEnabled = true;
      sampCtx.drawImage(img, 0, 0, cols, rows);
      const pixels = sampCtx.getImageData(0, 0, cols, rows).data;

      const bw      = gridSize - brickGap;
      const bh      = gridSize - brickGap;
      const studR   = bw * 0.30;
      const cornerR = Math.max(0.5, bw * 0.12);

      let row = 0;
      const renderChunk = () => {
        if (phase !== "pre-reveal") { buildRunning = false; return; }
        const end = Math.min(row + ROWS_PER_FRAME, rows);
        for (let r = row; r < end; r++) {
          for (let c = 0; c < cols; c++) {
            const i = (r * cols + c) * 4;
            drawBrick(sCtx2, pixels[i], pixels[i+1], pixels[i+2], c*gridSize, r*gridSize, bw, bh, cornerR, studR, true);
            drawBrick(pCtx,  pixels[i], pixels[i+1], pixels[i+2], c*gridSize, r*gridSize, bw, bh, cornerR, studR, false);
          }
        }
        row = end;
        if (row < rows) {
          requestAnimationFrame(renderChunk);
        } else {
          cache.studded = studdedC;
          cache.plain   = plainC;
          cacheSize.w   = w;
          cacheSize.h   = h;
          buildReady    = true;
          buildRunning  = false;
          tryBeginReveal();
        }
      };
      requestAnimationFrame(renderChunk);
    };

    const tick = (timestamp) => {
      const w = canvas.width;
      const h = canvas.height;
      ensureCache(w, h);

      if (!cache.studded) { raf = requestAnimationFrame(tick); return; }
      if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }

      ctx.clearRect(0, 0, w, h);

      if (phase === "pre-reveal") return;

      if (phase === "revealing") {
        if (!revealStart) revealStart = timestamp;
        const t  = Math.min(1, (timestamp - revealStart) / revealDuration);
        const rp = t * (1 + bandFraction);

        offCtx.clearRect(0, 0, w, h);
        offCtx.drawImage(cache.studded, 0, 0);

        if (revealMode === "square-ripple") {
          const maxR       = Math.max(w, h) / 2 + gridSize;
          const plainR     = rp * maxR;
          const imageR     = (rp - bandFraction) * maxR;

          if (plainR > 0) {
            offCtx.save();
            applySquareRadialClip(offCtx, w, h, plainR, gridSize, edgeJitter);
            offCtx.clip();
            offCtx.drawImage(cache.plain, 0, 0);
            offCtx.restore();
          }
          if (imageR > 0) {
            offCtx.save();
            applySquareRadialClip(offCtx, w, h, imageR, gridSize, edgeJitter);
            offCtx.clip();
            offCtx.globalCompositeOperation = "destination-out";
            offCtx.fillStyle = "rgba(0,0,0,1)";
            offCtx.fillRect(0, 0, w, h);
            offCtx.globalCompositeOperation = "source-over";
            offCtx.restore();
          }
        } else {
          const plainThreshY = rp * h;
          const imageThreshY = (rp - bandFraction) * h;

          if (plainThreshY > 0) {
            offCtx.save();
            applyHorizClip(offCtx, w, h, plainThreshY, gridSize, edgeJitter);
            offCtx.clip();
            offCtx.drawImage(cache.plain, 0, 0);
            offCtx.restore();
          }
          if (imageThreshY > 0) {
            offCtx.save();
            applyHorizClip(offCtx, w, h, imageThreshY, gridSize, edgeJitter);
            offCtx.clip();
            offCtx.globalCompositeOperation = "destination-out";
            offCtx.fillStyle = "rgba(0,0,0,1)";
            offCtx.fillRect(0, 0, w, h);
            offCtx.globalCompositeOperation = "source-over";
            offCtx.restore();
          }
        }

        ctx.drawImage(off, 0, 0);

        if (t >= 1) {
          phase = "post-reveal";
          streakPos    = 0;
          streakLastTs = null;
          if (disableLoop) { canvas.style.display = "none"; raf = null; return; }
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      // post-reveal: looping vertical streak sweeping left→right
      // outer zone = studded bricks, inner zone = plain bricks (progression)
      if (!streakLastTs) streakLastTs = timestamp;
      const dt = timestamp - streakLastTs;
      streakLastTs = timestamp;
      streakPos = (streakPos + dt / streakDuration) % 1;

      const halfBandPx  = streakBandFrac * w;
      const innerHalfPx = halfBandPx * streakInnerFrac;
      const bandX       = streakPos * (w + 2 * halfBandPx) - halfBandPx;

      offCtx.clearRect(0, 0, w, h);

      // Outer edges: plain (smooth-face) bricks
      offCtx.save();
      applyVerticalBandClip(offCtx, w, h, bandX, halfBandPx, gridSize, edgeJitter);
      offCtx.clip();
      offCtx.drawImage(cache.plain, 0, 0);
      offCtx.restore();

      // Inner core: studded bricks override the center
      offCtx.save();
      applyVerticalBandClip(offCtx, w, h, bandX, innerHalfPx, gridSize, edgeJitter);
      offCtx.clip();
      offCtx.drawImage(cache.studded, 0, 0);
      offCtx.restore();

      ctx.drawImage(off, 0, 0);
      raf = requestAnimationFrame(tick);
    };

    const startReveal = () => {
      if (phase !== "pre-reveal") return;
      if (buildReady) {
        ctx.drawImage(cache.studded, 0, 0);
        phase = "revealing";
        revealStart = null;
        if (!raf) raf = requestAnimationFrame(tick);
      } else {
        pendingReveal = true;
        startBuildChunked(canvas.width, canvas.height);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { startReveal(); io.disconnect(); }
        });
      },
      { threshold: ioThreshold }
    );

    const onLoad = () => {
      if (eagerBuild) {
        // Sync build so bricks appear on the canvas the moment the image is ready.
        buildCache(canvas.width, canvas.height);
        if (cache.studded) ctx.drawImage(cache.studded, 0, 0);
        io.observe(canvas);
      } else {
        io.observe(canvas);
        startBuildChunked(canvas.width, canvas.height);
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      onLoad();
    } else {
      img.addEventListener("load", onLoad);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      io.disconnect();
      ro.disconnect();
      img.removeEventListener("load", onLoad);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc, configKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={style ?? {
        position:      "absolute",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex,
      }}
    />
  );
}
