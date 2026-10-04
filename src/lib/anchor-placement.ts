import type { JSX } from "solid-js";

const EDGE = 16;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
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
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));
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
