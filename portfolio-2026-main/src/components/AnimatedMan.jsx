import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePixelHover } from '../hooks/usePixelHover';

const WavingMan = () => (
    <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="dot_waving">
            <rect id="hand-1" y="12" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 383" x="6" y="18" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="hand-2" x="6" y="12" width="6" height="6" rx="2" fill="#00A084" fillOpacity="0" opacity="0"/>
            <rect id="Rectangle 410" x="6" y="30" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 406" x="30" y="30" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 411" y="36" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 413" x="12" y="36" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 419" y="42" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 421" x="12" y="42" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 360" x="12" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 369" x="12" y="6" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 377" x="18" y="12" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 399" x="18" y="24" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 397" x="30" y="24" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 361" x="18" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 362" x="24" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 371" x="18" y="6" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 373" x="24" y="6" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 387" x="12" y="18" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 391" x="18" y="18" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 395" x="24" y="18" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 409" x="12" y="30" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
            <rect id="Rectangle 408" x="18" y="30" width="6" height="6" rx="2" fill="#00A084" opacity="0"/>
        </g>
    </svg>
);

const AnimatedMan = ({ isLoaded }) => {
    const container  = useRef(null);
    const waveRef    = useRef(null);
    const [hoverEnabled, setHoverEnabled] = useState(false);

    useGSAP(() => {
        if (!isLoaded) return;

        const rects = gsap.utils.toArray("rect", container.current);
        const sortedRects = rects.sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);

        const masterTl = gsap.timeline();

        masterTl.fromTo(
            sortedRects,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.04 }
        );

        // Enable hover once the reveal animation finishes
        masterTl.call(() => setHoverEnabled(true));

        const waveTl = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
        waveTl
            .to("#hand-1", { fillOpacity: 0, duration: 0.15 })
            .to("#hand-2", { fillOpacity: 1, duration: 0.15 }, "<")
            .to("#hand-1", { fillOpacity: 1, duration: 0.15 }, "+=0.6")
            .to("#hand-2", { fillOpacity: 0, duration: 0.15 }, "<");

        waveRef.current = waveTl;
        masterTl.add(waveTl);

    }, { scope: container, dependencies: [isLoaded] });

    useEffect(() => {
        const el = container.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) waveRef.current?.resume();
                else                      waveRef.current?.pause();
            },
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const { onMouseMove, onMouseLeave } = usePixelHover(container, hoverEnabled);

    return (
        <div ref={container} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
            <WavingMan />
        </div>
    );
};

export default AnimatedMan;
