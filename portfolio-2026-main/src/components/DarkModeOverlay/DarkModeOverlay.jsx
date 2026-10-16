import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import styles from "./DarkModeOverlay.module.css";

export default function DarkModeOverlay({ toDark, onMidway, onComplete }) {
  const boxRef = useRef(null);
  const midwayCalled = useRef(false);
  const color = toDark ? "#C0392B" : "#00A084";

  useGSAP(() => {
    const box = boxRef.current;
    if (!box) return;

    const tl = gsap.timeline();

    tl.fromTo(box,
      { width: "0%", height: "0%", borderRadius: "14px", rotate: "-6deg" },
      {
        width: "100%",
        height: "100%",
        borderRadius: "9px",
        rotate: "0deg",
        duration: 0.85,
        ease: "expo.inOut",
        onComplete: () => {
          gsap.set(box, { borderRadius: "0px" });
          if (!midwayCalled.current) {
            midwayCalled.current = true;
            onMidway();
          }
        },
      }
    )
    .to(box, { duration: 0.12 })
    .to(box, {
      width: "0%",
      height: "0%",
      borderRadius: "14px",
      rotate: "6deg",
      duration: 0.85,
      ease: "expo.inOut",
      onComplete,
    });

    return () => tl.kill();
  }, []);

  return (
    <div className={styles.overlay}>
      <div
        ref={boxRef}
        className={styles.box}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
