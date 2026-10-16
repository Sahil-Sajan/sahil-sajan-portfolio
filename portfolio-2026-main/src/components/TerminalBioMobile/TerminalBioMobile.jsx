import { useEffect, useRef, useState } from "react";
import styles from "./TerminalBioMobile.module.css";

const SEQUENCE = [
  {
    cmd: "require('./sahil.js')",
    out: ["undefined"],
  },
  {
    cmd: "sahil.name",
    out: ["'Sahil Sajjan'"],
  },
  {
    cmd: "sahil.role",
    out: ["'Frontend Dev & UI Eng'"],
  },
  {
    cmd: "sahil.skills",
    out: [
      "[ 'Next.js', 'React',",
      "  'TypeScript', 'Express.js',",
      "  'Tailwind', 'Node.js' ]",
    ],
  },
  {
    cmd: "sahil.job",
    out: [
      "{ co: 'Samarix',",
      "  role: 'Frontend Dev',",
      "  since: 2025 }",
    ],
  },
  {
    cmd: "sahil.projects",
    out: [
      "[ 'Sentinel Kids',",
      "  'Jayakhub',",
      "  'Roos Brothers',",
      "  'B&W Vapors' ]",
    ],
  },
  {
    cmd: "sahil.location",
    out: ["'Hyderabad, Pakistan'"],
  },
  {
    cmd: "sahil.status",
    out: ["'Open to Work ✓'"],
  },
];

const CHAR_MS = 45;
const OUT_MS = 70;
const CMD_PAUSE = 400;
const LOOP_PAUSE = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function TerminalBioMobile() {
  const [lines, setLines] = useState([]);
  const [cursor, setCursor] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      while (!cancelled) {
        setLines([]);
        setCursor(false);

        for (const { cmd, out } of SEQUENCE) {
          if (cancelled) return;

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

          for (const line of out) {
            if (cancelled) return;
            await sleep(OUT_MS);
            setLines((prev) => [...prev, { type: "out", text: line }]);
          }

          await sleep(CMD_PAUSE);
        }

        setCursor(true);
        await sleep(LOOP_PAUSE);
        if (!cancelled) setCursor(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

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
        <span className={styles.title}>sahil.js</span>
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
