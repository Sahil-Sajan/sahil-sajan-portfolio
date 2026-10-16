import { useEffect, useRef, useState } from "react";

export function useIsMobile(breakpoint = 1201) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  const resizeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        setIsMobile((wasMobile) => {
          const isMobileNow = window.innerWidth < breakpoint;
          return wasMobile !== isMobileNow ? isMobileNow : wasMobile;
        });
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeoutRef.current);
    };
  }, [breakpoint]);

  return isMobile;
}
