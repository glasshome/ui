import type { Window } from "happy-dom";

/** Resizes the test window the way a browser does: width, resize event, media query changes. */
export function setViewportWidth(width: number): void {
  (window as unknown as Window).happyDOM.setViewport({ width });
}
