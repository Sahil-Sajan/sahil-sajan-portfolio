import { useRef, useEffect } from "react";

const BAND_COS = Math.cos(-1);
const BAND_SIN = Math.sin(-1);

// imgSrc: URL string (used by cards)
// sourceCanvas: offscreen HTMLCanvasElement (used when caller composites its own scene)
export default function PixelHoverCanvas({ hoverPos, isActive, imgSrc, sourceCanvas, refreshSource, zIndex = 3 }) {
  const canvasRef  = useRef(null);
  const liveRef    = useRef({ hoverPos, isActive });
  liveRef.current  = { hoverPos, isActive };
  const rafRef     = useRef(null);
  const restartRef = useRef(null);
  const sourceRef        = useRef(sourceCanvas ?? null);
  sourceRef.current      = sourceCanvas ?? null;
  const refreshSourceRef = useRef(refreshSource ?? null);
  refreshSourceRef.current = refreshSource ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const tmp    = document.createElement("canvas");
    const tmpCtx = tmp.getContext("2d");
    tmpCtx.imageSmoothingEnabled = false;

    // For URL-based source, load an Image. For canvas source, use the ref directly each frame.
    let img = null;
    if (imgSrc) {
      img = new Image();
      img.src = imgSrc;
    }

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

    const off    = document.createElement("canvas");
    const offCtx = off.getContext("2d");

    const applyBandClip = (targetCtx, bandX, bandY, halfWidth) => {
      const len = Math.hypot(canvas.width, canvas.height) * 2;
      const nx = -BAND_SIN;
      const ny =  BAND_COS;
      targetCtx.beginPath();
      targetCtx.moveTo(bandX + nx * halfWidth - BAND_COS * len, bandY + ny * halfWidth - BAND_SIN * len);
      targetCtx.lineTo(bandX + nx * halfWidth + BAND_COS * len, bandY + ny * halfWidth + BAND_SIN * len);
      targetCtx.lineTo(bandX - nx * halfWidth + BAND_COS * len, bandY - ny * halfWidth + BAND_SIN * len);
      targetCtx.lineTo(bandX - nx * halfWidth - BAND_COS * len, bandY - ny * halfWidth - BAND_SIN * len);
      targetCtx.closePath();
    };

    const INNER_ZONES = [
      { relWidth: 0.52, blockSize: 6 },
      { relWidth: 0.41, blockSize: 4 },
      { relWidth: 0.33, blockSize: 2 },
      { relWidth: 0.28, blockSize: 1 },
    ];

    const tick = () => {
      // Repaint composite source each frame so scroll/parallax position is current
      refreshSourceRef.current?.();

      const { hoverPos: hp, isActive: act } = liveRef.current;

      const hvTarget = act ? 1 : 0;
      hv += (hvTarget - hv) * (act ? 0.12 : 0.08);
      if (Math.abs(hv - hvTarget) < 0.001) hv = hvTarget;

      if (hv < 0.001 && !act) {
        hv = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = null;
        return;
      }

      if (hp?.active) {
        spr.vx = (spr.vx + (hp.x - spr.x) * 0.12) * 0.72;
        spr.vy = (spr.vy + (hp.y - spr.y) * 0.12) * 0.72;
        spr.x += spr.vx;
        spr.y += spr.vy;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Resolve draw source: prefer sourceCanvas prop, fall back to loaded img
      const drawSrc = sourceRef.current ?? img;
      const srcReady = drawSrc instanceof HTMLCanvasElement
        ? drawSrc.width > 0 && drawSrc.height > 0
        : drawSrc?.complete && drawSrc.naturalWidth > 0;

      if (hv > 0.002 && srcReady) {
        const bandX = (spr.x + 0.5) * w;
        const bandY = (spr.y + 0.5) * h;

        if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
        offCtx.clearRect(0, 0, w, h);
        offCtx.imageSmoothingEnabled = false;

        const swB = Math.max(1, Math.floor(w / 4));
        const shB = Math.max(1, Math.floor(h / 4));
        if (tmp.width !== swB) tmp.width = swB;
        if (tmp.height !== shB) tmp.height = shB;
        tmpCtx.drawImage(drawSrc, 0, 0, swB, shB);
        offCtx.drawImage(tmp, 0, 0, swB, shB, 0, 0, w, h);

        for (const { relWidth, blockSize } of INNER_ZONES) {
          const halfWidth = relWidth * w * hv;
          if (halfWidth < 1) continue;
          const sw = Math.max(1, Math.floor(w / blockSize));
          const sh = Math.max(1, Math.floor(h / blockSize));
          if (tmp.width  !== sw) tmp.width  = sw;
          if (tmp.height !== sh) tmp.height = sh;
          tmpCtx.drawImage(drawSrc, 0, 0, sw, sh);

          offCtx.save();
          applyBandClip(offCtx, bandX, bandY, halfWidth);
          offCtx.clip();
          offCtx.drawImage(tmp, 0, 0, sw, sh, 0, 0, w, h);
          offCtx.restore();
        }

        ctx.globalAlpha = hv;
        ctx.drawImage(off, 0, 0);
        ctx.globalAlpha = 1;
      }

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
  }, [imgSrc]);

  useEffect(() => {
    if (isActive && restartRef.current) restartRef.current();
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex,
        borderRadius: "9px",
      }}
    />
  );
}
