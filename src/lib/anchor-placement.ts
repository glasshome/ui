import type { JSX } from "solid-js";

const EDGE = 16;

/** A panel that grows out of the element that opened it: its corner on the element's corner, at
 *  least as wide as the element, shifted only as far as the screen needs. The --morph-* values
 *  start the panel clipped to the element's box (MORPH_MOTION's keyframes), so it unrolls out of it. */
export function overAnchor(anchor: HTMLElement, width: number): JSX.CSSProperties {
  const box = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(Math.max(width, box.width), vw - 2 * EDGE);
  const x = Math.max(EDGE, Math.min(box.left, vw - EDGE - w));
  const y = Math.max(EDGE, Math.min(box.top, vh - EDGE - Math.max(box.height, 240)));
  const radius = getComputedStyle(anchor).borderTopLeftRadius || "0px";
  return {
    left: `${x}px`,
    top: `${y}px`,
    translate: "none",
    width: `${w}px`,
    "max-width": "none",
    "min-height": `${Math.min(box.height, vh - y - EDGE)}px`,
    "max-height": `${vh - y - EDGE}px`,
    "--morph-x": `${box.left - x}px`,
    "--morph-y": `${box.top - y}px`,
    "--morph-w": `${box.width}px`,
    "--morph-h": `${box.height}px`,
    "--morph-radius": radius,
  } as JSX.CSSProperties;
}
