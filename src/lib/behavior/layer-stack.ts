import { type Accessor, createSignal, createEffect, untrack } from "solid-js";

export type LayerKind = "modal" | "popover" | "menu" | "tooltip" | "tour";
export type TopLayer = "auto" | "manual";

export interface LayerOptions {
  element: Accessor<HTMLElement | undefined>;
  open: Accessor<boolean>;
  kind: LayerKind;
  escape: Accessor<boolean>;
  dismiss?: () => void;
  trigger?: Accessor<Element | undefined>;
  topLayer?: TopLayer;
  /** While open, the page takes no pointer events; this layer and the ones above it still do. */
  blockPointer?: Accessor<boolean>;
}

export interface Layer {
  readonly id: number;
  readonly kind: LayerKind;
  element(): HTMLElement | undefined;
  trigger(): Element | undefined;
  escape(): boolean;
  readonly blocksPointer: boolean;
  dismiss?: () => void;
}

export interface LayerHandle {
  layer: Accessor<Layer | undefined>;
  isTop: Accessor<boolean>;
  above(): readonly Layer[];
  containsPath(path: readonly EventTarget[]): boolean;
}

const [layerSignal, setLayers] = createSignal<readonly Layer[]>([]);
// The signal lags until flush, and handlers run inside a flush: reads track the signal and answer from this list.
let stack: readonly Layer[] = [];

const layers = (): readonly Layer[] => {
  layerSignal();
  return stack;
};
const top = (): Layer | undefined => layers().findLast((layer) => layer.kind !== "tooltip");

export const layerStack: {
  layers: Accessor<readonly Layer[]>;
  top: Accessor<Layer | undefined>;
} = { layers, top };

let nextId = 0;

function blockPointerBelow(above: readonly HTMLElement[]): () => void {
  const body = document.body;
  const prior = body.style.pointerEvents;
  body.style.pointerEvents = "none";
  const kept = above.map((element) => [element, element.style.pointerEvents] as const);
  for (const [element] of kept) element.style.pointerEvents = "auto";
  return () => {
    body.style.pointerEvents = prior;
    if (body.getAttribute("style") === "") body.removeAttribute("style");
    for (const [element, value] of kept) element.style.pointerEvents = value;
  };
}

let releasePointer: (() => void) | undefined;

function setStack(list: readonly Layer[]): void {
  stack = list;
  setLayers(list);
  releasePointer?.();
  releasePointer = undefined;
  const from = list.findLastIndex((layer) => layer.blocksPointer);
  if (from >= 0)
    releasePointer = blockPointerBelow(
      untrack(() => list.slice(from).flatMap((layer) => layer.element() ?? [])),
    );
}

function enterTopLayer(element: HTMLElement, mode: TopLayer, dismiss: (() => void) | undefined) {
  if (typeof element.showPopover !== "function") return undefined;
  element.setAttribute("popover", mode);
  try {
    element.showPopover();
  } catch {
    // Not connected yet, or already shown.
  }
  const onToggle = (event: Event) => {
    if ((event as ToggleEvent).newState === "closed") dismiss?.();
  };
  element.addEventListener("toggle", onToggle);
  return () => {
    element.removeEventListener("toggle", onToggle);
    try {
      element.hidePopover();
    } catch {
      // Already out of the top layer, or gone from the page.
    }
    element.removeAttribute("popover");
  };
}

export function registerLayer(options: LayerOptions): LayerHandle {
  const [layerSignal, setLayer] = createSignal<Layer | undefined>();
  let current: Layer | undefined;
  const layer = (): Layer | undefined => {
    layerSignal();
    return current;
  };

  createEffect(
    () => [options.element(), options.open(), options.blockPointer?.() ?? false] as const,
    ([element, open, blocksPointer]) => {
      if (!element || !open) return;
      const entry: Layer = {
        id: ++nextId,
        kind: options.kind,
        element: options.element,
        trigger: () => options.trigger?.(),
        escape: options.escape,
        blocksPointer,
        dismiss: options.dismiss,
      };
      setStack([...stack, entry]);
      current = entry;
      setLayer(entry);
      const leaveTopLayer = options.topLayer
        ? enterTopLayer(element, options.topLayer, () => {
            if (options.open()) options.dismiss?.();
          })
        : undefined;
      return () => {
        leaveTopLayer?.();
        setStack(stack.filter((other) => other !== entry));
        current = undefined;
        setLayer(undefined);
      };
    },
  );

  const above = (): readonly Layer[] => {
    const mine = layer();
    if (!mine) return [];
    return layers().slice(layers().indexOf(mine) + 1);
  };

  return {
    layer,
    isTop: () => {
      const mine = layer();
      return mine !== undefined && top() === mine;
    },
    above,
    containsPath(path) {
      const mine = layer();
      const own = [mine?.element(), mine?.trigger(), ...above().map((other) => other.element())];
      return path.some(
        (node) =>
          own.includes(node as Element) ||
          (node instanceof Element && node.hasAttribute("data-kb-top-layer")),
      );
    },
  };
}
