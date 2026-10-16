// components/TextReveal.jsx
import { useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";


const TextReveal = ({
  children,
  delay = 0,
  lineDelay = 0.2,
  parentClassName = "",
  isLoaded = true,
}) => {
  const containerRef = useRef(null);

  const getText = (node) => {
    if (typeof node === "string") return node;
    // Handle br tags
    if (node?.type?.name === "br" || node?.type === "br") {
      return "\n";
    }
    if (Array.isArray(node))
      return node.map(getText).join("");
    if (node?.props?.children)
      return getText(node.props.children);
    return "";
  };

  const buildCharacterMap = (node, offset = 0) => {
    const charMap = {};

    const traverse = (n, currentOffset, parentSpan = null) => {
      // Handle br tags
      if (n?.type?.name === "br" || n?.type === "br") {
        return currentOffset;
      }

      if (typeof n === "string") {
        for (let i = 0; i < n.length; i++) {
          charMap[currentOffset + i] = {
            style: parentSpan?.style || {},
            className: parentSpan?.className || "",
            spanIndex: parentSpan?.spanIndex || null,
          };
        }
        return currentOffset + n.length;
      }

      if (Array.isArray(n)) {
        let pos = currentOffset;
        let spanIndex = 0;
        n.forEach((item) => {
          if (item?.type?.name === "span" || item?.props) {
            pos = traverse(item, pos, {
              style: item?.props?.style || {},
              className: item?.props?.className || "",
              spanIndex,
            });
            spanIndex++;
          } else {
            pos = traverse(item, pos, parentSpan);
          }
        });
        return pos;
      }

      if (n?.props?.children) {
        const style = n.props.style || {};
        const className = n.props.className || "";
        const text = getText(n.props.children);

        let spanIndex = 0;
        for (let i = 0; i < text.length; i++) {
          charMap[currentOffset + i] = {
            style,
            className,
            spanIndex:
              n.type?.name === "span"
                ? spanIndex
                : parentSpan?.spanIndex,
          };
        }
        return currentOffset + text.length;
      }

      return currentOffset;
    };

    traverse(node, 0);
    return charMap;
  };

  const text = getText(children);
  const charMap = useMemo(
    () => buildCharacterMap(children),
    [children]
  );

  useGSAP(
    () => {
      if (!containerRef.current || !isLoaded) return;

      const lines = containerRef.current.querySelectorAll(
        "[data-reveal-line]"
      );
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          end: "top 0%",
          scrub: false,
          markers: false,
          toggleActions: "play reverse play reverse"
        },
      });

      lines.forEach((line, lineIndex) => {
        const chars = line.querySelectorAll(
          "[data-reveal-char]"
        );
        const charDelay = lineDelay / chars.length;

        chars.forEach((char, charIndex) => {
          tl.to(
            char,
            {
              opacity: 1,
              duration: 2,
              ease: "power2.out",
            },
            delay +
              lineIndex * lineDelay +
              charIndex * charDelay
          );
        });
      });
    },
    { scope: containerRef, dependencies: [isLoaded] }
  );

  const renderText = () => {
    const lines = text.split("\n");
    let charIndex = 0;

    return lines.map((line, lineIndex) => (
      <div
        key={lineIndex}
        data-reveal-line
        style={{ display: "block" }}
      >
        {line.split("").map((char) => {
          const charInfo =
            charMap[charIndex] || {
              style: {},
              className: "",
              spanIndex: null,
            };
          const index = charIndex;
          charIndex++;

          return (
            <span
              key={index}
              data-reveal-char
              data-span-index={charInfo.spanIndex}
              style={{
                opacity: 0,
                display: "inline",
                ...charInfo.style,
              }}
              className={charInfo.className}
            >
              {char}
            </span>
          );
        })}
      </div>
    ));
  };

  return (
    <div
      ref={containerRef}
      className={parentClassName}
    >
      {renderText()}
    </div>
  );
};

export default TextReveal;
