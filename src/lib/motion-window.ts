export const MOTION_WINDOW_MS = 30_000;

/** Ambient motion runs for a window after load or a touch, then freezes; `html[data-motion="live"]`
 *  is the one signal, which theme.css turns into `--motion-ambient` and the wallpapers gate on.
 *  Returns the stop function. */
export function startMotionWindow(windowMs = MOTION_WINDOW_MS): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const root = document.documentElement;

	const freeze = () => {
		clearTimeout(timer);
		timer = undefined;
		delete root.dataset.motion;
	};
	const wake = () => {
		clearTimeout(timer);
		timer = setTimeout(freeze, windowMs);
		if (root.dataset.motion !== "live") root.dataset.motion = "live";
	};
	const onVisibility = () => {
		if (document.visibilityState === "hidden") freeze();
		else wake();
	};

	wake();
	document.addEventListener("pointerdown", wake, { passive: true, capture: true });
	document.addEventListener("visibilitychange", onVisibility);

	return () => {
		freeze();
		document.removeEventListener("pointerdown", wake, { capture: true });
		document.removeEventListener("visibilitychange", onVisibility);
	};
}
