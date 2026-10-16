import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Header from '../sections/Header.jsx';
import HeaderMobile from '../sections/HeaderMobile.jsx';
import Home from '../sections/Home.jsx';
import HomeMobile from '../sections/HomeMobile.jsx';
import { useLenis } from 'lenis/react';
import Work from '../sections/Work.jsx';
import About from '../sections/About.jsx';
import Contact from '../sections/Contact.jsx';
import Footer from '../sections/Footer.jsx';
import { useIsMobile } from '../hooks/useIsMobile';

const LampWire = lazy(() => import('../components/LampWire/LampWire.jsx'));

const Landing = ({isLoaded, onProjectSelect, isIncomingTransition, onModifierDeckSelect, isPreloaderDone, returnedFrom, pendingScrollTarget, onScrollTargetConsumed}) => {
    const [linkHovered, setLinkHovered] = useState(false);
    const homeRef = useRef(null);
    const aboutRef = useRef(null);
    const workRef = useRef(null);
    const contactRef = useRef(null);
    const lenis = useLenis();
    const isMobile = useIsMobile();

      // Hook up Lenis to GSAP ticker safely
    // useEffect(() => {
    //     if (!lenis) return; // lenis might be null until provider mounts

    //     gsap.ticker.add((time) => {
    //         lenis.raf(time * 1000); // Convert time from seconds to milliseconds
    //       });

    //     // Disable lag smoothing in GSAP to prevent any delay in scroll animations
    //     gsap.ticker.lagSmoothing(0);
    // }, [lenis]);

    useEffect(() => {
        if (!isIncomingTransition && pendingScrollTarget && lenis) {
            let scrollDuration = 3;
            if (pendingScrollTarget === '#ABOUT') scrollDuration = 4;
            const timer = setTimeout(() => {
                lenis.scrollTo(pendingScrollTarget, { duration: scrollDuration, offset: isMobile ? -60 : 0 });
                onScrollTargetConsumed?.();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isIncomingTransition, pendingScrollTarget, lenis, isMobile]);

    const initialStyle = {
        position: "relative",
        width: "100%",
        height: "calc(100dvh / var(--app-scale, 1))",
        overflow: "hidden",
        backgroundColor: "var(--off-teal)",
        zIndex: 1,
        clipPath: "inset(50% 50% 50% 50% round 9px)"
    };

    useGSAP(()=>{
        if (isLoaded && !isPreloaderDone) {
            gsap.fromTo(
                '#main-content',
                { clipPath: "inset(50% 50% 50% 50% round 9px)" },
                {
                    clipPath: "inset(0% 0% 0% 0% round 9px)",
                    duration: 2,
                    ease: "expo.inOut",
                    delay: 0.3
                }
            );
        }
    }, [isLoaded, isPreloaderDone])

    const finalStyle = {
        position: "relative",
        width: "100%",
        minHeight: "100%",
        backgroundColor: "var(--off-teal)",
        overflow: "visible",
        zIndex: 1
    };

    const currentStyle = isIncomingTransition || !isPreloaderDone ? initialStyle : finalStyle;
    const HomeComponent = isMobile ? HomeMobile : Home;
    const HeaderComponent = isMobile ? HeaderMobile : Header;

    return (
        <div id="main-content" style={currentStyle}>
            {isMobile && <Suspense fallback={null}><LampWire /></Suspense>}
            <HeaderComponent setLinkHovered={setLinkHovered} lenis={lenis} isLoaded={isPreloaderDone} />
            <main>
                <HomeComponent linkHovered={linkHovered} isLoaded={isPreloaderDone} isLoadedforHero={!isIncomingTransition && isPreloaderDone} handleProjectSelect={onProjectSelect} ref={homeRef} onModifierDeckSelect={onModifierDeckSelect} returnedFrom={returnedFrom}/>
                <Work ref={workRef} handleProjectSelect={onProjectSelect}/>
                <About ref={aboutRef} />
                <Contact ref={contactRef} />
            </main>
            <Footer lenis={lenis} isMobile={isMobile}/>
        </div>
    );
};

export default Landing;
