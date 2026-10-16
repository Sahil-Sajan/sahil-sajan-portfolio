import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useButtonSounds } from "../hooks/useButtonSounds";
import styles from "./About.module.css";

const SpaceShooter = lazy(() => import("../components/SpaceShooter/SpaceShooter.jsx"));
const SnakeGame    = lazy(() => import("../components/SnakeGame/SnakeGame.jsx"));
import star from "/star.svg";
import checked from "/checked.svg";
import unchecked from "/unchecked.svg";
import TerminalBio from "../components/TerminalBio/TerminalBio.jsx";
import TerminalBioMobile from "../components/TerminalBioMobile/TerminalBioMobile.jsx";
import GrassOverlay from "../components/GrassOverlay.jsx";
import AnimatedArrow from "../components/AnimatedArrow.jsx";
import RevealText from "../components/RevealText.jsx";


const ListItem = ({ icon, text, span }) => (
  <div className={styles.item}>
    <div className={styles.wrapper}>
      <img src={icon} alt="" />
    </div>
    <p className={icon === checked ? styles.checked : styles.unchecked}>
      {text} {span && <span>{span}</span>}
    </p>
  </div>
);

// Objective sentence as reveal segments. `trail` is punctuation glued to its
// word (so it never wraps onto its own line); `className` styles a whole word.
const OBJECTIVE_SEGMENTS = [
  { text: "I" },
  { text: "build" },
  { text: "scalable", className: styles.objLora },
  { text: "SaaS" },
  { text: "platforms", trail: { text: ",", className: styles.objComma } },
  { text: "AI-powered", className: styles.objLora },
  { text: "products", trail: { text: ",", className: styles.objComma } },
  { text: "and" },
  { text: "modern" },
  { text: "web" },
  { text: "experiences", trail: { text: ".", className: styles.objPeriod } },

  { text: "From" },
  { text: "polished", className: styles.objLora },
  { text: "interfaces" },
  { text: "to" },
  { text: "scalable" },
  { text: "systems", trail: { text: ",", className: styles.objComma } },
  { text: "I" },
  { text: "focus" },
  { text: "on" },
  { text: "building" },
  { text: "products" },
  { text: "that" },
  { text: "feel" },
  { text: "fast", className: styles.objLora },
  { text: "and" },
  { text: "last", className: styles.objLora, trail: { text: ".", className: styles.objPeriod } },

  { text: "Using" },
  { text: "Next.js", className: styles.objLora },
  { text: ",", trail: { text: "", className: "" } },
  { text: "TypeScript", className: styles.objLora },
  { text: "and" },
  { text: "Node.js", className: styles.objLora },
  { text: "," },
  { text: "I" },
  { text: "turn" },
  { text: "ideas" },
  { text: "into" },
  { text: "production", className: styles.objLora },
  { text: "ready" },
  { text: "products", trail: { text: ".", className: styles.objPeriod } },
];
const ExperienceBlock = ({ company, experiences }) => (
  <div className={styles.experienceWrapper}>
    <div className={styles.company}>
      <img src={star} alt="" />
      <h4>{company}</h4>
    </div>
    {experiences.map(({ role, date }, i) => (
      <div className={styles.experience} key={i}>
        <h3>{role}</h3>
        <div className={styles.line}></div>
        <h3>{date}</h3>
      </div>
    ))}
  </div>
);

const About = forwardRef((_, ref) => {
  const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
  const playHover = () => _playHover(3);
  const playClick = () => _playClick(3);
  const [resumeHovered, setResumeHovered] = useState(false);
  const cellRef = useRef(null);
  const grassTargetRef1 = useRef(null);
  const grassTargetRef3 = useRef(null);
  const grassTargetRef4 = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    if (!headingRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        headingRef.current?.classList.toggle(styles.headingActive, entry.isIntersecting);
      },
      { rootMargin: "0px 0px -40% 0px" }
    );
    observer.observe(headingRef.current);
    return () => observer.disconnect();
  }, []);




  const handleEnter = useCallback(() => setResumeHovered(true), []);
  const handleLeave = useCallback(() => setResumeHovered(false), []);

  const currentEnjoy = [
    { text: "Gym & Strength Training" },
    { text: "MMA" },
    { text: "Gaming sessions" },
    { text: "Building websites with Next.js" },
    { text: "Late-night productivity sessions" },
    { text: "Listening to music" },
    { text: "Cinematic Movies" },
    { text: "Being a Cinephile" },
  ];

  const goals = [
    { text: "Backend with Node.js and Express.js", checked: true },
    { text: "React Native development", checked: true },
    { text: "Building full-stack projects", checked: true },
    { text: "Cloud AWS and deployment skills" },
    { text: "Pursue a Master’s abroad" },
    { text: "Not letting intrusive thoughts win" }
  ];

  const experiences = [
    {
      company: "VIGA ET",
      roles: [
        { role: "UI/UX Engineer", date: "2024 - Ongoing" },
        { role: "UI/UX Intern", date: "2023 - 2024" },
      ],
    },
    {
      company: "SIGGRAPH BNMIT",
      roles: [
        { role: "Siggraph Lead", date: "2023 - 2024" },
        { role: "Siggraph Brand Lead", date: "2022 - 2023" },
      ],
    },
  ];

  return (
    <section id="ABOUT" className={styles.about} ref={ref} aria-label="About">
      <div className="extremes-wrapper-left">
        <div className="extremes"></div>
      </div>

      <div className={styles.middle}>
        <div className={styles.right}>
          <h2 className={styles.heading} ref={headingRef}>
            <span className={`${styles.headingBracket}`}>
              {"<"}
            </span>
            ABOUT
            <span className={`${styles.headingBracket}`}>
              {"/>"}
            </span>
          </h2>

          <div className={styles.rightFirst}>
            <div>
              <div className={styles.iconWrapper}>
                <span aria-hidden="true">{">"}</span>
              </div>
              <h3>OBJECTIVE</h3>
            </div>
            <RevealText
              className={styles.objh3}
              segments={OBJECTIVE_SEGMENTS}
              rootMargin="0px 0px -25% 0px"
              threshold={0}
            />
          </div>

          <div
            className={styles.rightSecond}
            ref={grassTargetRef1}
          >
            <div>
              <div className={styles.iconWrapper}>
                <span aria-hidden="true" className={styles.desch4}>
                  {">"}
                </span>
              </div>
              <h3>DESCRIPTIVE</h3>
              ```jsx
            </div>
            <p className={styles.desch3}>
              <span>[ my intro ]</span> I’m Sahil Sajjan{" "}
              <span>[ Full-Stack Developer ]</span>, the kind of builder who sees products as more than just screens and code. From crafting polished interfaces in Next.js to architecting the systems that power them behind the scenes, I enjoy turning ambitious ideas into software people genuinely love using.

              <br />
              <br />

              Based in Hyderabad, Pakistan{" "}
              <span>[ building for the world ]</span>, I obsess over the details most people never notice — whether that's a perfectly timed animation, a clean API structure, or a component architecture that scales effortlessly as products grow. I believe the best digital experiences feel simple on the surface because of the complexity carefully handled underneath.

              <br />
              <br />

              Where others just ship features, I focus on building products that last. Armed with an IT foundation and a deep curiosity for how things work, I sit at the intersection of design, engineering, and problem-solving — using TypeScript to keep systems reliable, Next.js to deliver performant experiences, and modern web technologies to bridge the gap between vision and reality.

              <br />
              <br />


            </p>
          </div>
          ```


          <GrassOverlay targetRef={grassTargetRef1}></GrassOverlay>

        </div>

        <div className={styles.left}>
          <div className={styles.leftFirst} ref={cellRef}>
            <div className={styles.leftFirstS1}>
              <Suspense fallback={null}><SpaceShooter /></Suspense>
            </div>
            <div className={styles.aboutImgWrapper}>
              <div className={styles.desktopOnly}><TerminalBio /></div>
              <div className={styles.mobileOnly}><TerminalBioMobile /></div>
            </div>
            <div className={styles.leftFirstCell}>
              <Suspense fallback={null}><SnakeGame /></Suspense>
            </div>
          </div>

          <a
            href="https://drive.google.com/file/d/1eW45y3kP69cdX0T7bF0GH5vi8V_Hs9KX/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Sahil's resume (PDF, opens in new tab)"
            className={styles.second}
            onMouseEnter={() => { setResumeHovered(true); playHover(); }}
            onMouseLeave={() => setResumeHovered(false)}
            onClick={playClick}
            ref={grassTargetRef4}
          >
            <AnimatedArrow isActive={!resumeHovered} />
            <p>
              VIEW SAHIL'S <span>RESUME</span>
            </p>
            <AnimatedArrow isActive={resumeHovered} />
          </a>

          <GrassOverlay targetRef={grassTargetRef4}></GrassOverlay>

          <div className={styles.thirdNew}>
            <div className={styles.thirdLeft}>
              <h3>THINGS HE CURRENTLY ENJOYS</h3>
              <div className={styles.list}>
                {currentEnjoy.map((item, i) => (
                  <ListItem
                    key={i}
                    icon={star}
                    text={item.text}
                    span={item.span}
                  />
                ))}
              </div>
            </div>
            <div
              className={styles.thirdRight}
              ref={grassTargetRef3}
            >
              <h3>THINGS HE HOPES TO COMPLETE</h3>
              <div className={styles.list}>
                {goals.map((item, i) => (
                  <ListItem
                    key={i}
                    icon={item.checked ? checked : unchecked}
                    text={item.text}
                    span={item.span}
                  />
                ))}
              </div>
            </div>
            <GrassOverlay targetRef={grassTargetRef3}></GrassOverlay>
          </div>
        </div>
      </div>

      <div className="extremes-wrapper-right">
        <div className="extremes"></div>
      </div>
    </section>
  );
});

export default About;
