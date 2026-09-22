import { clamp } from "./theme-colors.js";

export const MATERIAL_VERSION = 1;

export type MaterialPresetId = "frosted" | "paper";

/** Tier 2 of the glass formula: what every surface's knobs are multiplied by. */
export interface MaterialDials {
	/** Backdrop blur radius, px. */
	blur: number;
	/** How much of the card colour a surface keeps, %; the rest is the wallpaper. */
	clarity: number;
	/** Scales sheen, shade, rim and lift together. */
	depth: number;
	/** Scales the tone wash. */
	tint: number;
}

/** What was chosen, never what was computed. */
export interface Material {
	v: typeof MATERIAL_VERSION;
	preset: MaterialPresetId;
	dials?: Partial<MaterialDials>;
}

export type BlurMode = "dynamic" | "performant" | "none";

export const MATERIAL_PRESETS: Record<MaterialPresetId, MaterialDials> = {
	frosted: { blur: 24, clarity: 60, depth: 1, tint: 1 },
	paper: { blur: 0, clarity: 100, depth: 0.3, tint: 1 },
};

export const FROSTED: Material = { v: 1, preset: "frosted" };

const RANGE: Record<keyof MaterialDials, [number, number]> = {
	blur: [0, 48],
	clarity: [0, 100],
	depth: [0, 2],
	tint: [0, 2],
};

/** Below this the text floor fails over a busy wallpaper with nothing blurred behind it. */
const NO_BLUR_CLARITY_FLOOR = 85;

export function materialDials(material: Material): MaterialDials {
	const merged = { ...MATERIAL_PRESETS[material.preset], ...material.dials };
	return {
		blur: clamp(merged.blur, ...RANGE.blur),
		clarity: clamp(merged.clarity, ...RANGE.clarity),
		depth: clamp(merged.depth, ...RANGE.depth),
		tint: clamp(merged.tint, ...RANGE.tint),
	};
}

export function resolveMaterial(
	material: Material,
	blurMode: BlurMode,
): Record<`--material-${string}`, string> {
	const d = materialDials(material);
	const blur = blurMode === "none" ? 0 : d.blur;
	const clarity = blurMode === "none" ? Math.max(d.clarity, NO_BLUR_CLARITY_FLOOR) : d.clarity;
	return {
		"--material-blur": `${blur}px`,
		"--material-clarity": `${clarity}%`,
		"--material-depth": `${d.depth}`,
		"--material-tint": `${d.tint}`,
	};
}
