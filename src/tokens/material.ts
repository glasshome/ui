import { clamp } from "./theme-colors.js";

export const MATERIAL_VERSION = 1;

export type MaterialPresetId = "frosted" | "paper" | "poster" | "glow";

/** Tier 2 of the glass formula: what every surface's knobs are multiplied by. The homeowner's dials. */
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

/** Terms a preset turns on; inert at zero, never a homeowner dial. */
export interface MaterialTerms {
	/** Edge width, px. */
	edgeWidth: number;
	/** 0..1, how far the edge moves toward the foreground ink. */
	edgeInk: number;
	/** Hard down-right shadow offset in the ink, px. */
	cast: number;
	/** Outer accent bloom radius, px. */
	glow: number;
}

export type MaterialSpec = MaterialDials & MaterialTerms;

/** What was chosen, never what was computed. */
export interface Material {
	v: typeof MATERIAL_VERSION;
	preset: MaterialPresetId;
	dials?: Partial<MaterialDials>;
}

export type BlurMode = "dynamic" | "performant" | "none";

const PLAIN: MaterialTerms = { edgeWidth: 1, edgeInk: 0, cast: 0, glow: 0 };

export const MATERIAL_PRESETS: Record<MaterialPresetId, MaterialSpec> = {
	frosted: { blur: 24, clarity: 60, depth: 1, tint: 1, ...PLAIN },
	paper: { blur: 0, clarity: 100, depth: 0.3, tint: 1, ...PLAIN },
	poster: {
		blur: 0,
		clarity: 100,
		depth: 0,
		tint: 1.4,
		edgeWidth: 2.5,
		edgeInk: 1,
		cast: 6,
		glow: 0,
	},
	glow: { blur: 12, clarity: 85, depth: 0.6, tint: 0.6, ...PLAIN, glow: 24 },
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
	const t = MATERIAL_PRESETS[material.preset];
	const blur = blurMode === "none" ? 0 : d.blur;
	const clarity = blurMode === "none" ? Math.max(d.clarity, NO_BLUR_CLARITY_FLOOR) : d.clarity;
	return {
		"--material-blur": `${blur}px`,
		"--material-clarity": `${clarity}%`,
		"--material-depth": `${d.depth}`,
		"--material-tint": `${d.tint}`,
		"--material-edge-width": `${t.edgeWidth}px`,
		"--material-edge-ink": `${t.edgeInk}`,
		"--material-cast": `${t.cast}px`,
		"--material-glow": `${t.glow}px`,
	};
}
