import { type Accessor, createEffect } from "solid-js";

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

/** Centres the segment matching `selected` in `list` whenever `selection` changes; drives
 *  scrollLeft, since scrollIntoView would scroll the page with it. Tracks nothing while `list` is undefined. */
export function trackScroll(
  list: Accessor<HTMLElement | undefined>,
  selected: string,
  selection: Accessor<unknown>,
): void {
  const reveal = (el: HTMLElement) => {
    writeClip(el);
    if (el.scrollWidth <= el.clientWidth) return;
    const item = el.querySelector(selected);
    if (!item) return;
    const track = el.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    const left = el.scrollLeft + (box.left - track.left) - (track.width - box.width) / 2;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  };
  createEffect(list, (el) => {
    if (!el) return;
    const clip = () => writeClip(el);
    const resize = new ResizeObserver(clip);
    resize.observe(el);
    el.addEventListener("scroll", clip, { passive: true });
    return () => {
      resize.disconnect();
      el.removeEventListener("scroll", clip);
    };
  });
  // A frame late: on mount the track has no width yet, and during a press
  // the focus scroll cancels a smooth scroll started in the same task.
  createEffect(
    () => [list(), selection()] as const,
    ([el]) => {
      if (!el) return;
      const frame = requestAnimationFrame(() => reveal(el));
      return () => cancelAnimationFrame(frame);
    },
  );
}
