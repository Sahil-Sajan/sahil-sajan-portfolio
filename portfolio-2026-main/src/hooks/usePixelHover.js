import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";

const EFFECT_RADIUS = 30;
const GRID_UNIT = 6;
const LERP = 0.18;

/**
 * Diamond pixel-dot hover effect + tube-light flicker on exit.
 * @param {React.RefObject} containerRef  - element whose rect children receive the effect
 * @param {boolean}         enabled       - set true once the load animation has finished
 */
export function usePixelHover(containerRef, enabled) {
  const rafRef      = useRef(null);
  const rectsRef    = useRef(null);
  const wasActive   = useRef(false);
  const state       = useRef({ currX: 0, currY: 0, currStrength: 0, targX: 0, targY: 0, targStrength: 0 });

  // Cache rects once hover becomes enabled
  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    rectsRef.current = Array.from(containerRef.current.querySelectorAll("rect"));
  }, [enabled, containerRef]);

  // Cleanup on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const triggerFlash = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const s = state.current;
    s.targStrength = 0;
    s.currStrength = 0;

    const rects = rectsRef.current;
    if (!rects) return;

    // Kill only opacity tweens — leaves fillOpacity (waving/wiggling) untouched
    rects.forEach(r => gsap.killTweensOf(r, "opacity"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rects.forEach(r => { r.style.opacity = "1"; });
      return;
    }

    const sorted = [...rects].sort((a, b) =>
      a.getBoundingClientRect().top - b.getBoundingClientRect().top
    );

    sorted.forEach((rect, i) => {
      gsap.timeline({ delay: i * 0.015 })
        .to(rect, { opacity: 1,    duration: 0.05, ease: "none" })
        .to(rect, { opacity: 0.18, duration: 0.09, ease: "none" })
        .to(rect, { opacity: 1,    duration: 0.26, ease: "power2.out" });
    });
  }, []);

  const scheduleRAF = useCallback(() => {
    if (rafRef.current !== null) return;
    const rects = rectsRef.current;
    if (rects) rects.forEach(r => gsap.killTweensOf(r, "opacity"));

    const tick = () => {
      const s = state.current;
      const r = rectsRef.current;
      if (!r || !r.length) { rafRef.current = null; return; }

      s.currX      += (s.targX      - s.currX)      * LERP;
      s.currY      += (s.targY      - s.currY)      * LERP;
      s.currStrength += (s.targStrength - s.currStrength) * LERP;

      r.forEach(rect => {
        const b  = rect.getBoundingClientRect();
        const cx = b.left + b.width  / 2;
        const cy = b.top  + b.height / 2;
        const d  = Math.abs(cx - s.currX) + Math.abs(cy - s.currY);
        const t  = Math.min(d / EFFECT_RADIUS, 1);
        rect.style.opacity = String((1 - s.currStrength * t * 0.7).toFixed(3));
      });

      const settled =
        Math.abs(s.targStrength - s.currStrength) < 0.002 &&
        Math.abs(s.targX - s.currX) < 0.5 &&
        Math.abs(s.targY - s.currY) < 0.5;

      if (!settled) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        s.currStrength = s.targStrength;
        s.currX = s.targX;
        s.currY = s.targY;
        rafRef.current = null;
        if (s.currStrength < 0.001) r.forEach(rect => { rect.style.opacity = "1"; });
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!enabled || !rectsRef.current) return;

    const rects  = rectsRef.current;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    let nearestCX = 0, nearestCY = 0, nearestDist = Infinity;
    rects.forEach(rect => {
      const b  = rect.getBoundingClientRect();
      const cx = b.left + b.width  / 2;
      const cy = b.top  + b.height / 2;
      const dist = Math.abs(mouseX - cx) + Math.abs(mouseY - cy);
      if (dist < nearestDist) { nearestDist = dist; nearestCX = cx; nearestCY = cy; }
    });

    const s       = state.current;
    const inRange = nearestDist <= GRID_UNIT * 3;

    if (inRange) {
      if (s.currStrength < 0.01) { s.currX = nearestCX; s.currY = nearestCY; }
      s.targX = nearestCX;
      s.targY = nearestCY;
      s.targStrength = 1;
      wasActive.current = true;
      scheduleRAF();
    } else {
      if (wasActive.current) { wasActive.current = false; triggerFlash(); }
      s.targStrength = 0;
    }
  }, [enabled, scheduleRAF, triggerFlash]);

  const onMouseLeave = useCallback(() => {
    if (wasActive.current) { wasActive.current = false; triggerFlash(); }
    state.current.targStrength = 0;
  }, [triggerFlash]);

  return {
    onMouseMove:  enabled ? onMouseMove  : undefined,
    onMouseLeave: enabled ? onMouseLeave : undefined,
  };
}
