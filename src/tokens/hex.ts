import { parseOklch } from "./theme-colors.js";

/**
 * oklch() string -> sRGB hex, matching browser rendering: out-of-gamut colors
 * are gamut-mapped by chroma reduction (CSS Color 4), not channel-clipped.
 * For renderers that cannot parse oklch (librsvg, sharp SVG, canvas fills).
 */
export function oklchToHex(oklch: string): string {
	const parsed = parseOklch(oklch);
	if (!parsed) throw new Error(`oklchToHex: cannot parse "${oklch}"`);
	let rgb = oklchToLinearSrgb(parsed.l, parsed.c, parsed.h);
	if (!inGamut(rgb)) {
		let lo = 0;
		let hi = parsed.c;
		for (let i = 0; i < 40; i++) {
			const mid = (lo + hi) / 2;
			if (inGamut(oklchToLinearSrgb(parsed.l, mid, parsed.h))) lo = mid;
			else hi = mid;
		}
		rgb = oklchToLinearSrgb(parsed.l, lo, parsed.h);
	}
	return `#${rgb.map(linearToByte).map(toHexByte).join("")}`;
}

function oklchToLinearSrgb(L: number, C: number, hDeg: number): [number, number, number] {
	const h = (hDeg * Math.PI) / 180;
	const a = C * Math.cos(h);
	const b = C * Math.sin(h);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
}

function inGamut(rgb: [number, number, number]): boolean {
	return rgb.every((x) => x >= -1e-6 && x <= 1 + 1e-6);
}

function linearToByte(x: number): number {
	const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.max(0, x) ** (1 / 2.4) - 0.055;
	return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

function toHexByte(n: number): string {
	return n.toString(16).padStart(2, "0");
}
