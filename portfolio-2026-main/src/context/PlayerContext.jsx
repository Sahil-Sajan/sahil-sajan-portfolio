import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const TRACKS = [
  { id: 1,  name: "3AM AT FALLS",     artist: "JJ47",                      src: "/songs/3AM AT FALLS - JJ47 (Prod. @umairmusicxx ) - (320 Kbps).mp3" },
  { id: 2,  name: "Bebasi",           artist: "Talhah Yunus",              src: "/songs/Bebasi - Talhah Yunus _ Prod. by Jokhay & Umair - (64 Kbps).mp3" },
  { id: 3,  name: "JUST A DREAM",     artist: "Talhah Yunus",              src: "/songs/JUST A DREAM - Talhah Yunus _ JJ47 _ Prod. by Jokhay - (320 Kbps).mp3" },
  { id: 4,  name: "SHIKWA",           artist: "Talhah Yunus",              src: "/songs/SHIKWA - Talhah Yunus _ Prod. By Jokhay (Official Music Video) - (320 Kbps).mp3" },
  { id: 5,  name: "TWO TONE",         artist: "Young Stunners",            src: "/songs/TWO TONE - Young Stunners _ Talha Anjum _ Talhah Yunus _ Prod. by Umair (Official Music Video) - (320 Kbps).mp3" },
  { id: 6,  name: "THE COME UP STORY",artist: "BAGGH-E SMG, FARMAAN SMG, BIG KAY SMG, NAV DHIMAN", src: "/songs/THE COME UP STORY [OFFICIAL MUSIC VIDEO] - BAGGH-E SMG x FARMAAN SMG x BIG KAY SMG  NAV DHIMAN.m4a" },
  { id: 7,  name: "5-7",              artist: "Karan Aujla, Mxrci, Alankriitaa Sahai", src: "/songs/5-7 (Music Video) Karan Aujla  Mxrci  Alankriitaa Sahai  Rehaan Records  Punjabi Songs 2026.m4a" },
  { id: 8,  name: "BOLERO",           artist: "Prince Narula, Komal Chaudhary, Pranjal Dahiya", src: "/songs/Bolero (Official Music Video) _ Prince Narula & Komal Chaudhary  Pranjal Dahiya  New Haryanvi Song.m4a" },
  { id: 9,  name: "GOOBA",            artist: "6IX9INE",                   src: "/songs/6IX9INE- GOOBA (Official Music Video).m4a" },
  { id: 10, name: "LATE KNIGHTS",     artist: "DIVINE, Gurinder Gill",     src: "/songs/DIVINE Gurinder Gill - Late Knights  Official Music Video.m4a" },
  { id: 11, name: "TUTOR",            artist: "Cheema Y, Gur Sidhu",       src: "/songs/TUTOR (Official Video) Cheema Y  Gur Sidhu  New Punjabi Song.m4a" },
  { id: 12, name: "HAWA ANEY DE",     artist: "Talha Anjum",               src: "/songs/Talha Anjum - HAWA ANEY DE  Prod by Umair (Official Music Video).m4a" },
  { id: 13, name: "BACKSEAT",         artist: "Jokhay, Umair",             src: "/songs/Jokhay Umair - BACKSEAT (Official Audio).m4a" },
  { id: 14, name: "I GUESS",          artist: "KR$NA",                     src: "/songs/KR$NA - I Guess  Official Music Video.m4a" },
  { id: 15, name: "OUTCAST",          artist: "Talhah Yunus",              src: "/songs/Outcast - Talhah Yunus  Prod by Jokhay.m4a" },
  { id: 16, name: "5AM IN LAHORE",    artist: "Talha Anjum",               src: "/songs/Talha Anjum - 5AM In Lahore  Prod by Umair (Official Audio).m4a" },
  { id: 17, name: "BAAP LOG",         artist: "Jokhay, TALKsick, Talha Anjum", src: "/songs/Jokhay TALKsick Talha Anjum - Baap Log (Official Audio).m4a" },
  { id: 18, name: "NO LOVE",          artist: "Shubh",                     src: "/songs/No Love (Official Audio) - Shubh.m4a" },
  { id: 19, name: "CRAZY MAYBE",      artist: "Talha Anjum",               src: "/songs/Talha Anjum - Crazy Maybe  Prod by Umair (Official Audio).m4a" },
  { id: 20, name: "LICKETY RAP",      artist: "Gargi",                     src: "/songs/Lickety Rap  Gargi's Powerful Performance  MTV Hustle 5 Apna Homeground.m4a" },
  { id: 21, name: "PRESSURE",         artist: "Rap Demon",                 src: "/songs/Rap Demon - Pressure  Prod by Sickkid (Official Audio).m4a" },
  { id: 22, name: "ARHE SO JHDE",     artist: "Cheema Y, Gur Sidhu",       src: "/songs/Arhe So Jhde (Official Audio) Cheema Y  Gur Sidhu  Punjabi Song.m4a" },
  { id: 23, name: "INTRO",            artist: "Cheema Y, Gur Sidhu",       src: "/songs/Cheema Y - Intro (Official Audio) Cheema Y  Gur Sidhu  Punjabi Song  Anyway Album.m4a" },
  { id: 24, name: "SUPREME",          artist: "Shubh",                     src: "/songs/Shubh - Supreme (Official Music Video).m4a" },
  { id: 25, name: "BOOM SHAKA",       artist: "KR$NA, Dhanda Nyoliwala",   src: "/songs/Boom Shaka (Official Music Video)  KR$NA   Dhanda Nyoliwala.m4a" },
  { id: 26, name: "GOD KNOWS",        artist: "Jokhay, Umair",             src: "/songs/Jokhay Umair - GOD KNOWS (Official Audio).m4a" },
  { id: 27, name: "SWEET TALK",       artist: "Talha Anjum",               src: "/songs/Talha Anjum - Sweet Talk  Prod by Umair (Official Audio).m4a" },
  { id: 28, name: "TAGDE GHARDE",     artist: "Cheema Y, Gur Sidhu",       src: "/songs/Tagde Gharde (Official Audio) Cheema Y  Gur Sidhu.m4a" },
  { id: 29, name: "WAVY",             artist: "DIVINE, Karan Aujla",       src: "/songs/WAVY - DIVINE x Karan Aujla  Punjabi Song 2025 Remix.m4a" },
  { id: 30, name: "HOMICIDE",         artist: "DIVINE",                    src: "/songs/DIVINE - Homicide  Prod by Phenom  Official Music Video.m4a" },
  { id: 31, name: "DESI HOOD",        artist: "Krish Rao",                 src: "/songs/Desi Hood - Krish Rao (Music Video)  Gully Gang Records  Latest Haryanvi Song 2024.m4a" },
];

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  // Tracks which src is currently attached to the <audio> element so we never
  // download a song (or its metadata) until the visitor actually presses play.
  const loadedSrcRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!playing) {
      audio.pause();
      return;
    }

    const nextSrc = TRACKS[idx].src;
    if (loadedSrcRef.current !== nextSrc) {
      loadedSrcRef.current = nextSrc;
      audio.src = nextSrc;
      setProgress(0);
      setDuration(0);
    }
    audio.play().catch(() => setPlaying(false));
  }, [idx, playing]);

  const handleTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const a = audioRef.current;
    if (a) setDuration(a.duration);
  }, []);

  const handleEnded = useCallback(() => {
    setIdx(i => (i + 1) % TRACKS.length);
  }, []);

  const prev = useCallback(() => { setIdx(i => (i - 1 + TRACKS.length) % TRACKS.length); setProgress(0); }, []);
  const next = useCallback(() => { setIdx(i => (i + 1) % TRACKS.length); setProgress(0); }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);

  const seekTo = useCallback((pct) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const clamped = Math.max(0, Math.min(100, pct));
    a.currentTime = (clamped / 100) * a.duration;
    setProgress(clamped);
  }, []);

  const value = {
    tracks: TRACKS,
    track: TRACKS[idx],
    idx,
    playing,
    progress,
    duration,
    prev,
    next,
    togglePlay,
    seekTo,
  };

  return (
    <PlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
