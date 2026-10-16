import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { gsap } from "gsap";
import { useButtonSounds } from "../../hooks/useButtonSounds";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { useLenis } from "lenis/react";

import styles from "./Hero.module.css";

import figma_apply from "/icons/figma_apply.png";
import figma_cancel from "/icons/figma_cancel.png";
import figma_search from "/icons/figma_search.png";
import box_anchor from "/box_anchor.svg";


(() => {
  try {
    CustomEase.create("wave", "M0,0 C0.6,0, 0.1,1.4, 1,1");
  } catch {
    // ease may already exist; ignore
  }
})();

const fonts = Object.freeze([
  { label: "Next.js", fontFamily: "Abril Fatface" },
  { label: "React.js", fontFamily: "Lobster" },
  { label: "TypeScript", fontFamily: "Lora" },
  { label: "JavaScript", fontFamily: "Merriweather" },
  { label: "Tailwind CSS", fontFamily: "Montserrat" },
  { label: "Shadcn/UI", fontFamily: "Oswald" },
  { label: "Node.js", fontFamily: "Pacifico" },
  { label: "Express.js", fontFamily: "Roboto Flex" },
  { label: "GitHub", fontFamily: "Stara" },
]);

const Hero = ({ isLoaded }) => {
  const lenis = useLenis();
  const { playHover } = useButtonSounds();

  gsap.config({
    force3D: true,
  });

  // Font state
  const [fontWrapperState, setFontWrapperState] = useState("Stara");
  const fontStateRef = useRef("Stara");
  const [fontMenuHovered, setFontMenuHovered] = useState(false);

  // Refs for SVG parts
  const leftIrisRef = useRef(null);
  const rightIrisRef = useRef(null);
  const leftBrowRef = useRef(null);
  const rightBrowRef = useRef(null);
  const fishingLineRef = useRef(null);
  const fontRefs = useRef([]);
  const parallaxGroupRef = useRef(null);
  const meSvgRef = useRef(null);
  const fishermanRef = useRef(null);
  const [searchHover, setSearchHover] = useState(false);

  // mid-top typing animation state
  const DEFAULT_MID_TOP = "Choose a skill with me";
  const HOVER_MID_TOP = "Pushing code up the hill, daily.";
  const [midTopText, setMidTopText] = useState(DEFAULT_MID_TOP);
  const [midTopHighlighted, setMidTopHighlighted] = useState(false);
  const [midTopCursor, setMidTopCursor] = useState(false);
  const midTopTimers = useRef([]);

  // Eyelid refs for blinking
  const rightEyelidRef = useRef(null);
  const rightEyelidBottomRef = useRef(null);
  const rightEyelashRef = useRef(null);
  const leftEyelidRef = useRef(null);
  const leftEyelidBottomRef = useRef(null);
  const leftEyelashRef = useRef(null);

  // Bars for wave animation
  const rect1Ref = useRef(null);
  const rect2Ref = useRef(null);
  const rect3Ref = useRef(null);
  const rect4Ref = useRef(null);

  const stopTimerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const isIdleRef = useRef(false);
  const fontMenuHoveredRef = useRef(false);
  const isLoadedRef = useRef(false);

  const previousBlinkRef = useRef("single");

  // Timelines
  const t1 = useRef(null);
  const fishermanTlRef = useRef(null);
  const waveTlRef = useRef(null);
  const isHeroVisibleRef = useRef(true);
  const blinkRestartRef = useRef(null);

  const d = 0.8;

  const titleStyle = useMemo(
    () => ({
      margin: 0,
      fontSize: "42px",
      fontWeight: 400,
      fontFamily: fontWrapperState,
      color: "var(--off-black)",
      lineHeight: "100%",
    }),
    [fontWrapperState]
  );

  const setActiveFont = useCallback((font) => {
    if (fontStateRef.current !== font) {
      fontStateRef.current = font;
      setFontWrapperState(font);
    }
  }, []);

  const handleFontMenuEnter = useCallback(() => {
    fontMenuHoveredRef.current = true;
    setFontMenuHovered(true);
  }, []);

  const handleFontMenuLeave = useCallback(() => {
    fontMenuHoveredRef.current = false;
    setFontMenuHovered(false);
  }, []);

  const animateMidTop = useCallback((targetText, stopCursor = false) => {
    midTopTimers.current.forEach(clearTimeout);
    midTopTimers.current = [];

    // Phase 1: highlight current text
    setMidTopHighlighted(true);
    setMidTopCursor(false);

    // Phase 2: clear → show cursor
    const tClear = setTimeout(() => {
      setMidTopHighlighted(false);
      setMidTopText("");
      setMidTopCursor(true);
    }, 380);
    midTopTimers.current.push(tClear);

    // Phase 3: type each character
    const TYPE_DELAY = 560;
    const CHAR_MS = 48;
    for (let i = 1; i <= targetText.length; i++) {
      const tChar = setTimeout(() => {
        setMidTopText(targetText.slice(0, i));
      }, TYPE_DELAY + i * CHAR_MS);
      midTopTimers.current.push(tChar);
    }

    // Phase 4: hide cursor once typing is done (only when reverting to default)
    if (stopCursor) {
      const tDone = setTimeout(() => {
        setMidTopCursor(false);
      }, TYPE_DELAY + targetText.length * CHAR_MS + 120);
      midTopTimers.current.push(tDone);
    }
  }, []);

  const checkIntersection = useCallback(() => {
    const lineEl = fishingLineRef.current;
    if (!lineEl) return;

    const lineRect = lineEl.getBoundingClientRect();
    if (!lineRect) return;

    for (let i = 0; i < fontRefs.current.length; i++) {
      const el = fontRefs.current[i];
      if (!el) continue;
      const fr = el.getBoundingClientRect();
      if (!fr) continue;

      if (lineRect.bottom >= fr.top && lineRect.bottom <= fr.bottom) {
        if (fonts[i]) setActiveFont(fonts[i].fontFamily);
        break;
      }
    }
  }, [setActiveFont]);

  // Reset iris translation back to neutral
  const resetIrisTranslation = useCallback(() => {
    gsap.to(
      [leftIrisRef.current, rightIrisRef.current].filter(Boolean),
      {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      }
    );
  }, []);

  // Eye animations
  const animateEyesLeft = useCallback(() => {
    if (!leftIrisRef.current || !rightIrisRef.current) return;
    gsap.to([leftIrisRef.current, rightIrisRef.current], {
      x: -4,
      duration: d,
      ease: "power3.out",
    });
  }, []);

  const animateEyesRight = useCallback(() => {
    if (!leftIrisRef.current || !rightIrisRef.current) return;
    gsap.to([leftIrisRef.current, rightIrisRef.current], {
      x: 4,
      duration: d,
      ease: "power3.out",
    });
  }, []);

  // Scroll-driven eye direction + idle tracking
  useEffect(() => {
    if (!lenis) return;

    const STOP_DELAY = 100;
    const VELOCITY_EPS = 0.8;

    const onLenisScroll = ({ velocity }) => {
      const v = Math.abs(velocity || 0);

      if (v > VELOCITY_EPS && !isScrollingRef.current) {
        isScrollingRef.current = true;
        isIdleRef.current = false;
        resetIrisTranslation();
        animateEyesLeft();
        if (isHeroVisibleRef.current) waveTlRef.current?.pause();
      }

      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        if (isScrollingRef.current) {
          isScrollingRef.current = false;
          const stillBlocked =
            fontMenuHoveredRef.current || !isLoadedRef.current;
          isIdleRef.current = !stillBlocked;
          animateEyesRight();
          if (isHeroVisibleRef.current) waveTlRef.current?.resume();
        }
      }, STOP_DELAY);
    };

    lenis.on("scroll", onLenisScroll);
    return () => {
      lenis.off("scroll", onLenisScroll);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [lenis, animateEyesLeft, animateEyesRight, resetIrisTranslation]);

  // Font hover / loading state → eye direction + idle flag
  useEffect(() => {
    isLoadedRef.current = isLoaded;

    const goLeft = fontMenuHoveredRef.current || !isLoaded;
    const idle = !goLeft && !isScrollingRef.current;

    isIdleRef.current = idle;

    if (goLeft) {
      resetIrisTranslation();
      animateEyesLeft();
    } else {
      animateEyesRight();
    }
  }, [
    fontMenuHovered,
    isLoaded,
    animateEyesLeft,
    animateEyesRight,
    resetIrisTranslation,
  ]);

  // Cursor-tracking iris translation (only when idle)
  useEffect(() => {
    if (!leftIrisRef.current || !rightIrisRef.current) return;

    const irisConfig = [
      { ref: leftIrisRef, maxMove: 4 },
      { ref: rightIrisRef, maxMove: 4 },
    ];

    const getIrisCenter = (el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const handleMouseMove = (e) => {
      if (!isIdleRef.current) return;

      irisConfig.forEach(({ ref, maxMove }) => {
        const iris = ref.current;
        if (!iris) return;

        const center = getIrisCenter(iris);

        const dx = e.clientX - center.x;
        const dy = e.clientY - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const scale = Math.min(dist, maxMove * 20) / (maxMove * 20);
        const x = (dx / dist) * scale * maxMove;
        const y = (dy / dist) * scale * maxMove;

        gsap.to(iris, {
          x: isNaN(x) ? 0 : x,
          y: isNaN(y) ? 0 : y,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking animation
  useGSAP(() => {
    const eyelids = [
      rightEyelidRef.current,
      rightEyelidBottomRef.current,
      rightEyelashRef.current,
      leftEyelidRef.current,
      leftEyelidBottomRef.current,
      leftEyelashRef.current,
    ];

    if (eyelids.some((el) => !el)) return;

    let blinkTimeout;

    const createSingleBlink = () => {
      const blinkTl = gsap.timeline();

      blinkTl
        .to(
          rightEyelidRef.current,
          {
            attr: {
              d: "M237.5 251C224 244.5 206.5 243.5 202 244V233.5H236.5L237.5 251Z",
            },
            duration: 0.1,
            ease: "power2.in",
          },
          0
        )
        .to(
          rightEyelidBottomRef.current,
          {
            attr: {
              d: "M237 251.5C217.8 245.9 200.333 246.5 194 247.5C195.6 262.7 217 264.833 227.5 264C237.5 261.6 238 254.667 237 251.5Z",
            },
            duration: 0.1,
            ease: "power2.in",
          },
          0
        )
        .to(
          rightEyelashRef.current,
          {
            attr: {
              d: "M201.064 244.56L194.349 246.589C194.136 246.717 194.3 247.041 194.529 246.945L203.027 246.589C203.658 246.326 204.321 246.67 205 246.589C221 247.5 229 249.5 232.784 252.178C232.914 252.367 233.15 252.449 233.367 252.377L236.771 251.242C237.113 251.128 237.222 250.696 236.973 250.434C224.5 245 210.973 244 203 244C202.306 244.208 202 244 201.064 244.56Z",
            },
            duration: 0.1,
            ease: "power2.in",
          },
          0
        )
        .to(
          leftEyelidRef.current,
          {
            attr: {
              d: "M124 236.5C138.5 235 148.5 237.5 152.5 240.5C153.3 236.1 152.167 231 151.5 229.5L124 225V236.5Z",
            },
            duration: 0.1,
            ease: "power2.in",
          },
          0
        )
        .to(
          leftEyelidBottomRef.current,
          {
            attr: {
              d: "M149.5 243C143.1 239 128.5 239 121.5 240C125.1 251.2 137.333 252.333 143 251.5C148.6 248.7 149.333 245 149.5 243Z",
            },
            duration: 0.1,
            ease: "power2.in",
          },
          0
        )
        .to(
          leftEyelashRef.current,
          {
            attr: {
              d: "M119.965 237.201C133.5 234.5 147 237 152.5 239.5V240.5C141.5 241.5 133.5 239.5 127.135 239.5C124.922 240.399 123.604 238.422 121.5 240L119.843 237.929C119.659 237.699 119.715 237.358 119.965 237.201Z",
            },
            duration: 0.1,
            ease: "power2.in",
          },
          0
        )
        .to({}, { duration: 0.05 })
        .to(
          rightEyelidRef.current,
          {
            attr: {
              d: "M237.5 250C225 236 206 239 202 241V232.5H236.5L237.5 250Z",
            },
            duration: 0.12,
            ease: "power2.out",
          },
          ">"
        )
        .to(
          rightEyelidBottomRef.current,
          {
            attr: {
              d: "M237 251.5C238 260.5 213 275.5 194 247.5C195.6 262.7 217 264.833 227.5 264C237.5 261.6 238 254.667 237 251.5Z",
            },
            duration: 0.12,
            ease: "power2.out",
          },
          "<"
        )
        .to(
          rightEyelashRef.current,
          {
            attr: {
              d: "M201.068 241.56L194.353 245.589C194.14 245.717 194.304 246.041 194.532 245.945L203.051 242.396C203.682 242.133 204.35 241.948 205.029 241.867C221.141 239.96 229.929 247.037 232.787 251.178C232.918 251.367 233.154 251.449 233.371 251.377L236.775 250.242C237.117 250.128 237.226 249.696 236.977 249.435C225.94 237.81 210.43 238.445 203.031 240.663C202.337 240.871 201.689 241.188 201.068 241.56Z",
            },
            duration: 0.12,
            ease: "power2.out",
          },
          "<"
        )
        .to(
          leftEyelidRef.current,
          {
            attr: {
              d: "M124 235C138.5 229.5 148.5 236.5 152.5 239.5C153.3 235.1 152.167 231 151.5 229.5L124 225V235Z",
            },
            duration: 0.12,
            ease: "power2.out",
          },
          "<"
        )
        .to(
          leftEyelidBottomRef.current,
          {
            attr: {
              d: "M149.5 243C148.417 256 129.5 249.396 121.5 240C125.1 251.2 137.333 252.333 143 251.5C149 248.5 149.333 245 149.5 243Z",
            },
            duration: 0.12,
            ease: "power2.out",
          },
          "<"
        )
        .to(
          leftEyelashRef.current,
          {
            attr: {
              d: "M119.965 237.201C132.666 229.219 147.56 234.067 152.5 239.5V240.5C142.95 234.399 133.118 234.631 127.135 236.5C124.922 237.399 123.604 238.422 121.5 240L119.843 237.929C119.659 237.699 119.715 237.358 119.965 237.201Z",
            },
            duration: 0.12,
            ease: "power2.out",
          },
          "<"
        );

      return blinkTl;
    };

    const performBlinkGroup = () => {
      const r = Math.random();
      let blinkType;

      if (previousBlinkRef.current === "triple") {
        blinkType = r < 0.55 ? "single" : r < 0.775 ? "double" : "triple";
      } else if (previousBlinkRef.current === "double") {
        blinkType = r < 0.45 ? "single" : r < 0.725 ? "double" : "triple";
      } else {
        blinkType = r < 0.35 ? "single" : r < 0.675 ? "double" : "triple";
      }

      if (blinkType === "triple") {
        createSingleBlink();
        blinkTimeout = setTimeout(() => {
          createSingleBlink();
          blinkTimeout = setTimeout(() => {
            createSingleBlink();
            previousBlinkRef.current = "triple";
            scheduleNextGroup();
          }, 520);
        }, 300);
      } else if (blinkType === "double") {
        createSingleBlink();
        blinkTimeout = setTimeout(() => {
          createSingleBlink();
          previousBlinkRef.current = "double";
          scheduleNextGroup();
        }, 300);
      } else {
        createSingleBlink();
        previousBlinkRef.current = "single";
        scheduleNextGroup();
      }
    };

    const scheduleNextGroup = () => {
      const delay = 1.5 + Math.random() * 0.5;
      blinkTimeout = setTimeout(() => {
        if (!isHeroVisibleRef.current) {
          blinkRestartRef.current = performBlinkGroup;
          return;
        }
        performBlinkGroup();
      }, delay * 1000);
    };

    blinkTimeout = setTimeout(() => {
      if (isHeroVisibleRef.current) {
        performBlinkGroup();
      } else {
        blinkRestartRef.current = performBlinkGroup;
      }
    }, (1.5 + Math.random() * 0.5) * 1000);

    return () => {
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, []);

  // Fishing line up/down and intersection checking
  useGSAP(() => {
    const line = fishingLineRef.current;
    if (!line) return;

    t1.current = gsap.timeline({
      paused: false,
      repeat: -1,
      onUpdate: () => {
        checkIntersection();
      },
    });

    t1.current
      .to(line, {
        height: "348px",
        duration: 5.6,
        ease: "linear",
      })
      .to(line, {
        height: "124px",
        duration: 5.6,
        ease: "linear",
      });

    return () => {
      t1.current?.kill();
      t1.current = null;
    };
  }, [checkIntersection]);

  // Fisherman bob animation
  useGSAP(() => {
    if (!fishermanRef.current) return;

    const masterTl = gsap.timeline({ repeat: -1 });

    const fishermanTl = gsap.timeline();
    fishermanTl
      .to(fishermanRef.current, {
        scaleY: 1.04,
        transformOrigin: "top center",
        duration: 1.5,
        ease: "sine.inOut",
      })
      .to(fishermanRef.current, {
        scaleY: 1.02,
        transformOrigin: "top center",
        duration: 1.5,
        ease: "sine.inOut",
      });

    masterTl.add(fishermanTl, 0);
    fishermanTlRef.current = masterTl;

    return () => { masterTl.kill(); fishermanTlRef.current = null; };
  }, []);

  // Wave animation on header rectangles
  useGSAP(() => {
    const rects = [
      rect4Ref.current,
      rect3Ref.current,
      rect2Ref.current,
      rect1Ref.current,
    ].filter(Boolean);

    if (!rects.length) return;

    const t2 = gsap.timeline({ repeat: -1, yoyo: true });
    t2.to(rects, {
      scaleY: 1.4,
      transformOrigin: "top",
      duration: 2,
      stagger: 0.25,
      ease: "wave",
    });

    waveTlRef.current = t2;

    return () => { t2.kill(); waveTlRef.current = null; };
  }, []);

  // Parallax group on scroll
  useGSAP(() => {
    if (!parallaxGroupRef.current || !meSvgRef.current) return;

    const tween = gsap.to(parallaxGroupRef.current, {
      y: 60,
      ease: "none",
      scrollTrigger: {
        trigger: meSvgRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    return () => tween.kill();
  }, []);

  // Pause all looping animations when the hero is scrolled out of view
  useEffect(() => {
    const el = meSvgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isHeroVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          t1.current?.resume();
          fishermanTlRef.current?.resume();
          if (!isScrollingRef.current) waveTlRef.current?.resume();
          if (blinkRestartRef.current) {
            blinkRestartRef.current();
            blinkRestartRef.current = null;
          }
        } else {
          t1.current?.pause();
          fishermanTlRef.current?.pause();
          waveTlRef.current?.pause();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        width: "576px",
        position: "relative",
        height: "511px",
      }}
    >
      <div className={styles["hero-text"]}>
        <div className={styles["wrapper-top"]}>
          <h1 style={titleStyle}>Full Stack</h1>
          <img
            className={styles["b1"]}
            src={box_anchor}
            alt="anchor"
            aria-hidden="true"
          />
          <img
            className={styles["b2"]}
            src={box_anchor}
            alt="anchor"
            aria-hidden="true"
          />
          <img
            className={styles["b3"]}
            src={box_anchor}
            alt="anchor"
            aria-hidden="true"
          />
          <img
            className={styles["b4"]}
            src={box_anchor}
            alt="anchor"
            aria-hidden="true"
          />
        </div>
        <h1>Developer</h1>
      </div>

      <div className={styles["fishing-line"]} ref={fishingLineRef}>
        <div className={styles["line"]}></div>
        <div className={styles["cursor-wrapper"]}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              transform={"scale(0.8)"}
              d="M7.3239 17.0623C6.7643 17.894 5.50583 17.6248 5.31627 16.6329L2.79723 3.45096C2.61555 2.50022 3.59643 1.76338 4.42399 2.22893L15.9769 8.72805C16.8473 9.21766 16.7054 10.5435 15.7523 10.8274L10.458 12.4044L7.3239 17.0623Z"
              fill="var(--off-white)"
            />
            <path
              transform={"scale(0.8)"}
              d="M17.4216 8.89043C18.292 9.38 18.1501 10.7059 17.197 10.9898L10.8087 12.8929L7.03194 18.5061C6.47234 19.3378 5.21386 19.0686 5.0243 18.0766L2.02197 2.36541C1.84029 1.4147 2.82112 0.677868 3.64868 1.14336L17.4216 8.89043ZM6.01718 17.3141C6.0551 17.5124 6.30673 17.5663 6.41867 17.4L9.99836 12.0824L10.1094 11.9153L10.3011 11.8591L16.3788 10.0476C16.5694 9.99078 16.5978 9.72565 16.4237 9.62773L3.53373 2.37553C3.36821 2.28241 3.17202 2.42979 3.20837 2.61995L6.01718 17.3141Z"
              fill="var(--off-teal)"
            />
          </svg>
        </div>
      </div>

      <div
        className={styles["font-menu"]}
        onMouseEnter={handleFontMenuEnter}
        onMouseLeave={handleFontMenuLeave}
      >
        <div className={styles["top"]}>
          <div className={styles["top-top"]}>
            Skills
            <div className={styles["top-top-right"]}>
              <img src={figma_apply} alt="apply" />
              <img src={figma_cancel} alt="cancel" />
            </div>
          </div>
          <div className={styles["top-bot"]}
            onMouseEnter={() => setSearchHover(true)}
            onMouseLeave={() => setSearchHover(false)}
          >
            <img src={figma_search} alt="search" />
            {!searchHover ? "Search tech stack..." : "What I bring to the table :) "}
          </div>
        </div>

        <div className={styles["mid"]}>
          <div className={styles["mid-top"]}>
            <span className={midTopHighlighted ? styles["mid-top-selected"] : undefined}>
              {midTopText}
            </span>
            {midTopCursor && <span className={styles["mid-top-cursor"]}>▌</span>}
          </div>
        </div>

        <div
          className={styles["bot"]}
          onMouseEnter={() => { t1.current && t1.current.pause(); animateMidTop(HOVER_MID_TOP, false); }}
          onMouseLeave={() => { t1.current && t1.current.resume(); animateMidTop(DEFAULT_MID_TOP, true); }}
        >
          {fonts.map((font, index) => (
            <div
              key={font.label}
              className={
                styles[
                font.fontFamily === fontWrapperState
                  ? "font-wrapper-active"
                  : "font-wrapper"
                ]
              }
              ref={(el) => (fontRefs.current[index] = el)}
              style={{ fontFamily: font.fontFamily }}
              onMouseEnter={() => { setActiveFont(font.fontFamily); playHover(); }}
            >
              {font.label}
            </div>
          ))}
        </div>
      </div>

      <div className={styles["heroWrapper"]}>
        <svg
          ref={meSvgRef}
          className={styles["me"]}
          width="375"
          height="600"
          viewBox="0 0 375 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g id="Frame 2585">
            <g clipPath="url(#clip0_1470_10701)">
              <mask
                id="path-1-outside-1_1470_10701"
                maskUnits="userSpaceOnUse"
                x="0"
                y="-1"
                width="375"
                height="601"
                fill="black"
              >
                <rect fill="white" y="-1" width="375" height="601" />
                <path d="M0 0H375V591C375 595.971 370.971 600 366 600H9C4.02943 600 0 595.971 0 591V0Z" />
              </mask>
              <path
                d="M0 0H375V591C375 595.971 370.971 600 366 600H9C4.02943 600 0 595.971 0 591V0Z"
                fill="var(--hero-bg-main)"
              />
              <path
                ref={rect4Ref}
                id="rect-4"
                d="M0 0H375V165H0V0Z"
                fill="var(--hero-bg-4)"
              />
              <path
                ref={rect3Ref}
                id="rect-3"
                d="M0 0H375V150H0V0Z"
                fill="var(--hero-bg-3)"
              />
              <path
                ref={rect2Ref}
                id="rect-2"
                d="M0 0H375V120H0V0Z"
                fill="var(--hero-bg-2)"
              />
              <path
                ref={rect1Ref}
                id="rect-1"
                d="M0 0H375V60H0V0Z"
                fill="var(--hero-bg-1)"
              />

              <g ref={parallaxGroupRef}>
                <path
                  id="line-top"
                  d="M24 140V32"
                  stroke="var(--off-white)"
                  strokeWidth="1.5"
                />
                <g id="Face" display="none">
                  <path
                    id="Vector 281"
                    d="M35.5 423.5L149.5 383.5L276 385.5L404 484H0L8 454C12.8 436 28.3333 426.167 35.5 423.5Z"
                    fill="var(--off-black)"
                  />
                  <path
                    id="Neck BG"
                    d="M142.502 424.5C144.902 407.3 152.169 393.667 155.502 389V328.5L292.5 292L290 315C283.6 325.4 280.333 362.333 279.5 379.5C280.3 387.9 288.5 402 292.5 408C297.7 438.4 256.667 471 235.5 483.5H148L142.502 467.5C137.702 451.1 140.502 432 142.502 424.5Z"
                    fill="var(--off-white)"
                  />
                  <path
                    id="Neck Intersect 3"
                    d="M286 309C267.836 379.063 224.732 399.123 194.224 406.714C185.564 408.869 176.519 408.438 167.835 406.382L148.734 401.857C151.243 395.813 153.855 391.309 155.504 389V373.335L286 309Z"
                    fill="url(#paint0_linear_1717_11082)"
                  />
                  <path
                    id="Neck Intersect 2"
                    d="M281.072 358.441C280.283 366.475 279.766 374.001 279.499 379.5C280.299 387.9 288.499 402 292.499 408C295.61 426.187 282.171 445.16 266.34 460.147L281.072 358.441Z"
                    fill="var(--light-off-teal)"
                  />
                  <path
                    id="Neck Intersect 1"
                    d="M173.103 483.5H148L142.502 467.5C137.702 451.1 140.502 432 142.502 424.5C144.701 408.738 150.988 395.971 154.589 390.355L157.5 388.5L173.103 483.5Z"
                    fill="url(#paint1_linear_1717_11082)"
                  />
                  <path
                    id="Face BG"
                    d="M124.404 192.776L127.974 184.796C128.655 183.273 129.125 181.663 129.37 180.012C130.372 173.249 135.065 167.611 141.534 165.399L177.97 152.94C197.583 146.233 219.015 147.253 237.903 155.791L265.94 168.466C275.876 172.957 283.533 181.329 287.124 191.625L307.218 249.256C307.581 250.294 308.904 250.597 309.682 249.82C309.89 249.611 310.155 249.469 310.444 249.412L316.274 248.246C317.091 248.082 317.895 247.86 318.679 247.579L321.811 246.461C323.549 245.84 325.45 245.845 327.186 246.476C329 247.136 330.511 248.435 331.435 250.13L331.963 251.098C332.648 252.354 333.078 253.733 333.228 255.155L333.579 258.487C333.859 261.148 333.75 263.836 333.257 266.466L332.501 270.5L330.001 283.5L328.26 291.161C327.756 293.379 326.987 295.529 325.969 297.563C324.339 300.824 322.096 303.74 319.362 306.152L315.001 310L307.251 316.934C306.09 317.974 304.795 318.853 303.401 319.55L302.053 320.224C299.74 321.381 297.13 321.804 294.57 321.439L292.779 321.183C291.939 321.063 291.141 320.743 290.45 320.25C288.931 319.165 288.096 317.361 288.251 315.501L288.91 307.596C288.927 307.39 288.642 307.318 288.559 307.507L277.465 332.791C270.912 347.725 260.971 360.927 248.43 371.352L245.158 374.071C234.492 382.936 222.176 389.6 208.921 393.679L198.735 396.813C192.945 398.594 186.921 399.5 180.863 399.5H178.301C173.466 399.5 168.663 398.721 164.076 397.192L161.774 396.425C156.985 394.828 152.609 392.19 148.961 388.701C145.044 384.954 142.074 380.329 140.298 375.208L134.501 358.5L129.001 342L123.001 313.5L121.501 295L119.849 279.855C118.953 271.647 119.029 263.362 120.075 255.172L121.501 244V235.963C121.501 233.34 121.055 230.737 120.182 228.263C119.074 225.125 118.657 221.784 118.958 218.47L119.636 211.019C120.209 204.716 121.82 198.552 124.404 192.776Z"
                    fill="var(--off-white)"
                  />
                  <path
                    id="Intersect"
                    d="M119.648 210.889C132.152 210.152 150.87 214.139 153.999 235C153.999 236.5 153.399 240.3 150.999 243.5C148.166 247.167 142.199 256.2 140.999 263L130.499 297C128.833 302.667 129.3 314.2 144.499 315C149.299 315.8 153.333 311.334 154.499 309C157.454 306.045 161.682 305.819 164.765 306.306C166.591 306.594 168.01 307.962 169.671 308.772C172.42 310.11 175.82 309.275 177.499 308.5C181.273 307.557 181.585 299.96 181.061 293.92C181.019 293.435 181.624 293.305 181.741 293.779C182.921 298.566 184.004 304.782 184.499 308C185.699 315.6 177.333 315.167 172.999 314C165.799 312.8 159.499 317.5 157.499 320.5C156.405 321.959 154.673 322.42 153.744 322.49C153.582 322.503 153.418 322.48 153.26 322.441L151.951 322.113L148.871 329.428C148.33 330.714 148.499 332.191 149.316 333.322L154.499 340.5L144.499 339L149.394 350.748L178.499 344C182.823 342.559 188.07 342.041 190.692 340.672C190.829 340.6 190.995 340.697 190.979 340.852C190.793 342.607 189.396 346.604 187.999 348L176.499 361C174.099 363.8 170.499 364.167 168.999 364L149.984 360.099L146.953 364.763C146.005 366.223 145.495 367.92 145.587 369.658C145.854 374.667 146.938 385.471 151.328 390.762C150.51 390.112 149.718 389.427 148.96 388.701C145.043 384.955 142.074 380.33 140.297 375.209L134.5 358.5L129 342L123 313.5L121.5 295L119.848 279.856C118.953 271.648 119.029 263.362 120.075 255.172L121.5 244V235.963C121.5 233.341 121.055 230.737 120.182 228.264C119.074 225.125 118.657 221.785 118.958 218.47L119.635 211.019C119.639 210.975 119.644 210.932 119.648 210.889ZM177.97 152.94C197.583 146.233 219.015 147.253 237.903 155.791L265.94 168.466C275.876 172.958 283.533 181.329 287.123 191.625L303.129 237.53L290.999 267.5C294.999 238.3 290.999 228.5 278.999 224.5C279.999 213.5 274.999 210.667 271.999 209C249.999 211.4 235.833 197 231.499 189.5C218.299 203.1 195.666 195.167 185.999 189.5C183.833 194 175.227 201.699 157.999 197C134.171 190.502 125.982 199.392 120.751 203.834C121.589 200.04 122.812 196.334 124.404 192.776L127.973 184.797C128.655 183.273 129.125 181.663 129.369 180.012C130.371 173.249 135.064 167.611 141.534 165.399L177.97 152.94ZM236.691 251.27C237.053 251.149 237.405 251.459 237.301 251.826C236.24 255.556 232.269 262 222.999 262C215.171 262 208.057 259.242 204.297 257.085C203.814 256.807 204.089 256.328 204.613 256.519C221.217 262.596 231.7 258.79 232.945 252.801C232.983 252.618 233.111 252.463 233.288 252.404L236.691 251.27Z"
                    fill="var(--off-teal)"
                  />

                  <g
                    id="Eye Right"
                    style={{
                      transformOrigin: "213px 245.5px",
                      transform: "scaleY(1.05)",
                    }}
                  >
                    <path
                      ref={rightEyelashRef}
                      id="Eyelash-Right"
                      d="M201.068 241.56L194.353 245.589C194.14 245.717 194.304 246.041 194.532 245.945L203.051 242.396C203.682 242.133 204.35 241.948 205.029 241.867C221.141 239.96 229.929 247.037 232.787 251.178C232.918 251.367 233.154 251.449 233.371 251.377L236.775 250.242C237.117 250.128 237.226 249.696 236.977 249.435C225.94 237.81 210.43 238.445 203.031 240.663C202.337 240.871 201.689 241.188 201.068 241.56Z"
                      fill="var(--off-black)"
                    />
                    <path
                      id="Eye-Right"
                      d="M221.5 245.5C221.5 250.194 217.694 254 213 254C208.306 254 204.5 250.194 204.5 245.5C204.5 240.806 208.306 237 213 237C217.694 237 221.5 240.806 221.5 245.5Z"
                      fill="var(--off-black)"
                    />
                    <path
                      ref={rightEyelidRef}
                      id="Eyelid-Right"
                      d="M237.5 250C225 236 206 239 202 241V232.5H236.5L237.5 250Z"
                      fill="var(--off-white)"
                    />
                    <path
                      ref={rightEyelidBottomRef}
                      id="Eyelid-bottom-right"
                      d="M237 251.5C238 260.5 213 275.5 194 247.5C195.6 262.7 217 264.833 227.5 264C237.5 261.6 238 254.667 237 251.5Z"
                      fill="#FBFFFD"
                    />
                  </g>

                  <g
                    id="Eye Left"
                    style={{
                      transformOrigin: "135px 237.5px",
                      transform: "scaleY(1.08)",
                    }}
                  >
                    <path
                      id="Vector 291"
                      d="M130.002 246C125.602 243.6 125.5 237.5 127.502 235L135.001 233L146.001 235L151.501 239L148.501 246C142.101 250.8 133.5 247.908 130.002 246Z"
                      fill="var(--off-white)"
                    />
                    <path
                      ref={leftEyelashRef}
                      id="Eyelash-Left"
                      d="M119.965 237.201C132.666 229.219 147.56 234.067 152.5 239.5V240.5C142.95 234.399 133.118 234.631 127.135 236.5C124.922 237.399 123.604 238.422 121.5 240L119.843 237.929C119.659 237.699 119.715 237.358 119.965 237.201Z"
                      fill="var(--off-black)"
                    />
                    <path
                      id="Eye-Left"
                      d="M143 237.5C143 241.918 139.418 245.5 135 245.5C130.582 245.5 127 241.918 127 237.5C127 233.082 130.582 229.5 135 229.5C139.418 229.5 143 233.082 143 237.5Z"
                      fill="var(--off-black)"
                    />
                    <path
                      ref={leftEyelidRef}
                      id="Eyelid-Left"
                      d="M124 235C138.5 229.5 148.5 236.5 152.5 239.5C153.3 235.1 152.167 231 151.5 229.5L124 225V235Z"
                      fill="var(--off-teal)"
                    />
                    <path
                      ref={leftEyelidBottomRef}
                      id="Eyelid-bottom-left"
                      d="M149.5 243C148.417 256 129.5 249.396 121.5 240C125.1 251.2 137.333 252.333 143 251.5C149 248.5 149.333 245 149.5 243Z"
                      fill="#C2E9E7"
                    />
                  </g>

                  <g id="upper lip">
                    <path
                      id="Union"
                      d="M143.5 333.5C145.422 331.963 146.882 332.763 147.437 333.42C146.823 332.648 146.743 332.469 151 337.5C155.4 342.699 160.167 338.333 162 335.5C162.667 334 164.6 331.5 167 333.5C170.001 336 180.5 340.5 184 341C184.284 341.04 184.547 341.096 184.789 341.162C186.518 341.394 191.97 341.029 193 340C194.325 338.675 194.87 343.202 190.496 343.93C190.497 343.954 190.5 343.977 190.5 344L189.815 344.01C189.539 344.028 189.248 344.033 188.94 344.022L154 344.5L139.899 336.721C139.747 336.636 139.77 336.409 139.934 336.35C142.354 335.494 141.131 335.395 143.5 333.5Z"
                      fill="#121312"
                    />
                  </g>
                  <path
                    id="Vector 290"
                    d="M160 353C148 351.8 143.333 347.833 142.5 346C142.5 352 148.167 354.167 151 354.5L160.5 356L167.5 357.5C176.3 357.9 180.167 351.667 181 348.5C179 350.5 172 354.2 160 353Z"
                    fill="var(--off-black)"
                  />
                  <path
                    id="bottom lip"
                    d="M148.999 352C140.199 350 141.332 343.167 142.999 338.5C147.398 335.3 151.499 338.5 153 340.5C156.201 343.7 162.334 342.5 165 341.5C171.4 338.7 180.667 342 184.5 344C179.3 358.8 169.333 356.5 165 355L148.999 352Z"
                    fill="#FBFFFD"
                  />
                  <g id="Vector 286">
                    <path
                      d="M166 308.5C160.179 305.864 154.359 309.954 151.41 311.914C151.226 312.037 151.043 311.825 151.186 311.655C156.416 305.42 161.167 304.542 165 305.5C168.349 306.935 175.36 309.744 179.901 305.165C180.052 305.014 180.298 305.151 180.212 305.346C177.977 310.448 168.376 309.926 166 308.5Z"
                      fill="var(--off-black)"
                    />
                    <path
                      d="M141 213C146.833 217.833 162 232.5 148 246.5C154.5 235.5 150 223 141 213Z"
                      fill="var(--off-black)"
                    />
                  </g>
                  <path
                    ref={leftBrowRef}
                    id="Eyebrow-Left"
                    d="M120.499 206.5C119.791 208.622 118.902 210.379 117.899 211.218C117.69 211.393 117.603 211.691 117.733 211.93L120.135 216.334C120.307 216.649 120.75 216.687 121.016 216.446C126.065 211.893 141.624 218.482 149.499 222.5C140.999 204.5 129.999 202.167 126.499 203C125.332 203.167 121.299 204.1 120.499 206.5Z"
                    fill="var(--off-black)"
                  />
                  <path
                    ref={rightBrowRef}
                    id="Eyebrow-Right"
                    d="M192.47 206.449C182.438 206.374 180.054 212.557 180.009 216.903C179.731 220.07 183.469 222.697 185.514 222.412C185.539 222.409 185.564 222.4 185.586 222.386C203.001 211.783 234.438 223.735 248.962 231.516C249.16 231.622 249.341 231.36 249.191 231.194C227.517 207.04 204.864 206.541 192.47 206.449Z"
                    fill="var(--off-black)"
                  />
                  <path
                    id="Hair"
                    d="M85.9981 112C93.1981 100 98 109.5 104 109.5L316.099 108.003C316.357 108.001 316.606 108.098 316.789 108.279C322.822 114.214 323.977 123.635 322.439 128.409C322.25 128.997 322.542 129.664 323.118 129.888C331.723 133.227 333.147 142.378 333.444 147.318C333.488 148.049 333.915 148.695 334.543 149.072C338.056 151.181 339.216 153.924 339.375 156.136C339.476 157.536 340.509 159 341.912 159H345.187C346.563 159 347.528 160.358 347.076 161.657L344.291 169.663C344.106 170.196 344.154 170.783 344.424 171.278L349.435 180.464C349.784 181.104 349.757 181.882 349.366 182.496L347.011 186.197C346.688 186.705 346.611 187.332 346.801 187.903L349.31 195.43C349.649 196.448 348.891 197.5 347.817 197.5C347.055 197.5 346.402 198.047 346.268 198.797L344.294 209.852C344.124 210.806 343.294 211.5 342.326 211.5H340.35C339.534 211.5 338.8 211.996 338.495 212.752L327.5 240C325.833 243 320.6 249.3 313 250.5C305.779 251.641 299.49 263.103 296.88 269.533C296.666 270.06 296.063 270.313 295.54 270.089L290.199 267.8C289.786 267.623 289.542 267.192 289.602 266.747L292 249C294.681 233.678 286.572 225.386 281.635 222.809C281.258 222.612 281.026 222.21 281.055 221.786C281.97 208.487 275.935 203.122 272.628 202.041C272.542 202.012 272.457 202 272.366 201.998C263.153 201.791 244.694 197.423 243.5 181.5C242.348 166.143 234.963 163.991 230.982 164.874C230.674 164.942 230.437 165.174 230.329 165.47L226.5 176C221.815 185.816 216.705 186.964 212.436 184.787C211.343 184.23 212.57 183.034 213.795 183.091C220.374 183.397 222.5 170.281 222.5 167C222.5 159.8 216.25 159.5 215 162C211.357 169.286 205.326 171.086 199.807 171.076C198.683 171.074 198.601 169.442 199.635 169.001C202.721 167.685 203.144 166.029 198 165C183.57 162.114 170.058 163.707 163.089 170.273C162.447 170.877 162.964 171.903 163.845 171.929C169.33 172.092 177.308 174.502 178 183.5C178.593 191.207 167.692 191.153 157.869 189.32C156.687 189.099 156.931 187.653 158.132 187.714C168.539 188.238 177.742 187.754 166.5 183.5C152.038 178.028 136.079 179.749 129.449 181.386C129.161 181.457 128.927 181.656 128.802 181.925L123.352 193.604C122.937 194.492 121.625 194.316 121.46 193.35L119.136 179.792C119.056 179.33 118.664 178.979 118.195 178.988C112.012 179.1 112.45 184.297 113.976 188.271C114.297 189.108 113.511 190.003 112.699 189.624C104.26 185.689 109.068 178.164 112.913 174.581C112.972 174.526 113.025 174.463 113.069 174.396C118.355 166.285 105.949 163.473 98.5572 163.03C98.2096 163.009 97.8733 163.185 97.6863 163.478C89.1963 176.819 103.686 188.389 114.171 193.679C115.04 194.117 114.878 195.374 113.907 195.45C105.732 196.089 97.5581 192.638 94.0952 190.558C94.0299 190.519 93.9702 190.471 93.9159 190.418C75.7895 172.599 83.5366 160.019 90.8683 155.001C91.5354 154.544 91.5301 153.431 91.0187 152.805C89.2933 150.693 89.1785 147.036 89.5255 144.133C89.6353 143.214 88.6752 142.659 88.1844 143.443C86.7777 145.69 86.4662 148.719 86.2725 151.178C86.2285 151.735 85.612 151.749 85.5299 151.195C82.6055 131.473 88.7233 119.717 92.401 116.096C92.4685 116.03 92.5417 115.979 92.6256 115.935C96.7818 113.768 102.4 110.54 92.5 114.5C84.7179 117.613 82.4865 124.763 82.2719 130.06C82.2299 131.097 81.2439 131.378 81.0606 130.356C80.375 126.534 81.0155 120.305 85.9981 112Z"
                    fill="var(--off-black)"
                  />
                  <path
                    id="Pool"
                    d="M318 110C318 116.627 270.094 122 211 122C151.906 122 104 116.627 104 110C104 103.373 151.906 98 211 98C270.094 98 318 103.373 318 110Z"
                    fill="var(--light-green)"
                  />
                </g>

                <image href="/sahil1.svg" x="-30" y="-70" width="450" height="690" />

                <clipPath id="fishermanclip">
                  <rect x="0" y="0" width="210px" height="108" />
                </clipPath>
                <g
                  id="FishermanGroupWrapper"
                  clipPath="url(#fishermanclip)"
                >
                  <g
                    id="Fisherman with Boat"
                    ref={fishermanRef}
                    style={{ transform: "scaleY(1.02)" }}
                  >
                    <path
                      id="Vector 41 (Stroke)"
                      d="M24.041 32.001C42.1258 32.5034 76.0772 35.6801 107.699 44.4121C123.51 48.7781 138.804 54.5504 151.257 62.1143C163.699 69.6718 173.438 79.1002 177.902 90.832L175.098 91.8994C170.962 81.0315 161.838 72.0522 149.699 64.6787C137.57 57.3115 122.565 51.6292 106.9 47.3037C75.5721 38.6528 41.8723 35.4967 23.957 34.999L24.041 32.001Z"
                      fill="var(--off-white)"
                    />
                    <g
                      id="Group 31"
                      style={{
                        transform: "rotate(2deg) translateY(-5px)",
                      }}
                    >
                      <path
                        id="Vector 38"
                        d="M169.365 97.9722C162.038 98.1933 141.886 97.7987 130.528 97.5223C129.184 97.4895 128.363 98.7324 129.311 99.6856C132.602 102.995 140.264 106.411 144.39 107.94C159.032 112.005 186.987 107.835 199.134 105.242C203.542 104.694 207.518 101.749 210.173 99.0834C211.344 97.9078 210.405 96.107 208.747 96.1823L169.365 97.9722Z"
                        fill="var(--off-black)"
                      />
                      <path
                        id="Vector 39"
                        d="M181.866 101.559C165.627 102.915 141.397 100.184 129.574 98.0691C129.337 98.0266 129.373 97.6997 129.614 97.7002C140.017 97.7202 159.272 98.2107 168.204 98.1485L209.493 96.2499C210.011 96.2261 210.168 96.8055 209.684 96.9904C203.485 99.3585 189.161 101.007 181.866 101.559Z"
                        fill="var(--off-white)"
                      />
                    </g>
                    <g id="Group 30">
                      <path
                        id="Vector 40"
                        d="M173.01 77.4609C174.37 74.7406 177.43 75.6473 178.791 76.4407C181.239 78.345 182.078 82.2214 182.191 83.9216L180.831 85.2817C181.103 91.5384 179.584 99.2233 178.791 102.284H175.05C174.234 101.196 173.35 94.5761 173.01 91.4024L171.99 91.7425V85.9618L170.63 86.9819L169.27 86.3019L173.01 77.4609Z"
                        fill="var(--off-black)"
                      />
                      <path
                        id="Ellipse 14"
                        d="M177.089 73.3803C177.089 74.6949 176.023 75.7605 174.708 75.7605C173.394 75.7605 172.328 74.6949 172.328 73.3803C172.328 72.0657 173.394 71 174.708 71C176.023 71 177.089 72.0657 177.089 73.3803Z"
                        fill="var(--off-black)"
                      />
                    </g>
                  </g>
                </g>
              </g>

              <path
                d="M0 -1H375V1H0V-1ZM375 600H0H375ZM0 600V0V600ZM375 0V600V0Z"
                fill="var(--dark-green)"
                mask="url(#path-1-outside-1_1470_10701)"
              />
            </g>

            <defs>
              <linearGradient
                id="paint0_linear_1717_11082"
                x1="145"
                y1="394.5"
                x2="271.002"
                y2="425.583"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--off-teal)" />
                <stop offset="1" stopColor="var(--light-off-teal)" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_1717_11082"
                x1="150"
                y1="394"
                x2="172.836"
                y2="493.766"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--off-teal)" />
                <stop offset="1" stopColor="var(--light-off-teal)" />
              </linearGradient>
              <clipPath id="clip0_1470_10701">
                <rect width="375" height="600" fill="white" />
              </clipPath>
            </defs>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
