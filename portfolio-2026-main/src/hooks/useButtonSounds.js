import { useRef } from "react";
import { Howl } from "howler";

const tapSrcs = [
	"/tap_01.wav",
	"/tap_02.wav",
	"/tap_03.wav",
	"/tap_04.wav",
	"/tap_05.wav",
];

// Shared pool loaded once
let hoverPool = null;
let clickPool = null;

function getHoverPool() {
	if (!hoverPool) {
		hoverPool = tapSrcs.map(
			(src) =>
				new Howl({
					src: [src],
					volume: 0.15,
					preload: true,
				})
		);
	}
	return hoverPool;
}

function getClickPool() {
	if (!clickPool) {
		clickPool = tapSrcs.map(
			(src) =>
				new Howl({
					src: [src],
					volume: 0.9,
					preload: true,
				})
		);
	}
	return clickPool;
}

// index: 1–5 (1-based), defaults to 1
function playFromPool(pool, index = 1) {
	const n = typeof index === "number" && isFinite(index) ? Math.max(1, Math.min(5, index)) : 1;
	const i = n - 1;
	const sound = pool[i];
	sound.stop();
	sound.play();
}

export function useButtonSounds() {
	const lastHoverTime = useRef(0);

	const playHover = (index = 1) => {
		const now = Date.now();
		if (now - lastHoverTime.current < 80) return;
		lastHoverTime.current = now;
		playFromPool(getHoverPool(), index);
	};

	const playClick = (index = 1) => {
		playFromPool(getClickPool(), index);
	};

	return { playHover, playClick };
}
