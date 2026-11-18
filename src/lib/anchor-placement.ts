import type { JSX } from "solid-js";

const EDGE = 16;

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";
export interface AnchorPlace {
  side: Side;
  align: Align;
  offset: number;
  matchAnchorWidth: boolean;
  /** False keeps the chosen side even without room; the part only shifts to stay inside the viewport. */
  flip?: boolean;
}
export interface Placement {
  left: number;
  top: number;
  side: Side;
  maxWidth: number;
  maxHeight: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

const crossStart = (align: Align, start: number, size: number, own: number): number =>
  start + { start: 0, center: (size - own) / 2, end: size - own }[align];

/** Where a part of this size sits beside its anchor: on the chosen side, or the opposite when that
 *  side lacks room and the other has more, aligned along the edge and held 16px inside the viewport. */
export function placeBeside(
  anchor: Box,
  floating: { width: number; height: number },
  viewport: { width: number; height: number },
  place: AnchorPlace,
): Placement {
  const { offset } = place;
  const rooms: Record<Side, number> = {
    bottom: viewport.height - EDGE - (anchor.top + anchor.height + offset),
    top: anchor.top - offset - EDGE,
    right: viewport.width - EDGE - (anchor.left + anchor.width + offset),
    left: anchor.left - offset - EDGE,
  };
  const vertical = place.side === "top" || place.side === "bottom";
  const need = vertical ? floating.height : floating.width;
  const other = OPPOSITE[place.side];
  const side =
    place.flip === false || rooms[place.side] >= need || rooms[other] <= rooms[place.side]
      ? place.side
      : other;
  const maxWidth = viewport.width - 2 * EDGE;
  const maxHeight = viewport.height - 2 * EDGE;
  const width = Math.min(
    Math.max(floating.width, place.matchAnchorWidth && vertical ? anchor.width : 0),
    maxWidth,
  );
  const height = Math.min(floating.height, maxHeight);
  const along: Record<Side, number> = {
    bottom: anchor.top + anchor.height + offset,
    top: anchor.top - offset - height,
    right: anchor.left + anchor.width + offset,
    left: anchor.left - offset - width,
  };
  const beside = side === "top" || side === "bottom";
  const left = beside ? crossStart(place.align, anchor.left, anchor.width, width) : along[side];
  const top = beside ? along[side] : crossStart(place.align, anchor.top, anchor.height, height);
  return {
    left: clamp(left, EDGE, viewport.width - EDGE - width),
    top: clamp(top, EDGE, viewport.height - EDGE - height),
    side,
    maxWidth,
    maxHeight,
  };
}

/** Where a panel of this size sits over its anchor: centred on it, shifted only as far as the
 *  screen needs, as wide as the anchor at least. Before the panel is measured (`height`
 *  undefined) its top sits on the anchor's top. */
function anchoredBox(
  anchor: Box,
  viewport: { width: number; height: number },
  width: number,
  height?: number,
): Box {
  const w = Math.min(Math.max(width, anchor.width), viewport.width - 2 * EDGE);
  const x = clamp(anchor.left + (anchor.width - w) / 2, EDGE, viewport.width - EDGE - w);
  const h = Math.min(Math.max(height ?? 0, anchor.height), viewport.height - 2 * EDGE);
  const y =
    height === undefined
      ? clamp(anchor.top, EDGE, viewport.height - EDGE - h)
      : clamp(anchor.top + (anchor.height - h) / 2, EDGE, viewport.height - EDGE - h);
  return { left: x, top: y, width: w, height: h };
}

/** A panel that grows out of the element that opened it. The --morph-* values start the panel
 *  clipped to the element's box (MORPH_MOTION's keyframes), so it unrolls out of it. */
export function overAnchor(anchor: HTMLElement, width: number, height?: number): JSX.CSSProperties {
  const box = anchor.getBoundingClientRect();
  const vh = window.innerHeight;
  const placed = anchoredBox(box, { width: window.innerWidth, height: vh }, width, height);
  const radius = getComputedStyle(anchor).borderTopLeftRadius || "0px";
  return {
    left: `${placed.left}px`,
    top: `${placed.top}px`,
    translate: "none",
    width: `${placed.width}px`,
    "max-width": "none",
    "min-height": `${Math.min(box.height, vh - 2 * EDGE)}px`,
    "max-height": `${vh - 2 * EDGE}px`,
    "--morph-x": `${box.left - placed.left}px`,
    "--morph-y": `${box.top - placed.top}px`,
    "--morph-w": `${box.width}px`,
    "--morph-h": `${box.height}px`,
    "--morph-radius": radius,
  } as JSX.CSSProperties;
}
