import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

import styles from "./HeroMobile.module.css";

import figma_apply from "/icons/figma_apply.png";
import figma_cancel from "/icons/figma_cancel.png";
import figma_search from "/icons/figma_search.png";
import box_anchor from "/box_anchor.svg";


// Create the named ease once
(() => {
  try {
    CustomEase.create("wave", "M0,0 C0.6,0, 0.1,1.4, 1,1");
  } catch {
    // ease may already exist; ignore
  }
})();

const fonts = Object.freeze([
  { label: "Next.js",      fontFamily: "Abril Fatface" },
  { label: "React.js",     fontFamily: "Lobster" },
  { label: "TypeScript",   fontFamily: "Lora" },
  { label: "JavaScript",   fontFamily: "Merriweather" },
  { label: "Tailwind CSS", fontFamily: "Montserrat" },
  { label: "Shadcn/UI",    fontFamily: "Oswald" },
  { label: "Node.js",      fontFamily: "Pacifico" },
  { label: "Express.js",   fontFamily: "Roboto Flex" },
  { label: "GitHub",       fontFamily: "Stara" },
]);

const Hero = ({ isLoaded }) => {
  const lenis = useLenis();

  gsap.config({
    force3D: true,
  });

  // Font state
  const [fontWrapperState, setFontWrapperState] = useState("Stara");
  const fontStateRef = useRef("Stara");
  const [fontMenuHovered, setFontMenuHovered] = useState(false);

  // mid-top typing animation state
  const DEFAULT_MID_TOP = "Choose a font with me";
  const HOVER_MID_TOP   = "Sahil is happy";
  const [midTopText,        setMidTopText]        = useState(DEFAULT_MID_TOP);
  const [midTopHighlighted, setMidTopHighlighted] = useState(false);
  const [midTopCursor,      setMidTopCursor]      = useState(false);
  const midTopTimers = useRef([]);

  const fishermanRef = useRef(null);

  // Refs for SVG parts
  const fishingLineRef = useRef(null);
  const fontRefs = useRef([]);
  const parallaxGroupRef = useRef(null);
  const meSvgRef = useRef(null);
  const leftIrisRef = useRef(null);
  const rightIrisRef = useRef(null);
  const leftBrowRef = useRef(null);
  const rightBrowRef = useRef(null);

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

  const rippleRef = useRef(null);
  const previousBlinkRef = useRef("single");

  // Timelines
  const t1 = useRef(null);

  // Scrolling state (via Lenis)
  const isScrollingRef = useRef(false);
  const stopTimerRef = useRef(null);

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

  const animateMidTop = useCallback((targetText, stopCursor = false) => {
    midTopTimers.current.forEach(clearTimeout);
    midTopTimers.current = [];

    setMidTopHighlighted(true);
    setMidTopCursor(false);

    const tClear = setTimeout(() => {
      setMidTopHighlighted(false);
      setMidTopText("");
      setMidTopCursor(true);
    }, 380);
    midTopTimers.current.push(tClear);

    const TYPE_DELAY = 560;
    const CHAR_MS    = 48;
    for (let i = 1; i <= targetText.length; i++) {
      const tChar = setTimeout(() => {
        setMidTopText(targetText.slice(0, i));
      }, TYPE_DELAY + i * CHAR_MS);
      midTopTimers.current.push(tChar);
    }

    if (stopCursor) {
      const tDone = setTimeout(() => {
        setMidTopCursor(false);
      }, TYPE_DELAY + targetText.length * CHAR_MS + 120);
      midTopTimers.current.push(tDone);
    }
  }, []);

  // Eye animations
  const animateEyesRight = useCallback(() => {
    gsap.to(leftIrisRef.current, {
      attr: {
        d: "M114.146 163.554C114.146 166.66 111.628 169.178 108.522 169.178C105.416 169.178 102.898 166.66 102.898 163.554C102.898 160.449 105.416 157.931 108.522 157.931C111.628 157.931 114.146 160.449 114.146 163.554Z",
      },
      duration: d,
      ease: "power3.out",
    });
    gsap.to(rightIrisRef.current, {
      attr: {
        d: "M169.333 169.177C169.333 172.477 166.658 175.153 163.358 175.153C160.058 175.153 157.383 172.477 157.383 169.177C157.383 165.877 160.058 163.202 163.358 163.202C166.658 163.202 169.333 165.877 169.333 169.177Z",
      },
      duration: d,
      ease: "power3.out",
    });
    gsap.to(leftBrowRef.current, {
      attr: {
        d: "M92.7137 139.465C92.2165 140.956 91.5911 142.191 90.8861 142.781C90.7393 142.904 90.6782 143.114 90.7698 143.282L92.4583 146.377C92.5792 146.599 92.8903 146.625 93.0777 146.456C96.6263 143.256 107.564 147.888 113.1 150.712C107.125 138.059 99.3919 136.418 96.9315 137.004C96.1114 137.121 93.2761 137.777 92.7137 139.465Z",
      },
      duration: d,
      ease: "power3.out",
    });
    gsap.to(rightBrowRef.current, {
      attr: {
        d: "M143.294 139.429C136.242 139.377 134.566 143.723 134.534 146.778C134.339 149.005 136.967 150.851 138.404 150.651C138.422 150.648 138.439 150.642 138.455 150.632C150.698 143.179 172.797 151.581 183.007 157.051C183.146 157.125 183.273 156.941 183.168 156.824C167.931 139.845 152.007 139.494 143.294 139.429Z",
      },
      duration: d,
      ease: "power3.out",
    });
  }, []);

  const animateEyesLeft = useCallback(() => {
    gsap.to(leftIrisRef.current, {
      attr: {
        d: "M109.146 162.554C109.146 165.66 106.628 168.178 103.522 168.178C100.416 168.178 97.8984 165.66 97.8984 162.554C97.8984 159.449 100.416 156.931 103.522 156.931C106.628 156.931 109.146 159.449 109.146 162.554Z",
      },
      duration: d,
      ease: "power3.out",
    });
    gsap.to(rightIrisRef.current, {
      attr: {
        d: "M164.333 168.177C164.333 171.477 161.658 174.153 158.358 174.153C155.058 174.153 152.383 171.477 152.383 168.177C152.383 164.877 155.058 162.202 158.358 162.202C161.658 162.202 164.333 164.877 164.333 168.177Z",
      },
      duration: d,
      ease: "power3.out",
    });
    gsap.to(leftBrowRef.current, {
      attr: {
        d: "M92.7137 141.465C92.2165 142.956 91.5911 144.191 90.8861 144.781C90.7393 144.904 90.6782 145.114 90.7698 145.282L92.4583 148.377C92.5792 148.599 92.8903 148.625 93.0777 148.456C96.6263 145.256 107.564 149.888 113.1 152.712C107.125 140.059 99.3919 138.418 96.9315 139.004C96.1114 139.121 93.2761 139.777 92.7137 141.465Z",
      },
      duration: d,
      ease: "power3.out",
    });
    gsap.to(rightBrowRef.current, {
      attr: {
        d: "M143.294 141.429C136.242 141.377 134.566 145.723 134.534 148.778C134.339 151.005 136.967 152.851 138.404 152.651C138.422 152.648 138.439 152.642 138.455 152.632C150.698 145.179 172.797 153.581 183.007 159.051C183.146 159.125 183.273 158.941 183.168 158.824C167.931 141.845 152.007 141.494 143.294 141.429Z",
      },
      duration: d,
      ease: "power3.out",
    });
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

  useEffect(() => {
    if (!isLoaded) animateEyesLeft();
    else animateEyesRight();
  }, [isLoaded, animateEyesLeft, animateEyesRight]);

  // Lenis-driven scroll
  useEffect(() => {
    if (!lenis) return;

    const STOP_DELAY = 160;
    const VELOCITY_EPS = 0.02;

    const onLenisScroll = ({ velocity }) => {
      const v = Math.abs(velocity || 0);

      if (v > VELOCITY_EPS && !isScrollingRef.current) {
        isScrollingRef.current = true;
        animateEyesLeft();
      }

      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        if (isScrollingRef.current) {
          isScrollingRef.current = false;
          animateEyesRight();
        }
      }, STOP_DELAY);
    };

    lenis.on("scroll", onLenisScroll);
    return () => {
      lenis.off("scroll", onLenisScroll);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [lenis, animateEyesLeft, animateEyesRight]);

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

      // Close eyes
      blinkTl
        .to(
          rightEyelidRef.current,
          {
            attr: {
              d: "M174.955 169.663C165.465 165.094 153.163 164.391 150 164.743V157.361H174.252L174.955 169.663Z",
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
              d: "M174.603 170.015C161.106 166.078 148.827 166.5 144.375 167.203C145.5 177.888 160.543 179.388 167.925 178.802C174.954 177.115 175.306 172.241 174.603 170.015Z",
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
              d: "M149.344 165.136L144.624 166.562C144.475 166.652 144.59 166.88 144.751 166.813L150.725 166.562C151.169 166.377 151.634 166.619 152.112 166.562C163.359 167.203 168.983 168.608 171.643 170.491C171.734 170.624 171.9 170.682 172.053 170.631L174.445 169.833C174.686 169.753 174.763 169.449 174.588 169.265C165.82 165.445 156.31 164.742 150.706 164.742C150.218 164.888 150.003 164.742 149.344 165.136Z",
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
              d: "M95.1719 159.47C105.365 158.415 112.395 160.173 115.207 162.282C115.769 159.189 114.972 155.604 114.504 154.549L95.1719 151.386V159.47Z",
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
              d: "M113.097 164.041C108.598 161.229 98.3349 161.229 93.4141 161.932C95.9448 169.805 104.544 170.602 108.528 170.016C112.465 168.047 112.98 165.447 113.097 164.041Z",
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
              d: "M92.3339 159.964C101.849 158.064 111.339 159.822 115.205 161.58V162.283C107.472 162.986 101.849 161.58 97.374 161.58C95.8187 162.211 94.8921 160.822 93.4128 161.931L92.2481 160.475C92.1187 160.313 92.1585 160.074 92.3339 159.964Z",
            },
            duration: 0.1,
            ease: "power2.in",
          },
          0
        )
        // Brief pause while closed
        .to({}, { duration: 0.05 })
        // Open eyes
        .to(
          rightEyelidRef.current,
          {
            attr: {
              d: "M174.955 169.935C166.168 160.093 152.812 162.202 150 163.608V157.633H174.252L174.955 169.935Z",
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
              d: "M174.603 170.015C176.5 178.802 154 183 144.375 167.203C145.5 177.888 160.543 179.388 167.925 178.802C174.954 177.115 175.306 172.241 174.603 170.015Z",
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
              d: "M149.344 164.002L144.624 166.834C144.475 166.924 144.59 167.152 144.751 167.084L150.738 164.59C151.182 164.405 151.652 164.274 152.13 164.218C163.455 162.877 169.633 167.852 171.643 170.763C171.734 170.895 171.9 170.954 172.053 170.903L174.445 170.105C174.686 170.025 174.763 169.721 174.588 169.537C166.829 161.365 155.926 161.812 150.725 163.371C150.237 163.517 149.781 163.74 149.344 164.002Z",
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
              d: "M95.1719 158.687C105.365 154.821 112.395 159.741 115.207 161.85C115.769 158.757 114.972 155.875 114.504 154.821L95.1719 151.657V158.687Z",
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
              d: "M113.5 165.5C113 169.5 99 173.5 93.4141 161.932C95.9448 169.805 104.544 170.602 108.528 170.016C112.465 168.048 113.383 166.906 113.5 165.5Z",
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
              d: "M92.3261 160.235C101.254 154.623 111.725 158.031 115.197 161.851V162.554C108.484 158.265 101.573 158.428 97.3662 159.742C95.8109 160.374 94.8843 161.093 93.405 162.202L92.2403 160.746C92.1109 160.585 92.1507 160.345 92.3261 160.235Z",
            },
            duration: 0.12,
            ease: "power2.out",
          },
          "<"
        );

      return blinkTl;
    };

    const performBlinkGroup = () => {
    let isDoubleBlink;

    // Determine probability based on previous blink
    if (previousBlinkRef.current === "double") {
        // After double blink, more likely to do single blink (70% single, 30% double)
        isDoubleBlink = Math.random() < 0.3;
    } else {
        // After single blink, more likely to do double blink (40% single, 60% double)
        isDoubleBlink = Math.random() < 0.6;
    }

    if (isDoubleBlink) {
        // First blink
        createSingleBlink();

        // Second blink after short delay (0.3 seconds)
        blinkTimeout = setTimeout(() => {
        createSingleBlink();
        previousBlinkRef.current = "double";
        scheduleNextGroup();
        }, 300);
    } else {
        // Single blink
        createSingleBlink();
        previousBlinkRef.current = "single";
        scheduleNextGroup();
    }
    };

    const scheduleNextGroup = () => {
      const delay = 1.5 + Math.random() * 0.5;
      blinkTimeout = setTimeout(() => {
        performBlinkGroup();
      }, delay * 1000);
    };

    blinkTimeout = setTimeout(() => {
      performBlinkGroup();
    }, (1.5 + Math.random() * 0.5) * 1000);

    return () => {
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, []);

  // Fishing line up/down
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
      .fromTo(line,
        {
            height: "380px",
        },
        {
        height: "604px",
        duration: 5.6,
        ease: "linear",
      })
      .to(line, {
        height: "380px",
        duration: 5.6,
        ease: "linear",
      });

    return () => {
      t1.current?.kill();
      t1.current = null;
    };
  }, [checkIntersection]);

    // Ripple animation
        // Update the ripple animation useGSAP hook
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
        scaleY: 1.0,
        transformOrigin: "top center",
        duration: 1.5,
        ease: "sine.inOut",
        });

    masterTl.add(fishermanTl, 0);

    return () => masterTl.kill();
    }, []);

    // Wave animation
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

    return () => t2.kill();
  }, []);

  // Parallax
  useGSAP(() => {
    if (!parallaxGroupRef.current || !meSvgRef.current) return;

    gsap.to(parallaxGroupRef.current, {
      y: 60,
      ease: "none",
      scrollTrigger: {
        trigger: meSvgRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  }, []);

  useEffect(() => {
    if (!lenis) return;
    const update = () => ScrollTrigger.update();
    lenis.on("scroll", update);
    return () => {
      lenis.off("scroll", update);
    };
  }, [lenis]);

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        height: "878px",
        padding: "30px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        borderRadius: "9px",
      }}
    >
      <div className={styles["hero-text"]}>
        <div className={styles["wrapper-top"]}>
          <h1 style={titleStyle}>Fullstack</h1>
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

      <svg
        ref={meSvgRef}
        className={styles["me"]}
        width="287"
        height="321"
        viewBox="0 0 287 321"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Frame 2585">
          <g clipPath="url(#clip0_1875_13046)">
            <path
              d="M0 9C0 4.02943 4.02944 0 9 0H278C282.971 0 287 4.02944 287 9V312C287 316.971 282.971 321 278 321H9C4.02944 321 0 316.971 0 312V9Z"
              fill="var(--dark-green)"
            />
            <path
              ref={rect4Ref}
              id="rect-4"
              d="M0 0H287V165H0V0Z"
              fill="var(--hero-bg-4)"
            />
            <path
              ref={rect3Ref}
              id="rect-3"
              d="M0 0H287V150H0V0Z"
              fill="var(--hero-bg-3)"
            />
            <path
              ref={rect2Ref}
              id="rect-2"
              d="M0 0H287V120H0V0Z"
              fill="var(--hero-bg-2)"
            />
            <path
              ref={rect1Ref}
              id="rect-1"
              d="M0 0H287V60H0V0Z"
              fill="var(--hero-bg-1)"
            />
            <g id="parallax-group" ref={parallaxGroupRef}>
              <image href="/sahil1.svg" x="0" y="-44" width="287" height="430" />
              <g id="Face" display="none">
                <path
                  id="Vector 281"
                  d="M32.9554 291.197L113.094 263.078L202.02 264.484L292 333.727H8L13.6238 312.638C16.998 299.984 27.9175 293.072 32.9554 291.197Z"
                  fill="#121312"
                />
                <path
                  id="Neck BG"
                  d="M108.176 293.005C109.863 280.914 114.971 271.33 117.314 268.049V225.52L213.62 199.861L211.862 216.03C207.363 223.341 205.067 249.304 204.481 261.371C205.044 267.276 210.808 277.188 213.62 281.406C217.275 302.776 188.43 325.693 173.551 334.48H112.041L108.176 323.233C104.801 311.704 106.77 298.277 108.176 293.005Z"
                  fill="#FBFFFD"
                />
                <path
                  id="Neck Intersect 3"
                  d="M209.048 210.707C196.279 259.959 165.979 274.061 144.532 279.397C138.445 280.912 132.086 280.609 125.982 279.164L112.555 275.983C114.318 271.734 116.154 268.568 117.313 266.945V255.933L209.048 210.707Z"
                  fill="url(#paint0_linear_1875_13046)"
                />
                <path
                  id="Neck Intersect 2"
                  d="M205.583 245.464C205.028 251.111 204.665 256.402 204.477 260.267C205.039 266.172 210.804 276.084 213.616 280.302C215.803 293.087 206.355 306.425 195.227 316.96L205.583 245.464Z"
                  fill="#ECF8F5"
                />
                <path
                  id="Neck Intersect 1"
                  d="M129.688 333.376H112.041L108.176 322.128C104.801 310.6 106.77 297.173 108.176 291.901C109.722 280.82 114.141 271.846 116.672 267.898L118.719 266.594L129.688 333.376Z"
                  fill="url(#paint1_linear_1875_13046)"
                />
                <path
                  id="Face BG"
                  d="M95.4497 129.005L97.9591 123.395C98.4382 122.324 98.7684 121.193 98.9403 120.032C99.6447 115.278 102.944 111.314 107.492 109.759L133.105 101.001C146.893 96.2867 161.958 97.0035 175.236 103.006L194.945 111.915C201.93 115.073 207.313 120.958 209.837 128.196L223.963 168.709C224.217 169.439 225.148 169.651 225.694 169.105C225.841 168.958 226.027 168.859 226.23 168.818L230.329 167.998C230.903 167.883 231.468 167.727 232.019 167.53L234.221 166.744C235.443 166.307 236.779 166.311 237.999 166.755C239.275 167.218 240.337 168.132 240.987 169.323L241.358 170.003C241.839 170.886 242.141 171.855 242.247 172.856L242.493 175.198C242.69 177.069 242.614 178.958 242.267 180.807L241.736 183.643L239.978 192.781L238.754 198.166C238.4 199.726 237.859 201.237 237.144 202.667C235.998 204.959 234.421 207.009 232.499 208.705L229.434 211.41L223.986 216.284C223.169 217.015 222.259 217.633 221.279 218.123L220.332 218.597C218.706 219.41 216.871 219.708 215.071 219.451L213.812 219.271C213.222 219.187 212.661 218.962 212.175 218.615C211.108 217.852 210.52 216.584 210.629 215.277L211.092 209.72C211.104 209.575 210.904 209.524 210.846 209.658L203.047 227.431C198.441 237.929 191.452 247.21 182.636 254.538L180.336 256.45C172.838 262.682 164.181 267.366 154.862 270.233L147.702 272.437C143.632 273.689 139.397 274.326 135.139 274.326H133.337C129.939 274.326 126.562 273.778 123.338 272.703L121.72 272.164C118.353 271.041 115.277 269.187 112.712 266.734C109.959 264.1 107.871 260.849 106.622 257.249L102.548 245.504L98.6812 233.905L94.4634 213.87L93.4089 200.865L92.2475 190.219C91.618 184.449 91.6713 178.625 92.4063 172.867L93.4089 165.014V159.364C93.4089 157.52 93.0954 155.69 92.4818 153.951C91.7031 151.745 91.4096 149.397 91.6215 147.067L92.0976 141.829C92.5004 137.399 93.633 133.065 95.4497 129.005Z"
                  fill="#FBFFFD"
                />
                <path
                  id="Intersect"
                  d="M92.1062 141.738C100.896 141.22 114.055 144.023 116.254 158.687C116.254 159.742 115.833 162.413 114.145 164.662C112.154 167.24 107.959 173.59 107.116 178.37L99.7345 202.271C98.5629 206.255 98.8911 214.362 109.576 214.925C112.95 215.487 115.786 212.347 116.606 210.707C118.683 208.63 121.655 208.471 123.822 208.813C125.106 209.016 126.103 209.977 127.271 210.546C129.203 211.487 131.594 210.9 132.774 210.355C135.427 209.692 135.647 204.352 135.278 200.106C135.248 199.765 135.673 199.674 135.756 200.007C136.585 203.372 137.347 207.742 137.695 210.004C138.538 215.347 132.657 215.042 129.611 214.222C124.549 213.378 120.121 216.682 118.715 218.791C117.945 219.817 116.728 220.141 116.075 220.19C115.961 220.199 115.846 220.183 115.735 220.155L114.815 219.925L112.65 225.067C112.269 225.971 112.387 227.009 112.962 227.805L116.606 232.851L109.576 231.796L113.017 240.055L133.477 235.311C136.516 234.298 140.205 233.934 142.048 232.971C142.145 232.921 142.261 232.989 142.25 233.098C142.119 234.332 141.137 237.141 140.155 238.123L132.071 247.261C130.384 249.23 127.853 249.488 126.799 249.37L113.431 246.628L111.301 249.906C110.634 250.933 110.276 252.126 110.341 253.348C110.529 256.869 111.29 264.464 114.377 268.183C113.802 267.726 113.245 267.244 112.712 266.735C109.959 264.101 107.871 260.85 106.622 257.25L102.547 245.504L98.6807 233.905L94.4629 213.87L93.4084 200.865L92.2469 190.219C91.6174 184.449 91.6712 178.625 92.4062 172.867L93.4084 165.014V159.364C93.4084 157.52 93.0952 155.69 92.4817 153.952C91.703 151.745 91.4097 149.397 91.6215 147.067L92.0972 141.829C92.1 141.798 92.1033 141.768 92.1062 141.738ZM133.105 101.001C146.892 96.2867 161.958 97.0035 175.236 103.006L194.945 111.916C201.93 115.073 207.313 120.958 209.837 128.196L221.088 160.466L212.561 181.534C215.373 161.007 212.561 154.118 204.126 151.306C204.829 143.573 201.314 141.582 199.205 140.41C183.74 142.097 173.781 131.974 170.734 126.702C161.455 136.262 145.545 130.686 138.749 126.702C137.226 129.865 131.177 135.277 119.066 131.974C102.316 127.406 96.5591 133.656 92.8819 136.778C93.4711 134.111 94.3303 131.506 95.4494 129.005L97.9585 123.396C98.4377 122.325 98.7683 121.193 98.9402 120.032C99.6446 115.278 102.944 111.314 107.491 109.759L133.105 101.001ZM174.384 170.124C174.638 170.039 174.886 170.257 174.813 170.515C174.067 173.137 171.276 177.667 164.759 177.667C159.256 177.667 154.255 175.729 151.612 174.212C151.273 174.017 151.466 173.68 151.834 173.814C163.506 178.086 170.876 175.411 171.75 171.201C171.777 171.072 171.867 170.963 171.992 170.921L174.384 170.124Z"
                  fill="#C2E9E7"
                />
                <g id="Eye Right">
                  <path
                    ref={rightEyelashRef}
                    id="Eyelash-Right"
                    d="M149.344 164.002L144.624 166.834C144.475 166.924 144.59 167.152 144.751 167.084L150.738 164.59C151.182 164.405 151.652 164.274 152.13 164.218C163.455 162.877 169.633 167.852 171.643 170.763C171.734 170.895 171.9 170.954 172.053 170.903L174.445 170.105C174.686 170.025 174.763 169.721 174.588 169.537C166.829 161.365 155.926 161.812 150.725 163.371C150.237 163.517 149.781 163.74 149.344 164.002Z"
                    fill="#121312"
                  />
                  <path
                    ref={rightIrisRef}
                    id="Eye-Right"
                    d="M164.333 168.177C164.333 171.477 161.658 174.153 158.358 174.153C155.058 174.153 152.383 171.477 152.383 168.177C152.383 164.877 155.058 162.202 158.358 162.202C161.658 162.202 164.333 164.877 164.333 168.177Z"
                    fill="#121312"
                  />
                  <path
                    ref={rightEyelidRef}
                    id="Eyelid-Right"
                    d="M174.955 169.935C166.168 160.093 152.812 162.202 150 163.608V157.633H174.252L174.955 169.935Z"
                    fill="#FBFFFD"
                  />
                  <path
                    ref={rightEyelidBottomRef}
                    id="Eyelid-bottom-right"
                    d="M174.603 170.015C176.5 178.802 154 183 144.375 167.203C145.5 177.888 160.543 179.388 167.925 178.802C174.954 177.115 175.306 172.241 174.603 170.015Z"
                    fill="#FBFFFD"
                  />
                </g>
                <g id="Eye Left">
                  <path
                    id="Vector 291"
                    d="M99.3878 167.123C96.2947 165.436 96.2229 161.148 97.6305 159.39L102.902 157.984L110.634 159.39L114.501 162.202L112.392 167.123C107.893 170.497 101.847 168.464 99.3878 167.123Z"
                    fill="#FBFFFD"
                  />
                  <path
                    ref={leftEyelashRef}
                    id="Eyelash-Left"
                    d="M92.3261 160.235C101.254 154.623 111.725 158.031 115.197 161.851V162.554C108.484 158.265 101.573 158.428 97.3662 159.742C95.8109 160.374 94.8843 161.093 93.405 162.202L92.2403 160.746C92.1109 160.585 92.1507 160.345 92.3261 160.235Z"
                    fill="#121312"
                  />
                  <path
                    ref={leftIrisRef}
                    id="Eye-Left"
                    d="M109.146 162.554C109.146 165.66 106.628 168.178 103.522 168.178C100.416 168.178 97.8984 165.66 97.8984 162.554C97.8984 159.449 100.416 156.931 103.522 156.931C106.628 156.931 109.146 159.449 109.146 162.554Z"
                    fill="#121312"
                  />
                  <path
                    ref={leftEyelidRef}
                    id="Eyelid-Left"
                    d="M95.1719 158.687C105.365 154.821 112.395 159.741 115.207 161.85C115.769 158.757 114.972 155.875 114.504 154.821L95.1719 151.657V158.687Z"
                    fill="#C2E9E7"
                  />
                  <path
                    ref={leftEyelidBottomRef}
                    id="Eyelid-bottom-left"
                    d="M113.5 165.5C113 169.5 99 173.5 93.4141 161.932C95.9448 169.805 104.544 170.602 108.528 170.016C112.465 168.048 113.383 166.906 113.5 165.5Z"
                    fill="#C2E9E7"
                  />
                </g>
                <path
                  id="Union"
                  d="M108.877 227.93C110.227 226.849 111.254 227.412 111.644 227.873C111.213 227.331 111.156 227.205 114.149 230.742C117.242 234.397 120.593 231.327 121.882 229.336C122.35 228.281 123.709 226.524 125.396 227.93C127.506 229.687 134.887 232.851 137.347 233.202C137.547 233.231 137.731 233.269 137.902 233.316C141.117 233.479 142.841 233.223 143.565 232.499C144.496 231.568 144.879 234.75 141.805 235.262C141.805 235.279 141.807 235.295 141.807 235.311L141.325 235.318C141.132 235.331 140.927 235.334 140.71 235.327L116.258 235.662L106.346 230.194C106.238 230.135 106.254 229.975 106.37 229.934C108.071 229.331 107.211 229.262 108.877 227.93Z"
                  fill="#121312"
                />
                <path
                  id="Vector 290"
                  d="M120.474 242.342C112.038 241.498 108.758 238.71 108.172 237.421C108.172 241.639 112.155 243.162 114.147 243.396L120.825 244.451L125.746 245.505C131.932 245.786 134.65 241.404 135.236 239.178C133.83 240.584 128.909 243.185 120.474 242.342Z"
                  fill="#121312"
                />
                <path
                  id="Vector 284"
                  d="M112.741 240.935C106.554 239.529 107.351 234.725 108.523 231.445C111.615 229.195 114.498 231.445 115.553 232.85C117.804 235.1 122.115 234.256 123.989 233.553C128.488 231.585 135.002 233.905 137.697 235.311C134.042 245.715 127.035 244.098 123.989 243.044L112.741 240.935Z"
                  fill="#FBFFFD"
                />
                <g id="Vector 286">
                  <path
                    d="M124.691 211.059C120.6 209.206 116.508 212.081 114.435 213.46C114.305 213.546 114.177 213.397 114.278 213.277C117.954 208.894 121.294 208.277 123.988 208.951C126.343 209.959 131.271 211.934 134.464 208.715C134.569 208.609 134.742 208.705 134.682 208.842C133.111 212.429 126.362 212.062 124.691 211.059Z"
                    fill="#121312"
                  />
                  <path
                    d="M107.117 143.926C111.218 147.323 121.88 157.634 112.038 167.475C116.607 159.743 113.444 150.955 107.117 143.926Z"
                    fill="#121312"
                  />
                </g>
                <path
                  ref={leftBrowRef}
                  id="Eyebrow-Left"
                  d="M92.7137 141.465C92.2165 142.956 91.5911 144.191 90.8861 144.781C90.7393 144.904 90.6782 145.114 90.7698 145.282L92.4583 148.377C92.5792 148.599 92.8903 148.625 93.0777 148.456C96.6263 145.256 107.564 149.888 113.1 152.712C107.125 140.059 99.3919 138.418 96.9315 139.004C96.1114 139.121 93.2761 139.777 92.7137 141.465Z"
                  fill="#121312"
                />
                <path
                  ref={rightBrowRef}
                  id="Eyebrow-Right"
                  d="M143.294 141.429C136.242 141.377 134.566 145.723 134.534 148.778C134.339 151.005 136.967 152.851 138.404 152.651C138.422 152.648 138.439 152.642 138.455 152.632C150.698 145.179 172.797 153.581 183.007 159.051C183.146 159.125 183.273 158.941 183.168 158.824C167.931 141.845 152.007 141.494 143.294 141.429Z"
                  fill="#121312"
                />
                <path
                  id="Hair"
                  d="M68.4441 72.9253C73.5055 64.4896 76.8811 71.1679 81.0989 71.1679L230.198 70.1154C230.379 70.1141 230.555 70.1824 230.684 70.3092C234.924 74.4814 235.736 81.1044 234.655 84.46C234.522 84.8735 234.727 85.3426 235.132 85.4998C241.181 87.8473 242.182 94.2801 242.391 97.7528C242.422 98.2664 242.722 98.7204 243.163 98.9852C245.633 100.468 246.449 102.396 246.561 103.951C246.632 104.935 247.357 105.965 248.344 105.965H250.646C251.613 105.965 252.292 106.919 251.974 107.833L250.016 113.461C249.886 113.835 249.92 114.248 250.11 114.596L253.632 121.053C253.877 121.503 253.859 122.05 253.584 122.482L251.928 125.083C251.701 125.441 251.647 125.881 251.781 126.283L253.544 131.574C253.783 132.29 253.25 133.029 252.495 133.029C251.959 133.029 251.501 133.413 251.406 133.941L250.019 141.712C249.899 142.383 249.316 142.871 248.635 142.871H247.246C246.672 142.871 246.156 143.219 245.942 143.751L238.213 162.905C237.041 165.014 233.362 169.443 228.02 170.287C222.943 171.088 218.523 179.146 216.688 183.666C216.537 184.037 216.114 184.215 215.746 184.057L211.991 182.448C211.701 182.323 211.529 182.02 211.571 181.707L213.257 169.232C215.142 158.461 209.441 152.632 205.971 150.82C205.706 150.682 205.543 150.4 205.563 150.101C206.207 140.752 201.964 136.981 199.64 136.221C199.579 136.201 199.519 136.192 199.455 136.191C192.979 136.046 180.003 132.975 179.163 121.782C178.354 110.986 173.162 109.473 170.363 110.094C170.147 110.142 169.98 110.305 169.905 110.513L167.213 117.915C163.919 124.816 160.327 125.623 157.326 124.092C156.558 123.7 157.42 122.86 158.282 122.9C162.906 123.115 164.401 113.895 164.401 111.589C164.401 106.527 160.007 106.316 159.129 108.074C156.568 113.195 152.328 114.461 148.448 114.454C147.658 114.452 147.6 113.305 148.328 112.995C150.497 112.07 150.794 110.906 147.178 110.183C137.035 108.154 127.535 109.274 122.636 113.889C122.185 114.314 122.549 115.035 123.168 115.053C127.024 115.168 132.632 116.862 133.119 123.188C133.535 128.605 125.872 128.567 118.967 127.278C118.136 127.123 118.308 126.107 119.152 126.15C126.468 126.518 132.938 126.178 125.035 123.188C114.868 119.341 103.65 120.551 98.9888 121.701C98.786 121.751 98.6221 121.891 98.5338 122.08L94.7026 130.29C94.4113 130.914 93.4891 130.791 93.3727 130.112L91.7389 120.581C91.6831 120.256 91.4074 120.009 91.0776 120.015C86.7313 120.094 87.0391 123.748 88.1115 126.541C88.3374 127.13 87.7851 127.759 87.2138 127.493C81.2818 124.726 84.6618 119.436 87.3647 116.917C87.4057 116.879 87.4434 116.835 87.474 116.788C91.1898 111.086 82.4692 109.109 77.2728 108.797C77.0284 108.783 76.792 108.906 76.6606 109.113C70.6924 118.491 80.878 126.624 88.249 130.343C88.86 130.651 88.7455 131.535 88.0632 131.588C82.3163 132.037 76.5704 129.611 74.1361 128.149C74.0902 128.121 74.0482 128.088 74.01 128.05C61.2678 115.524 66.7137 106.681 71.8677 103.153C72.3367 102.832 72.3329 102.05 71.9734 101.61C70.7605 100.125 70.6798 97.5544 70.9237 95.5134C71.0009 94.8676 70.326 94.4772 69.981 95.0285C68.9921 96.6084 68.7732 98.7372 68.637 100.466C68.6061 100.858 68.1727 100.867 68.115 100.478C66.0592 86.6141 70.3598 78.3498 72.9452 75.8047C72.9926 75.758 73.044 75.722 73.103 75.6912C76.0247 74.1677 79.9741 71.899 73.0147 74.6827C67.5441 76.8709 65.9755 81.8974 65.8247 85.6207C65.7952 86.3498 65.102 86.5472 64.9732 85.8289C64.4912 83.1419 64.9415 78.763 68.4441 72.9253Z"
                  fill="#121312"
                />
                <path
                  id="Pool"
                  d="M231.545 71.5187C231.545 76.1775 197.869 79.9543 156.327 79.9543C114.786 79.9543 81.1094 76.1775 81.1094 71.5187C81.1094 66.8598 114.786 63.083 156.327 63.083C197.869 63.083 231.545 66.8598 231.545 71.5187Z"
                  fill="#4EDF88"
                />
              </g>
              <clipPath id="fishermanclip">
                <rect x="0" y="0" width="160px" height="70px" />
              </clipPath>
              <g
                id="FishermanGroupWrapper"
                clipPath="url(#fishermanclip)"
                transform = "translate(-6, 0)"
              >
                <g id="Fisherman with Boat" ref={fishermanRef}>
                  <path
                    id="Vector 41 (Stroke)"
                    d="M37.0534 21C48.5579 21.3196 62.1556 23.3404 82.2716 28.8952C92.3294 31.6725 102.059 35.3446 109.98 40.1562C117.895 44.9638 124.091 50.9616 126.931 58.4247L125.146 59.1037C122.516 52.1902 116.712 46.4781 108.989 41.7876C101.274 37.101 91.7282 33.4863 81.7635 30.7347C61.8344 25.2315 48.3966 23.2237 37 22.9072L37.0534 21Z"
                    fill="#FBFFFD"
                  />
                  <g id="Group 31">
                    <path
                      id="Vector 38"
                      d="M121.494 64.0931C116.307 64.2496 102.042 63.9703 94.0015 63.7746C93.0501 63.7514 92.4687 64.6313 93.1398 65.306C95.4698 67.6486 100.893 70.0665 103.814 71.149C114.179 74.0264 133.968 71.0748 142.566 69.2394C145.686 68.851 148.501 66.7664 150.38 64.8797C151.209 64.0475 150.544 62.7728 149.371 62.8261L121.494 64.0931Z"
                      fill="#121312"
                    />
                    <path
                      id="Vector 39"
                      d="M130.343 66.6317C118.847 67.5918 101.695 65.6587 93.3262 64.1614C93.1581 64.1313 93.1837 63.8999 93.3545 63.9002C100.719 63.9144 114.349 64.2616 120.672 64.2176L149.899 62.8736C150.266 62.8568 150.377 63.2669 150.034 63.3978C145.646 65.0741 135.506 66.2413 130.343 66.6317Z"
                      fill="#FBFFFD"
                    />
                  </g>
                  <g id="Group 30">
                    <path
                      id="Vector 40"
                      d="M124.077 49.5733C125.04 47.6477 127.207 48.2896 128.169 48.8512C129.903 50.1992 130.496 52.9432 130.576 54.1467L129.614 55.1096C129.806 59.5385 128.731 64.9785 128.169 67.1448H125.522C124.944 66.3746 124.318 61.6888 124.077 59.4422L123.355 59.683V55.591L122.393 56.3131L121.43 55.8317L124.077 49.5733Z"
                      fill="#121312"
                    />
                    <path
                      id="Ellipse 14"
                      d="M126.964 46.6849C126.964 47.6155 126.209 48.3699 125.279 48.3699C124.348 48.3699 123.594 47.6155 123.594 46.6849C123.594 45.7544 124.348 45 125.279 45C126.209 45 126.964 45.7544 126.964 46.6849Z"
                      fill="#121312"
                    />
                  </g>
                  <path
                    id="line-top"
                    d="M37.875 129V21"
                    stroke="#FBFFFD"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
        <defs>
          <linearGradient
            id="paint0_linear_1875_13046"
            x1="109.93"
            y1="270.811"
            x2="198.505"
            y2="292.662"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BDE8E6" />
            <stop offset="1" stopColor="#F0FCFA" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_1875_13046"
            x1="113.447"
            y1="270.46"
            x2="129.499"
            y2="340.593"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BDE8E6" />
            <stop offset="1" stopColor="#F0FCFA" />
          </linearGradient>
          <clipPath id="clip0_1875_13046">
            <path
              d="M0 9C0 4.02943 4.02944 0 9 0H278C282.971 0 287 4.02944 287 9V312C287 316.971 282.971 321 278 321H9C4.02944 321 0 316.971 0 312V9Z"
              fill="white"
            />
          </clipPath>
        </defs>
      </svg>

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
        onMouseEnter={() => setFontMenuHovered(true)}
        onMouseLeave={() => setFontMenuHovered(false)}
      >
        <div className={styles["top"]}>
          <div className={styles["top-top"]}>
            Fonts
            <div className={styles["top-top-right"]}>
              <img src={figma_apply} alt="apply" />
              <img src={figma_cancel} alt="cancel" />
            </div>
          </div>
          <div className={styles["top-bot"]}>
            <img src={figma_search} alt="search" />
            Search fonts
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
              onMouseEnter={() => setActiveFont(font.fontFamily)}
            >
              {font.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
