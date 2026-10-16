import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useTheme } from "../context/ThemeContext";


const containerStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  backgroundColor: "var(--dark-green)",
  borderRadius: "9px",
  justifyContent: "center",
  alignItems: "end",
  overflow: "hidden",
  padding: "18px 18px 0 18px",
  boxSizing: "border-box",
  border: "3px solid var(--off-teal)",
};

const baseRectStyle = {
  position: "absolute",
  left: 0,
  width: "100%",
};

const RECT_LIGHT = [
  { zIndex: 5, backgroundColor: "#006352", height: "60px" },
  { zIndex: 4, backgroundColor: "#00735F", height: "120px" },
  { zIndex: 3, backgroundColor: "#00826B", height: "150px" },
  { zIndex: 2, backgroundColor: "#009178", height: "165px" },
];

const RECT_DARK = [
  { zIndex: 5, backgroundColor: "#6B0000", height: "60px" },
  { zIndex: 4, backgroundColor: "#7A0000", height: "120px" },
  { zIndex: 3, backgroundColor: "#8B0000", height: "150px" },
  { zIndex: 2, backgroundColor: "#9B1010", height: "165px" },
];

const RED_OVERLAY = {
  position: "absolute",
  inset: 0,
  backgroundColor: "#C0392B",
  mixBlendMode: "hue",
  zIndex: 15,
  pointerEvents: "none",
  borderRadius: "6px",
};

const Denji = () => {
  const { isDark } = useTheme();
  const rectConfigs = isDark ? RECT_DARK : RECT_LIGHT;
  const container = useRef(null);
  const denjiRef = useRef(null);
  const handRef = useRef(null);
  const scrollTriggerRef = useRef(null);
  const handScrollTriggerRef = useRef(null);
  const waveTlRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const wrapperStyle = {
    position: "relative",
    zIndex: 6,
    aspectRatio: "1024 / 1536",
    ...(isMobile
      ? { width: "130%", bottom: "-120px" }
      : { height: "150%", bottom: "-200px" }),
  };

  const layerStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };

  // Wave animation
  useGSAP(
    () => {
      CustomEase.create("wave", "M0,0 C0.6,0, 0.1,1.4, 1,1");

      const rects = gsap.utils.toArray(".rect", container.current);

      waveTlRef.current = gsap.timeline({ repeat: -1, yoyo: true, paused: true }).to(rects, {
        scaleY: 1.4,
        transformOrigin: "bottom",
        duration: 2,
        stagger: 0.2,
        ease: "wave",
      });
    },
    { scope: container }
  );

  // Scroll animation - with proper cleanup
  useGSAP(() => {
    if (!denjiRef.current || !container.current) {
      console.log("Denji ref not found");
      return;
    }

    // Get the section element for trigger
    const section = container.current.closest("section");

    if (!section) {
      console.log("Section not found");
      return;
    }

    // Kill any existing scroll triggers for this element
    ScrollTrigger.getAll().forEach((trigger) => {
      if (trigger.trigger === section || trigger.target === denjiRef.current) {
        trigger.kill();
      }
    });

    // Create new scroll trigger
    scrollTriggerRef.current = gsap.to(denjiRef.current, {
      y: -60,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        endTrigger: 'footer',
        end: "bottom bottom",
        scrub: 1,
        markers: false,
      },
    }).scrollTrigger;

    return () => {
      // Proper cleanup
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, []);

  // Hand parallax — starts 60px below body, rises 30px over scroll to simulate being in front
  useGSAP(() => {
    if (!handRef.current || !container.current) return;

    const section = container.current.closest("section");
    if (!section) return;

    gsap.set(handRef.current, { y: 60 });

    handScrollTriggerRef.current = gsap.to(handRef.current, {
      y: 15,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        endTrigger: "footer",
        end: "bottom bottom",
        scrub: 1,
        markers: false,
      },
    }).scrollTrigger;

    return () => {
      if (handScrollTriggerRef.current) {
        handScrollTriggerRef.current.kill();
        handScrollTriggerRef.current = null;
      }
    };
  }, []);

  // Refresh ScrollTrigger on mount and window resize
  useEffect(() => {
    // Refresh immediately on mount
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    const handleResize = () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.refresh());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup all ScrollTriggers related to this component on unmount
  useEffect(() => {
    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
      if (handScrollTriggerRef.current) {
        handScrollTriggerRef.current.kill();
      }
      ScrollTrigger.refresh();
    };
  }, []);

  // Only run the looping wave animation while the section is on screen
  useEffect(() => {
    const el = container.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      waveTlRef.current?.resume();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        const tl = waveTlRef.current;
        if (!tl) return;
        if (entry.isIntersecting) tl.resume();
        else tl.pause();
      },
      { rootMargin: "150px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div style={containerStyle} ref={container}>
      <div style={wrapperStyle} ref={denjiRef} id="denji">
        <img src="/sahil3.webp" style={layerStyle} alt="Sahil" loading="lazy" decoding="async" />
      </div>
      {rectConfigs.map((style, i) => (
        <div
          key={i}
          className={`rect rect-${i + 1}`}
          style={{ ...baseRectStyle, ...style }}
        />
      ))}
      {/* Red hue overlay in dark mode — uses mix-blend-mode:hue to shift
          teal SVG backgrounds to red while leaving neutrals (skin, hair) unchanged */}
      {isDark && <div style={RED_OVERLAY} />}
    </div>
  );
};

export default Denji;
