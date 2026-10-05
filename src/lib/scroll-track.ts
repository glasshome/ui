/* A row of segments that scrolls sideways (tabs, a scrolling toggle group):
 * the selected segment stays in view and a clipped edge fades out, so the row
 * reads as "more this way" instead of ending mid-label. */

/** Fades whichever edge the track writes as clipped. */
export const SCROLL_TRACK_FADE =
  "data-[clip-end]:[mask-image:linear-gradient(to_right,black_85%,transparent)] data-[clip-start]:[mask-image:linear-gradient(to_left,black_85%,transparent)] data-[clip-start]:data-[clip-end]:[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]";

function writeClip(list: HTMLElement): void {
  const end = list.scrollWidth - list.clientWidth - list.scrollLeft;
  list.toggleAttribute("data-clip-start", list.scrollLeft > 1);
  list.toggleAttribute("data-clip-end", end > 1);
}

/** Centres the segment matching `selected` whenever it changes; drives
 *  scrollLeft, since scrollIntoView would scroll the page with it. */
export function trackScroll(list: HTMLElement, selected: string, attribute: string): () => void {
  const reveal = () => {
    writeClip(list);
    if (list.scrollWidth <= list.clientWidth) return;
    const item = list.querySelector(selected);
    if (!item) return;
    const track = list.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    const left = list.scrollLeft + (box.left - track.left) - (track.width - box.width) / 2;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  };
  const clip = () => writeClip(list);
  // The track has no width during mount, so the first pass waits for layout.
  const first = requestAnimationFrame(reveal);
  const observer = new MutationObserver(reveal);
  observer.observe(list, { attributes: true, attributeFilter: [attribute], subtree: true });
  const resize = new ResizeObserver(clip);
  resize.observe(list);
  list.addEventListener("scroll", clip, { passive: true });
  return () => {
    cancelAnimationFrame(first);
    observer.disconnect();
    resize.disconnect();
    list.removeEventListener("scroll", clip);
  };
}
