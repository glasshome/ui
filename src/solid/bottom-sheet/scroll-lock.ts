let refcount = 0;
let savedScrollY = 0;
let savedBodyStyles: {
	position: string;
	top: string;
	left: string;
	right: string;
	width: string;
	overflow: string;
} | null = null;

function isIOS(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;
	return /iP(ad|hone|od)/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

export function acquireScrollLock(): void {
	refcount++;
	if (refcount > 1) return;
	if (typeof document === "undefined") return;

	const body = document.body;
	savedBodyStyles = {
		position: body.style.position,
		top: body.style.top,
		left: body.style.left,
		right: body.style.right,
		width: body.style.width,
		overflow: body.style.overflow,
	};

	if (isIOS()) {
		savedScrollY = window.scrollY;
		body.style.position = "fixed";
		body.style.top = `-${savedScrollY}px`;
		body.style.left = "0";
		body.style.right = "0";
		body.style.width = "100%";
	} else {
		body.style.overflow = "hidden";
	}
}

export function releaseScrollLock(): void {
	refcount = Math.max(0, refcount - 1);
	if (refcount > 0) return;
	if (typeof document === "undefined" || !savedBodyStyles) return;

	const body = document.body;
	const wasIOS = body.style.position === "fixed";

	body.style.position = savedBodyStyles.position;
	body.style.top = savedBodyStyles.top;
	body.style.left = savedBodyStyles.left;
	body.style.right = savedBodyStyles.right;
	body.style.width = savedBodyStyles.width;
	body.style.overflow = savedBodyStyles.overflow;
	savedBodyStyles = null;

	if (wasIOS) {
		window.scrollTo(0, savedScrollY);
	}
}
