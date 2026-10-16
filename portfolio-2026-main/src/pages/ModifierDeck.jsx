import { useMemo, useState, useRef, useEffect } from "react";
import { useButtonSounds } from "../hooks/useButtonSounds";
import styles from "./ModifierDeck.module.css";
import Contact from "../sections/Contact";
import Footer from "../sections/Footer";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import LegoStreakCanvas from "../components/LegoStreakCanvas";

const TOTAL_CARDS = 42;

const Card = ({ index, isLocked, triggerFlip, cardData, isDesktop, isAnyHovered, onHoverStart, onHoverEnd }) => {
  const cardRef = useRef(null);
  const unlockLabelRef = useRef(null);
  const cardLabelRef = useRef(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0, active: false });
  const [hasFinishedIntro, setHasFinishedIntro] = useState(false);

  const frontImage = cardData?.img || `/cards/cardBack.webp`;
  const backImage = `/cards/cardBack.webp`;

  useEffect(() => {
    if (triggerFlip && !isLocked && cardData) {
      setTimeout(() => {
        if (unlockLabelRef.current) {
          unlockLabelRef.current.textContent =
            cardData.unlockLabel || "?";
        }
        if (cardLabelRef.current) {
          cardLabelRef.current.textContent = cardData.cardLabel || "?";
        }
      }, index * 100);
    }
  }, [triggerFlip, isLocked, cardData, index]);

  useGSAP(() => {
    if (triggerFlip) {
      gsap.set(cardRef.current, {
        rotateY: 180,
        z: 0,
        rotationZ: 0,
        x: 0,
        y: 0,
      });

      const tl = gsap.timeline({
        delay: index * 0.1,
        onComplete: () => setHasFinishedIntro(true),
      });

      tl.to(cardRef.current, {
        z: 100,
        duration: 0.6,
        ease: "power2.out",
      })
        .to(
          cardRef.current,
          {
            rotateY: isLocked ? 180 : 0,
            duration: 0.4,
            ease: "back.out(1.2)",
          },
          0
        )
        .to(
          cardRef.current,
          {
            z: 0,
            duration: 0.3,
            ease: "power2.in",
          },
          "-=0.2"
        );
    }
  }, [triggerFlip, isLocked, index]);

  const handleMouseMove = (e) => {
    if (!hasFinishedIntro || !isDesktop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHoverPos({ x, y, active: true });
    onHoverStart?.();
  };

  const dynamicStyle = useMemo(() => {
    if (!hasFinishedIntro) return {};

    if (hoverPos.active) {
      const tiltX = isLocked ? 180 + hoverPos.x * 18 : hoverPos.x * 18;
      const tiltY = isLocked ? hoverPos.y * 18 : hoverPos.y * -18;
      const transZ = isLocked ? -36 : 36;

      return {
        transform: `perspective(1000px) rotateY(${tiltX}deg)
                    rotateX(${tiltY}deg) translateZ(${transZ}px)`,
        zIndex: 10,
        transition: "transform 0.1s ease-out",
      };
    }

    return {
      transform: `perspective(1000px) rotateY(${isLocked ? 180 : 0}deg)
                  rotateX(0deg) translateZ(0px)`,
      transition: "transform 0.9s cubic-bezier(0.23, 1, 0.32, 1)",
    };
  }, [hoverPos, isLocked, hasFinishedIntro]);


  return (
    <div
      className={styles.cardContainer}
      style={{
        opacity: isAnyHovered ? 0.6 : 1,
        transition: "opacity 0.9s ease",
      }}
      onMouseMove={isDesktop ? handleMouseMove : undefined}
      onMouseLeave={
        isDesktop ? () => { setHoverPos({ x: 0, y: 0, active: false }); onHoverEnd?.(); } : undefined
      }
    >
      <div className={styles.cardInner} ref={cardRef} style={dynamicStyle}>
        <div className={styles.cardFront}>
          <img
            src={frontImage}
            alt={cardData?.name || `Card ${index + 1}`}
            className={styles.cardImg}
          />
          {!isLocked && <LegoStreakCanvas hoverPos={hoverPos} isActive={hoverPos.active} imgSrc={frontImage} 
          config={{ 
                gridSize: 21,
                innerZones: [
                  { relWidth: 0.50, quality: "plain" },  // outer edge: studded → plain
                  { relWidth: 0.29, quality: "image" },  // inner edge: plain → transparent
                ], 
            }} />}
        </div>
        <div className={styles.cardBack}>
          <img src={backImage} alt="Card Back" className={styles.cardImg} />
          {!isLocked && <LegoStreakCanvas hoverPos={hoverPos} isActive={hoverPos.active} imgSrc={backImage} config={{ gridSize: 21 }} />}
        </div>
      </div>
      <div className={styles.unlockLabel} ref={unlockLabelRef}>
        {isLocked ? "?" : "?"}
      </div>
      <div className={styles.rect}></div>
      <div className={styles.cardLabel} ref={cardLabelRef}>
        {isLocked ? "?" : "?"}
      </div>
    </div>
  );
};

const ModifierDeck = ({ handleBack, onBackWithScroll, isIncomingTransition }) => {
  const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
  const playHover = () => _playHover(3);
  const playClick = () => _playClick(3);
  const lenis = useLenis();
  const [startSequence, setStartSequence] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [cardsData, setCardsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1201;
  });

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 1201);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetch("/data/cards.json")
      .then((res) => res.json())
      .then((data) => {
        setCardsData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading cards data:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isIncomingTransition && cardsData) {
      const timer = setTimeout(() => setStartSequence(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isIncomingTransition, cardsData]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const UNLOCKED_COUNT = cardsData?.cards?.length || 0;

  return (
    <div
      id="modifierDeck-content"
      className={styles.modifierContent}
      style={
        isIncomingTransition
          ? {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "calc(100dvh / var(--app-scale, 1))",
              overflow: "hidden",
              backgroundColor: "var(--off-teal)",
              zIndex: 0,
              clipPath: "inset(50% 50% 50% 50% round 9px)",
            }
          : {}
      }
    >
      <section className={styles.modifierSection}>
        <div className={"extremes-wrapper-left"}>
          <div className={"extremes"}></div>
        </div>
        <div className={styles.middle}>
          <div className={styles.left}>
            <div className={styles.stickyDiv}>
              <div className={styles.menu}>
                <div className={styles.navLink} onMouseEnter={playHover} onClick={() => { playClick(); handleBack(); }}>
                  BACK
                </div>
                <div className={styles.cell}></div>
              </div>
              <div className={styles.titleBox}>
                MODIFIER DECK{" "}
                <span className={styles.counter}>
                  {UNLOCKED_COUNT}
                  <span className={styles.count}>/{TOTAL_CARDS}</span>
                </span>
              </div>
              <div className={styles.third}>
                <div>
                  <div className={styles.iconWrapper}>
                    <span aria-hidden="true" className={styles.chevronh4}>{">"}</span>
                  </div>
                  <p className={styles.desch4}>ABOUT MODIFIER DECK</p>
                </div>
                <h3 className={styles.desch3}>
                  Completing a task or achievement forges a new card,
                  enhancing Sahil's traits.
                  <br/>
                </h3>
              </div>
                <div className={styles.third}>
                <h3 className={styles.desch3}>
                    The Answer to the Ultimate Question of Life, the Universe, and Everything was 42 — the number of cards in this deck.
                </h3>
              </div>
              <div className={styles.rounder}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d="M0 0H9C4.02944 0 3.22128e-07 4.02944 0 9V0Z"
                    fill="var(--off-teal)"
                  />
                </svg>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d="M9 0H0C4.97056 0 9 4.02944 9 9V0Z"
                    fill="var(--off-teal)"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className={styles.right}>
                <div className={styles.third}>
                    <div>
                        <div className={styles.iconWrapper}>
                            <span aria-hidden="true" className={styles.chevronh4}>{">"}</span>
                        </div>
                        <p className={styles.desch4}>ABOUT MODIFIER DECK</p>
                    </div>
                    <h3 className={styles.desch3}>
                        Completing a task or achievement forges a new card,
                        enhancing Sahil's traits.
                        <br/>
                    </h3>
                </div>
                <div className={styles.third}>
                <h3 className={styles.desch3}>
                    The Answer to the Ultimate Question of Life, the Universe, and Everything was 42 — the number of cards in this deck.
                </h3>
                </div>
                <div className={styles.contentBlockWrapper}>
                    <div className={styles.contentBlock}>
                    <div className={styles.cardsGrid}>
                        {[...Array(TOTAL_CARDS)].map((_, i) => (
                        <Card
                          key={i}
                          index={i}
                          isLocked={i >= UNLOCKED_COUNT}
                          triggerFlip={startSequence}
                          cardData={cardsData?.cards[i]}
                          isDesktop={isDesktop}
                          isAnyHovered={hoveredIndex !== null && hoveredIndex !== i}
                          onHoverStart={() => setHoveredIndex(i)}
                          onHoverEnd={() => setHoveredIndex(null)}
                        />
                        ))}
                    </div>
                    </div>
                </div>
          </div>
        </div>
        <div className={"extremes-wrapper-right"}>
          <div className={"extremes"}></div>
        </div>
      </section>
      <Contact />
      <Footer inProject={true} lenis={lenis} onBackWithScroll={onBackWithScroll} />
    </div>
  );
};

export default ModifierDeck;
