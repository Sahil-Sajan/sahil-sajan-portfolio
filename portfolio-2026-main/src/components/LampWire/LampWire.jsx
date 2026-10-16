import { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { useTheme } from "../../context/ThemeContext";
import styles from "./LampWire.module.css";

const PULL_THRESHOLD = 55;

export default function LampWire() {
  const { toggle, isToggling } = useTheme();
  const wireGroupRef = useRef(null);
  const cordRef      = useRef(null);
  const knobRef      = useRef(null);
  const swayTween    = useRef(null);
  const isDragging   = useRef(false);
  const startY       = useRef(0);
  const currentPull  = useRef(0);
  const hasHinted    = useRef(false);

  // Auto sway on mount
  useEffect(() => {
    const el = wireGroupRef.current;
    if (!el) return;

    gsap.set(el, { transformOrigin: "top center" });

    swayTween.current = gsap.to(el, {
      rotation: 10,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    return () => swayTween.current?.kill();
  }, []);

  const pauseSway = useCallback(() => {
    swayTween.current?.pause();
    gsap.to(wireGroupRef.current, {
      rotation: 0,
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  const resumeSway = useCallback(() => {
    setTimeout(() => {
      if (!isDragging.current) swayTween.current?.resume();
    }, 500);
  }, []);

  const onTouchStart = useCallback((e) => {
    if (isToggling) return;
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    currentPull.current = 0;
    pauseSway();
  }, [isToggling, pauseSway]);

  const onTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    currentPull.current = delta;

    // Stretch the cord
    const stretch = 1 + delta * 0.008;
    gsap.set(cordRef.current, { scaleY: stretch, transformOrigin: "top center" });
    // Knob follows
    gsap.set(knobRef.current, { y: delta * 0.85 });
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    isDragging.current = false;
    const pulled = currentPull.current;
    currentPull.current = 0;

    // Snap cord and knob back with elastic bounce
    gsap.to(cordRef.current, {
      scaleY: 1,
      duration: 0.55,
      ease: "elastic.out(1.2, 0.4)",
      transformOrigin: "top center",
    });
    gsap.to(knobRef.current, {
      y: 0,
      duration: 0.55,
      ease: "elastic.out(1.2, 0.4)",
    });

    if (pulled >= PULL_THRESHOLD && !isToggling) {
      toggle();
    }

    resumeSway();
  }, [toggle, isToggling, resumeSway]);

  return (
    <div className={styles.container}>
      <div className={styles.anchor} />
      <div
        ref={wireGroupRef}
        className={styles.wireGroup}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div ref={cordRef} className={styles.cord} />
        <div ref={knobRef} className={styles.knob} />
      </div>
    </div>
  );
}
