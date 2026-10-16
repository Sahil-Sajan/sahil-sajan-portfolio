import { forwardRef, useRef, useCallback, useEffect, useState, memo } from "react";
import Digit from "./Digit";
import { usePixelHover } from "../hooks/usePixelHover";

const Metric = forwardRef(({ name, count, isLoaded }, forwardedRef) => {
  const internalRef   = useRef(null);
  const [hoverEnabled, setHoverEnabled] = useState(false);

  const setRefs = useCallback((node) => {
    internalRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => setHoverEnabled(true), 2200);
    return () => clearTimeout(t);
  }, [isLoaded]);

  const { onMouseMove, onMouseLeave } = usePixelHover(internalRef, hoverEnabled);

  return (
    <div
      ref={setRefs}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        height: "150px",
        padding: "30px",
        borderRadius: "9px",
        backgroundColor: "var(--off-white)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <h4
        style={{
          fontSize: "13px",
          width: "100%",
          fontWeight: 400,
          color: "var(--off-black-06)",
          margin: 0,
        }}
      >
        {name}
      </h4>

      <div
        style={{
          display: "flex",
          gap: "7px",
          alignItems: "flex-end",
        }}
      >
        {String(count)
          .split("")
          .map((char, index) => {
            if (char === "+") {
              return <Digit key={index} number="+" isLoaded={isLoaded} />;
            }
            const num = parseInt(char, 10);
            if (isNaN(num)) return null;
            return <Digit key={index} number={num} isLoaded={isLoaded} />;
          })}
      </div>
    </div>
  );
});

export default memo(Metric);
