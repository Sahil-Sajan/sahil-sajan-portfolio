import { useState } from "react";
import styles from "./MobilePlayer.module.css";
import { usePlayer } from "../../context/PlayerContext";

const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
    <path d="M2 2V12M12 2L5 7L12 12V2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
    <path d="M12 2V12M2 2L9 7L2 12V2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="2" width="2.5" height="10" rx="1" fill="currentColor" />
    <rect x="8.5" y="2" width="2.5" height="10" rx="1" fill="currentColor" />
  </svg>
);
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
    <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
  </svg>
);

function Disc({ playing, size = 64 }) {
  return (
    <div
      className={`${styles.disc} ${playing ? styles.spinning : ""}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/recorder.jpg"
        alt="recorder"
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
      />
    </div>
  );
}

export default function MobilePlayer() {
  const [open, setOpen] = useState(false);
  const { track, playing, prev, next, togglePlay } = usePlayer();

  return (
    <div className={styles.wrapper}>
      {/* Mini panel — shows when disc is tapped */}
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelDisc}>
            <Disc playing={playing} size={48} />
          </div>
          <div className={styles.panelInfo}>
            <p className={styles.trackName}>{track.name}</p>
            <p className={styles.artist}>{track.artist}</p>
          </div>
          <div className={styles.panelControls}>
            <button className={styles.ctrl} onClick={prev} aria-label="Previous"><PrevIcon /></button>
            <button className={`${styles.ctrl} ${styles.ctrlPlay}`} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className={styles.ctrl} onClick={next} aria-label="Next"><NextIcon /></button>
          </div>
        </div>
      )}

      {/* Floating disc button */}
      <button
        className={styles.discBtn}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle music player"
      >
        <Disc playing={playing} size={56} />
        {playing && <span className={styles.pulse} />}
      </button>
    </div>
  );
}
