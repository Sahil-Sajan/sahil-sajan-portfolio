import {
  useState,
  useRef,
  forwardRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import "./Work.css";
import { useButtonSounds } from "../hooks/useButtonSounds";
import AnimatedArrow from "../components/AnimatedArrow";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import GrassOverlay from "../components/GrassOverlay";
import ScrollTrigger from "gsap/ScrollTrigger";
import PixelLock from "/pixelLock.svg";
import star from "/star.svg";
import WorkCursor from "../components/WorkCursor";
import LegoStudGrid from "../components/LegoStudGrid/LegoStudGrid";


const BASE_PATH = "";
const PROJECTS_JSON_URL = `${BASE_PATH}/data/projects.json`;
const FALLBACK_IMG_SRC = BASE_PATH + "/project_imgs/placeholder.webp";

const LEGO_GRID = 30;
const LEGO_REVEAL_MS = 1200;
const LEGO_BAND_FRAC = 0.30;
const LEGO_FADE_MS = 350;
const LEGO_JITTER = LEGO_GRID * 0.65;
const LEGO_LIGHT_ANGLE = Math.atan2(-0.707, -0.707);
const legoClamp = (v) => (v > 255 ? 255 : v < 0 ? 0 : v | 0);
const legoHash = (ix, iy) => ((Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453) % 1 + 1) % 1;

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
  const cols = Math.ceil(w / LEGO_GRID);
  const rows = Math.ceil(h / LEGO_GRID);
  const samp = document.createElement("canvas");
  samp.width = cols; samp.height = rows;
  const sCtx = samp.getContext("2d");
  sCtx.imageSmoothingEnabled = true;
  sCtx.drawImage(img, 0, 0, cols, rows);
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

const getAppScale = () => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--app-scale")
    .trim();

  return parseFloat(value) || 1;
};

const Work = forwardRef(({ handleProjectSelect }, ref) => {
  const { playHover, playClick } = useButtonSounds();
  const [projectsData, setProjectsData] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth < 1201 ? -1 : 0;
  });
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [scale, setScale] = useState(getAppScale);
  useEffect(() => {
    const apply = () => setScale(getAppScale());
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  const imagesRef = useRef({});
  const topImgRef = useRef(null);
  const bottomImgRef = useRef(null);
  const prevActiveIndex = useRef(null);
  const handRef = useRef(null);
  const handShadowRef = useRef(null);
  const grassTargetRef1 = useRef(null);
  const grassTargetRef2 = useRef(null);
  const headingRef = useRef(null);
  const starRefsMap = useRef({});

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isCursorVisible, setIsCursorVisible] = useState(false);

  const pixelCanvasRef = useRef(null);
  const legoRafRef = useRef(null);
  const legoObserverRef = useRef(null);
  const legoCacheRef = useRef(null);

  const handleImgMouseMove = useCallback((e) => {
    const s = getAppScale();
    setCursorPos({ x: e.clientX / s, y: e.clientY / s });
  }, []);

  const handleImgMouseEnter = useCallback(
    (e) => {
      // Ensure the cursor position is correct on first entry,
      // even if there hasn't been a prior mousemove in this area.
      handleImgMouseMove(e);
      setIsCursorVisible(true);
    },
    [handleImgMouseMove]
  );

  const handleImgMouseLeave = useCallback(() => {
    setIsCursorVisible(false);
  }, []);


  const syncCanvasSize = useCallback(() => {
    const canvas = pixelCanvasRef.current;
    const img = topImgRef.current;
    if (!canvas || !img) return;

    const { offsetWidth, offsetHeight } = img;
    if (offsetWidth > 0 && offsetHeight > 0) {
      canvas.width = offsetWidth;
      canvas.height = offsetHeight;
    }
  }, []);

  useEffect(() => {
    const img = topImgRef.current;
    if (!img) return;

    const ro = new ResizeObserver(syncCanvasSize);
    ro.observe(img);
    syncCanvasSize();

    return () => ro.disconnect();
  }, [syncCanvasSize]);

  const runLegoReveal = useCallback(() => {
    const canvas = pixelCanvasRef.current;
    const cache = legoCacheRef.current;
    if (!canvas || !cache) return;

    if (legoRafRef.current) cancelAnimationFrame(legoRafRef.current);

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
        canvas.style.opacity = "0";
      }
    };

    legoRafRef.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!projectsData || projectsData.length === 0) return;

    const canvas = pixelCanvasRef.current;
    const img = topImgRef.current;
    if (!canvas || !img) return;

    const startObserver = () => {
      syncCanvasSize();
      const w = canvas.width, h = canvas.height;
      if (w === 0 || h === 0 || !img.complete || img.naturalWidth === 0) return;

      const ctx = canvas.getContext("2d");
      canvas.style.transition = "none";
      canvas.style.opacity = "1";

      // Immediately cover the real image so it never flashes through
      ctx.fillStyle = "#C2E9E7";
      ctx.fillRect(0, 0, w, h);

      // Build the lego cache in the next frame (heavy sync work)
      legoRafRef.current = requestAnimationFrame(() => {
        legoRafRef.current = null;
        legoCacheRef.current = buildLegoCache(img, w, h);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(legoCacheRef.current.studded, 0, 0);

        legoObserverRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                runLegoReveal();
                legoObserverRef.current?.disconnect();
              }
            });
          },
          { threshold: 0.5 }
        );

        legoObserverRef.current.observe(canvas);
      });
    };

    if (img.complete && img.naturalWidth > 0) {
      startObserver();
    } else {
      img.addEventListener("load", startObserver, { once: true });
    }

    return () => {
      legoObserverRef.current?.disconnect();
      if (legoRafRef.current) cancelAnimationFrame(legoRafRef.current);
    };
  }, [projectsData, syncCanvasSize, runLegoReveal]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch(PROJECTS_JSON_URL);
        if (!res.ok) throw new Error("Failed to fetch projects.json");
        const data = await res.json();
        setProjectsData(data.projects || []);
      } catch (err) {
        console.error("[ERROR] Could not load projects.json:", err);
        setProjectsData([]);
      }
    };
    loadProjects();
  }, []);

  const activeIndex = useMemo(() => {
    if (selectedIndex !== null) return selectedIndex;
    if (hoveredIndex >= 0) return hoveredIndex;
    return 0;
  }, [hoveredIndex, selectedIndex]);

  const activeProject = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return {};
    if (activeIndex < 0 || activeIndex >= projectsData.length) return {};
    return projectsData[activeIndex] ?? {};
  }, [activeIndex, projectsData]);

  const getOrLoadImage = (src) => {
    if (imagesRef.current[src]) return imagesRef.current[src];
    const img = new Image();
    img.src = src;
    imagesRef.current[src] = img;
    return img;
  };

  useEffect(() => {
    if (!projectsData || projectsData.length === 0) return;
    const sources = projectsData.map((p) =>
      p.img ? BASE_PATH + p.img : FALLBACK_IMG_SRC
    );
    if (!sources.includes(FALLBACK_IMG_SRC)) sources.push(FALLBACK_IMG_SRC);
    sources.forEach((src) => getOrLoadImage(src));
  }, [projectsData]);

  useGSAP(() => {
    if (!projectsData || !handRef.current) return;
    gsap.to(handRef.current, {
      y: 40,
      ease: "none",
      scrollTrigger: {
        trigger: "#WORK",
        start: "top bottom",
        end: "top top",
        scrub: 1,
      },
    });

    gsap.globalTimeline.add(() => {
      import("gsap/ScrollTrigger").then((st) =>
        st.ScrollTrigger.refresh()
      );
    }, 0.5);
  }, [projectsData, handRef.current]);

  useGSAP(() => {
    if (!projectsData || !handShadowRef.current) return;
    gsap.to(handShadowRef.current, {
      y: 40,
      ease: "none",
      scrollTrigger: {
        trigger: "#WORK",
        start: "top bottom",
        end: "top top",
        scrub: 1,
      },
    });
  }, [projectsData]);

  useEffect(() => {
    if (!headingRef.current || !projectsData) return;
    const section = document.querySelector("#WORK");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        headingRef.current?.classList.toggle("heading--active", entry.isIntersecting);
      },
      // rootMargin -40% on bottom mirrors "start: top 60%" — fires when
      // the section's top has crossed 60% down from the top of the viewport
      { rootMargin: "0px 0px -40% 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [projectsData]);

  useGSAP(() => {
    if (!projectsData) return;

    Object.entries(starRefsMap.current).forEach(([projIndex, starArray]) => {
      if (Array.isArray(starArray)) {
        starArray.forEach((star) => {
          if (star) {
            gsap.killTweensOf(star);
            gsap.set(star, { rotate: 0 });
          }
        });
      }
    });

    if (activeIndex < 0) return;

    const starRefs = starRefsMap.current[activeIndex];
    if (!starRefs || starRefs.length === 0) return;

    CustomEase.create("wave", "M0,0 C0.6,0, 0.3,1.4, 1,1");

    const tl = gsap.timeline();

    starRefs.forEach((starEl, idx) => {
      if (starEl) {
        tl.to(
          starEl,
          {
            rotate: "360deg",
            duration: 3,
            ease: "wave",
            repeat: -1,
          },
          idx * 0.8
        );
      }
    });

    return () => {
      tl.kill();
    };
  }, [activeIndex, projectsData]);

  // Clip-path reveal animation when active project changes
  useGSAP(() => {
    if (!topImgRef.current || !bottomImgRef.current) return;
    if (!projectsData || projectsData.length === 0) return;

    const newSrc = activeProject.img
      ? BASE_PATH + activeProject.img
      : FALLBACK_IMG_SRC;

    // First mount — set both without animating
    if (prevActiveIndex.current === null) {
      topImgRef.current.src = newSrc;
      bottomImgRef.current.src = newSrc;
      gsap.set(topImgRef.current, {
        clipPath: "inset(0% 0% 0% 0% round 6px)",
      });
      prevActiveIndex.current = activeIndex;
      return;
    }

    if (activeIndex === prevActiveIndex.current) return;

    // Kill any in-progress animation
    gsap.killTweensOf(topImgRef.current);

    // Snapshot outgoing image onto bottom layer
    bottomImgRef.current.src = topImgRef.current.src;

    // Set new src on top layer, collapsed via clip-path
    topImgRef.current.src = newSrc;
    gsap.set(topImgRef.current, {
      clipPath: "inset(50% 50% 50% 50% round 6px)",
    });

    gsap.fromTo(topImgRef.current,
      {
        clipPath: "inset(50% 50% 50% 50% round 6px)",
      },
      {
        clipPath: "inset(0% 0% 0% 0% round 6px)",
        duration: 0.9,
        ease: "power2.inOut",
        onComplete: () => {
          if (topImgRef.current) {
            gsap.set(topImgRef.current, {
              clipPath: "inset(0% 0% 0% 0% round 6px)",
            });
          }
        },
      });

    prevActiveIndex.current = activeIndex;
  }, [activeIndex, projectsData, activeProject]);

  const handleMouseEnter = useCallback(
    (index) => setHoveredIndex(index),
    []
  );
  const handleMouseLeave = useCallback(() => {
    if (typeof window === "undefined") {
      setHoveredIndex(0);
      return;
    }
    setHoveredIndex(window.innerWidth < 1201 ? -1 : 0);
  }, []);

  const handleClick = useCallback(
    (project, index) => {
      setSelectedIndex(index);
      handleProjectSelect(project);
    },
    [handleProjectSelect]
  );

  if (!projectsData) {
    return (
      <section id="WORK" ref={ref} aria-label="Work">
        <div style={{ textAlign: "center", padding: "100px" }}>
          Loading Works...
        </div>
      </section>
    );
  }

  return (
    <section id="WORK" ref={ref}>
      <div className="extremes-wrapper-left">
        <div className="extremes"></div>
      </div>

      <div className="middle">
        <div className="right">
          <div className="headingWrapper">
            <h2 className="heading" ref={headingRef}>
              <div className="workHeadingWrapper">
                <span className="heading-bracket left">{"<"}</span>
                WORKS
                <span className="heading-bracket right">{"/>"}</span>
              </div>
              <div className="descHeading">
                A collection of Sahil's curated works. Choose one below
                to view.
              </div>
            </h2>
            <div className="rounder" ref={grassTargetRef2}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 9 9"
                fill="none"
              >
                <path
                  d="M0 0H9C4.02944 0 3.22128e-07 4.02944 0 9V0Z"
                  fill="var(--off-teal)"
                />
              </svg>
              <svg
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
            </div>
          </div>

          <div
            className={"project locked"}
            role="button"
            tabIndex={0}
            aria-label="Nortra AI – case study coming soon"
            aria-disabled="true"
            onMouseEnter={playHover}
            onClick={() => { playClick(2); console.log("It ain't here yet!"); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playClick(2); } }}
          >
            <div className="title">
              <img
                src={PixelLock}
                alt=""
                style={{ paddingRight: "6px", paddingTop: "2px" }}
              />
              <h3>NORTRA AI</h3>
            </div>
            <div className="description locked">
              <p>
                Case study coming soon! AI-powered response and operations layer for pre-deal CRM workflows
              </p>
            </div>
            <div className="tags">
              <div className="tag">
                <img src={star} alt="" />
                Web App
              </div>
              <div className="tag">
                <img src={star} alt="" />
                AI Operations
              </div>
              <div className="tag">
                <img src={star} alt="" />
                SaaS
              </div>
            </div>
          </div>

          {projectsData.map((project, index) => {
            const isActive = hoveredIndex === index || selectedIndex === index;
            return (
              <div
                key={index}
                className={`project ${isActive ? "project--active" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`View project: ${project.name}`}
                onMouseEnter={() => { handleMouseEnter(index); playHover(3); }}
                onMouseLeave={handleMouseLeave}
                onClick={() => { handleClick(project, index); playClick(3); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(project, index); playClick(3); } }}
              >
                <div className="title">
                  <AnimatedArrow isActive={hoveredIndex !== index} />
                  <h3>{project.name}</h3>
                  <AnimatedArrow isActive={hoveredIndex === index} />
                </div>
                <div className="description">
                  <p className="description-text">{project.description}</p>
                </div>
                <div className="tags">
                  {project.tags?.map((tag, tagIndex) => (
                    <div className="tag" key={tagIndex}>
                      <img
                        ref={(el) => {
                          if (el) {
                            if (!starRefsMap.current[index]) {
                              starRefsMap.current[index] = [];
                            }
                            starRefsMap.current[index][tagIndex] = el;
                          }
                        }}
                        src={star}
                        alt=""
                      />
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="left">
          <div className="img-superwrapper">
            <div className="hand-wrapper">
              <svg
                className="hand"
                ref={handRef}
                width="375"
                height="204"
                viewBox="0 0 375 204"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_1777_11121)">
                  <path
                    d="M49.0618 123.485L56.8618 61.3268C59.6093 39.4325 74.3931 31.2993 81.4416 29.9696L180.953 -30.9677L343.024 -100.102L431.686 -166.746L490.875 -42.6034L220.577 34.7595L201.388 56.2242C202.084 68.5095 177.784 86.984 165.547 94.6856L148.557 128.126L140.646 148.859C136.794 157.435 125.279 153.829 120.003 150.954C118.344 159.574 109.853 160.477 105.815 159.85C97.7597 158.901 96.1809 152.263 96.3924 148.776L93.3972 187.16C93.7293 196.948 85.5258 198.78 81.3825 198.472C72.7686 199.362 70.4136 187.774 70.3129 181.868C70.4372 190.229 64.0522 192.035 60.8439 191.895C53.06 190.978 50.7778 182.184 50.6097 177.902L49.0621 123.48L56.8621 61.3227C58.3873 49.1684 63.6224 41.2558 69.1837 36.3929Z"
                    fill="var(--off-white)"
                  />
                  <path
                    d="M69.1837 36.3929C69.2131 36.5706 69.1955 36.76 69.1125 36.9423C66.9236 41.7479 64.8589 49.5246 68.4566 54.1433C69.0056 54.8482 68.6032 56.4162 67.7682 56.7339C65.0452 57.7691 61.9191 60.3449 61.2087 66.1545L55.3176 119.29C55.3107 119.352 55.3102 119.413 55.3168 119.475C55.6448 122.534 57.7724 128.409 63.7649 128.945C64.1664 128.981 64.5278 128.716 64.6457 128.331L82.0305 71.4838C82.358 70.4141 83.9544 70.7806 83.7826 71.886L75.3004 126.383C75.2152 126.93 75.6391 127.425 76.1916 127.464C79.0759 127.671 83.5423 128.76 85.8988 131.85C86.3986 132.506 87.5899 132.499 87.9069 131.738L113.669 69.9017L100.42 120.089C100.285 120.604 100.619 121.122 101.144 121.205L101.157 121.208C107.294 122.179 117.88 123.854 119.06 131.96L120.664 142.975C120.807 143.955 122.197 144.021 122.432 143.058L134.426 93.8205C134.439 93.7703 134.455 93.721 134.476 93.6737L140.589 79.6442L134.704 95.5287L128.124 123.598C128.029 124.003 128.224 124.421 128.595 124.609L139.374 130.056C142.911 131.844 144.82 135.699 144.208 139.52L140.646 148.855C136.795 157.43 125.279 153.824 120.003 150.949C118.344 159.57 109.853 160.472 105.815 159.846C97.7599 158.897 96.1808 152.259 96.3922 148.772L93.3974 187.156C93.7294 196.944 85.5259 198.776 81.3826 198.468C72.7687 199.358 70.4137 187.769 70.3129 181.864C70.4372 190.225 64.0522 192.035 60.8439 191.895C53.06 190.978 50.7778 182.184 50.6097 177.902L49.0621 123.48L56.8621 61.3227C58.3873 49.1684 63.6224 41.2558 69.1837 36.3929Z"
                    fill="var(--off-teal)"
                  />
                  <path
                    d="M98.9336 59.3005C92.1732 47.8981 97.7253 36.4034 101.346 32.0813C99.1787 31.7897 93.9714 33.9747 90.4829 45.0476C86.9944 56.1205 94.6632 59.1632 98.9336 59.3005Z"
                    fill="var(--off-teal)"
                  />
                  <path
                    d="M128.599 47.2406C129.351 42.3951 130.982 40.67 131.704 40.4132C128.493 40.8806 127.145 43.5057 126.872 44.7598C125.206 50.8313 124.985 62.0357 125.083 66.8789L128.599 47.2406Z"
                    fill="var(--off-teal)"
                  />
                  <path
                    d="M70.118 126.723L82.6475 72.6003L71.2121 127.282C70.7823 129.337 70.5588 131.43 70.5448 133.529L70.2477 178.234L69.3124 134.512C69.2564 131.892 69.527 129.275 70.118 126.723Z"
                    fill="var(--off-black)"
                  />
                  <path
                    d="M98.4036 115.564L110.832 78.5155L99.2796 116.421C98.5603 118.781 98.1204 121.218 97.9689 123.681L96.3036 150.761L96.7709 125.024C96.8293 121.806 97.3799 118.616 98.4036 115.564Z"
                    fill="var(--off-black)"
                  />
                  <path
                    d="M123.091 134.565L133.132 100.315L120.328 149.995L123.091 134.565Z"
                    fill="var(--off-black)"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1777_11121">
                    <rect width="375" height="204" rx="9" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>

            <div className="first">
              <div
                className="cell"
                ref={grassTargetRef1}
                style={{ overflow: "hidden", borderRadius: 9 }}
              >
                <LegoStudGrid />
              </div>
              <GrassOverlay targetRef={grassTargetRef1}></GrassOverlay>
              <div className="window"></div>
              <div className="cell-small"></div>
            </div>

            <div className="img-wrapper">
              <div className="hand-shadow-wrapper">
                <svg
                  ref={handShadowRef}
                  className="hand-shadow"
                  width="99"
                  height="89"
                  viewBox="0 0 99 89"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.275817 5.01798L2 -23H21.5L99 9.5V34C94.6 47.2 84.8333 44.1667 80 42.5C75 52.5 65.6667 51 61.5 50.5L58.5437 70.8983C57.2706 79.683 51.7037 88.169 42.854 88.8578C35.5028 89.43 30.7414 86.7896 28 83.5C11.5 88 5 75.1667 5 69.5L0.372915 13.975C0.12463 10.9956 0.0921794 8.00208 0.275817 5.01798Z"
                    fill="var(--off-black)"
                    fillOpacity="0.3"
                  />
                </svg>
              </div>
              <div className="work-img-wrapper"
                onMouseMove={handleImgMouseMove}
                onMouseEnter={handleImgMouseEnter}
                onMouseLeave={handleImgMouseLeave}
              >
                <div className="canvas-wrapper">
                  {/* Outgoing image — sits underneath */}
                  <img
                    ref={bottomImgRef}
                    className="work-img work-img--bottom"
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Incoming image — animates in via clip-path */}
                  <img
                    ref={topImgRef}
                    className="work-img work-img--top"
                    alt={activeProject.name || ""}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                  <canvas
                    ref={pixelCanvasRef}
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="rounder" ref={grassTargetRef2}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 9 9"
                fill="none"
              >
                <path
                  d="M0 0H9C4.02944 0 3.22128e-07 4.02944 0 9V0Z"
                  fill="var(--off-teal)"
                />
              </svg>
              <svg
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
            </div>
            <GrassOverlay targetRef={grassTargetRef2}></GrassOverlay>
          </div>
        </div>
      </div>

      <div className="extremes-wrapper-right">
        <div className="extremes"></div>
      </div>
      <div
        style={{
          position: "fixed",
          top: cursorPos.y,
          left: cursorPos.x,
          transform: `translate(${16 / scale}px, ${16 / scale}px)`,
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        <WorkCursor isVisible={isCursorVisible} />
      </div>
    </section>
  );
});

export default Work;
