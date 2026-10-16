// src/components/Digit.jsx
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

// Import digit components
import D0 from "./digits/D0";
import D1 from "./digits/D1";
import D2 from "./digits/D2";
import D3 from "./digits/D3";
import D4 from "./digits/D4";
import D5 from "./digits/D5";
import D6 from "./digits/D6";
import D7 from "./digits/D7";
import D8 from "./digits/D8";
import D9 from "./digits/D9";
import PLUS from "./digits/PLUS";

const digitComponents = [D0, D1, D2, D3, D4, D5, D6, D7, D8, D9];

const Digit = ({ number, isLoaded, delay=0 }) => {
  const container = useRef();
  const sortedPaths = useRef([]);

  // Convert the prop to string for parsing
  const str = String(number);
  const hasPlus = str.startsWith("+");
  const cleanNumber = hasPlus ? str.slice(1) : str;

  // In case the "cleanNumber" is a multi-digit string, grab its digits
  const digits = cleanNumber.split("").map((d) => parseInt(d, 10));

  useGSAP(
    () => {
      if (isLoaded) {
        const rects = gsap.utils.toArray("rect", container.current);
        sortedPaths.current = rects.sort((a, b) => {
          const aY = a.getBoundingClientRect().y;
          const bY = b.getBoundingClientRect().y;
          return aY - bY;
        });
        gsap.to(sortedPaths.current, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.08,
          delay: delay
        });
      }
    },
    { scope: container, dependencies: [isLoaded] }
  );

  return (
    <div ref={container} style={{ display: "flex", gap: "7px" }}>
      {hasPlus && <PLUS />}
      {digits.map((d, i) => {
        const DigitSvg = digitComponents[d];
        if (!DigitSvg) return null;
        return <DigitSvg key={i} />;
      })}
    </div>
  );
};

export default Digit;
