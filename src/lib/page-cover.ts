import { watchMotion } from "./behavior/presence.js";
import { MOTION_EXIT_MS } from "./motion-classes.js";

/** On a modal's panel from the end of its open animation; the widget realm carries it out of a sealed widget. */
export const COVERING_ATTR = "data-covering";

let covers = 0;
const pageRoot = () => document.querySelector("[data-page]");

/** Pauses the page's ambient loops while a modal covers it: one attribute on the app's [data-page] root, never on html. Returns the release. */
export function coverPage(): () => void {
  covers++;
  if (covers === 1) pageRoot()?.setAttribute("data-covered", "");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    covers--;
    if (covers === 0) pageRoot()?.removeAttribute("data-covered");
  };
}

/** A modal panel covers the page once its open animation ends, if it is still open then, until the returned release runs. */
export function coverOnceOpen(panel: Element, open: () => boolean): () => void {
  let release: (() => void) | undefined;
  let done = false;
  const stop = watchMotion(panel, MOTION_EXIT_MS.sheet, () => {
    if (done || !open()) return;
    panel.setAttribute(COVERING_ATTR, "");
    release = coverPage();
  });
  return () => {
    if (done) return;
    done = true;
    stop();
    if (!release) return;
    panel.removeAttribute(COVERING_ATTR);
    release();
  };
}
