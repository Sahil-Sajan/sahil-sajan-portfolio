import { useRef, useEffect } from "react";

const TWO_PI = Math.PI * 2;
const DEFAULT_LA = Math.atan2(-0.707, -0.707);
const clamp255 = (v) => (v > 255 ? 255 : v < 0 ? 0 : v | 0);

const drawBrick = (ctx, r, g, b, bx, by, bw, bh, cornerR, studR, la) => {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const lx = Math.cos(la);
  const ly = Math.sin(la);

  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, cornerR);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, cornerR);
  ctx.clip();

  const bevel = ctx.createLinearGradient(
    cx + lx * bw * 0.7, cy + ly * bh * 0.7,
    cx - lx * bw * 0.7, cy - ly * bh * 0.7
  );
  bevel.addColorStop(0,   "rgba(255,255,255,0.16)");
  bevel.addColorStop(0.4, "rgba(255,255,255,0)");
  bevel.addColorStop(0.6, "rgba(0,0,0,0)");
  bevel.addColorStop(1,   "rgba(0,0,0,0.28)");
  ctx.fillStyle = bevel;
  ctx.fillRect(bx, by, bw, bh);

  if (studR >= 1.5) {
    const shCx = cx - lx * studR * 0.34;
    const shCy = cy - ly * studR * 0.34;
    const shadow = ctx.createRadialGradient(shCx, shCy, studR * 0.55, shCx, shCy, studR * 1.25);
    shadow.addColorStop(0, "rgba(0,0,0,0.30)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.fillRect(bx, by, bw, bh);
  }

  ctx.restore();

  if (studR < 1.5) return;

  ctx.beginPath();
  ctx.arc(cx, cy, studR, 0, TWO_PI);
  ctx.fillStyle = `rgb(${clamp255(r + 9)},${clamp255(g + 9)},${clamp255(b + 9)})`;
  ctx.fill();

  const rim = ctx.createConicGradient(la, cx, cy);
  rim.addColorStop(0,   "rgba(255,255,255,0.68)");
  rim.addColorStop(0.3, "rgba(255,255,255,0)");
  rim.addColorStop(0.5, "rgba(0,0,0,0.28)");
  rim.addColorStop(0.7, "rgba(255,255,255,0)");
  rim.addColorStop(1,   "rgba(255,255,255,0.68)");
  ctx.strokeStyle = rim;
  ctx.lineWidth   = Math.max(0.7, studR * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, studR * 0.93, 0, TWO_PI);
  ctx.stroke();
};

const buildPlate = (w, h, r, g, b, gridSize, brickGap) => {
  const c      = document.createElement("canvas");
  c.width      = w;
  c.height     = h;
  const ctx    = c.getContext("2d");
  const bw     = gridSize - brickGap;
  const bh     = gridSize - brickGap;
  const studR  = bw * 0.28;
  const cornerR = Math.max(0.5, bw * 0.10);
  const cols   = Math.ceil(w / gridSize);
  const rows   = Math.ceil(h / gridSize);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      drawBrick(ctx, r, g, b, col * gridSize, row * gridSize, bw, bh, cornerR, studR, DEFAULT_LA);
    }
  }
  return c;
};

export default function LegoBgCanvas({
  color    = "#00A084",
  gridSize = 20,
  brickGap = 2,
  zIndex   = 0,
  style,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const hex = color.replace("#", "");
    const r   = parseInt(hex.substring(0, 2), 16);
    const g   = parseInt(hex.substring(2, 4), 16);
    const b   = parseInt(hex.substring(4, 6), 16);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width  = w;
      canvas.height = h;
      ctx.drawImage(buildPlate(w, h, r, g, b, gridSize, brickGap), 0, 0);
    };

    let rafId = requestAnimationFrame(draw);
    const ro  = new ResizeObserver(draw);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [color, gridSize, brickGap]);

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
