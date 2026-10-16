import styles from "./SpotifyPlayer.module.css";
import { usePlayer } from "../../context/PlayerContext";

function fmt(s) {
  const t = Math.floor(s || 0);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

// ── Vinyl SVG ────────────────────────────────────────────────────────────────
function Vinyl({ playing }) {
  return (
    <div className={`${styles.record} ${playing ? "" : styles.paused}`}>
      <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="110" cy="110" r="109" fill="#161616" />
        {[96, 84, 72, 60, 48].map(r => (
          <circle key={r} cx="110" cy="110" r={r} stroke="#242424" strokeWidth="1.2" fill="none" />
        ))}
        <circle cx="110" cy="110" r="40" fill="#222222" />
        <circle cx="110" cy="110" r="38" fill="#00A084" opacity="0.55" />
        <path d="M 72 72 Q 110 54 148 72" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="110" cy="110" r="5" fill="#0a0a0a" />
      </svg>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
const PrevIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2V12M12 2L5 7L12 12V2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const NextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 2V12M2 2L9 7L2 12V2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="2" width="2.5" height="10" rx="1" fill="currentColor" />
    <rect x="8.5" y="2" width="2.5" height="10" rx="1" fill="currentColor" />
  </svg>
);
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
  </svg>
);

// ── Main component ───────────────────────────────────────────────────────────
export default function SpotifyPlayer() {
  const { track, playing, progress, duration, prev, next, togglePlay, seekTo } = usePlayer();
  const elapsed = duration > 0 ? (progress / 100) * duration : 0;

  const handleSeek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - r.left) / r.width) * 100;
    seekTo(pct);
  };

  return (
    <div className={styles.container}>
      {/* ── Info panel ── */}
      <div className={styles.info}>
        <span className={styles.label}>
          <span className={styles.dot} />
          NOW PLAYING
        </span>

        <h3 className={styles.title} title={track.name}>{track.name}</h3>
        <p className={styles.artist}>{track.artist}</p>

        <div className={styles.controls}>
          <button className={styles.btn} onClick={prev} aria-label="Previous track"><PrevIcon /></button>
          <button className={`${styles.btn} ${styles.btnPlay}`} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className={styles.btn} onClick={next} aria-label="Next track"><NextIcon /></button>
        </div>

        <div className={styles.progressRow}>
          <span className={styles.time}>{fmt(elapsed)}</span>
          <div className={styles.bar} onClick={handleSeek} role="slider" aria-label="Seek">
            <div className={styles.fill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.time}>{fmt(duration)}</span>
        </div>

        <span className={styles.badge}>♪ local tracks</span>
      </div>

      {/* ── Vinyl record (half-hidden right) ── */}
      <div className={styles.recordWrapper}>
        <Vinyl playing={playing} />
      </div>
    </div>
  );
}
