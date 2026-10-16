import { Fragment, useRef } from "react";
import { useColorReveal } from "../hooks/useColorReveal";
import styles from "./RevealText.module.css";

// Split a plain string into word segments for <RevealText>.
export function wordsFromText(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ text: w }));
}

// Renders text as per-word / per-letter spans and runs the color reveal on it.
//
// Props:
//   as        - tag to render (default "p")
//   segments  - [{ text, className?, style?, trail?: { text, className?, style? } }]
//   text      - plain string (alternative to `segments`)
//   trail     - punctuation glued to the last word, e.g. { text: ".", style }
//   replayRef - ref populated with a manual reset+replay function
//   active    - undefined = reveal in view (default); boolean = reveal when true
// Words carry `aria-hidden`; the full sentence is exposed via aria-label so
// screen readers read it normally instead of letter-by-letter.
export default function RevealText({
  as: Tag = "p",
  segments,
  text,
  trail,
  replayRef,
  active,
  rootMargin,
  threshold,
  ...rest
}) {
  const ref = useRef(null);

  let words = segments ?? wordsFromText(text ?? "");
  if (trail && words.length) {
    words = words.map((w, i) =>
      i === words.length - 1 ? { ...w, trail } : w
    );
  }

  const label = words
    .map((w) => w.text + (w.trail ? w.trail.text : ""))
    .join(" ");

  useColorReveal(ref, { replayRef, deps: [label], active, rootMargin, threshold });

  return (
    <Tag ref={ref} aria-label={label} {...rest}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className={styles.word} data-revealword aria-hidden="true">
            {[...w.text].map((ch, ci) => (
              <span
                key={ci}
                data-revealchar
                className={`${styles.char}${w.className ? ` ${w.className}` : ""}`}
                style={w.style}
              >
                {ch}
              </span>
            ))}
            {w.trail &&
              [...w.trail.text].map((ch, ci) => (
                <span
                  key={`t${ci}`}
                  data-revealchar
                  className={`${styles.char}${
                    w.trail.className ? ` ${w.trail.className}` : ""
                  }`}
                  style={w.trail.style}
                >
                  {ch}
                </span>
              ))}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
