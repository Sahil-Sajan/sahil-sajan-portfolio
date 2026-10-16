import { forwardRef, useRef, useImperativeHandle, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePixelHover } from '../hooks/usePixelHover';

const LegWiggleMan = () => (
    <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="leg_wiggle_man">
        <rect id="Rectangle 360" x="12" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 361" x="18" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 362" x="24" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 369" x="12" y="6" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 371" x="18" y="6" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 373" x="24" y="6" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 377" x="18" y="12" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 387" x="12" y="18" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 391" x="18" y="18" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 395" x="24" y="18" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 378" x="30" y="18" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 394" x="6" y="24" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 399" x="18" y="24" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 397" x="30" y="24" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 409" x="12" y="30" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 408" x="18" y="30" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 407" x="24" y="30" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 412" x="6" y="36" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="Rectangle 415" x="24" y="36" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="foot-l" y="42" width="6" height="6" rx="2" fill="#00A084" fillOpacity="0"/>
        <rect id="foot-ld" x="6" y="42" width="6" height="6" rx="2" fill="#00A084"/>
        <rect id="foot-r" x="18" y="42" width="6" height="6" rx="2" fill="#00A084" fillOpacity="0"/>
        <rect id="foot-rd" x="24" y="42" width="6" height="6" rx="2" fill="#00A084"/>
        </g>
    </svg>
);

const AnimatedLegWiggle = forwardRef((props, ref) => {
    const container = useRef(null);
    const masterTl  = useRef(null);
    const [hoverEnabled, setHoverEnabled] = useState(false);

    useGSAP(() => {
        const footR  = container.current.querySelector("#foot-r");
        const footRd = container.current.querySelector("#foot-rd");
        const footL  = container.current.querySelector("#foot-l");
        const footLd = container.current.querySelector("#foot-ld");

        const rects = gsap.utils.toArray("rect", container.current);
        const sortedRects = rects.sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);

        masterTl.current = gsap.timeline({ paused: true });

        masterTl.current.fromTo(
            sortedRects,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.04, delay: 0.3 }
        );

        // Enable hover once the reveal animation finishes (fires on play())
        masterTl.current.call(() => setHoverEnabled(true));

        const waveTl = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
        waveTl
            .to(footRd, { fillOpacity: 1, duration: 0.15 })
            .to(footR,  { fillOpacity: 0, duration: 0.15 }, "<")
            .to(footLd, { fillOpacity: 0, duration: 0.15 }, "<")
            .to(footL,  { fillOpacity: 1, duration: 0.15 }, "<")
            .to(footLd, { fillOpacity: 1, duration: 0.15 }, "+=0.6")
            .to(footL,  { fillOpacity: 0, duration: 0.15 }, "<")
            .to(footRd, { fillOpacity: 0, duration: 0.15 }, "<")
            .to(footR,  { fillOpacity: 1, duration: 0.15 }, "<");

        masterTl.current.add(waveTl);

    }, { scope: container });

    useImperativeHandle(ref, () => ({
        play:  () => masterTl.current?.play(0),
        pause: () => masterTl.current?.pause(),
    }));

    const { onMouseMove, onMouseLeave } = usePixelHover(container, hoverEnabled);

    return (
        <div
            ref={container}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                position: "absolute",
                width: 36,
                height: 48,
                left: 0,
                bottom: -13,
                zIndex: 5,
                transform: "scaleX(-1)",
            }}
        >
            <LegWiggleMan />
        </div>
    );
});

export default AnimatedLegWiggle;
