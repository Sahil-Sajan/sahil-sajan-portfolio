import styles from "./WorkCursor.module.css";

const ArrowSvg = (props) => (
  <svg
    width="43"
    height="42"
    viewBox="0 0 43 42"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M19 2C19 0.89543 19.8954 0 21 0H23C24.1046 0 25 0.895431 25 2V4C25 5.10457 24.1046 6 23 6H21C19.8954 6 19 5.10457 19 4V2Z" />
    <path d="M19 8C19 6.89543 19.8954 6 21 6H23C24.1046 6 25 6.89543 25 8V10C25 11.1046 24.1046 12 23 12H21C19.8954 12 19 11.1046 19 10V8Z" />
    <path d="M19 14C19 12.8954 19.8954 12 21 12H23C24.1046 12 25 12.8954 25 14V16C25 17.1046 24.1046 18 23 18H21C19.8954 18 19 17.1046 19 16V14Z" />
    <path d="M19 20C19 18.8954 19.8954 18 21 18H23C24.1046 18 25 18.8954 25 20V22C25 23.1046 24.1046 24 23 24H21C19.8954 24 19 23.1046 19 22V20Z" />
    <path d="M7 26C7 24.8954 7.89543 24 9 24H11C12.1046 24 13 24.8954 13 26V28C13 29.1046 12.1046 30 11 30H9C7.89543 30 7 29.1046 7 28V26Z" />
    <path d="M19 26C19 24.8954 19.8954 24 21 24H23C24.1046 24 25 24.8954 25 26V28C25 29.1046 24.1046 30 23 30H21C19.8954 30 19 29.1046 19 28V26Z" />
    <path d="M31 26C31 24.8954 31.8954 24 33 24H35C36.1046 24 37 24.8954 37 26V28C37 29.1046 36.1046 30 35 30H33C31.8954 30 31 29.1046 31 28V26Z" />
    <path d="M13 32C13 30.8954 13.8954 30 15 30H17C18.1046 30 19 30.8954 19 32V34C19 35.1046 18.1046 36 17 36H15C13.8954 36 13 35.1046 13 34V32Z" />
    <path d="M19 32C19 30.8954 19.8954 30 21 30H23C24.1046 30 25 30.8954 25 32V34C25 35.1046 24.1046 36 23 36H21C19.8954 36 19 35.1046 19 34V32Z" />
    <path d="M25 32C25 30.8954 25.8954 30 27 30H29C30.1046 30 31 30.8954 31 32V34C31 35.1046 30.1046 36 29 36H27C25.8954 36 25 35.1046 25 34V32Z" />
    <path d="M19 38C19 36.8954 19.8954 36 21 36H23C24.1046 36 25 36.8954 25 38V40C25 41.1046 24.1046 42 23 42H21C19.8954 42 19 41.1046 19 40V38Z" />
  </svg>
);

const ARROWS = [0, 1, 2, 3, 4, 5, 6, 7];

const MarqueeTrack = ({ ariaHidden }) => (
  <div className={styles.cursorMarqueeTrack} aria-hidden={ariaHidden}>
    {ARROWS.map((i) => (
      <ArrowSvg
        key={i}
        className={styles.cursorArrow}
        style={{ transform: "rotate(90deg)" }}
      />
    ))}
  </div>
);

const WorkCursor = ({ isVisible = false }) => {
  return (
    <div className={styles.workCursor}>
      <div
        className={`${styles.cursorTop} ${
          isVisible ? styles.revealed : ""
        }`}
      >
        Hover &amp; click on <br /> projects on the left.
      </div>
      <div
        className={`${styles.cursorBottom} ${
          isVisible ? styles.revealed : ""
        }`}
      >
        <div className={styles.cursorMarquee}>
          <MarqueeTrack />
          <MarqueeTrack ariaHidden />
        </div>
      </div>
    </div>
  );
};

export default WorkCursor;
