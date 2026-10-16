import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const C  = "var(--dark-green)";
const R  = { width: 6, height: 6, rx: 2, fill: C };

/* ─────────────────────────────────────────────────
   LAPTOP ROBOT  (top-left)
   Same head/neck/body as original.
   Arms reach down to keyboard below.
   Screen pulses.

   Grid (6-px units, 6 cols × 9 rows = 36×54):
   row0 y=0:         [H][H][H]
   row1 y=6:         [H][H][H]
   row2 y=12:            [N]
   row3 y=18:        [B][B][B]
   row4 y=24:   [A]  [B][B][B]  [A]
   row5 y=30:   [A]              [A]   ← hands near keyboard
   ─── laptop ───
   row6 y=36: [K][K][K][K][K][K]
   row7 y=42: [S][S][S][S][S][S]
   row8 y=48: [S][S][S][S][S][S]
───────────────────────────────────────────────── */
export const RobotLaptop = () => {
  const ref = useRef(null);

  useGSAP(() => {
    // Screen glow pulse
    gsap.to(ref.current.querySelectorAll(".scr"), {
      opacity: 0.45,
      duration: 1.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 0.08,
    });
    // Subtle body bob
    gsap.to(ref.current, {
      y: -2,
      duration: 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }, { scope: ref });

  return (
    <div ref={ref} style={{ position: "absolute", left: 0, top: 10, width: 36, height: 54 }}>
      <svg width="36" height="54" viewBox="0 0 36 54" fill="none">
        {/* Head */}
        <rect x="12" y="0"  {...R}/>
        <rect x="18" y="0"  {...R}/>
        <rect x="24" y="0"  {...R}/>
        <rect x="12" y="6"  {...R}/>
        <rect x="18" y="6"  {...R}/>
        <rect x="24" y="6"  {...R}/>
        {/* Neck */}
        <rect x="18" y="12" {...R}/>
        {/* Upper body */}
        <rect x="12" y="18" {...R}/>
        <rect x="18" y="18" {...R}/>
        <rect x="24" y="18" {...R}/>
        {/* Body + arms reaching down */}
        <rect x="6"  y="24" {...R}/>
        <rect x="12" y="24" {...R}/>
        <rect x="18" y="24" {...R}/>
        <rect x="24" y="24" {...R}/>
        <rect x="30" y="24" {...R}/>
        {/* Arms at keyboard level */}
        <rect x="6"  y="30" {...R}/>
        <rect x="30" y="30" {...R}/>
        {/* Keyboard */}
        <rect x="0"  y="36" {...R}/>
        <rect x="6"  y="36" {...R}/>
        <rect x="12" y="36" {...R}/>
        <rect x="18" y="36" {...R}/>
        <rect x="24" y="36" {...R}/>
        <rect x="30" y="36" {...R}/>
        {/* Screen (pulsing) */}
        <rect className="scr" x="0"  y="42" {...R}/>
        <rect className="scr" x="6"  y="42" {...R}/>
        <rect className="scr" x="12" y="42" {...R}/>
        <rect className="scr" x="18" y="42" {...R}/>
        <rect className="scr" x="24" y="42" {...R}/>
        <rect className="scr" x="30" y="42" {...R}/>
        <rect className="scr" x="0"  y="48" {...R}/>
        <rect className="scr" x="6"  y="48" {...R}/>
        <rect className="scr" x="12" y="48" {...R}/>
        <rect className="scr" x="18" y="48" {...R}/>
        <rect className="scr" x="24" y="48" {...R}/>
        <rect className="scr" x="30" y="48" {...R}/>
      </svg>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   PUSHUP ROBOT  (top-right)
   Same head. Arms on both sides pushed straight down.
   Legs together at back. Body bobs up/down.

   Grid (6-px units, 6 cols × 7 rows = 36×42):
   row0 y=0:         [H][H][H]
   row1 y=6:         [H][H][H]
   row2 y=12:   [A]  [B][B][B]  [A]
   row3 y=18:   [A]  [B][B][B]  [A]
   row4 y=24:   [A]              [A]   ← arms on floor
   row5 y=30:        [L][L]            ← legs together
   row6 y=36:        [L][L]            ← feet
───────────────────────────────────────────────── */
export const RobotPushup = () => {
  const bodyRef = useRef(null);
  const armsRef = useRef(null);

  useGSAP(() => {
    // Body pumps up
    gsap.to(bodyRef.current, {
      y: -5,
      duration: 0.55,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.5,
    });
    // Arms stay on floor (opposite direction to body)
    gsap.to(armsRef.current, {
      y: 5,
      duration: 0.55,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.5,
    });
  });

  return (
    <div style={{ position: "absolute", right: 0, top: 10, width: 36, height: 42 }}>
      <svg width="36" height="42" viewBox="0 0 36 42" fill="none">
        {/* Head + body (pumps up) */}
        <g ref={bodyRef}>
          <rect x="12" y="0"  {...R}/>
          <rect x="18" y="0"  {...R}/>
          <rect x="24" y="0"  {...R}/>
          <rect x="12" y="6"  {...R}/>
          <rect x="18" y="6"  {...R}/>
          <rect x="24" y="6"  {...R}/>
          <rect x="12" y="12" {...R}/>
          <rect x="18" y="12" {...R}/>
          <rect x="24" y="12" {...R}/>
          <rect x="12" y="18" {...R}/>
          <rect x="18" y="18" {...R}/>
          <rect x="24" y="18" {...R}/>
          {/* Legs together */}
          <rect x="12" y="30" {...R}/>
          <rect x="18" y="30" {...R}/>
          <rect x="12" y="36" {...R}/>
          <rect x="18" y="36" {...R}/>
        </g>
        {/* Arms on floor (stay low) */}
        <g ref={armsRef}>
          <rect x="6"  y="12" {...R}/>
          <rect x="6"  y="18" {...R}/>
          <rect x="6"  y="24" {...R}/>
          <rect x="30" y="12" {...R}/>
          <rect x="30" y="18" {...R}/>
          <rect x="30" y="24" {...R}/>
        </g>
      </svg>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   SLEEPING ROBOT  (bottom-right)
   Lying on side — head on right, body goes left.
   Legs hang down. ZZZ floats up.

   Grid (8 cols × 7 rows = 48×42):
   row0 y=0:                         [z]
   row1 y=6:                    [z]
   row2 y=12:               [H][H]
   row3 y=18:  [B][B][B][B][B][H][H]
   row4 y=24:  [L][L]
   row5 y=30:  [L]
   row6 y=36:  [F][F]
───────────────────────────────────────────────── */
export const RobotSleeping = () => {
  const ref = useRef(null);

  useGSAP(() => {
    // Breathing
    gsap.to(ref.current, {
      y: -2,
      duration: 2.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // ZZZ each block floats up and fades independently
    const zeds = ref.current.querySelectorAll(".zed");
    zeds.forEach((z, i) => {
      const tl = gsap.timeline({ repeat: -1, delay: i * 0.6 });
      tl.set(z, { opacity: 0, y: 0 })
        .to(z, { opacity: 1, y: -4, duration: 0.5, ease: "power1.out" })
        .to(z, { opacity: 0, y: -10, duration: 0.7, ease: "power1.in" })
        .to(z, { y: 0, duration: 0 });
    });
  }, { scope: ref });

  return (
    <div ref={ref} style={{ position: "absolute", right: 0, bottom: 8, width: 48, height: 48 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        {/* ZZZ — float up from above head, no overlap */}
        <rect className="zed" x="42" y="0"  width="6" height="6" rx="2" fill="var(--dark-green)" opacity="0"/>
        <rect className="zed" x="36" y="0"  width="6" height="6" rx="2" fill="var(--dark-green)" opacity="0"/>
        <rect className="zed" x="36" y="6"  width="6" height="6" rx="2" fill="var(--dark-green)" opacity="0"/>
        {/* Head (2×2) */}
        <rect x="30" y="18" {...R}/>
        <rect x="36" y="18" {...R}/>
        <rect x="30" y="24" {...R}/>
        <rect x="36" y="24" {...R}/>
        {/* Body horizontal (connects to head) */}
        <rect x="0"  y="24" {...R}/>
        <rect x="6"  y="24" {...R}/>
        <rect x="12" y="24" {...R}/>
        <rect x="18" y="24" {...R}/>
        <rect x="24" y="24" {...R}/>
        {/* Legs down */}
        <rect x="0"  y="30" {...R}/>
        <rect x="6"  y="30" {...R}/>
        <rect x="0"  y="36" {...R}/>
        {/* Feet */}
        <rect x="0"  y="42" {...R}/>
        <rect x="6"  y="42" {...R}/>
      </svg>
    </div>
  );
};
