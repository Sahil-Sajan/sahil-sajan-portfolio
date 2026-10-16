import {
  useState,
  useRef,
  forwardRef,
  useMemo,
  useCallback,
  useEffect,
  memo,
} from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { useButtonSounds } from "../hooks/useButtonSounds";
import styles from "./Home.module.css";
import Clock from "../components/Clock";
import AnimatedArrow from "../components/AnimatedArrow";
import AnimatedDownwardArrow from "../components/AnimatedDownwardArrow";
import Metric from "../components/Metric";
import Hero from "../components/Hero/Hero";
import AnimatedMan from "../components/AnimatedMan";
import GrassOverlay from "../components/GrassOverlay";
import LegoStreakCanvas from "../components/LegoStreakCanvas";
import SpotifyPlayer from "../components/SpotifyPlayer/SpotifyPlayer";
import { useCardCount } from "../hooks/useCardCount";


const BASE_PATH = "";

const LEGO_LIGHT_ANGLE = Math.atan2(-0.707, -0.707);
const legoClamp = (v) => (v > 255 ? 255 : v < 0 ? 0 : v | 0);
const hash2 = (ix, iy) => ((Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453) % 1 + 1) % 1;

const LEGO_GRID = 27;
const LEGO_REVEAL_MS = 1200;
const LEGO_BAND_FRAC = 0.30;
const LEGO_FADE_MS = 350;
const LEGO_JITTER = LEGO_GRID * 0.65;

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
  bevel.addColorStop(0, "rgba(255,255,255,0.15)");
  bevel.addColorStop(0.35, "rgba(255,255,255,0)");
  bevel.addColorStop(0.65, "rgba(0,0,0,0)");
  bevel.addColorStop(1, "rgba(0,0,0,0.18)");
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
  rim.addColorStop(0, "rgba(255,255,255,0.58)");
  rim.addColorStop(0.3, "rgba(255,255,255,0)");
  rim.addColorStop(0.5, "rgba(0,0,0,0.30)");
  rim.addColorStop(0.7, "rgba(255,255,255,0)");
  rim.addColorStop(1, "rgba(255,255,255,0.58)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(0.7, studR * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, studR * 0.93, 0, Math.PI * 2);
  ctx.stroke();
};

const buildLegoCache = (img, w, h) => {
  const natW = img.naturalWidth, natH = img.naturalHeight;
  // Replicate object-fit:cover / object-position:center relative to canvas (container) size
  const scale = Math.max(w / natW, h / natH);
  const sx = (natW - w / scale) / 2;
  const sy = (natH - h / scale) / 2;
  const sw = w / scale, sh = h / scale;

  const cols = Math.ceil(w / LEGO_GRID);
  const rows = Math.ceil(h / LEGO_GRID);
  const samp = document.createElement("canvas");
  samp.width = cols; samp.height = rows;
  const sCtx = samp.getContext("2d");
  sCtx.imageSmoothingEnabled = true;
  sCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  const { data } = sCtx.getImageData(0, 0, cols, rows);

  const studR = LEGO_GRID * 0.30;
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

const applySquareRadialClip = (ctx, w, h, threshold) => {
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
      if (dist < threshold + (hash2(ix, iy) - 0.5) * LEGO_JITTER)
        ctx.rect(ix * LEGO_GRID, iy * LEGO_GRID, LEGO_GRID, LEGO_GRID);
    }
  }
};

const PROJECTS_JSON_URL = `${BASE_PATH}/data/projects.json`;

const HomeCard = memo(
  ({ index, containerHover, deckHovered, hasDesign = true }) => {
    const cardRef = useRef(null);
    const [hasEntered, setHasEntered] = useState(false);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0, active: false });

    const frontImage = `/cards/card${index + 1}.webp`;
    const backImage = `/cards/cardBack.webp`;

    useGSAP(() => {
      if (!cardRef.current) return;

      let tl;

      if (hasDesign) {
        gsap.set(cardRef.current, { rotateY: 180, z: 0 });
      } else {
        gsap.set(cardRef.current, { rotateY: 0, z: 0 });
      }

      const buildAnimation = () => {
        tl = gsap.timeline({
          onComplete: () => {
            setHasEntered(true);
          },
        });

        if (hasDesign) {
          tl.fromTo(
            cardRef.current,
            { rotateY: 180, z: 0 },
            { z: 60, duration: 0.6, ease: "power2.out" },
            index * 0.15
          )
            .to(cardRef.current, {
              rotateY: 0,
              duration: 0.4,
              ease: "back.out(1.2)",
            })
            .to(
              cardRef.current,
              { z: 0, duration: 0.3, ease: "power2.in" },
              "-=0.2"
            );
        } else {
          setHasEntered(true);
        }

        return tl;
      };

      let hasPlayed = false;

      const trigger = ScrollTrigger.create({
        trigger: cardRef.current,
        start: "top 70%",
        end: "bottom top",
        once: true,
        onEnter: () => {
          if (hasPlayed) return;
          if (tl) tl.kill();
          tl = buildAnimation();
          hasPlayed = true;
        },
        onEnterBack: () => {
          if (hasPlayed) return;
          if (tl) tl.kill();
          tl = buildAnimation();
          hasPlayed = true;
        },
        invalidateOnRefresh: true,
      });

      return () => {
        if (tl) tl.kill();
        trigger.kill();
      };
    }, [index, hasDesign]);

    const handleMouseMove = (e) => {
      if (!hasEntered) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setHoverPos({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
        active: true,
      });
    };

    const dynamicStyle = useMemo(() => {
      if (!hasEntered) return {};

      let baseRotateY = 0;
      if (index === 0) baseRotateY = containerHover ? -15 : 0;
      if (index === 2) baseRotateY = containerHover ? 15 : 0;
      if (index === 3) baseRotateY = containerHover ? 28 : 0;
      if (index === 4) baseRotateY = containerHover ? -28 : 0;
      if (index === 5) baseRotateY = containerHover ? 36 : 0;
      if (index === 6) baseRotateY = containerHover ? -36 : 0;

      const activeDepth = index === 1 ? 30 : 18;
      const idleDepth = index === 1 ? 0 : -10;

      let rotateZ = 0;
      if (deckHovered) {
        if (index === 0) rotateZ = -6;
        if (index === 2) rotateZ = 6;
        if (index === 3) rotateZ = 12;
        if (index === 4) rotateZ = -12;
        if (index === 5) rotateZ = 18;
        if (index === 6) rotateZ = -18;
      }

      if (hoverPos.active) {
        return {
          transform: `perspective(1000px)
                    rotateY(${baseRotateY + hoverPos.x * 20}deg)
                    rotateX(${hoverPos.y * -20}deg)
                    rotateZ(${rotateZ}deg)
                    translateZ(${activeDepth}px)`,
          zIndex: index === 1 ? 10 : (7 - index) % 8,
          transition: "transform 0.1s ease-out, rotateZ 0.4s ease-out",
        };
      }

      return {
        transform: `perspective(1000px)
                  rotateY(${baseRotateY}deg)
                  rotateX(0deg)
                  rotateZ(${rotateZ}deg)
                  translateZ(${idleDepth}px)`,
        transition:
          "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), rotateZ 0.4s ease-out",
        zIndex: index === 1 ? 10 : (7 - index) % 8,
      };
    }, [hoverPos, containerHover, index, deckHovered, hasEntered]);

    return (
      <div
        className={styles.homeCard}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPos({ active: false })}
        style={{ zIndex: index === 1 ? 10 : (7 - index) % 8 }}
      >
        <div
          className={styles.homeCardInner}
          ref={cardRef}
          style={dynamicStyle}
        >
          {hasDesign ? (
            <>
              <div className={styles.homeCardFront}>
                <img src={frontImage} className={styles.cardImg} alt="" />
                <LegoStreakCanvas hoverPos={hoverPos} isActive={hoverPos.active} imgSrc={frontImage} config={{ gridSize: 18 }} />
                <div
                  className={styles.glimmer}
                  style={{
                    opacity: hoverPos.active ? 1 : 0,
                    background: `linear-gradient(
                    105deg,
                    transparent ${(0.5 - hoverPos.x) * 100 - 45}%,
                    rgba(255, 255, 255, 0.05) ${(0.5 - hoverPos.x) * 100 - 30
                      }%,
                    rgba(255, 255, 255, 0.4) ${(0.5 - hoverPos.x) * 100}%,
                    rgba(255, 255, 255, 0.05) ${(0.5 - hoverPos.x) * 100 + 30
                      }%,
                    transparent ${(0.5 - hoverPos.x) * 100 + 45}%
                  )`,
                  }}
                />
              </div>
              <div className={styles.homeCardBack}>
                <img src={backImage} className={styles.cardImg} alt="" />
              </div>
            </>
          ) : (
            <div className={styles.homeCardBlank}>
              <img src={backImage} className={styles.cardImg} alt="" />
              <div
                className={styles.glimmer}
                style={{
                  opacity: hoverPos.active ? 1 : 0,
                  background: `linear-gradient(
                  105deg,
                  transparent ${(0.5 - hoverPos.x) * 100 - 45}%,
                  rgba(255, 255, 255, 0.05) ${(0.5 - hoverPos.x) * 100 - 30
                    }%,
                  rgba(255, 255, 255, 0.4) ${(0.5 - hoverPos.x) * 100}%,
                  rgba(255, 255, 255, 0.05) ${(0.5 - hoverPos.x) * 100 + 30
                    }%,
                  transparent ${(0.5 - hoverPos.x) * 100 + 45}%
                )`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

const STAR_COUNT = 7;
const DEFAULT_COLORS = [
  "var(--light-off-teal)",
  "var(--off-teal)",
  "var(--dark-green)",
  "var(--off-black)",
  "var(--dark-green)",
  "var(--off-teal)",
  "var(--light-off-teal)",
];
const HOVER_COLOR_BANDS = [
  "var(--off-black)",
  "var(--dark-green)",
  "var(--off-teal)",
  "var(--light-off-teal)",
];

const Home = forwardRef(
  (
    {
      isLoaded,
      handleProjectSelect,
      onModifierDeckSelect,
      isLoadedforHero,
      returnedFrom,
    },
    ref
  ) => {
    const { playHover, playClick } = useButtonSounds();
    const cardCount = useCardCount();
    const [projects, setProjects] = useState(null);
    const [recentHovered, setRecentHovered] = useState(false);
    const [recentSelected, setRecentSelected] = useState(false);
    const [deckHovered, setDeckHovered] = useState(false);
    const [cardsHovered, setCardsHovered] = useState(false);
    const [starsHover, setStarsHover] = useState({ active: false, x: 0.5 });

    const rectRef = useRef(null);
    const heroRef = useRef(null);
    const parallaxRef = useRef(null);
    const homeRef = useRef(null);
    const narratorRef = useRef(null);
    const cursorRef = useRef(null);

    const leftSecondS2Ref = useRef(null);
    const secondInnerRef = useRef(null);
    const metricWrapperRef = useRef(null);
    const recentImgRef = useRef(null);
    const imgRef = useRef(null);

    const grassTargetRef1 = useRef(null);
    const grassTargetRef2 = useRef(null);
    const grassTargetRef3 = useRef(null);

    const cardDeckRef = useRef(null);
    const recentCanvasRef = useRef(null);
    const recentRafRef = useRef(null);
    const recentCacheRef = useRef(null);
    const starTweenRef = useRef(null);

    const syncRecentCanvasSize = useCallback(() => {
      const canvas = recentCanvasRef.current;
      if (!canvas) return;
      const { offsetWidth, offsetHeight } = canvas;
      if (offsetWidth > 0 && offsetHeight > 0) {
        canvas.width = offsetWidth;
        canvas.height = offsetHeight;
      }
    }, []);

    useEffect(() => {
      const wrapper = recentImgRef.current;
      if (!wrapper) return;
      const ro = new ResizeObserver(syncRecentCanvasSize);
      ro.observe(wrapper);
      syncRecentCanvasSize();
      return () => ro.disconnect();
    }, [syncRecentCanvasSize]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const runLegoReveal = useCallback(() => {
      const canvas = recentCanvasRef.current;
      const cache = recentCacheRef.current;
      if (!canvas || !cache) return;

      if (recentRafRef.current) cancelAnimationFrame(recentRafRef.current);

      const { studded, plain, w, h } = cache;
      if (canvas.width !== w || canvas.height !== h) return;

      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const offCtx = off.getContext("2d");

      const maxR = Math.max(w, h) / 2 + LEGO_GRID;
      const start = performance.now();
      const ctx = canvas.getContext("2d");

      canvas.style.transition = "none";
      canvas.style.opacity = "1";

      const frame = (now) => {
        const t = Math.min(1, (now - start) / LEGO_REVEAL_MS);
        const rp = t * (1 + LEGO_BAND_FRAC);

        offCtx.clearRect(0, 0, w, h);
        offCtx.drawImage(studded, 0, 0);

        const plainR = rp * maxR;
        if (plainR > 0) {
          offCtx.save();
          applySquareRadialClip(offCtx, w, h, plainR);
          offCtx.clip();
          offCtx.drawImage(plain, 0, 0);
          offCtx.restore();
        }

        const imageR = (rp - LEGO_BAND_FRAC) * maxR;
        if (imageR > 0) {
          offCtx.save();
          applySquareRadialClip(offCtx, w, h, imageR);
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
          recentRafRef.current = requestAnimationFrame(frame);
        } else {
          recentRafRef.current = null;
          canvas.style.transition = `opacity ${LEGO_FADE_MS}ms ease`;
          canvas.style.opacity = "0";
        }
      };

      recentRafRef.current = requestAnimationFrame(frame);
    }, []);

    useEffect(() => {
      if (!isLoadedforHero) return;
      const img = imgRef.current;
      const canvas = recentCanvasRef.current;
      if (!img || !canvas) return;

      const start = () => {
        syncRecentCanvasSize();
        const w = canvas.width, h = canvas.height;
        if (w === 0 || h === 0 || !img.complete || img.naturalWidth === 0) return;
        const cached = recentCacheRef.current;
        if (!cached || cached.w !== w || cached.h !== h)
          recentCacheRef.current = buildLegoCache(img, w, h);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(recentCacheRef.current.studded, 0, 0);
        runLegoReveal();
      };

      if (img.complete && img.naturalWidth > 0) start();
      else img.addEventListener("load", start, { once: true });

      return () => {
        if (recentRafRef.current) cancelAnimationFrame(recentRafRef.current);
      };
    }, [isLoadedforHero, runLegoReveal, syncRecentCanvasSize]);

    const narratorMessage = useMemo(() => {
      const modifierDialogues = [
        "The deck grows heavier. So does he",
        "The collection expands. So does his resolve",
        "He carries more now and carries it well",
        "He's building a hand he believes in",
        "The deck grows. So does his discipline",
        "He's assembling something steady, isn't he",
        "He keeps forging interesting cards",
        "The more he unlocks, the more deliberate he becomes",
        "He unlocked it. Now he has to live up to it",
        "It suits him, though he doesn't realize why yet",
        "He reached for a heavier card this time",
        "He's not afraid of harder cards now",
        "The collection is gaining structure",
        "That card will matter later",
        "He's stacking identity, not just achievement",
        "The deck is beginning to resemble resolve",
        "He's assembling something coherent",
        "He's shaping who he'll be remembered as",
      ];

      const projectDialogues = [
        "He builds like he's solving something personal",
        "Every project leaves a fingerprint",
        "Work is how he thinks out loud",
        "Interesting… he handled that differently",
        "That's growth",
        "He's asking better questions",
        "You can feel the evolution, can't you",
        "You can tell he wrestled with this",
        "He's designing the way he thinks",
        "The ambition outpaces the polish",
        "He sees it. He just hasn't mastered it yet",
        "He's aware of what's missing",
        "He's outgrowing his old limits",
        "He's building taste faster than technique",
        "He's not satisfied with this. That's a good sign",
        "The growth is uneven. That's normal",
        "There's rawness here. That's not weakness",
        "He's closer to mastery than he was yesterday",
      ];

      if (returnedFrom === "modifier_deck") {
        return modifierDialogues[
          Math.floor(Math.random() * modifierDialogues.length)
        ];
      }

      if (returnedFrom === "project") {
        return projectDialogues[
          Math.floor(Math.random() * projectDialogues.length)
        ];
      }

      return "He opened DevTools before saying hello.";
    }, [returnedFrom]);

    useEffect(() => {
      const loadProjects = async () => {
        try {
          const res = await fetch(PROJECTS_JSON_URL);
          if (!res.ok) throw new Error("Failed to fetch projects.json");
          const data = await res.json();
          setProjects(data.projects || []);
        } catch (err) {
          console.error("[ERROR] Could not load projects.json:", err);
          setProjects([]);
        }
      };
      loadProjects();
    }, []);

    const firstProject = useMemo(() => {
      if (!projects || projects.length === 0) return null;
      return projects[0];
    }, [projects]);

    useEffect(() => {
      if (!firstProject?.img) return;
      const canvas = recentCanvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;
      canvas.style.transition = "none";
      canvas.style.opacity = "1";
      const drawInitial = () => {
        syncRecentCanvasSize();
        const w = canvas.width, h = canvas.height;
        if (w === 0 || h === 0 || !img.complete || img.naturalWidth === 0) return;
        recentCacheRef.current = buildLegoCache(img, w, h);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(recentCacheRef.current.studded, 0, 0);
      };
      if (img.complete && img.naturalWidth > 0) drawInitial();
      else img.addEventListener("load", drawInitial, { once: true });
      return () => img.removeEventListener("load", drawInitial);
    }, [firstProject?.img, syncRecentCanvasSize]);

    /* — rotation of small star — */
    useGSAP(() => {
      if (!rectRef.current) return;
      CustomEase.create("wave", "M0,0 C0.6,0, 0.3,1.4, 1,1");
      starTweenRef.current = gsap.to(rectRef.current, {
        rotate: "360deg",
        duration: 3,
        ease: "wave",
        repeat: -1,
      });
    }, [rectRef.current]);

    useEffect(() => {
      const el = rectRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            starTweenRef.current?.resume();
          } else {
            starTweenRef.current?.pause();
          }
        },
        { threshold: 0 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    useGSAP(() => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, {
        opacity: 1,
        duration: 0.1,
        repeat: -1,
        yoyo: true,
        ease: "none",
        repeatDelay: 0.6,
      });
    }, [cursorRef.current]);

    /* — parallax line in chest — */
    useGSAP(() => {
      if (!parallaxRef.current || !homeRef.current) return;
      gsap.to(parallaxRef.current, {
        y: 90,
        ease: "none",
        scrollTrigger: {
          trigger: homeRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, [homeRef.current]);

    /* — parallax on card deck — */
    useGSAP(() => {
      if (!cardDeckRef.current || !homeRef.current) return;
      gsap.set(cardDeckRef.current, { y: -18, force3D: true });
      const tween = gsap.to(cardDeckRef.current, {
        y: 18,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: cardDeckRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      return () => tween.kill();
    }, [homeRef.current]);

    const handleRecentEnter = useCallback(() => setRecentHovered(true), []);
    const handleRecentLeave = useCallback(() => setRecentHovered(false), []);
    const handleRecentClick = useCallback(() => {
      if (!firstProject) return;
      handleProjectSelect(firstProject);
      setRecentSelected(true);
    }, [handleProjectSelect, firstProject]);

    /* — stars hover handlers (scoped to entire home section) — */
    const handleStarsMove = useCallback((e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      setStarsHover({ active: true, x: Math.max(0, Math.min(1, x)) });
    }, []);

    const handleStarsLeave = useCallback(() => {
      setStarsHover({ active: false, x: 0.5 });
    }, []);

    const getStarStyle = useCallback(
      (index) => {
        if (!starsHover.active) {
          return {
            color: DEFAULT_COLORS[index],
            transform: "rotate(0deg)",
            transition: "color 0.4s ease, transform 0.5s ease",
          };
        }

        const starPos = index / (STAR_COUNT - 1);
        const distance = Math.abs(starPos - starsHover.x) * (STAR_COUNT - 1);
        const colorIndex = Math.min(
          Math.floor(distance),
          HOVER_COLOR_BANDS.length - 1
        );
        const rotation = starsHover.x * 360;

        return {
          color: HOVER_COLOR_BANDS[colorIndex],
          transform: `rotate(${rotation}deg)`,
          transition: "color 0.15s ease",
        };
      },
      [starsHover]
    );

    /* — narrator word reveal — */
    useGSAP(() => {
      if (!narratorRef.current) return;

      const words = narratorRef.current?.querySelectorAll(".narrator-word");
      gsap.fromTo(
        words,
        {
          opacity: 0,
          display: "none",
        },
        {
          opacity: 1,
          display: "inline",
          duration: 0.15,
          stagger: 0.1,
          delay: 0,
          ease: "none",
        }
      );
    }, [returnedFrom, narratorRef.current]);

    if (!projects) {
      return (
        <section id="HOME" ref={ref} className={styles.home} aria-label="Home">
          <div className={styles.middle}>
            <h2 style={{ padding: "100px", textAlign: "center" }}>
              Loading projects...
            </h2>
          </div>
        </section>
      );
    }

    return (
      <section
        id="HOME"
        ref={homeRef}
        className={styles.home}
        aria-label="Home"
        onMouseMove={handleStarsMove}
        onMouseLeave={handleStarsLeave}
      >
        <div className={"extremes-wrapper-left"}>
          <div className={"extremes"}></div>
        </div>

        <div className={styles.middle}>
          <div className={styles.right}>
            {/* HERO / INTRO */}
            <div className={styles.first}>
              <div className={styles.manWrapper}>
                <AnimatedMan isLoaded={isLoaded} />
              </div>
              <h1 className={styles.heroText}>
                Less <span>clutter</span>
                <span>.</span> More <span>intention</span>
                <span>.</span> Better <span>experiences</span>
                <span>.</span>
              </h1>

              <h2 className={styles.heroCaption}>
                Well hello there! I'm <span>Sahil Sajjan.</span> Honestly, I treat the
                browser like an open canvas and <span>Next.js</span> like my medium. I
                love taking heavy, complex logic and turning it into clean, fluid web
                experiences that just feel right when you use them. To me, a
                pixel-perfect layout and a smooth animation aren't just details — they're
                the whole craft. I als- <span>[ muted ]</span>
              </h2>
              <div className={styles.botText}>
                <h2 className={styles.heroCaption2}>
                  <span className={styles.narrator}>Narrator:</span>{" "}
                  <span ref={narratorRef}>
                    {narratorMessage.split(" ").map((word, i, arr) => (
                      <span
                        key={`${word}-${i}`}
                        className={"narrator-word"}
                        style={{ opacity: 0, display: "none" }}
                      >
                        {word}
                        {i < arr.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </span>
                  <span ref={cursorRef} className={styles.cursor}>
                    ▌
                  </span>
                </h2>
              </div>
              <div className={styles.time}>
                <div>
                  <svg
                    ref={rectRef}
                    width="9"
                    height="10"
                    viewBox="0 0 9 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h3 className={styles.timeh3}>
                  LOCAL TIME <Clock />
                </h3>
                <h3 className={styles.timeh32}>GMT +0500</h3>
              </div>
            </div>

            {/* METRICS & PROJECT */}
            <div className={styles.second}>
              <svg
                className={styles.homeRounder1}
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 9 9"
                fill="none"
              >
                <path
                  d="M9 0H0C4.97056 0 9 4.02944 9 9V0Z"
                  fill="var(--off-teal)"
                />
              </svg>
              <svg
                className={styles.homeRounder2}
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 9 9"
                fill="none"
              >
                <path
                  d="M9 0H0C4.97056 0 9 4.02944 9 9V0Z"
                  fill="var(--off-teal)"
                />
              </svg>

              <div className={styles.metricSuperwrapper}>
                <div
                  ref={metricWrapperRef}
                  className={styles.metricWrapper}
                >
                  <Metric
                    name={"PROJECTS COMPLETED"}
                    count={5}
                    isLoaded={isLoaded}
                    ref={grassTargetRef2}
                    delay={1.5}
                  />
                  <GrassOverlay
                    isLoaded={isLoaded}
                    targetRef={grassTargetRef2}
                  />
                  <Metric
                    name={"DEV EXPERIENCE"}
                    count={
                      +
                      Math.floor(
                        (new Date() - new Date("2024-10-01")) /
                        (1000 * 60 * 60 * 24 * 365.25)
                      )
                    }
                    isLoaded={isLoaded}
                    ref={grassTargetRef3}
                    delay={1.5}
                  />
                  <GrassOverlay
                    isLoaded={isLoaded}
                    targetRef={grassTargetRef3}
                  />
                </div>
              </div>

              {firstProject && (
                <div
                  ref={secondInnerRef}
                  className={`${styles.secondInnerwrapper} ${recentSelected
                    ? styles.secondInnerwrapperSelected
                    : ""
                    }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`View recent work: ${firstProject.name}`}
                  onMouseEnter={() => { handleRecentEnter(); playHover(3); }}
                  onMouseLeave={handleRecentLeave}
                  onClick={() => { handleRecentClick(); playClick(3); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRecentClick(); playClick(3); } }}
                >
                  <h4 className={styles.recenth4}>RECENT WORK</h4>
                  <div
                    ref={recentImgRef}
                    className={styles.recentImgWrapper}
                  >
                    <div className={styles.recentImg}>
                      <img
                        ref={imgRef}
                        className={styles.img}
                        src={BASE_PATH + firstProject.img}
                        alt={firstProject.name}
                      />
                      <canvas
                        ref={recentCanvasRef}
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.td}>
                    <div className={styles.title}>
                      <AnimatedArrow
                        isActive={!recentHovered && isLoaded}
                      />
                      <div className={styles.titleh3Wrapper}>
                        <h3 className={styles.titleh3}>
                          {firstProject.name}
                        </h3>
                      </div>
                      <AnimatedArrow isActive={recentHovered} />
                    </div>
                    <p className={styles.description}>
                      {firstProject.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SPOTIFY PLAYER */}
            <div className={styles.spotifySection}>
              <SpotifyPlayer />
            </div>


            {/* CARD DECK */}
            <div className={styles.fourth}>
              <div
                className={styles.cardWrapper}
                onMouseEnter={() => setCardsHovered(true)}
                onMouseLeave={() => setCardsHovered(false)}
              >
                <div className={styles.homeCardDeck} ref={cardDeckRef}>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <HomeCard
                      key={i}
                      index={i}
                      containerHover={cardsHovered}
                      deckHovered={deckHovered}
                      hasDesign={i <= 3}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LEFT COLUMN */}
          <div className={styles.left}>
            <div className={styles.first}>
              <div className={styles.hero}>
                <svg
                  className={styles.herorounder}
                  xmlns="http://www.w3.org/2000/svg"
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                >
                  <path
                    d="M9 0H0C4.97056 0 9 4.02944 9 9V0Z"
                    fill="var(--off-teal)"
                  />
                </svg>
                <Hero ref={heroRef} isLoaded={isLoadedforHero} />
              </div>
              <div className={styles.cell}></div>
            </div>

            <div className={styles.second}>
              <div ref={leftSecondS2Ref} className={styles.s2}>
                <div>
                  <AnimatedDownwardArrow
                    isLoaded={isLoaded}
                    isActive={true}
                  />
                </div>
              </div>
              <GrassOverlay
                isLoaded={isLoaded}
                targetRef={leftSecondS2Ref}
              />
              <div className={styles.s1}>
                <div className={styles.chestWindow}>
                  <svg
                    ref={parallaxRef}
                    width="40"
                    height="162"
                    viewBox="0 0 40 162"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M23.5 1C13 23 1.4 138.755 1 161.866"
                      stroke="var(--off-white)"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="34"
                      cy="19"
                      r="6"
                      fill="var(--dark-green)"
                    />
                    <circle
                      cx="27"
                      cy="73"
                      r="6"
                      fill="var(--dark-green)"
                    />
                    <circle
                      cx="22"
                      cy="125.866"
                      r="6"
                      fill="var(--dark-green)"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className={styles.third}>
              <div>
                <div className={styles.iconWrapper}>
                  <span aria-hidden="true" className={styles.chevronh4}>{">"}</span>
                </div>
                <p className={styles.desch4}>NARRATOR'S NOTE</p>
              </div>
              <div className={styles.spacer}></div>
              <h3 className={styles.desch3}>
                For the past{" "}
                {
                  [
                    "zero",
                    "one",
                    "two",
                    "three",
                    "four",
                    "five",
                    "six",
                    "seven",
                    "eight",
                    "nine",
                    "ten",
                  ][
                  Math.floor(
                    (new Date() - new Date("2023-10-01")) /
                    (1000 * 60 * 60 * 24 * 365.25)
                  )
                  ]
                }{" "}
                years, Sahil has been mastering frameworks and code to become as strong as possible. He is a quiet developer with a massive dream: to build legendary digital experiences and push his work to total perfection.
              </h3>
              <div className={styles.stars}>
                {Array.from({ length: STAR_COUNT }, (_, i) => (
                  <svg
                    key={i}
                    width="9"
                    height="10"
                    viewBox="0 0 9 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={getStarStyle(i)}
                  >
                    <path
                      d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                      fill="currentColor"
                    />
                  </svg>
                ))}
              </div>
            </div>

            <div className={styles.fourth}>
              <div className={styles.top}>
                <Metric
                  name={"CARDS COLLECTED"}
                  count={cardCount}
                  isLoaded={isLoaded}
                  delay={0}
                />
                <div className={styles.cell} ref={grassTargetRef1}>
                  With every feat accomplished, a new card is forged and
                  registered in his database.
                </div>
              </div>
              <GrassOverlay
                isLoaded={isLoaded}
                targetRef={grassTargetRef1}
              ></GrassOverlay>
              <a
                href="#"
                className={styles.second}
                onMouseEnter={() => { setDeckHovered(true); playHover(3); }}
                onMouseLeave={() => setDeckHovered(false)}
                onClick={(e) => {
                  e.preventDefault();
                  playClick(3);
                  onModifierDeckSelect();
                }}
              >
                <AnimatedArrow isActive={!deckHovered} />
                <h4>
                  VIEW<span> MODIFIER DECK</span>
                </h4>
                <AnimatedArrow isActive={deckHovered} />
              </a>
            </div>
          </div>
        </div>

        <div className={"extremes-wrapper-right"}>
          <div className={"extremes"}></div>
        </div>
      </section>
    );
  }
);

export default Home;
