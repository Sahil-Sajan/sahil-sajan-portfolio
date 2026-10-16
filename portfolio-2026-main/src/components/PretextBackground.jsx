import { useRef, useEffect } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";

const FILLER_TEXT =
  "the architecture of forgotten systems dissolves into recursive patterns where each iteration reveals another layer of emergent complexity spiraling through networks of interconnected nodes that pulse with the quiet energy of dormant processes awaiting their moment of activation in the grand orchestration of digital ecosystems that span continents and timeframes beyond human comprehension while the underlying substrate hums with potential energy stored in magnetic fields and silicon lattices arranged with atomic precision to form the backbone of civilization's nervous system carrying thoughts and dreams encoded as electromagnetic whispers across fiber optic highways that stretch beneath oceans and through mountains connecting minds separated by vast distances yet united by shared protocols and mutual understanding of the fundamental principles that govern information flow through chaotic systems tending toward order through the application of elegant algorithms refined over decades of collective human ingenuity applied to problems both mundane and extraordinary from sorting lists to simulating universes each solution building upon the last in an endless tower of abstraction reaching ever higher toward some asymptotic ideal of computational perfection that may forever remain just beyond our grasp yet whose pursuit defines the very essence of our technological endeavor as we push boundaries explore frontiers and discover new territories in the infinite landscape of mathematical possibility where every theorem proved opens doorways to unexplored realms of knowledge and every bug fixed brings us one step closer to reliable systems that serve humanity with quiet dignity and unwavering precision through seasons of change and cycles of innovation that reshape our world in ways both subtle and profound ";

const FONT = "13px sans-serif";
const LINE_HEIGHT = 16;
const BLOCK = 8; // displacement grid size

function hash(x, y) {
  return ((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1 + 1) % 1;
}

export default function PretextBackground({ hoverPos, isActive }) {
  const canvasRef = useRef(null);
  const liveRef = useRef({ hoverPos, isActive });
  liveRef.current = { hoverPos, isActive };
  const rafRef = useRef(null);
  const restartRef = useRef(null);
  const baseImageRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = 0, h = 0;
    let hoverVal = 0;
    let smx = 0, smy = 0;

    const renderBaseText = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;

      canvas.width = w;
      canvas.height = h;

      // Use pretext to lay out the text
      const linesNeeded = Math.ceil(h / LINE_HEIGHT) + 2;
      let text = FILLER_TEXT;
      let lines;
      while (true) {
        const prepared = prepareWithSegments(text, FONT);
        const result = layoutWithLines(prepared, w, LINE_HEIGHT);
        if (result.lines.length >= linesNeeded) {
          lines = result.lines.slice(0, linesNeeded);
          break;
        }
        text += FILLER_TEXT;
      }

      // Draw text onto an offscreen canvas to use as source
      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext("2d");
      offCtx.font = FONT;
      offCtx.fillStyle = "#4EDF88";
      offCtx.textBaseline = "top";
      for (let i = 0; i < lines.length; i++) {
        offCtx.fillText(lines[i].text, 0, i * LINE_HEIGHT);
      }
      baseImageRef.current = offCtx.getImageData(0, 0, w, h);

      // Draw initial undistorted text
      ctx.putImageData(baseImageRef.current, 0, 0);
    };

    renderBaseText();

    const ro = new ResizeObserver(() => {
      renderBaseText();
    });
    ro.observe(canvas);

    const tick = () => {
      const { hoverPos: hp, isActive: act } = liveRef.current;

      hoverVal += ((act ? 1.0 : 0.0) - hoverVal) * 0.08;
      if (Math.abs(hoverVal - (act ? 1.0 : 0.0)) < 0.002) hoverVal = act ? 1.0 : 0.0;

      // When fully idle, draw base image and stop
      if (hoverVal < 0.002 && !act) {
        hoverVal = 0;
        if (baseImageRef.current) {
          ctx.putImageData(baseImageRef.current, 0, 0);
        }
        rafRef.current = null;
        return;
      }

      // Smooth cursor
      if (hp?.active) {
        smx += (hp.x - smx) * 0.15;
        smy += (hp.y - smy) * 0.15;
      }

      if (!baseImageRef.current || w === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const src = baseImageRef.current.data;
      const out = ctx.createImageData(w, h);
      const dst = out.data;

      // Cursor in pixel space
      const cx = (smx + 0.5) * w;
      const cy = (smy + 0.5) * h;
      const radius = Math.max(w, h) * 0.55;

      for (let by = 0; by < h; by += BLOCK) {
        for (let bx = 0; bx < w; bx += BLOCK) {
          // Distance from block center to cursor
          const bcx = bx + BLOCK * 0.5;
          const bcy = by + BLOCK * 0.5;
          const dx = bcx - cx;
          const dy = bcy - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const t = Math.max(0, 1 - dist / radius);
          const falloff = t * t * t * hoverVal;

          // Per-block random displacement
          const bix = (bx / BLOCK) | 0;
          const biy = (by / BLOCK) | 0;
          const rawDx = (hash(bix + 1.31, biy + 2.74) - 0.5) * 2 * 6 * falloff;
          const rawDy = (hash(bix + 4.07, biy + 0.93) - 0.5) * 2 * 3 * falloff;
          const sdx = Math.round(rawDx) * BLOCK;
          const sdy = Math.round(rawDy) * BLOCK;

          // Copy block from displaced source
          for (let py = by; py < by + BLOCK && py < h; py++) {
            for (let px = bx; px < bx + BLOCK && px < w; px++) {
              const sx = px + sdx;
              const sy = py + sdy;
              const di = (py * w + px) * 4;
              if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                const si = (sy * w + sx) * 4;
                dst[di] = src[si];
                dst[di + 1] = src[si + 1];
                dst[di + 2] = src[si + 2];
                dst[di + 3] = src[si + 3];
              } else {
                dst[di + 3] = 0;
              }
            }
          }
        }
      }

      ctx.putImageData(out, 0, 0);
      rafRef.current = requestAnimationFrame(tick);
    };

    restartRef.current = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ro.disconnect();
    };
  }, []);

  // Restart loop when hover begins
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
        zIndex: 0,
        borderRadius: "6px",
      }}
    />
  );
}
