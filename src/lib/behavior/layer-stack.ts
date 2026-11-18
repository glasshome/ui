import { type Accessor, createMemo, createRoot, createSignal } from "solid-js";
import { effect } from "./solid";

export type LayerKind = "modal" | "popover" | "menu" | "tooltip" | "tour";
export type TopLayer = "auto" | "manual";

export interface LayerOptions {
  element: Accessor<HTMLElement | undefined>;
  open: Accessor<boolean>;
  kind: LayerKind;
  escape: Accessor<boolean>;
  readsOwnEscape?: boolean;
  dismiss?: () => void;
  trigger?: Accessor<Element | undefined>;
  topLayer?: TopLayer;
  /** While open, the page takes no pointer events; this layer and the ones above it still do. */
  blockPointer?: Accessor<boolean>;
}

export interface Layer {
  readonly id: number;
  readonly kind: LayerKind;
  readonly readsOwnEscape: boolean;
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

const [layers, setLayers] = createSignal<readonly Layer[]>([]);

const top = createRoot(() =>
  createMemo(() => layers().findLast((layer) => layer.kind !== "tooltip")),
);

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
  setLayers(list);
  releasePointer?.();
  releasePointer = undefined;
  const from = list.findLastIndex((layer) => layer.blocksPointer);
  if (from >= 0)
    releasePointer = blockPointerBelow(list.slice(from).flatMap((layer) => layer.element() ?? []));
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
  const [layer, setLayer] = createSignal<Layer | undefined>();

  effect(
    () => [options.element(), options.open(), options.blockPointer?.() ?? false] as const,
    ([element, open, blocksPointer]) => {
      if (!element || !open) return;
      const entry: Layer = {
        id: ++nextId,
        kind: options.kind,
        readsOwnEscape: options.readsOwnEscape ?? false,
        element: options.element,
        trigger: () => options.trigger?.(),
        escape: options.escape,
        blocksPointer,
        dismiss: options.dismiss,
      };
      setStack([...layers(), entry]);
      setLayer(entry);
      const leaveTopLayer = options.topLayer
        ? enterTopLayer(element, options.topLayer, () => {
            if (options.open()) options.dismiss?.();
          })
        : undefined;
      return () => {
        leaveTopLayer?.();
        setStack(layers().filter((other) => other !== entry));
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
