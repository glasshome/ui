import type { Accessor } from "solid-js";
import { type Align, type Box, placeBeside, type Side } from "../anchor-placement.js";
import { effect } from "./solid.js";

/** An element, or a point or box with no element of its own: a context menu opens at the pointer. */
export interface AnchorLike {
  getBoundingClientRect: () => Box;
  getRootNode?(): Node;
}

export interface Anchored {
  /** Where the part was last placed, from the measure that placed it. */
  placed: () => Box | undefined;
}

export interface AnchoredOptions {
  anchor: Accessor<AnchorLike | undefined>;
  floating: Accessor<HTMLElement | undefined>;
  open: Accessor<boolean>;
  side?: Accessor<Side>;
  align?: Accessor<Align>;
  offset?: number;
  matchAnchorWidth?: boolean;
  /** The anchor counts as its top edge and the part never flips: placed below, it covers the anchor. */
  coverAnchor?: boolean;
  /** A custom property the part gets the anchor's width in, for styles sized by the anchor. */
  widthVar?: string;
}

const SHADOW_ROOT_NODE = 11;
// The widget realm's tap guard reads this marker as a placed panel.
const ANCHORED = "data-anchored";

export function createAnchored(options: AnchoredOptions): Anchored {
  let last: Box | undefined;
  effect(
    () =>
      [
        options.open(),
        options.anchor(),
        options.floating(),
        options.side?.() ?? "bottom",
        options.align?.() ?? "center",
      ] as const,
    ([open, anchor, floating, side, align]) => {
      if (!open || !anchor || !floating) return;
      floating.setAttribute(ANCHORED, "");
      const offset = options.offset ?? 0;
      const matchAnchorWidth = options.matchAnchorWidth ?? false;
      const cover = options.coverAnchor ?? false;
      const written = new Map<string, string>();
      const write = (name: string, value: string) => {
        if (written.get(name) === value) return;
        written.set(name, value);
        floating.style.setProperty(name, value);
      };

      let size = { width: 0, height: 0 };
      const place = (measure: boolean) => {
        if (measure) {
          write("position", "fixed");
          write("margin", "0");
          write("right", "auto");
          write("bottom", "auto");
        }
        const box = anchor.getBoundingClientRect();
        if (options.widthVar) write(options.widthVar, `${box.width}px`);
        if (measure) size = { width: floating.offsetWidth, height: floating.offsetHeight };
        const placed = placeBeside(
          { left: box.left, top: box.top, width: box.width, height: cover ? 0 : box.height },
          size,
          { width: window.innerWidth, height: window.innerHeight },
          { side, align, offset, matchAnchorWidth, flip: !cover },
        );
        // A covering part may sit as near the edge as its anchor already does.
        const top = cover && box.top >= 0 ? Math.min(placed.top, box.top + offset) : placed.top;
        write("top", `${top}px`);
        write("left", `${placed.left}px`);
        last = {
          left: placed.left,
          top,
          width: Math.min(size.width, placed.maxWidth),
          height: Math.min(size.height, placed.maxHeight),
        };
        write("max-width", `${placed.maxWidth}px`);
        write("max-height", `${placed.maxHeight}px`);
        if (matchAnchorWidth) write("min-width", `${box.width}px`);
        if (floating.getAttribute("data-side") !== placed.side)
          floating.setAttribute("data-side", placed.side);
      };
      place(true);

      let frame: number | undefined;
      const onScroll = () => {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {
          frame = undefined;
          place(false);
        });
      };
      const onResize = () => place(true);

      const root = anchor.getRootNode?.() ?? document;
      const scrollTargets: EventTarget[] =
        root.nodeType === SHADOW_ROOT_NODE ? [document, root] : [document];
      for (const target of scrollTargets)
        target.addEventListener("scroll", onScroll, { capture: true, passive: true });
      window.addEventListener("resize", onResize);
      // A layout read in the widget realm's Worker answers the last size the page sent; observing sends it.
      const sizes = new ResizeObserver(onResize);
      sizes.observe(floating);
      if (anchor instanceof Element) sizes.observe(anchor);
      return () => {
        for (const target of scrollTargets)
          target.removeEventListener("scroll", onScroll, { capture: true });
        window.removeEventListener("resize", onResize);
        sizes.disconnect();
        if (frame !== undefined) cancelAnimationFrame(frame);
        floating.removeAttribute(ANCHORED);
        last = undefined;
      };
    },
  );
  return { placed: () => last };
}
