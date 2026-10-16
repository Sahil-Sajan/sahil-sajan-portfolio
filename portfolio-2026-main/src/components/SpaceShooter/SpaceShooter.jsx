import { useEffect, useRef, useCallback } from "react";
import styles from "./SpaceShooter.module.css";
import { useTheme } from "../../context/ThemeContext";

const playBlast = (() => {
  let ctx = null;
  return () => {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Noise burst
      const bufLen = ctx.sampleRate * 0.12;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(900, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.12);
      noiseFilter.Q.value = 0.8;

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.12);

      // Pitched thump
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.12, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (_) {}
  };
})();

const COLORS = {
  bg: "#ffffff",
  star: "#c8c8c8",
  player: "#444444",
  playerAccent: "#222",
  bullet: "#00A084",
  bulletGlow: "#4EDF88",
  enemy: "#888",
  enemyAccent: "#aaa",
  explosion: ["#00A084", "#4EDF88", "#333", "#aaa"],
  text: "#aaa",
  scoreColor: "#00A084",
};

const DARK_COLORS = {
  bg: "#0D0D0D",
  star: "#2A2A2A",
  player: "#C0392B",
  playerAccent: "#8B0000",
  bullet: "#C0392B",
  bulletGlow: "#E74C3C",
  enemy: "#555",
  enemyAccent: "#777",
  explosion: ["#C0392B", "#E74C3C", "#333", "#777"],
  text: "#666",
  scoreColor: "#C0392B",
};

export default function SpaceShooter() {
  const { isDark } = useTheme();
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const pausedRef = useRef(true);   // starts paused — waits for scroll + hover
  const inViewRef = useRef(false);
  const hoveredRef = useRef(false);
  const colorsRef = useRef(COLORS);

  useEffect(() => {
    colorsRef.current = isDark ? DARK_COLORS : COLORS;
  }, [isDark]);

  const initState = useCallback((w, h) => {
    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.4 + 0.15,
    }));

    return {
      w, h,
      player: { x: w / 2, y: h - 28, w: 14, h: 12 },
      bullets: [],
      enemies: [],
      explosions: [],
      stars,
      score: 0,
      lives: 3,
      dead: false,
      shootTimer: 0,
      enemyTimer: 0,
      enemyInterval: 120,
      mouseX: w / 2,
      frame: 0,
    };
  }, []);

  const drawPixelShip = useCallback((ctx, x, y, w, h, color, accent) => {
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x - w * 0.15, y - h * 0.4, w * 0.3, h * 0.8);
    // Wings
    ctx.fillRect(x - w * 0.5, y, w, h * 0.35);
    ctx.fillRect(x - w * 0.35, y - h * 0.15, w * 0.7, h * 0.2);
    // Nose
    ctx.fillStyle = accent;
    ctx.fillRect(x - w * 0.08, y - h * 0.65, w * 0.16, h * 0.28);
    // Engine glow
    ctx.fillStyle = colorsRef.current.bullet;
    ctx.fillRect(x - w * 0.07, y + h * 0.32, w * 0.14, h * 0.18);
  }, []);

  const drawEnemyShip = useCallback((ctx, x, y, w, h, color) => {
    // Inverted ship
    ctx.fillStyle = color;
    ctx.fillRect(x - w * 0.15, y - h * 0.3, w * 0.3, h * 0.6);
    ctx.fillRect(x - w * 0.5, y - h * 0.35, w, h * 0.3);
    ctx.fillRect(x - w * 0.3, y - h * 0.1, w * 0.6, h * 0.15);
    ctx.fillStyle = colorsRef.current.enemy;
    ctx.fillRect(x - w * 0.08, y + h * 0.28, w * 0.16, h * 0.2);
  }, []);

  const spawnEnemy = useCallback((state) => {
    const ew = 10, eh = 9;
    state.enemies.push({
      x: ew + Math.random() * (state.w - ew * 2),
      y: -eh,
      w: ew, h: eh,
      speed: 0.5 + Math.random() * 0.6 + state.score * 0.003,
      wobble: Math.random() * Math.PI * 2,
    });
  }, []);

  const restart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    stateRef.current = initState(canvas.width, canvas.height);
  }, [initState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const r = container.getBoundingClientRect();
      canvas.width = Math.floor(r.width);
      canvas.height = Math.floor(r.height);
      stateRef.current = initState(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Pause logic
    const updatePause = () => {
      pausedRef.current = !(inViewRef.current && hoveredRef.current);
    };

    // IntersectionObserver — start only when section is visible
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        updatePause();
      },
      { threshold: 0.3 }
    );
    io.observe(container);

    // Hover pause/resume
    const onMouseEnter = () => {
      hoveredRef.current = true;
      updatePause();
    };
    const onMouseLeave = () => {
      hoveredRef.current = false;
      updatePause();
    };

    // Mouse tracking
    const onMouseMove = (e) => {
      if (!stateRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      stateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
    };
    const onTouch = (e) => {
      if (!stateRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      stateRef.current.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
    };
    const onClick = () => {
      if (stateRef.current?.dead) restart();
    };

    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    canvas.addEventListener("click", onClick);

    const ctx = canvas.getContext("2d");

    const tick = () => {
      const s = stateRef.current;
      if (!s) { rafRef.current = requestAnimationFrame(tick); return; }

      const paused = pausedRef.current;
      const { w, h } = s;

      // — Background —
      ctx.fillStyle = colorsRef.current.bg;
      ctx.fillRect(0, 0, w, h);

      // — Stars (always scroll, even when paused) —
      s.stars.forEach((star) => {
        if (!paused) {
          star.y += star.speed;
          if (star.y > h) { star.y = 0; star.x = Math.random() * w; }
        }
        ctx.fillStyle = colorsRef.current.star;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // — Paused overlay —
      if (paused && !s.dead) {
        // Draw frozen player
        drawPixelShip(ctx, s.player.x, s.player.y, s.player.w, s.player.h, colorsRef.current.player, colorsRef.current.playerAccent);
        // Pause text
        const fs = Math.max(7, w * 0.11);
        ctx.font = `bold ${fs}px monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = colorsRef.current.text;
        ctx.fillText(!inViewRef.current ? "scroll" : "hover", w / 2, h / 2 - fs * 0.4);
        ctx.fillText(!inViewRef.current ? "to play" : "to play", w / 2, h / 2 + fs * 0.9);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!paused) s.frame++;

      if (!s.dead) {
        // — Move player toward mouse —
        const targetX = Math.max(s.player.w / 2, Math.min(w - s.player.w / 2, s.mouseX));
        s.player.x += (targetX - s.player.x) * 0.12;

        // — Auto shoot —
        s.shootTimer++;
        if (s.shootTimer >= 22) {
          s.shootTimer = 0;
          s.bullets.push({ x: s.player.x, y: s.player.y - s.player.h, speed: 5 });
        }

        // — Spawn enemies —
        s.enemyTimer++;
        if (s.enemyTimer >= s.enemyInterval) {
          s.enemyTimer = 0;
          s.enemyInterval = Math.max(40, 120 - s.score * 0.5);
          spawnEnemy(s);
        }

        // — Move bullets —
        s.bullets = s.bullets.filter((b) => {
          b.y -= b.speed;
          return b.y > -4;
        });

        // — Move enemies —
        s.enemies = s.enemies.filter((en) => {
          en.wobble += 0.03;
          en.x += Math.sin(en.wobble) * 0.5;
          en.y += en.speed;

          // Hit player
          if (
            Math.abs(en.x - s.player.x) < (en.w + s.player.w) * 0.5 &&
            Math.abs(en.y - s.player.y) < (en.h + s.player.h) * 0.5
          ) {
            s.dead = true;
            return false;
          }
          return en.y < h + en.h;
        });

        // — Bullet-enemy collision —
        s.bullets = s.bullets.filter((b) => {
          let hit = false;
          s.enemies = s.enemies.filter((en) => {
            if (
              !hit &&
              Math.abs(b.x - en.x) < en.w * 0.9 &&
              Math.abs(b.y - en.y) < en.h * 1.2
            ) {
              hit = true;
              s.score++;
              playBlast();
              for (let i = 0; i < 5; i++) {
                s.explosions.push({
                  x: en.x, y: en.y,
                  vx: (Math.random() - 0.5) * 2.5,
                  vy: (Math.random() - 0.5) * 2.5,
                  life: 1,
                  color: colorsRef.current.explosion[Math.floor(Math.random() * colorsRef.current.explosion.length)],
                  r: Math.random() * 2 + 1,
                });
              }
              return false;
            }
            return true;
          });
          return !hit;
        });

        // — Explosions —
        s.explosions = s.explosions.filter((p) => {
          p.x += p.vx; p.y += p.vy; p.life -= 0.06;
          if (p.life <= 0) return false;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          return true;
        });

        // — Draw bullets —
        s.bullets.forEach((b) => {
          ctx.shadowColor = colorsRef.current.bulletGlow;
          ctx.shadowBlur = 6;
          ctx.fillStyle = colorsRef.current.bullet;
          ctx.fillRect(b.x - 1, b.y - 5, 2, 8);
          ctx.shadowBlur = 0;
        });

        // — Draw enemies —
        s.enemies.forEach((en) => {
          drawEnemyShip(ctx, en.x, en.y, en.w, en.h, colorsRef.current.enemy);
        });

        // — Draw player —
        drawPixelShip(ctx, s.player.x, s.player.y, s.player.w, s.player.h, colorsRef.current.player, colorsRef.current.playerAccent);

        // — Score —
        ctx.fillStyle = colorsRef.current.scoreColor;
        ctx.font = `bold ${Math.max(7, w * 0.1)}px monospace`;
        ctx.textAlign = "left";
        ctx.fillText(s.score, 5, 14);

      } else {
        // — Game Over screen —
        ctx.fillStyle = colorsRef.current.bg;
        ctx.fillRect(0, 0, w, h);
        s.stars.forEach((star) => {
          ctx.fillStyle = colorsRef.current.star;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
        });

        const fs = Math.max(8, w * 0.13);
        ctx.font = `bold ${fs}px monospace`;
        ctx.textAlign = "center";

        ctx.fillStyle = colorsRef.current.bullet;
        ctx.fillText("GAME", w / 2, h / 2 - fs * 1.2);
        ctx.fillText("OVER", w / 2, h / 2);

        ctx.fillStyle = colorsRef.current.text;
        ctx.font = `${Math.max(6, w * 0.1)}px monospace`;
        ctx.fillText(`${s.score}`, w / 2, h / 2 + fs * 1.4);

        // Blink "tap"
        if (Math.floor(s.frame / 30) % 2 === 0) {
          ctx.fillStyle = colorsRef.current.text;
          ctx.font = `${Math.max(5, w * 0.08)}px monospace`;
          ctx.fillText("tap", w / 2, h / 2 + fs * 2.4);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("click", onClick);
    };
  }, [initState, spawnEnemy, drawPixelShip, drawEnemyShip, restart]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
