import { clamp } from "./theme-colors.js";

export const MATERIAL_VERSION = 1;

export type MaterialPresetId = "frosted" | "paper" | "poster" | "neon";

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
	/** 0..1, how far the edge moves toward the surface's own hue (its tone, else the accent). */
	edgeAccent: number;
	/** Hard down-right shadow offset in the ink, px. */
	cast: number;
	/** Outer bloom radius in the surface's own hue, px. */
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

const PLAIN: MaterialTerms = { edgeWidth: 1, edgeInk: 0, edgeAccent: 0, cast: 0, glow: 0 };

export const MATERIAL_PRESETS: Record<MaterialPresetId, MaterialSpec> = {
	/** Today's glass: translucent, blurred, lit rim. */
	frosted: { blur: 24, clarity: 60, depth: 1, tint: 1, ...PLAIN },
	/** Opaque matte stock, a faint inked cut edge, calm tint. */
	paper: { blur: 0, clarity: 100, depth: 0.5, tint: 0.85, ...PLAIN, edgeInk: 0.2 },
	/** Flat fill, thick ink edge, hard cast; no sheen at all. */
	poster: {
		blur: 0,
		clarity: 100,
		depth: 0,
		tint: 1.3,
		edgeWidth: 3,
		edgeInk: 1,
		edgeAccent: 0,
		cast: 5,
		glow: 0,
	},
	/** Near-opaque dark tile, thin tube of its own hue at the edge, bloom around it. */
	neon: {
		blur: 8,
		clarity: 92,
		depth: 0.4,
		tint: 0.9,
		edgeWidth: 1.5,
		edgeInk: 0,
		edgeAccent: 1,
		cast: 0,
		glow: 18,
	},
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
		"--material-edge-accent": `${t.edgeAccent}`,
		"--material-cast": `${t.cast}px`,
		"--material-glow": `${t.glow}px`,
	};
}
