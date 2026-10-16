// src/components/AnimatedArrow.jsx
import { useRef} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

// The SVG is its own component that accepts props (like style).
const ArrowSvg = (props) => (
  <svg
    width="43"
    height="43"
    viewBox="0 0 43 43"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props} // Spread any passed-in props, like style
  >
    <rect x="0.5" y="0.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="6.5" y="0.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="30.5" y="0.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="36.5" y="0.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="0.5" y="6.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="6.5" y="6.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="30.5" y="6.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="36.5" y="6.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="18.5" y="12.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="18.5" y="18.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="18.5" y="24.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="0.5" y="30.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="36.5" y="30.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="6.5" y="36.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="12.5" y="36.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="18.5" y="36.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="24.5" y="36.75" width="6" height="6" rx="2" fill="#00A084"/>
    <rect x="30.5" y="36.75" width="6" height="6" rx="2" fill="#00A084"/>
  </svg>
);

const AnimatedDownwardSmiley = ({ isActive = false }) => {
  const container = useRef(null);
  const tl = useRef(null);
  const sortedPaths = useRef([]);

  useGSAP(
    () => {
      // 1. Get all paths and sort them from right to left based on their X position.
      // This is crucial for the right-to-left stagger effect.
      const paths = gsap.utils.toArray("rect", container.current);
      sortedPaths.current = paths.sort((a, b) => {
        const aX = a.getBoundingClientRect().x;
        const bX = b.getBoundingClientRect().x;
        return aX - bX; // Sort descending (rightmost first)
      });

      // 2. Create the looping timeline, paused by default.
      tl.current = gsap.timeline({
        paused: true,
        repeat: -1, // Loop indefinitely
        repeatDelay: 0.5, // Pause for 0.5s between each full loop
      });

      // 3. Add animations to the timeline using the sorted paths array.
      tl.current
        // REVEAL: Animate paths from opacity 0 to 1, right to left.
        .fromTo(
          sortedPaths.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.5,
            ease: "power2.inOut",
            stagger: 0.08, // Stagger from the start of the sorted array (rightmost)
          }
        )
        // EXIT: Animate paths from opacity 1 to 0, right to left.
        .to(
          sortedPaths.current,
          {
            opacity: 0,
            duration: 0.5,
            ease: "power2.inOut",
            stagger: 0.08,
          },
          "+=0.5" // Wait for 0.5s after reveal before starting the exit
        );
    },
    { scope: container }
  );

  // 4. Control the animation's visibility and play state based on the isActive prop.
  useGSAP(() => {
    if (isActive) {
      // Fade in the container and start the looping animation.
      gsap.to(container.current, { opacity: 1, duration: 0.3 });
      tl.current.play();
    } else {
      // Fade out the container and pause the animation at its beginning.
      gsap.to(container.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          tl.current.pause(0);
        },
      });
    }
  }, [isActive]);

  const containerStyle = {
    opacity: 0, // Start invisible
    width: "42px",
    height: "42px",
    backgroundColor: "transparent",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
  };

  const svgStyle = {
    width: "42px",
    height: "42px",
    color: "var(--dark-green)",
    flexShrink: 0,
  };

  return (
    <div ref={container} style={containerStyle}>
      <ArrowSvg style={svgStyle} />
    </div>
  );
};

export default AnimatedDownwardSmiley;
