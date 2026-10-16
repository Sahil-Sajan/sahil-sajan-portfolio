import { useEffect } from "react";
import gsap from "gsap";

// Per-letter color reveal: each letter fades in and interpolates its color from
// off-teal to its own resting color, on a random per-word + per-letter stagger,
// once the container scrolls into view. Operates on the [data-revealword] /
// [data-revealchar] spans rendered by <RevealText>.
//
// `replayRef` (optional) is populated with a reset+replay function for manual
// triggering; `deps` re-initialises the effect when the text content changes.
// `active` controls the trigger: leave it undefined to reveal when the text
// scrolls into view (default); pass a boolean to instead reveal when it flips
// true (e.g. gated on a load/transition signal). Either way the letters are
// hidden up front so the reveal never gets skipped.
export function useColorReveal(
  containerRef,
  {
    replayRef,
    deps = [],
    active,
    rootMargin = "0px 0px -25% 0px",
    threshold = 0.6,
  } = {}
) {
  const viewTriggered = active === undefined;

  useEffect(() => {
    const p = containerRef.current;
    if (!p) return;

    const chars = gsap.utils.toArray(p.querySelectorAll("[data-revealchar]"));
    if (!chars.length) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const offTeal = getComputedStyle(document.documentElement)
      .getPropertyValue("--off-teal")
      .trim();

    // Reset each letter to the light (off-teal) end, fully hidden. The resting
    // color is captured once so we can interpolate back to it on replay.
    const setup = () => {
      gsap.killTweensOf(chars);
      chars.forEach((c) => {
        if (!c.dataset.rest) c.dataset.rest = getComputedStyle(c).color;
      });
      gsap.set(chars, { opacity: 0, color: offTeal });
    };

    const play = () => {
      p.querySelectorAll("[data-revealword]").forEach((word) => {
        const wordBase = Math.random() * 0.6;
        word.querySelectorAll("[data-revealchar]").forEach((c) => {
          const delay = wordBase + Math.random() * 0.35;
          gsap.to(c, {
            opacity: 1,
            duration: 0.4,
            delay,
            ease: "power2.out",
          });
          // gsap interpolates the RGB channels, so the letter blends smoothly
          // through the intermediate hues from off-teal to its resting color.
          gsap.to(c, {
            color: c.dataset.rest,
            duration: 0.6,
            delay,
            ease: "power2.inOut",
            // Hand color back to CSS so theme changes still apply.
            onComplete: () => gsap.set(c, { clearProps: "color" }),
          });
        });
      });
    };

    setup();
    if (replayRef) {
      replayRef.current = () => {
        setup();
        play();
      };
    }

    let played = false;
    const runOnce = () => {
      if (played) return;
      played = true;
      play();
    };

    // Signal-triggered: reveal as soon as `active` is true (it's in deps, so
    // the effect re-runs and re-hides when it flips).
    if (!viewTriggered) {
      if (active) runOnce();
      return () => {
        gsap.killTweensOf(chars);
        if (replayRef) replayRef.current = null;
      };
    }

    // View-triggered: -25% bottom margin holds the trigger until the text has
    // scrolled comfortably into view (not the instant its bottom edge appears).
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) runOnce();
      },
      { rootMargin, threshold }
    );
    observer.observe(p);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(chars);
      if (replayRef) replayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewTriggered, active, rootMargin, threshold, ...deps]);
}
