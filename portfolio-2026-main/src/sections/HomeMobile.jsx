import { useRef, forwardRef, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./HomeMobile.module.css";
import Clock from "../components/Clock";
import Metric from "../components/Metric";
import HeroMobile from "../components/Hero/HeroMobile";
import AnimatedMan from "../components/AnimatedMan";
import { useGSAP } from "@gsap/react";
import GrassOverlay from "../components/GrassOverlay";
import AnimatedArrow from "../components/AnimatedArrow";
import { useButtonSounds } from "../hooks/useButtonSounds";
import { useCardCount } from "../hooks/useCardCount";


const Home = forwardRef(
  ({ isLoaded, isLoadedforHero, onModifierDeckSelect, returnedFrom }, ref) => {
    const cardCount = useCardCount();
    const rectRef = useRef(null);
    const heroRef = useRef(null);
    const parallaxRef = useRef(null);
    const grassTargetRef1 = useRef(null);
    const grassTargetRef2 = useRef(null);
    const grassTargetRef3 = useRef(null);
    const [deckHovered, setDeckHovered] = useState(false);
    const { playHover, playClick } = useButtonSounds();
    const narratorRef = useRef(null);
    const cursorRef = useRef(null);

    const cardWrapperRef = useRef(null);

    const narratorMessage = useMemo(() => {

      const modifierDialogues = [
        "The deck grows heavier. So does he",
        "The collection expands. So does his resolve",
        "He carries more now and carries it well",
        "He's building a hand he believes in",
        "The deck grows. So does his discipline",
        "He's assembling something steady, isn't he",
        "He keeps forging interesting cards",
        "The more he unlocks, the more deliberate he becomes",
        "He unlocked it. Now he has to live up to it",
        "It suits him, though he doesn't realize why yet",
        "He reached for a heavier card this time",
        "He's not afraid of harder cards now",
        "The collection is gaining structure",
        "That card will matter later",
        "He's stacking identity, not just achievement",
        "The deck is beginning to resemble resolve",
        "He's assembling something coherent",
        "He's shaping who he'll be remembered as",
      ];

      const projectDialogues = [
        "He builds like he's solving something personal",
        "Every project leaves a fingerprint",
        "Work is how he thinks out loud",
        "Interesting… he handled that differently",
        "That's growth",
        "He's asking better questions",
        "You can feel the evolution, can't you",
        "You can tell he wrestled with this",
        "He's designing the way he thinks",
        "The ambition outpaces the polish",
        "He sees it. He just hasn't mastered it yet",
        "He's aware of what's missing",
        "He's outgrowing his old limits",
        "He's building taste faster than technique",
        "He's not satisfied with this. That's a good sign",
        "The growth is uneven. That's normal",
        "There's rawness here. That's not weakness",
        "He's closer to mastery than he was yesterday",
      ];

      if (returnedFrom === "modifier_deck") {
        return modifierDialogues[
          Math.floor(Math.random() * modifierDialogues.length)
        ];
      }

      if (returnedFrom === "project") {
        return projectDialogues[
          Math.floor(Math.random() * projectDialogues.length)
        ];
      }

      return "This is the loud version of him";
    }, [returnedFrom]);

    useGSAP(() => {
      if (!rectRef.current) return;
      CustomEase.create("wave", "M0,0 C0.6,0, 0.3,1.4, 1,1");

      const tween = gsap.to(rectRef.current, {
        rotate: "360deg",
        duration: 3,
        ease: "wave",
        repeat: -1,
      });
    }, []);

    useGSAP(() => {
      if (!parallaxRef.current || !ref.current) return;
      gsap.to(parallaxRef.current, {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          endTrigger: parallaxRef.current,
          start: "top top",
          end: "top top",
          scrub: 1,
        },
      });
    }, []);

    useEffect(() => {
      if (!cardWrapperRef.current) return;

      const cards = cardWrapperRef.current.querySelectorAll(
        `.${styles.homeCardInner}`
      );
      gsap.set(cards, { rotateY: 180 });

      const master = gsap.timeline({ paused: true });

      cards.forEach((card, i) => {
        const tl = gsap
          .timeline()
          .fromTo(
            card,
            { rotateY: 180, z: 0 },
            { z: 60, duration: 0.6, ease: "power2.out" }
          )
          .to(card, {
            rotateY: 0,
            duration: 0.4,
            ease: "back.out(1.4)",
          })
          .to(card, { z: 0, duration: 0.3, ease: "power2.in" }, "-=0.2");
        master.add(tl, i * 0.15);
      });

      let hasPlayed = false;

      ScrollTrigger.create({
        trigger: cardWrapperRef.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => {
          if (hasPlayed) return;
          master.restart();
          hasPlayed = true;
        },
        onEnterBack: () => {
          if (hasPlayed) return;
          master.restart();
          hasPlayed = true;
        },
        invalidateOnRefresh: true,
      });

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    }, []);

    useGSAP(() => {
      if (!narratorRef.current) return;

      const words = narratorRef.current?.querySelectorAll(".narrator-word-mobile");
      gsap.fromTo(words,
        {
          opacity: 0,
          display: "none",
        },
        {
          opacity: 1,
          display: "inline",
          duration: 0.15,
          stagger: 0.1,
          delay: returnedFrom ? 4 : 2,
          ease: "none",
        });

    }, [returnedFrom]);

    useGSAP(() => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, {
        opacity: 1,
        duration: 0.1,
        repeat: -1,
        yoyo: true,
        ease: "none",
        repeatDelay: 0.6,
      });
    }, []);

    return (
      <section id="HOME" ref={ref} className={styles.home} aria-label="Home">
        <div className="extremes-wrapper-left">
          <div className="extremes"></div>
        </div>

        <div className={styles.middle}>
          <div className={styles.topFirst}>
            <h1 className={styles.topFirstH1}>
              Unconventional <span>ideas</span>
              <span>,</span> minimalist <span>execution</span>
              <span>.</span>
            </h1>
            <h2 className={styles.topFirstH2}>
              Well hello there! I'm <span>Sahil Sajjan.</span> Honestly, I treat the
              browser like an open canvas and <span>Next.js</span> like my medium. I love
              taking heavy, complex logic and turning it into clean, fluid web experiences
              that just feel right when you use them. To me, a pixel-perfect layout and a
              smooth animation aren't just details — they're the whole craft. I als- <span>[ muted ]</span>
            </h2>
            <div className={styles.botTextH2}>
              <h2 className={styles.topFirstH22}>
                <span className={styles.narrator}>Narrator:</span>{" "}
                <span ref={narratorRef}>
                  {narratorMessage.split(" ").map((word, i, arr) => (
                    <span
                      key={`${word}-${i}`}
                      className={"narrator-word-mobile"}
                      style={{ opacity: 0, display: "none" }}
                    >
                      {word}
                      {i < arr.length - 1 ? " " : ""}
                    </span>
                  ))}
                </span>
                <span ref={cursorRef} className={styles.cursor}>
                  ▌
                </span>
              </h2>
            </div>
            <div className={styles.time}>
              <svg
                ref={rectRef}
                width="9"
                height="10"
                viewBox="0 0 9 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                  fill="var(--dark-green)"
                />
              </svg>
              <h3 className={styles.timeh3}>
                LOCAL TIME <Clock />
              </h3>
              <h3 className={styles.timeh32}>GMT +0500</h3>
            </div>
          </div>

          <div className={styles.hero} ref={grassTargetRef3}>
            <HeroMobile ref={heroRef} isLoaded={isLoadedforHero} />
          </div>
          <GrassOverlay targetRef={grassTargetRef3} />

          <div className={styles.metricSuperwrapper}>
            <div className={styles.manWrapper}>
              <AnimatedMan isLoaded={isLoaded} />
            </div>
            <div className={styles.third}>
              <div>
                <div className={styles.iconWrapper}>
                  <span aria-hidden="true" className={styles.chevronh4}>{">"}</span>
                </div>
                <p className={styles.desch4}>NARRATOR'S NOTE</p>
              </div>
              <div className={styles.spacer}></div>
              <h3 className={styles.desch3}>
                For the past{" "}
                {
                  [
                    "zero",
                    "one",
                    "two",
                    "three",
                    "four",
                    "five",
                    "six",
                    "seven",
                    "eight",
                    "nine",
                    "ten",
                  ][
                  Math.floor(
                    (new Date() - new Date("2023-10-01")) /
                    (1000 * 60 * 60 * 24 * 365.25)
                  )
                  ]
                }{" "}
                years, Sahil has been mastering frameworks and code to become as strong as possible. He is a quiet developer with a massive dream: to build legendary digital experiences and push his work to total perfection.
              </h3>
              <div className={styles.stars}>
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.70596 1.00568C4.02063 0.331439 4.97937 0.33144 5.29404 1.00568L6.17762 2.89892C6.26466 3.08542 6.41458 3.23534 6.60108 3.32238L8.49432 4.20596C9.16856 4.52063 9.16856 5.47937 8.49432 5.79404L6.60108 6.67762C6.41458 6.76466 6.26466 6.91458 6.17762 7.10108L5.29404 8.99432C4.97937 9.66856 4.02063 9.66856 3.70595 8.99432L2.82238 7.10108C2.73534 6.91458 2.58542 6.76466 2.39892 6.67762L0.505681 5.79404C-0.168561 5.47937 -0.16856 4.52063 0.505682 4.20595L2.39892 3.32238C2.58542 3.23534 2.73534 3.08542 2.82238 2.89892L3.70596 1.00568Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <div className={styles.metricWrapper}>
              <Metric
                ref={grassTargetRef1}
                name={"PROJECTS COMPLETED"}
                count={5}
                isLoaded={isLoaded}
                delay={0}
              />
              <GrassOverlay targetRef={grassTargetRef1} />
              <Metric
                ref={grassTargetRef2}
                name={"DEV EXPERIENCE"}
                count={
                  Math.floor(
                    (new Date() - new Date("2024-10-01")) /
                    (1000 * 60 * 60 * 24 * 365.25)
                  )
                }
                isLoaded={isLoaded}
                delay={0}
              />
              <GrassOverlay targetRef={grassTargetRef2} />
            </div>
          </div>

          {/* -------- MOBILE CARDS SECTION -------- */}
          <div className={styles.fourthTop}>
            <div className={styles.cardWrapper} ref={cardWrapperRef}>
              <div className={styles.homeCardDeck}>
                {/* Back-facing cards — rendered first, z-index: -1 keeps them behind */}
                <div className={styles.homeCard} style={{ zIndex: -1 }}>
                  <div className={styles.homeCardBlank}>
                    <img src="/cards/cardBack.webp" className={styles.cardImg} alt="" />
                  </div>
                </div>
                <div className={styles.homeCard} style={{ zIndex: -1 }}>
                  <div className={styles.homeCardBlank}>
                    <img src="/cards/cardBack.webp" className={styles.cardImg} alt="" />
                  </div>
                </div>
                {/* Front-facing cards with flip animation */}
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={styles.homeCard}
                    style={{ zIndex: i === 1 ? 5 : i === 3 ? 2 : i + 1 }}
                  >
                    <div className={styles.homeCardInner}>
                      <div className={styles.homeCardFront}>
                        <img
                          src={`/cards/card${i + 1}.webp`}
                          className={styles.cardImg}
                          alt={`Card ${i + 1}`}
                        />
                      </div>
                      <div className={styles.homeCardBack}>
                        <img
                          src={`/cards/cardBack.webp`}
                          className={styles.cardImg}
                          alt="Card back"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* -------------------------------------- */}

          <div className={styles.fourth}>
            <div className={styles.top}>
              <Metric
                name={"CARDS COLLECTED"}
                count={cardCount}
                isLoaded={isLoaded}
                delay={0}
              />
              <div className={styles.cell}>
                With every feat accomplished, a new card is forged and registered in his database.
              </div>
            </div>

            <a
              href="#"
              className={styles.second}
              onMouseEnter={() => { setDeckHovered(true); playHover(3); }}
              onMouseLeave={() => setDeckHovered(false)}
              onClick={(e) => {
                e.preventDefault();
                playClick(3);
                onModifierDeckSelect();
              }}
            >
              <AnimatedArrow isActive={!deckHovered} />
              <h4>
                VIEW <span>MOD DECK</span>
              </h4>
              <AnimatedArrow isActive={deckHovered} />
            </a>
          </div>
        </div>

        <div className="extremes-wrapper-right">
          <div className="extremes"></div>
        </div>
      </section>
    );
  }
);

export default Home;
