import { useEffect, useRef, useState } from "react";
import styles from "./TerminalBio.module.css";

const SEQUENCE = [
  {
    cmd: "const sahil = require('./sahil.js')",
    out: ["undefined"],
  },
  {
    cmd: "sahil.name",
    out: ["'Sahil Sajjan'"],
  },
  {
    cmd: "sahil.role",
    out: ["'Frontend Developer & UI Engineer'"],
  },
  {
    cmd: "sahil.experience",
    out: ["'1+ year professional • 2+ years hands-on development'"],
  },
  {
    cmd: "sahil.skills",
    out: [
      "[ 'Next.js',     'React.js',   'TypeScript',",
      "  'JavaScript',  'Tailwind',   'Framer Motion',",
      "  'Shadcn/UI',   'Node.js',    'Express.js',",
      "  'React Query', 'Zustand',    'Figma' ]",
    ],
  },
  {
    cmd: "sahil.job",
    out: [
      "{ company: 'Samarix',",
      "  role:    'Frontend Developer',",
      "  since:   2025 }",
    ],
  },
  {
    cmd: "sahil.projects",
    out: [
      "[ 'Sentinel Kids',",
      "  'Nortra',",
      "  'Jayakhub',",
      "  'Roos Brothers',",
      "  'Black & White Vapors' ]",
    ],
  },
  {
    cmd: "sahil.specializesIn",
    out: [
      "[ 'Scalable Web Apps',",
      "  'Dashboard Development',",
      "  'UI/UX Engineering',",
      "  'Performance Optimization',",
      "  'Motion Design' ]",
    ],
  },
  {
    cmd: "sahil.education",
    out: [
      "{ degree: 'Bachelor of IT',",
      "  university: 'Uni of Sindh',",
      "  graduation: 2027 }",
    ],
  },
  {
    cmd: "sahil.location",
    out: ["'Hyderabad, Sindh, Pakistan'"],
  },
  {
    cmd: "sahil.status",
    out: ["'Open to Work ✓'"],
  },
];


const CHAR_MS = 38;
const OUT_MS = 80;
const CMD_PAUSE = 480;
const LOOP_PAUSE = 2600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function TerminalBio() {
  const [lines, setLines] = useState([]);
  const [cursor, setCursor] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    // Local flag — isolated per effect call, immune to StrictMode double-invoke
    let cancelled = false;

    async function run() {
      while (!cancelled) {
        setLines([]);
        setCursor(false);

        for (const { cmd, out } of SEQUENCE) {
          if (cancelled) return;

          // Start the cmd line empty, then type char by char
          setLines((prev) => [...prev, { type: "cmd", text: "" }]);

          for (let i = 1; i <= cmd.length; i++) {
            if (cancelled) return;
            const slice = cmd.slice(0, i);
            setLines((prev) => {
              const next = [...prev];
              next[next.length - 1] = { type: "cmd", text: slice };
              return next;
            });
            await sleep(CHAR_MS);
          }

          // Output lines appear one by one
          for (const line of out) {
            if (cancelled) return;
            await sleep(OUT_MS);
            setLines((prev) => [...prev, { type: "out", text: line }]);
          }

          await sleep(CMD_PAUSE);
        }

        // Idle blinking cursor, then loop
        setCursor(true);
        await sleep(LOOP_PAUSE);
        if (!cancelled) setCursor(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines, cursor]);

  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <span className={`${styles.dot} ${styles.red}`} />
        <span className={`${styles.dot} ${styles.yellow}`} />
        <span className={`${styles.dot} ${styles.green}`} />
        <span className={styles.title}>node  —  sahil.js</span>
      </div>

      <div className={styles.body} ref={bodyRef}>
        {lines.map((line, i) => (
          <div key={i} className={`${styles.line} ${styles[line.type]}`}>
            {line.type === "cmd" && <span className={styles.prompt}>&gt; </span>}
            {line.text}
            {line.type === "cmd" && i === lines.length - 1 && !cursor && (
              <span className={styles.caret} />
            )}
          </div>
        ))}

        {cursor && (
          <div className={`${styles.line} ${styles.cmd}`}>
            <span className={styles.prompt}>&gt; </span>
            <span className={styles.caret} />
          </div>
        )}
      </div>
    </div>
  );
}
