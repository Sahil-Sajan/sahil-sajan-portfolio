import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import DarkModeOverlay from "../components/DarkModeOverlay/DarkModeOverlay";

const ThemeCtx = createContext({ isDark: false, toggle: () => {}, isToggling: false });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme") === "dark";
    document.documentElement.setAttribute("data-theme", stored ? "dark" : "light");
    return stored;
  });
  const [pending, setPending] = useState(null); // null | true | false
  const pendingRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = useCallback(() => {
    if (pendingRef.current !== null) return;
    const next = !isDark;
    pendingRef.current = next;
    setPending(next);
  }, [isDark]);

  const handleMidway = useCallback(() => {
    if (pendingRef.current === null) return;
    setIsDark(pendingRef.current);
    localStorage.setItem("theme", pendingRef.current ? "dark" : "light");
  }, []);

  const handleComplete = useCallback(() => {
    pendingRef.current = null;
    setPending(null);
  }, []);

  return (
    <ThemeCtx.Provider value={{ isDark, toggle, isToggling: pending !== null }}>
      {children}
      {pending !== null && (
        <DarkModeOverlay
          toDark={pending}
          onMidway={handleMidway}
          onComplete={handleComplete}
        />
      )}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
