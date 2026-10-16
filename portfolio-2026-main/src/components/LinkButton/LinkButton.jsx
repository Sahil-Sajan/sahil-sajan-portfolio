import styles from "./LinkButton.module.css";
import { useButtonSounds } from "../../hooks/useButtonSounds";

const LinkButton = ({ isActive = false, linkName, linkTo = "", lenis, onClick, size="small", offset=false, ariaExpanded}) => {
	const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
	const playHover = () => _playHover(3);
	const playClick = () => _playClick(3);

	let duration = 2
	if(linkName === "ABOUT" && size==="small") duration = 3
	else if(linkName === "CONTACT" && size==="small") duration = 4

	const handleClick = () => {
		playClick();
		// Handle lenis scroll if linkTo is provided
		if(lenis && linkTo !== "") {
            lenis.scrollTo(linkTo, {duration: duration, offset: offset? -60 : 0})
        }

        // Call the onClick callback if provided
		if (onClick) {
			onClick();
		}
	};

	// Build the className string conditionally
	const buttonClassName = `${styles.navLink} ${size === "large" ? styles.large : ""} ${isActive ? styles.active : ""}`;

	return (
		<button
			className={buttonClassName.trim()}
			onClick={handleClick}
			onMouseEnter={playHover}
			aria-current={isActive ? "page" : undefined}
			aria-expanded={ariaExpanded}
		>
			<span className={styles.bracket} aria-hidden="true">{"<"}</span>
			{linkName}
			<span className={styles.bracket} aria-hidden="true">{"/>"}</span>
		</button>
	);
};

export default LinkButton;
