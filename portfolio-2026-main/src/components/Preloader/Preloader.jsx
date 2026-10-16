// src/components/Preloader/Preloader.jsx

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useAssetPreloader } from "../../hooks/useAssetPreloader";
import "./Preloader.css";

const Preloader = ({ onComplete, onMidway }) => {
    const { progress, isComplete } = useAssetPreloader();

    const firstTimeline = useRef(null);
    const secondTimeline = useRef(null);
    const thirdTimeline = useRef(null);
    const counterTextRef = useRef(null);
    const animatedCounterValue = useRef({ value: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1201);

    // Handle window resize to detect mobile
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1201);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Staggered vertical reveal for mobile / bottom info text
    useGSAP(() => {
        gsap.from(".mobile-info .mobile-word", {
            yPercent: 120,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.06,
        });

        gsap.from(".bottom-info .bottom-word", {
            yPercent: 120,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.06,
            delay: 0.1,
        });
    }, []);

    useGSAP(() => {

        // This function is called when the *entire* preloader sequence finishes
        const handleCompleteAllAnimation = () => {
            gsap.set("#preloader", { display: "none" });
            if (onComplete) onComplete();
        };

        const tl3 = gsap.timeline({
            paused: true,
            onComplete: handleCompleteAllAnimation,
        })

        // Expand the green box to fill the screen
        tl3.to(
            ".preloader-box",
            {
                width: "100%",
                height: "100%",
                borderRadius: 0,
                duration: 2,
                ease: "expo.inOut",
            },
            "+=0",
        )

        thirdTimeline.current = tl3;

        // Define the second timeline (tl2): Counter exit, quotes, and final reveal
        const tl2 = gsap.timeline({
            paused: true,
            onComplete: () => {
                thirdTimeline.current.resume()
                onMidway()
            }
        });

        // 1. Counter Exits
        tl2.to(counterTextRef.current, { yPercent: -205, duration: 0.6, ease: "power2.in" });
        tl2.set(counterTextRef.current, { display: "none" });

        // 2. Quotes Enter (Staggered)
        // We target the specific span class inside the top quote
        tl2.from(".quote-text.top .word-anim", {
            yPercent: 155,
            duration: 0.8, // Slightly longer to accommodate stagger feel
            ease: "power2.out",
            stagger: 0.03 // Delay between each word
        }, "<0");

        // We target the specific span class inside the bottom quote
        tl2.from(".quote-text.bottom .word-anim", {
            yPercent: -155,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.02
        }, "-=0.4"); // Overlap slightly with the top quote animation


        // 3. Quotes Exit (Staggered)
        // Top exits up
        tl2.to(".quote-text.top .word-anim", {
            yPercent: 155,
            duration: 0.8,
            ease: "power2.in",
            stagger: -0.05
        }, "+=1");

        // Bottom exits down
        tl2.to(".quote-text.bottom .word-anim", {
            yPercent: -155,
            duration: 0.8,
            ease: "power2.in",
            stagger: -0.05
        }, "<0"); // Sync with top exit

        tl2.set(".quote-line", { display: "none" });

        secondTimeline.current = tl2;

        // Define the first timeline (tl1): Initial box animation and counter entry
        const tl1 = gsap.timeline();

        // Calculate dimensions based on device type
        let boxWidth, boxHeight;

        if (isMobile) {
            // Mobile: 90% width of device with 16/9 aspect ratio
            boxWidth = Math.min(356, window.innerWidth*0.8)
            window.innerHeight < 400 ? boxHeight = 60 : boxHeight = 200
        } else {
            // Desktop: original calculation
            boxHeight = 200;
            boxWidth = 200 * (window.innerWidth / window.innerHeight);
        }

        tl1.to(".preloader-box", {
            height: boxHeight,
            width: boxWidth,
            rotate: 0,
            duration: 1,
            ease: "power2.inOut",
        });
        tl1.from(counterTextRef.current, { yPercent: 205, duration: 0.6, ease: "power2.out" });

        firstTimeline.current = tl1;

        // Cleanup function for useGSAP hook
        return () => {
            firstTimeline.current?.kill();
            secondTimeline.current?.kill();
            thirdTimeline.current?.kill();
        };
    }, [isMobile]); // Re-run when isMobile changes


    // --- Orchestration of counter animation and timeline progression ---
    useEffect(() => {
        gsap.to(animatedCounterValue.current, {
            value: progress,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
                if (counterTextRef.current) {
                    counterTextRef.current.textContent = Math.round(animatedCounterValue.current.value) + "%";
                }
            },
        });
    }, [progress]);

    // Once preloading reports complete (or the safety timeout fires), force the
    // counter to 100% and move the sequence along. This does not rely on many
    // incremental progress updates, so it still works when assets are cached.
    useEffect(() => {
        if (!isComplete) return;

        const tween = gsap.to(animatedCounterValue.current, {
            value: 100,
            duration: 0.4,
            ease: "power2.out",
            onUpdate: () => {
                if (counterTextRef.current) {
                    counterTextRef.current.textContent = Math.round(animatedCounterValue.current.value) + "%";
                }
            },
            onComplete: () => {
                if (firstTimeline.current?.isActive()) {
                    firstTimeline.current.eventCallback("onComplete", () => {
                        secondTimeline.current?.resume();
                    });
                } else {
                    secondTimeline.current?.resume();
                }
            },
        });

        return () => tween.kill();
    }, [isComplete]);

    // Helper style for split text
    const wordStyle = { display: "inline-block" };

    return (
        <div id="preloader">

            <div className="mobile-info">
                <span className="mobile-word" style={wordStyle}>Best</span>{" "}
                <span className="mobile-word" style={wordStyle}>experienced</span>{" "}
                <span className="mobile-word" style={wordStyle}>on</span>{" "}
                <span className="mobile-word" style={wordStyle}>desktops.</span>
            </div>

            <div className="preloader-content-wrapper">
                <div className="quote-line">
                    <div className="quote-text top">
                        {/* We split the sentence into chunks for the stagger effect */}
                        <span className="word-anim span-1" style={wordStyle}>To</span>{" "}
                        <span className="word-anim span-1" style={wordStyle}>think</span>{" "}
                        <span className="word-anim span-2" style={wordStyle}>outside</span>{" "}
                        <span className="word-anim span-2" style={wordStyle}>the</span>{" "}
                        <span className="word-anim span-2" style={wordStyle}>box<span className="period">,</span></span>{" "}
                    </div>
                </div>
                <div className="preloader-box">
                    <div className="counter-wrapper">
                        <div className="counter-text" ref={counterTextRef}>
                            0%
                        </div>
                    </div>
                </div>
                <div className="quote-line">
                    <div className="quote-text bottom">
                         {/* We split the sentence into chunks for the stagger effect */}
                         <span className="word-anim span-1" style={wordStyle}>we</span>{" "}
                         <span className="word-anim span-1" style={wordStyle}>must</span>{" "}
                         <span className="word-anim span-2" style={wordStyle}>see</span>{" "}
                         <span className="word-anim span-2" style={wordStyle}>through</span>{" "}
                         <span className="word-anim span-2" style={wordStyle}>it<span className="period">.</span></span>{" "}
                    </div>
                </div>
            </div>

            <div className="bottom-info">
                <span className="bottom-word" style={wordStyle}>Making</span>{" "}
                <span className="bottom-word" style={wordStyle}>things</span>{" "}
                <span className="bottom-word" style={wordStyle}>breaks</span>{" "}
                <span className="bottom-word" style={wordStyle}>you</span>{" "}
                <span className="bottom-word" style={wordStyle}>open</span>
            </div>
        </div>
    );
};

export default Preloader;
