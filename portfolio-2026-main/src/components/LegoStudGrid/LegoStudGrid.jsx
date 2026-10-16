import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { useTheme } from "../../context/ThemeContext";

const COLS = 5;
const ROWS = 3;
const STEP = 44;
const START_CX = 26.5;
const START_CY = 22;

const shadowPath = (cx, cy) =>
  `M${cx - 12} ${cy + 7.4483}V${cy}H${cx + 12}V${cy + 7.4483}` +
  `C${cx + 12} ${cy + 14.0757} ${cx + 6.6274} ${cy + 19.4483} ${cx} ${cy + 19.4483}` +
  `C${cx - 6.6274} ${cy + 19.4483} ${cx - 12} ${cy + 14.0757} ${cx - 12} ${cy + 7.4483}Z`;

const highlightPath = (cx, cy) =>
  `M${cx} ${cy - 12}` +
  `C${cx + 6.6274} ${cy - 12} ${cx + 12} ${cy - 6.6274} ${cx + 12} ${cy}` +
  `C${cx + 12} ${cy + 0.2781} ${cx + 11.9893} ${cy + 0.5538} ${cx + 11.9707} ${cy + 0.8271}` +
  `C${cx + 11.5453} ${cy - 5.414} ${cx + 6.3491} ${cy - 10.3447} ${cx} ${cy - 10.3447}` +
  `C${cx - 6.3491} ${cy - 10.3447} ${cx - 11.5463} ${cy - 5.414} ${cx - 11.9717} ${cy + 0.8271}` +
  `C${cx - 11.9903} ${cy + 0.5538} ${cx - 12} ${cy + 0.278} ${cx - 12} ${cy}` +
  `C${cx - 12} ${cy - 6.6274} ${cx - 6.6274} ${cy - 12} ${cx} ${cy - 12}Z`;

export default function LegoStudGrid() {
  const { isDark } = useTheme();
  const knobRefs   = useRef([]);
  const activeRef  = useRef(null);
  const isDragging = useRef(false);
  const hasMoved   = useRef(false);
  const dragPressed = useRef([]);

  const colors = isDark
    ? { bg: "#4A0000", shadow: "#2D0000", knob: "#6B0000" }
    : { bg: "#C2E9E7", shadow: "#559991", knob: "#C2E9E7" };

  const releaseAllDrag = useCallback(() => {
    dragPressed.current.forEach((idx, i) => {
      const el = knobRefs.current[idx];
      if (!el) return;
      gsap.to(el, { y: 0, duration: 0.65, ease: "elastic.out(1.3, 0.38)", delay: i * 0.025 });
    });
    dragPressed.current = [];
  }, []);

  useEffect(() => {
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (hasMoved.current) releaseAllDrag();
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [releaseAllDrag]);

  const handleSvgMouseDown = useCallback(() => {
    isDragging.current = true;
    hasMoved.current = false;
  }, []);

  const handleStudHover = useCallback((hovIdx) => {
    if (isDragging.current) return;
    const hRow = Math.floor(hovIdx / COLS);
    const hCol = hovIdx % COLS;
    knobRefs.current.forEach((el, idx) => {
      if (!el) return;
      const dist = Math.hypot(Math.floor(idx / COLS) - hRow, (idx % COLS) - hCol);
      if (dist > 3.5) return;
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(el, { y: -6, duration: 0.12, ease: "power2.out",  delay: dist * 0.045 })
        .to(el, { y: 0,  duration: 0.5,  ease: "elastic.out(1.1, 0.38)" });
    });
  }, []);

  const handleStudEnter = useCallback((idx) => {
    if (!isDragging.current) return;
    hasMoved.current = true;
    if (dragPressed.current.includes(idx)) return;
    const el = knobRefs.current[idx];
    if (!el) return;
    dragPressed.current.push(idx);
    gsap.to(el, { y: 7, duration: 0.08, ease: "power3.out" });
  }, []);

  const handleStudClick = useCallback((idx) => {
    if (hasMoved.current) return;
    const el = knobRefs.current[idx];
    if (!el) return;
    if (activeRef.current && activeRef.current !== el) {
      gsap.to(activeRef.current, { y: 0, duration: 0.65, ease: "elastic.out(1.3, 0.38)" });
    }
    if (activeRef.current === el) {
      gsap.to(el, { y: 0, duration: 0.65, ease: "elastic.out(1.3, 0.38)" });
      activeRef.current = null;
      return;
    }
    gsap.to(el, { y: 7, duration: 0.08, ease: "power3.out" });
    activeRef.current = el;
  }, []);

  const studs = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      studs.push({ idx, cx: START_CX + col * STEP, cy: START_CY + row * STEP });
    }
  }

  return (
    <svg
      width="229" height="132" viewBox="0 0 229 132" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%", userSelect: "none" }}
      onMouseDown={handleSvgMouseDown}
    >
      <rect width="229" height="132" rx="9" fill={colors.bg} />
      {studs.map(({ idx, cx, cy }) => (
        <g
          key={idx}
          onMouseEnter={() => { handleStudHover(idx); handleStudEnter(idx); }}
          onClick={() => handleStudClick(idx)}
          style={{ cursor: "pointer" }}
        >
          <path d={shadowPath(cx, cy)} fill={colors.shadow} />
          <g ref={el => { knobRefs.current[idx] = el; }}>
            <circle cx={cx} cy={cy} r="12" fill={colors.knob} />
            <path d={highlightPath(cx, cy)} fill="#FBFFFD" />
          </g>
        </g>
      ))}
    </svg>
  );
}
