import { useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const LegWiggleMan = ({ flip }) => (
  <svg
    width="36" height="48" viewBox="0 0 36 48" fill="none"
    style={{ display: "block", transform: flip ? "scaleX(-1)" : "none" }}
  >
    <rect x="12" y="0"  width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="18" y="0"  width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="24" y="0"  width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="12" y="6"  width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="18" y="6"  width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="24" y="6"  width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="18" y="12" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="12" y="18" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="18" y="18" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="24" y="18" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="30" y="18" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="6"  y="24" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="18" y="24" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="30" y="24" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="12" y="30" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="18" y="30" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="24" y="30" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="6"  y="36" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect x="24" y="36" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect className="dr-fl"  y="42"    width="6" height="6" rx="2" fill="var(--dark-green)" fillOpacity="0"/>
    <rect className="dr-fld" x="6"  y="42" width="6" height="6" rx="2" fill="var(--dark-green)"/>
    <rect className="dr-fr"  x="18" y="42" width="6" height="6" rx="2" fill="var(--dark-green)" fillOpacity="0"/>
    <rect className="dr-frd" x="24" y="42" width="6" height="6" rx="2" fill="var(--dark-green)"/>
  </svg>
);

const DraggableRobot = ({ style, flip = false }) => {
  const elRef  = useRef(null);
  const dragRef = useRef({ active: false, ox: 0, oy: 0 });

  // Leg-wiggle animation (auto-starts)
  useGSAP(() => {
    const el     = elRef.current;
    const footR  = el.querySelector(".dr-fr");
    const footRd = el.querySelector(".dr-frd");
    const footL  = el.querySelector(".dr-fl");
    const footLd = el.querySelector(".dr-fld");
    if (!footR) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
    tl.to(footRd, { fillOpacity: 1, duration: 0.15 })
      .to(footR,  { fillOpacity: 0, duration: 0.15 }, "<")
      .to(footLd, { fillOpacity: 0, duration: 0.15 }, "<")
      .to(footL,  { fillOpacity: 1, duration: 0.15 }, "<")
      .to(footLd, { fillOpacity: 1, duration: 0.15 }, "+=0.6")
      .to(footL,  { fillOpacity: 0, duration: 0.15 }, "<")
      .to(footRd, { fillOpacity: 0, duration: 0.15 }, "<")
      .to(footR,  { fillOpacity: 1, duration: 0.15 }, "<");
  }, { scope: elRef });

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const el = elRef.current;
    gsap.killTweensOf(el);

    dragRef.current = {
      active: true,
      // offset = pointer position minus current GSAP translate
      ox: e.clientX - gsap.getProperty(el, "x"),
      oy: e.clientY - gsap.getProperty(el, "y"),
    };

    el.setPointerCapture(e.pointerId);
    gsap.set(el, { zIndex: 1000, cursor: "grabbing" });
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    gsap.set(elRef.current, {
      x: e.clientX - dragRef.current.ox,
      y: e.clientY - dragRef.current.oy,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    gsap.to(elRef.current, {
      x: 0,
      y: 0,
      duration: 1.1,
      ease: "elastic.out(1, 0.45)",
      onComplete: () => gsap.set(elRef.current, { zIndex: 5, cursor: "grab" }),
    });
  }, []);

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute",
        width: 36,
        height: 48,
        zIndex: 5,
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        ...style,
      }}
    >
      <LegWiggleMan flip={flip} />
    </div>
  );
};

export default DraggableRobot;
