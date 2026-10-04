import { clamp } from "./theme-colors.js";

export const MATERIAL_VERSION = 1;

export type MaterialPresetId = "frosted" | "frost" | "paper" | "neon" | "chalk";

/** Tier 2 of the glass formula: what every surface's knobs are multiplied by. The homeowner's dials. */
export interface MaterialDials {
  /** Backdrop blur radius, px. */
  blur: number;
  /** How much of the card colour a surface keeps, %; the rest is the wallpaper. */
  clarity: number;
  /** Default for edge, sheen and shadow together; each can then move on its own. */
  depth: number;
  /** Scales the tone wash. */
  tint: number;
  /** Bloom radius in the surface's own hue, px. */
  glow: number;
  /** 0..1; above 0 every surface is hand-inked: a drawn line over a hand-laid fill. */
  ink: number;
}

export type WashStyle = "flat" | "fade" | "two-tone";
export type RimPosition = "top" | "top-bottom" | "around";
export type GlowPosition = "outside" | "inside";
export type MaterialFace = "flat" | "raised";

/** The creator's terms. Every one has a default that renders today's glass. */
export interface MaterialTerms extends MaterialDials {
  /** Backdrop saturation and brightness together; 1 is each surface's own. */
  vibrancy: number;
  /** The bright hairline and rim light. Defaults to depth. */
  edge: number;
  /** The white sweep. Defaults to depth. */
  sheen: number;
  /** The lift shadow. Defaults to depth. */
  shadow: number;
  /** Glass thickness: a soft inner shade with a light catch, 0..1. */
  inset: number;
  /** Where the light comes from, degrees, 0 is the top; turns sheen, rim and inset together. */
  lightFrom: number;
  rim: RimPosition;
  /** Dark mode multiplies edge, sheen, inset and inner glow by this. */
  darkScale: number;
  glowAt: GlowPosition;
  /** Light inside the card from the top, 0..1. */
  innerGlow: number;
  /** 0 is white light, 1 the surface's own hue. */
  innerGlowHue: number;
  /** Fine still frost over a card's fill, 0..1. */
  grain: number;
  washStyle: WashStyle;
  /** Angle of the tone wash, degrees. */
  washAngle: number;
  face: MaterialFace;
  /** Raised and pressed depth, for the surface face and the controls. */
  relief: number;
  /** "theme" is the theme's --primary; otherwise a colour. */
  accent: string;
  /** Accent wash on surfaces that pass no tone, 0..0.6. */
  fill: number;
}

/** Terms a preset turns on; inert at zero, never a creator term. */
export interface MaterialPresetTerms {
  /** Edge width, px. */
  edgeWidth: number;
  /** 0..1, how far the edge moves toward the material ink. */
  edgeInk: number;
  /** 0..1, how far the edge moves toward the surface's own hue (its tone, else the accent). */
  edgeAccent: number;
  /** 0..1, how far the Ink line moves from the mode's ink toward the foreground: chalk on a dark board. */
  inkLift: number;
}

export type MaterialSpec = MaterialDials & MaterialPresetTerms & Partial<MaterialTerms>;

/** What was chosen, never what was computed. */
export interface Material {
  v: typeof MATERIAL_VERSION;
  preset: MaterialPresetId;
  dials?: Partial<MaterialTerms>;
}

export type BlurMode = "dynamic" | "performant" | "none";

const PLAIN: MaterialPresetTerms = { edgeWidth: 1, edgeInk: 0, edgeAccent: 0, inkLift: 0 };

export const MATERIAL_PRESETS: Record<MaterialPresetId, MaterialSpec> = {
  /** Glass: clear, blurred, lit rim. The id predates the name and stays for stored themes. */
  frosted: { blur: 24, clarity: 60, depth: 1, tint: 1, glow: 0, ink: 0, ...PLAIN },
  /** Frosted: the same glass with a fine frost over each card. */
  frost: { blur: 24, clarity: 60, depth: 1, tint: 1, glow: 0, ink: 0, ...PLAIN, grain: 0.4 },
  /** Opaque matte stock, a faint inked cut edge, a short contact shadow; the Ink dial draws on it. */
  paper: {
    blur: 0,
    clarity: 100,
    depth: 0.5,
    tint: 0.85,
    glow: 0,
    ink: 0,
    ...PLAIN,
    edgeInk: 0.3,
    sheen: 0,
    edge: 0.2,
    shadow: 0.7,
  },
  /** Smoky glass lit from inside in its own hue, a soft hue edge and a small bloom. */
  neon: {
    blur: 9,
    clarity: 57,
    depth: 0.4,
    tint: 0.6,
    edgeWidth: 1,
    edgeInk: 0,
    edgeAccent: 0.35,
    inkLift: 0,
    glow: 3,
    ink: 0,
    vibrancy: 1.3,
    edge: 0.25,
    sheen: 0.3,
    shadow: 1,
    innerGlow: 0.35,
  },
  /** Matte board, the Ink body drawn in the foreground colour. */
  chalk: { blur: 0, clarity: 100, depth: 0.3, tint: 0.7, glow: 0, ink: 1, ...PLAIN, inkLift: 1 },
};

export const FROSTED: Material = { v: 1, preset: "frosted" };

type NumericTerm = {
  [K in keyof MaterialTerms]: MaterialTerms[K] extends number ? K : never;
}[keyof MaterialTerms];

export const MATERIAL_RANGES: Record<NumericTerm, [number, number]> = {
  blur: [0, 48],
  clarity: [0, 100],
  depth: [0, 2],
  tint: [0, 2],
  glow: [0, 40],
  ink: [0, 1],
  vibrancy: [0.5, 2],
  edge: [0, 2],
  sheen: [0, 2],
  shadow: [0, 2],
  inset: [0, 1],
  lightFrom: [0, 360],
  darkScale: [0, 1],
  innerGlow: [0, 1],
  innerGlowHue: [0, 1],
  grain: [0, 1],
  washAngle: [0, 360],
  relief: [0, 2],
  fill: [0, 0.6],
};

type DepthLed = "edge" | "sheen" | "shadow";

const TERM_DEFAULTS: Omit<MaterialTerms, keyof MaterialDials | DepthLed> = {
  vibrancy: 1,
  inset: 0,
  lightFrom: 315,
  rim: "top",
  darkScale: 1,
  glowAt: "outside",
  innerGlow: 0,
  innerGlowHue: 1,
  grain: 0,
  washStyle: "fade",
  washAngle: 135,
  face: "flat",
  relief: 1,
  accent: "theme",
  fill: 0,
};

/** Below this the text floor fails over a busy wallpaper with nothing blurred behind it. */
const NO_BLUR_CLARITY_FLOOR = 85;

const NUMERIC_TERMS = Object.keys(MATERIAL_RANGES) as NumericTerm[];

export function materialTerms(material: Material): MaterialTerms {
  const {
    edgeWidth: _w,
    edgeInk: _i,
    edgeAccent: _a,
    inkLift: _l,
    ...preset
  } = MATERIAL_PRESETS[material.preset];
  const merged = { ...TERM_DEFAULTS, ...preset, ...material.dials };
  const terms: MaterialTerms = {
    ...merged,
    edge: merged.edge ?? merged.depth,
    sheen: merged.sheen ?? merged.depth,
    shadow: merged.shadow ?? merged.depth,
  };
  for (const key of NUMERIC_TERMS) terms[key] = clamp(terms[key], ...MATERIAL_RANGES[key]);
  return terms;
}

export function materialDials(material: Material): MaterialDials {
  const { blur, clarity, depth, tint, glow, ink } = materialTerms(material);
  return { blur, clarity, depth, tint, glow, ink };
}

/** Today's offsets are drawn for light from 315deg; another angle rotates them. */
const LIGHT_HOME = 315;

const round = (n: number) => Math.round(n * 10000) / 10000;

const svgTile = (size: number, filter: string) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='n' x='0' y='0' width='100%' height='100%'>${filter}</filter><rect width='${size}' height='${size}' filter='url(%23n)'/></svg>")`;

/* Frost: a fine even tooth in neutral grey, its strength baked into the alpha. */
const frostTile = (strength: number) =>
  svgTile(
    160,
    `<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='0' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.7  0 0 0 0 0.7  0 0 0 0 0.7  0 0 0 ${round(strength * 0.3)} 0'/>`,
  );

const WASH_SPLIT: Record<WashStyle, number> = { flat: 1, fade: 3, "two-tone": 1 };
const RIM: Record<RimPosition, [bottom: number, around: number]> = {
  top: [0, 0],
  "top-bottom": [1, 0],
  around: [0, 1],
};

/** The --surface-control-* palette: calm on a flat face, neumorphic on a raised one. */
const CONTROLS: Record<MaterialFace, Record<`--surface-control-${string}`, string>> = {
  flat: {
    "--surface-control-track": "var(--input)",
    "--surface-control-fill": "var(--surface-accent)",
    "--surface-control-knob": "oklch(1 0 0)",
  },
  raised: {
    "--surface-control-track": "var(--surface-well)",
    "--surface-control-fill":
      "linear-gradient(90deg, color-mix(in srgb, var(--surface-accent), black 50%), var(--surface-accent))",
    "--surface-control-knob": "var(--surface-face)",
  },
};

export function resolveMaterial(
  material: Material,
  blurMode: BlurMode,
  mode: "light" | "dark" = "light",
): Record<`--${string}`, string> {
  const t = materialTerms(material);
  const p = MATERIAL_PRESETS[material.preset];
  const blur = blurMode === "none" ? 0 : t.blur;
  const clarity = blurMode === "none" ? Math.max(t.clarity, NO_BLUR_CLARITY_FLOOR) : t.clarity;
  const dim = mode === "dark" ? t.darkScale : 1;
  const turn = ((t.lightFrom - LIGHT_HOME) * Math.PI) / 180;
  const [rimBottom, rimAround] = RIM[t.rim];
  return {
    "--material-blur": `${blur}px`,
    "--material-clarity": `${clarity}%`,
    "--material-depth": `${t.depth}`,
    "--material-tint": `${t.tint}`,
    "--material-edge-width": `${p.edgeWidth}px`,
    "--material-edge-ink": `${p.edgeInk}`,
    "--material-edge-accent": `${p.edgeAccent}`,
    "--material-glow": `${t.glow}px`,
    "--material-ink-level": `${t.ink}`,
    "--material-ink-lift": `${p.inkLift}`,
    "--material-vibrancy": `${t.vibrancy}`,
    "--material-edge": `${round(t.edge * dim)}`,
    "--material-sheen": `${round(t.sheen * dim)}`,
    "--material-shadow": `${t.shadow}`,
    "--material-inset": `${round(t.inset * dim)}`,
    "--material-light-cos": `${round(Math.cos(turn))}`,
    "--material-light-sin": `${round(Math.sin(turn))}`,
    "--material-rim-bottom": `${rimBottom}`,
    "--material-rim-around": `${rimAround}`,
    "--material-glow-out": t.glowAt === "outside" ? "1" : "0",
    "--material-glow-in": t.glowAt === "inside" ? "1" : "0",
    "--material-inner-glow": `${round(t.innerGlow * dim)}`,
    "--material-inner-glow-hue": `${t.innerGlowHue}`,
    "--material-grain": t.grain > 0 ? frostTile(t.grain) : "none",
    "--material-wash-split": `${WASH_SPLIT[t.washStyle]}`,
    "--material-wash-angle": `${t.washAngle}deg`,
    "--material-two-tone": t.washStyle === "two-tone" ? "1" : "0",
    "--material-face-raised": t.face === "raised" ? "1" : "0",
    ...CONTROLS[t.face],
    "--material-relief": `${t.relief}`,
    "--surface-accent": t.accent === "theme" ? "var(--primary)" : t.accent,
    "--material-fill": `${t.fill}`,
  };
}
