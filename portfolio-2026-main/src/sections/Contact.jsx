import { useState, forwardRef, useRef } from "react";
import { useButtonSounds } from "../hooks/useButtonSounds";
import styles from "./Contact.module.css";
import Denji from "../components/Denji";
import AnimatedArrow from "../components/AnimatedArrow";
import GrassOverlay from "../components/GrassOverlay";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";


const Contact = forwardRef(({ }, ref) => {
  const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
  const playHover = () => _playHover(3);
  const playClick = () => _playClick(3);
  const [contactHovered, setContactHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const grassTargetRef1 = useRef(null);
  const grassTargetRef2 = useRef(null);
  const headingRef = useRef(null);
  const sectionRef = useRef(null);
  const firstH4Ref = useRef(null);
  const muteButtonRef = useRef(null);

  useGSAP(() => {
    if (!headingRef.current) return;

    gsap.to(headingRef.current, {
      scrollTrigger: {
        trigger: headingRef.current,
        start: "top 70%",
        end: "bottom top",
        toggleClass: {
          targets: headingRef.current,
          className: styles.headingActive,
        },
      },
    });

    if (!sectionRef.current || hasAnimated) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 50%",
        once: true,
        onEnter: () => setHasAnimated(true),
      },
    });

    tl.call(
      () => {
        if (muteButtonRef.current) {
          muteButtonRef.current.textContent = "[ Unmutes ]";
        }
      },
      null,
      1
    );

    if (firstH4Ref.current) {
      const words = firstH4Ref.current.querySelectorAll(".word");
      tl.to(
        words,
        {
          opacity: 1,
          duration: 0.15,
          stagger: 0.1,
        },
        1.5
      );
    }
  }, [hasAnimated]);

  return (
    <section
      id="CONTACT"
      className={styles.contact}
      aria-label="Contact"
      ref={(el) => {
        sectionRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
    >
      <div className="extremes-wrapper-left">
        <div className="extremes"></div>
      </div>

      <div className={styles.middle}>
        <div className={styles.right}>
          <h2 className={styles.heading} ref={headingRef}>
            <span className={styles.headingBracket}>{"<"}</span>
            CONTACT
            <span className={styles.headingBracket}>{"/>"}</span>
          </h2>

          <div className={styles.first}>
            <p className={styles.firstH4} ref={firstH4Ref}>
              <span ref={muteButtonRef}>[ Muted ]</span>
              <br />{" "}
              <span className="word" style={{ opacity: 0 }}>
                Nothing
              </span>{" "}
              <span className="word" style={{ opacity: 0 }}>
                from
              </span>{" "}
              <span className="word" style={{ opacity: 0 }}>
                my
              </span>{" "}
              <span className="word" style={{ opacity: 0 }}>
                side
              </span>{" "}
              <span className="word" style={{ opacity: 0 }}>
                ..
              </span>
            </p>
            <p className={styles.firstH3}>
              I’m always up for a chat whether it’s MMA techniques, cinematic films, or your next Web project. You can reach me at..
            </p>
          </div>

          <a
            href="mailto:sahilsajjan18@gmail.com"
            aria-label="Email Sahil at sahilsajjan18@gmail.com"
            className={styles.second}
            onMouseEnter={() => { setContactHovered(true); playHover(); }}
            onMouseLeave={() => setContactHovered(false)}
            onClick={playClick}
            ref={grassTargetRef1}
          >
            <AnimatedArrow isActive={!contactHovered} />
            <p>
              SAHILSAJJAN18
              <span>@GMAIL.COM</span>
            </p>
            <AnimatedArrow isActive={contactHovered} />
          </a>
          <GrassOverlay targetRef={grassTargetRef1}></GrassOverlay>
        </div>

        <div className={styles.left} ref={grassTargetRef2}>
          <Denji />
        </div>
        <GrassOverlay targetRef={grassTargetRef2}></GrassOverlay>
      </div>

      <div className="extremes-wrapper-right">
        <div className="extremes"></div>
      </div>
    </section>
  );
});

export default Contact;
