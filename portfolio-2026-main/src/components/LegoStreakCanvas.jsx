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
  ctx.lineWidth   = Math.max(0.7, studR * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, studR * 0.93, 0, TWO_PI);
  ctx.stroke();
};

const drawLegoGrid = (targetCtx, img, gridSize, gap, w, h, withStud) => {
  const cols = Math.ceil(w / gridSize);
  const rows = Math.ceil(h / gridSize);
  const sample = document.createElement("canvas");
  sample.width  = cols;
  sample.height = rows;
  const sCtx = sample.getContext("2d");
  sCtx.imageSmoothingEnabled = true;
  sCtx.drawImage(img, 0, 0, cols, rows);
  const { data } = sCtx.getImageData(0, 0, cols, rows);

  const bw     = gridSize - gap;
  const bh     = gridSize - gap;
  const studR  = bw * 0.30;
  const cornerR = Math.max(0.5, bw * 0.12);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      drawBrick(targetCtx, r, g, b, col * gridSize, row * gridSize, bw, bh, cornerR, studR, withStud);
    }
  }
};

const DEFAULT_CONFIG = {
  gridSize:        18,
  brickGap:        0,
  streakAngle:     1,
  edgeJitter:      0.65,
  hoverSpeed:      0.10,
  springStiffness: 0.10,
  springDamping:   0.70,
  innerZones: [
    { relWidth: 0.55, quality: "plain" },
    { relWidth: 0.24, quality: "image" },
  ],
};

const hash2 = (ix, iy) => ((Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453) % 1 + 1) % 1;

const LegoStreakCanvas = ({ hoverPos, isActive, imgSrc, config, zIndex = 3 }) => {
  const canvasRef    = useRef(null);
  const liveRef      = useRef({ hoverPos, isActive });
  liveRef.current    = { hoverPos, isActive };
  const cacheRef     = useRef({});
  const cacheSizeRef = useRef({ w: 0, h: 0 });
  const rafRef       = useRef(null);
  const restartRef   = useRef(null);
  const configKey    = JSON.stringify(config);

  useEffect(() => {
    const cfg = { ...DEFAULT_CONFIG, ...(config ?? {}) };
    const {
      gridSize, brickGap, innerZones, streakAngle,
      edgeJitter, hoverSpeed, springStiffness, springDamping,
    } = cfg;

    const cosA = Math.cos(streakAngle);
    const sinA = Math.sin(streakAngle);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = imgSrc;

    const off    = document.createElement("canvas");
    const offCtx = off.getContext("2d");

    const spr = { x: 0, y: 0, vx: 0, vy: 0 };
    let hv = 0;

    const sync = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w > 0 && h > 0) { canvas.width = w; canvas.height = h; }
    };
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    sync();

    const buildCache = (w, h) => {
      if (!img.complete || img.naturalWidth === 0 || w === 0 || h === 0) return;
      const make = (withStud) => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        drawLegoGrid(c.getContext("2d"), img, gridSize, brickGap, w, h, withStud);
        return c;
      };
      cacheRef.current     = { studded: make(true), plain: make(false) };
      cacheSizeRef.current = { w, h };
    };

    img.onload = () => buildCache(canvas.width, canvas.height);
    if (img.complete && img.naturalWidth > 0) buildCache(canvas.width, canvas.height);

    const applyStreakClip = (targetCtx, cw, ch, bandX, bandY, halfWidth) => {
      const cols   = Math.ceil(cw / gridSize);
      const rows   = Math.ceil(ch / gridSize);
      const jitter = gridSize * edgeJitter;
      targetCtx.beginPath();
      for (let iy = 0; iy <= rows; iy++) {
        for (let ix = 0; ix <= cols; ix++) {
          const bcx  = (ix + 0.5) * gridSize;
          const bcy  = (iy + 0.5) * gridSize;
          const perp = Math.abs((bcx - bandX) * (-sinA) + (bcy - bandY) * cosA);
          const noise = (hash2(ix, iy) - 0.5) * jitter;
          if (perp <= halfWidth + noise)
            targetCtx.rect(ix * gridSize, iy * gridSize, gridSize, gridSize);
        }
      }
    };

    const tick = () => {
      const { hoverPos: hp, isActive: act } = liveRef.current;

      hv += ((act ? 1 : 0) - hv) * hoverSpeed;
      if (Math.abs(hv - (act ? 1 : 0)) < 0.001) hv = act ? 1 : 0;

      if (hv < 0.001 && !act) {
        hv = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = null;
        return;
      }

      if (hp?.active) {
        spr.vx = (spr.vx + (hp.x - spr.x) * springStiffness) * springDamping;
        spr.vy = (spr.vy + (hp.y - spr.y) * springStiffness) * springDamping;
        spr.x += spr.vx;
        spr.y += spr.vy;
      }

      const w = canvas.width;
      const h = canvas.height;

      const { w: cw, h: ch } = cacheSizeRef.current;
      if (w !== cw || h !== ch) buildCache(w, h);

      const cache = cacheRef.current;
      if (!cache.studded) { rafRef.current = requestAnimationFrame(tick); return; }

      if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }

      offCtx.clearRect(0, 0, w, h);
      offCtx.drawImage(cache.studded, 0, 0);

      if (hv > 0.002) {
        const bandX = (spr.x + 0.5) * w;
        const bandY = (spr.y + 0.5) * h;

        for (const { relWidth, quality } of innerZones) {
          const halfWidth = relWidth * w * hv;
          if (halfWidth < 1) continue;

          offCtx.save();
          applyStreakClip(offCtx, w, h, bandX, bandY, halfWidth);
          offCtx.clip();

          if (quality === "image") {
            offCtx.globalCompositeOperation = "destination-out";
            offCtx.fillStyle = "rgba(0,0,0,1)";
            offCtx.fillRect(0, 0, w, h);
            offCtx.globalCompositeOperation = "source-over";
          } else {
            offCtx.drawImage(cache[quality], 0, 0);
          }

          offCtx.restore();
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = hv;
      ctx.drawImage(off, 0, 0);
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(tick);
    };

    restartRef.current = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc, configKey]);

  useEffect(() => {
    if (isActive && restartRef.current) restartRef.current();
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "absolute",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex,
        borderRadius:  "9px",
      }}
    />
  );
};

export default LegoStreakCanvas;
