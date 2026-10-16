import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { useTheme } from "../../context/ThemeContext";
import styles from "./ThemeSlider.module.css";

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export default function ThemeSlider() {
  const { isDark, toggle, isToggling } = useTheme();
  const trackRef  = useRef(null);
  const thumbRef  = useRef(null);
  const dragging  = useRef(false);
  const startX    = useRef(0);
  const maxPx     = useRef(0);
  const curPx     = useRef(0);

  const getMax = useCallback(() => {
    if (!trackRef.current || !thumbRef.current) return 0;
    return trackRef.current.offsetWidth - thumbRef.current.offsetWidth - 8;
  }, []);

  const rollDeg = useCallback((x) => {
    const d = thumbRef.current?.offsetWidth || 44;
    return (x / (Math.PI * d)) * 360;
  }, []);

  const snapTo = useCallback((dark, animate = true) => {
    const max = getMax();
    const x = dark ? max : 0;
    const rot = rollDeg(x);
    if (animate) {
      gsap.to(thumbRef.current, {
        x, rotation: rot,
        duration: 0.45, ease: "power2.inOut",
      });
    } else {
      gsap.set(thumbRef.current, { x, rotation: rot });
    }
    curPx.current = x;
  }, [getMax, rollDeg]);

  useEffect(() => {
    if (!isToggling) snapTo(isDark, false);
  }, [isDark, isToggling, snapTo]);

  const onPointerDown = useCallback((e) => {
    if (isToggling) return;
    dragging.current = true;
    startX.current   = e.clientX;
    maxPx.current    = getMax();
    curPx.current    = parseFloat(gsap.getProperty(thumbRef.current, "x")) || 0;
    thumbRef.current.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [isToggling, getMax]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    const base  = isDark ? maxPx.current : 0;
    const newX  = Math.max(0, Math.min(maxPx.current, base + delta));
    gsap.set(thumbRef.current, { x: newX, rotation: rollDeg(newX) });
    curPx.current = newX;
  }, [isDark, rollDeg]);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    const max      = maxPx.current;
    const progress = max > 0 ? curPx.current / max : 0;
    const shouldToggle = isDark ? progress < 0.4 : progress > 0.6;

    if (shouldToggle) {
      snapTo(!isDark);
      setTimeout(toggle, 280);
    } else {
      snapTo(isDark);
    }
  }, [isDark, toggle, snapTo]);

  return (
    <div ref={trackRef} className={styles.track}>
      <span className={styles.label}>
        {isDark ? "slide for light" : "slide for dark"}
      </span>

      <div
        ref={thumbRef}
        className={styles.thumb}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        role="button"
        tabIndex={0}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </div>
    </div>
  );
}
