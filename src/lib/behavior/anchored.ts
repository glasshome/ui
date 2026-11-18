import type { Accessor } from "solid-js";
import { type Align, placeBeside, type Side } from "../anchor-placement";
import { effect } from "./solid";

export interface AnchoredOptions {
  anchor: Accessor<Element | undefined>;
  floating: Accessor<HTMLElement | undefined>;
  open: Accessor<boolean>;
  side?: Accessor<Side>;
  align?: Accessor<Align>;
  offset?: number;
  matchAnchorWidth?: boolean;
}

const SHADOW_ROOT_NODE = 11;
// The widget realm's tap guard reads this marker as a placed panel.
const ANCHORED = "data-anchored";

export function createAnchored(options: AnchoredOptions): void {
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
          size = { width: floating.offsetWidth, height: floating.offsetHeight };
        }
        const box = anchor.getBoundingClientRect();
        const placed = placeBeside(
          { left: box.left, top: box.top, width: box.width, height: box.height },
          size,
          { width: window.innerWidth, height: window.innerHeight },
          { side, align, offset, matchAnchorWidth },
        );
        write("top", `${placed.top}px`);
        write("left", `${placed.left}px`);
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

      const root = typeof anchor.getRootNode === "function" ? anchor.getRootNode() : document;
      const scrollTargets: EventTarget[] =
        root.nodeType === SHADOW_ROOT_NODE ? [document, root] : [document];
      for (const target of scrollTargets)
        target.addEventListener("scroll", onScroll, { capture: true, passive: true });
      window.addEventListener("resize", onResize);
      return () => {
        for (const target of scrollTargets)
          target.removeEventListener("scroll", onScroll, { capture: true });
        window.removeEventListener("resize", onResize);
        if (frame !== undefined) cancelAnimationFrame(frame);
        floating.removeAttribute(ANCHORED);
      };
    },
  );
}
