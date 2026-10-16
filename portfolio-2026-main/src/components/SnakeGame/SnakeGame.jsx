import { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import styles from "./SnakeGame.module.css";

const CELL = 10;
const TICK_MS = 140;

const LIGHT = {
  bg:       "#ffffff",
  grid:     "#EBEBEB",
  snake:    "#00A084",
  snakeHead:"#007A65",
  food:     "#C0392B",
  text:     "#00A084",
  overlay:  "rgba(255,255,255,0.90)",
};

const DARK = {
  bg:       "#0D0D0D",
  grid:     "#1A1A1A",
  snake:    "#C0392B",
  snakeHead:"#8B0000",
  food:     "#00A084",
  text:     "#C0392B",
  overlay:  "rgba(13,13,13,0.88)",
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function spawnFood(snake, cols, rows) {
  let pos;
  do {
    pos = { x: randInt(0, cols), y: randInt(0, rows) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const canvasRef  = useRef(null);
  const stateRef   = useRef(null);
  const rafRef     = useRef(null);
  const lastTickRef = useRef(0);
  const visibleRef  = useRef(false);
  const { isDark } = useTheme();
  const colorsRef  = useRef(LIGHT);

  useEffect(() => { colorsRef.current = isDark ? DARK : LIGHT; }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  || canvas.offsetWidth  || 94;
      canvas.height = rect.height || canvas.offsetHeight || 459;
      initGame();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Pause RAF when scrolled off screen
    const io = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { rootMargin: "200px" }
    );
    io.observe(canvas);

    const onKey = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (!s.alive) { initGame(); return; }
      const map = {
        ArrowUp:    { x: 0,  y: -1 },
        ArrowDown:  { x: 0,  y:  1 },
        ArrowLeft:  { x: -1, y:  0 },
        ArrowRight: { x: 1,  y:  0 },
        w: { x: 0,  y: -1 },
        s: { x: 0,  y:  1 },
        a: { x: -1, y:  0 },
        d: { x: 1,  y:  0 },
      };
      const nd = map[e.key];
      if (!nd) return;
      // Prevent reversing
      if (nd.x === -s.dir.x && nd.y === -s.dir.y) return;
      s.nextDir = nd;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))
        e.preventDefault();
    };
    window.addEventListener("keydown", onKey);

    // Swipe support
    let touchStart = null;
    const onTouchStart = (e) => { touchStart = e.touches[0]; };
    const onTouchEnd = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (!s.alive) { initGame(); return; }
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.clientX;
      const dy = e.changedTouches[0].clientY - touchStart.clientY;
      touchStart = null;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      let nd;
      if (Math.abs(dx) > Math.abs(dy)) nd = dx > 0 ? { x:1,y:0 } : { x:-1,y:0 };
      else                              nd = dy > 0 ? { x:0,y:1 } : { x:0,y:-1 };
      if (nd.x === -s.dir.x && nd.y === -s.dir.y) return;
      s.nextDir = nd;
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend",   onTouchEnd);
    canvas.addEventListener("click", () => {
      if (stateRef.current && !stateRef.current.alive) initGame();
    });

    startLoop();

    return () => {
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend",   onTouchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initGame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cols = Math.floor(canvas.width  / CELL);
    const rows = Math.floor(canvas.height / CELL);
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    const snake = [
      { x: midX, y: midY },
      { x: midX, y: midY + 1 },
      { x: midX, y: midY + 2 },
    ];
    stateRef.current = {
      snake,
      dir:     { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      food:    spawnFood(snake, cols, rows),
      score:   0,
      alive:   true,
      cols,
      rows,
    };
  }

  function startLoop() {
    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!visibleRef.current) return;
      if (ts - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = ts;
        tick();
      }
      draw();
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function tick() {
    const s = stateRef.current;
    if (!s || !s.alive) return;

    s.dir = s.nextDir;
    const head = s.snake[0];
    const next = {
      x: (head.x + s.dir.x + s.cols) % s.cols,
      y: (head.y + s.dir.y + s.rows) % s.rows,
    };

    // Self collision
    if (s.snake.some(seg => seg.x === next.x && seg.y === next.y)) {
      s.alive = false;
      return;
    }

    s.snake.unshift(next);

    if (next.x === s.food.x && next.y === s.food.y) {
      s.score++;
      s.food = spawnFood(s.snake, s.cols, s.rows);
    } else {
      s.snake.pop();
    }
  }

  function draw() {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return;
    const ctx = canvas.getContext("2d");
    const C = colorsRef.current;
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= s.cols; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
    }
    for (let y = 0; y <= s.rows; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
    }

    // Food — pulsing dot
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);
    const fr = CELL * 0.32 + pulse * CELL * 0.08;
    ctx.fillStyle = C.food;
    ctx.beginPath();
    ctx.arc(
      s.food.x * CELL + CELL / 2,
      s.food.y * CELL + CELL / 2,
      fr, 0, Math.PI * 2
    );
    ctx.fill();

    // Snake body
    s.snake.forEach((seg, i) => {
      const r = Math.max(1, CELL * 0.18);
      ctx.fillStyle = i === 0 ? C.snakeHead : C.snake;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * CELL + 1,
        seg.y * CELL + 1,
        CELL - 2,
        CELL - 2,
        r
      );
      ctx.fill();
    });

    // Score
    ctx.fillStyle = C.text;
    ctx.font = `bold ${CELL - 1}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(s.score, W / 2, CELL - 1);

    // Game over overlay
    if (!s.alive) {
      ctx.fillStyle = C.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.text;
      ctx.font = `bold ${CELL + 1}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("GAME", W / 2, H / 2 - CELL * 2);
      ctx.fillText("OVER", W / 2, H / 2 - CELL * 0.5);
      ctx.font = `${CELL - 2}px monospace`;
      ctx.fillText(`${s.score} pts`, W / 2, H / 2 + CELL * 1.5);
      ctx.fillText("tap", W / 2, H / 2 + CELL * 3);
    }
  }

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
