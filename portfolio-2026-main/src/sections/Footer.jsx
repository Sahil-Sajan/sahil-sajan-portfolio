import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import "./Footer.css";
import { useButtonSounds } from "../hooks/useButtonSounds";
import AnimatedDownwardArrowSmall from "../components/AnimatedDownwardArrowSmall";
import LinkButtonFooter from "../components/LinkButton/LinkButtonFooter";
import FooterStudGrid from "../components/FooterStudGrid/FooterStudGrid";
import { useTheme } from "../context/ThemeContext";

// PixelTrail pulls in three.js + react-three-fiber (~900 KB). It is lazily
// imported *and* only mounted once the footer is near the viewport, so it never
// competes with the assets needed for the first paint.
const PixelTrail = lazy(() => import("../components/PixelTrail/PixelTrail"));

const CURRENT_YEAR = new Date().getFullYear();

const Footer = ({ inProject = false, lenis, isMobile, onBackWithScroll }) => {
  const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
  const playHover = () => _playHover(3);
  const playClick = () => _playClick(3);
  const { isDark } = useTheme();
  const studGridRef = useRef(null);
  const [showTrail, setShowTrail] = useState(false);

  // Mount the WebGL trail only when the footer area approaches the viewport.
  // A timeout guarantees it still appears if the observer never fires.
  useEffect(() => {
    if (showTrail) return;

    const el = studGridRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShowTrail(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShowTrail(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);

    const fallback = setTimeout(() => setShowTrail(true), 10000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [showTrail]);

  const scrollText = useMemo(
    () => (inProject ? "SCROLL TO TOP" : "SCROLL TO WORK"),
    [inProject]
  );

  return (
    <footer>
      <div className="extremes-wrapper-left">
        <div className="extremes" />
      </div>

      <div className="middle">
        <div className="right-wrapper">
          <nav className={"links"} aria-label="Social links">
            <a href="https://www.linkedin.com/in/sahil-sajan-885b15178" target='_blank' aria-label="LinkedIn profile" rel="noopener noreferrer" onMouseEnter={playHover} onClick={playClick}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12.0377 0H0.959766C0.429102 0 0 0.418945 0 0.936914V12.0605C0 12.5785 0.429102 13 0.959766 13H12.0377C12.5684 13 13 12.5785 13 12.0631V0.936914C13 0.418945 12.5684 0 12.0377 0ZM3.85684 11.0779H1.92715V4.87246H3.85684V11.0779ZM2.89199 4.02695C2.27246 4.02695 1.77227 3.52676 1.77227 2.90977C1.77227 2.29277 2.27246 1.79258 2.89199 1.79258C3.50898 1.79258 4.00918 2.29277 4.00918 2.90977C4.00918 3.52422 3.50898 4.02695 2.89199 4.02695ZM11.0779 11.0779H9.15078V8.06152C9.15078 7.34297 9.13809 6.41621 8.14785 6.41621C7.14492 6.41621 6.99258 7.20078 6.99258 8.01074V11.0779H5.06797V4.87246H6.91641V5.72051H6.9418C7.19824 5.23301 7.82793 4.71758 8.76484 4.71758C10.7174 4.71758 11.0779 6.00234 11.0779 7.67305V11.0779Z" fill="currentColor" />
              </svg>
            </a>
            <a href="mailto:sahilsajjan18@gmail.com" aria-label="Send email" onMouseEnter={playHover} onClick={playClick}>
              <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M14.25 0.875H0.75C0.600816 0.875 0.457742 0.934263 0.352252 1.03975C0.246763 1.14524 0.1875 1.28832 0.1875 1.4375V11C0.1875 11.2984 0.306026 11.5845 0.517005 11.7955C0.727983 12.0065 1.01413 12.125 1.3125 12.125H13.6875C13.9859 12.125 14.272 12.0065 14.483 11.7955C14.694 11.5845 14.8125 11.2984 14.8125 11V1.4375C14.8125 1.28832 14.7532 1.14524 14.6477 1.03975C14.5423 0.934263 14.3992 0.875 14.25 0.875ZM13.6875 11H1.3125V2.71648L7.11961 8.03984C7.22338 8.13511 7.35913 8.18797 7.5 8.18797C7.64087 8.18797 7.77662 8.13511 7.88039 8.03984L13.6875 2.71648V11Z" fill="currentColor" />
              </svg>
            </a>
            <a href="https://www.instagram.com/sahil_meymon?igsh=MWp0c3h3NGRwcGxhOA%3D%3D&utm_source=qr" target='_blank' aria-label="Instagram profile" rel="noopener noreferrer" onMouseEnter={playHover} onClick={playClick}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6.50391 1.17148C8.24063 1.17148 8.44629 1.1791 9.1293 1.20957C9.76406 1.2375 10.1068 1.34414 10.3354 1.43301C10.6375 1.5498 10.8559 1.69199 11.0818 1.91797C11.3104 2.14648 11.45 2.3623 11.5668 2.66445C11.6557 2.89297 11.7623 3.23828 11.7902 3.87051C11.8207 4.55605 11.8283 4.76172 11.8283 6.4959C11.8283 8.23262 11.8207 8.43828 11.7902 9.12129C11.7623 9.75605 11.6557 10.0988 11.5668 10.3273C11.45 10.6295 11.3078 10.8479 11.0818 11.0738C10.8533 11.3023 10.6375 11.442 10.3354 11.5588C10.1068 11.6477 9.76152 11.7543 9.1293 11.7822C8.44375 11.8127 8.23809 11.8203 6.50391 11.8203C4.76719 11.8203 4.56152 11.8127 3.87852 11.7822C3.24375 11.7543 2.90098 11.6477 2.67246 11.5588C2.37031 11.442 2.15195 11.2998 1.92598 11.0738C1.69746 10.8453 1.55781 10.6295 1.44102 10.3273C1.35215 10.0988 1.24551 9.75352 1.21758 9.12129C1.18711 8.43574 1.17949 8.23008 1.17949 6.4959C1.17949 4.75918 1.18711 4.55352 1.21758 3.87051C1.24551 3.23574 1.35215 2.89297 1.44102 2.66445C1.55781 2.3623 1.7 2.14395 1.92598 1.91797C2.15449 1.68945 2.37031 1.5498 2.67246 1.43301C2.90098 1.34414 3.24629 1.2375 3.87852 1.20957C4.56152 1.1791 4.76719 1.17148 6.50391 1.17148ZM6.50391 0.000976562C4.73926 0.000976562 4.51836 0.00859375 3.8252 0.0390625C3.13457 0.0695312 2.65977 0.18125 2.24844 0.341211C1.81934 0.508789 1.45625 0.729687 1.0957 1.09277C0.732617 1.45332 0.511719 1.81641 0.344141 2.24297C0.18418 2.65684 0.0724609 3.1291 0.0419922 3.81973C0.0115234 4.51543 0.00390625 4.73633 0.00390625 6.50098C0.00390625 8.26562 0.0115234 8.48652 0.0419922 9.17969C0.0724609 9.87031 0.18418 10.3451 0.344141 10.7564C0.511719 11.1855 0.732617 11.5486 1.0957 11.9092C1.45625 12.2697 1.81934 12.4932 2.2459 12.6582C2.65977 12.8182 3.13203 12.9299 3.82266 12.9604C4.51582 12.9908 4.73672 12.9984 6.50137 12.9984C8.26602 12.9984 8.48692 12.9908 9.18008 12.9604C9.8707 12.9299 10.3455 12.8182 10.7568 12.6582C11.1834 12.4932 11.5465 12.2697 11.907 11.9092C12.2676 11.5486 12.491 11.1855 12.6561 10.759C12.816 10.3451 12.9277 9.87285 12.9582 9.18223C12.9887 8.48906 12.9963 8.26816 12.9963 6.50352C12.9963 4.73887 12.9887 4.51797 12.9582 3.8248C12.9277 3.13418 12.816 2.65937 12.6561 2.24805C12.4961 1.81641 12.2752 1.45332 11.9121 1.09277C11.5516 0.732226 11.1885 0.508789 10.7619 0.34375C10.348 0.183789 9.87578 0.0720703 9.18516 0.0416016C8.48945 0.00859375 8.26856 0.000976562 6.50391 0.000976562Z" fill="currentColor" />
                <path d="M6.50391 3.16211C4.66055 3.16211 3.16504 4.65762 3.16504 6.50098C3.16504 8.34434 4.66055 9.83984 6.50391 9.83984C8.34727 9.83984 9.84277 8.34434 9.84277 6.50098C9.84277 4.65762 8.34727 3.16211 6.50391 3.16211ZM6.50391 8.6668C5.30801 8.6668 4.33809 7.69687 4.33809 6.50098C4.33809 5.30508 5.30801 4.33516 6.50391 4.33516C7.6998 4.33516 8.66973 5.30508 8.66973 6.50098C8.66973 7.69687 7.6998 8.6668 6.50391 8.6668Z" fill="currentColor" />
                <path d="M10.7543 3.03005C10.7543 3.4617 10.4039 3.80955 9.9748 3.80955C9.54316 3.80955 9.19531 3.45916 9.19531 3.03005C9.19531 2.59841 9.5457 2.25056 9.9748 2.25056C10.4039 2.25056 10.7543 2.60095 10.7543 3.03005Z" fill="currentColor" />
              </svg>
            </a>
            <a href="https://drive.google.com/file/d/1eW45y3kP69cdX0T7bF0GH5vi8V_Hs9KX/view?usp=sharing" target='_blank' aria-label="View resume (PDF)" rel="noopener noreferrer" onMouseEnter={playHover} onClick={playClick}>
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M10.8538 3.64625L7.35375 0.14625C7.30728 0.099833 7.25212 0.063026 7.19143 0.037932C7.13073 0.0128379 7.06568 -5.14929e-05 7 1.546e-07H1C0.734784 1.546e-07 0.48043 0.105357 0.292893 0.292893C0.105357 0.48043 0 0.734784 0 1V12C0 12.2652 0.105357 12.5196 0.292893 12.7071C0.48043 12.8946 0.734784 13 1 13H10C10.2652 13 10.5196 12.8946 10.7071 12.7071C10.8946 12.5196 11 12.2652 11 12V4C11.0001 3.93432 10.9872 3.86927 10.9621 3.80858C10.937 3.74788 10.9002 3.69272 10.8538 3.64625ZM7.5 9.5H3.5C3.36739 9.5 3.24021 9.44732 3.14645 9.35355C3.05268 9.25979 3 9.13261 3 9C3 8.86739 3.05268 8.74021 3.14645 8.64645C3.24021 8.55268 3.36739 8.5 3.5 8.5H7.5C7.63261 8.5 7.75979 8.55268 7.85355 8.64645C7.94732 8.74021 8 8.86739 8 9C8 9.13261 7.94732 9.25979 7.85355 9.35355C7.75979 9.44732 7.63261 9.5 7.5 9.5ZM7.5 7.5H3.5C3.36739 7.5 3.24021 7.44732 3.14645 7.35355C3.05268 7.25979 3 7.13261 3 7C3 6.86739 3.05268 6.74021 3.14645 6.64645C3.24021 6.55268 3.36739 6.5 3.5 6.5H7.5C7.63261 6.5 7.75979 6.55268 7.85355 6.64645C7.94732 6.74021 8 6.86739 8 7C8 7.13261 7.94732 7.25979 7.85355 7.35355C7.75979 7.44732 7.63261 7.5 7.5 7.5ZM7 4V1.25L9.75 4H7Z" fill="currentColor" />
              </svg>
            </a>
            <a href="https://github.com/Sahil-Sajan" target='_blank' aria-label="GitHub profile" rel="noopener noreferrer" onMouseEnter={playHover} onClick={playClick}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6.5 0C2.91 0 0 2.98333 0 6.66667C0 9.61333 1.8525 12.1033 4.42417 12.9883C4.75583 13.0533 4.875 12.845 4.875 12.6683C4.875 12.5083 4.86917 11.9917 4.86917 11.44C3.25 11.765 2.8275 11.04 2.7625 10.66C2.72583 10.4667 2.3725 9.86667 2.0625 9.70667C1.8075 9.58 1.4475 9.255 2.05583 9.24667C2.6275 9.23833 3.03083 9.75333 3.1525 9.95333C3.8025 11.0983 4.83583 10.7983 4.90083 10.6217C4.96583 10.1967 5.135 9.88833 5.3225 9.71333C4.0625 9.53833 2.7425 9.03333 2.7425 6.43333C2.7425 5.69167 2.99583 5.07833 3.17 4.49833C3.10583 4.32333 2.89083 3.61167 3.23417 2.655C3.23417 2.655 3.84083 2.47167 4.875 3.38C5.3125 3.2225 5.7825 3.14333 6.25 3.14333C6.7175 3.14333 7.1875 3.2225 7.625 3.38C8.65917 2.465 9.26583 2.655 9.26583 2.655C9.60917 3.61167 9.39417 4.32333 9.33 4.49833C9.50417 5.07833 9.7575 5.685 9.7575 6.43333C9.7575 9.04167 8.43083 9.53833 7.17083 9.71333C7.4025 9.93 7.60417 10.3458 7.60417 11C7.60417 11.9333 7.59833 12.685 7.59833 12.6683C7.59833 12.845 7.7175 13.0617 8.04917 12.9883C9.33274 12.5409 10.4464 11.6866 11.2268 10.5479C12.0072 9.40926 12.4148 8.04511 12.4167 6.64833C12.4167 2.98333 9.5067 0 5.9167 0H6.5Z" fill="currentColor" />
              </svg>
            </a>
          </nav>
          <div className="right-subwrapper">
            <div className={"web-links"}>
              <LinkButtonFooter linkName={"HOME"} linkTo={inProject && onBackWithScroll ? "" : "#HOME"} lenis={lenis} offset={isMobile ? -60 : 0} onClick={inProject && onBackWithScroll ? () => onBackWithScroll('#HOME') : undefined} />
              <LinkButtonFooter linkName={"WORK"} linkTo={inProject && onBackWithScroll ? "" : "#WORK"} lenis={lenis} offset={isMobile ? -60 : 0} onClick={inProject && onBackWithScroll ? () => onBackWithScroll('#WORK') : undefined} />
              <LinkButtonFooter linkName={"ABOUT"} linkTo={inProject && onBackWithScroll ? "" : "#ABOUT"} lenis={lenis} offset={isMobile ? -60 : 0} onClick={inProject && onBackWithScroll ? () => onBackWithScroll('#ABOUT') : undefined} />
            </div>
            <div className="right">
              <div className="wrapper">
                <p className="copyright">
                  SAHIL MEYMON &copy; {CURRENT_YEAR}
                </p>
                <p className="tagline">ALL LEFTS UNRESERVED</p>
              </div>
              <div className="au-revoir" aria-hidden="true">
                <div className="title">
                  <h1>FI-AMANILLAH</h1>
                </div>
                <div className="ghost">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="left" ref={studGridRef} style={{ position: "relative" }}>
          <FooterStudGrid />
          {showTrail && (
            <Suspense fallback={null}>
              <PixelTrail
                gridSize={30}
                trailSize={0.12}
                maxAge={300}
                interpolate={5}
                color={isDark ? "#C0392B" : "#00A084"}
                canvasProps={{
                  eventSource: studGridRef,
                  style: { inset: 0, width: "100%", height: "100%", pointerEvents: "none" },
                }}
              />
            </Suspense>
          )}
        </div>
      </div>

      <div className="extremes-wrapper-right">
        <div className="extremes" />
      </div>
    </footer>
  );
};

export default Footer;
