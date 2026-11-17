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
}

export interface Layer {
  readonly id: number;
  readonly kind: LayerKind;
  readonly readsOwnEscape: boolean;
  element(): HTMLElement | undefined;
  trigger(): Element | undefined;
  escape(): boolean;
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
    () => [options.element(), options.open()] as const,
    ([element, open]) => {
      if (!element || !open) return;
      const entry: Layer = {
        id: ++nextId,
        kind: options.kind,
        readsOwnEscape: options.readsOwnEscape ?? false,
        element: options.element,
        trigger: () => options.trigger?.(),
        escape: options.escape,
        dismiss: options.dismiss,
      };
      setLayers([...layers(), entry]);
      setLayer(entry);
      const leaveTopLayer = options.topLayer
        ? enterTopLayer(element, options.topLayer, () => {
            if (options.open()) options.dismiss?.();
          })
        : undefined;
      return () => {
        leaveTopLayer?.();
        setLayers(layers().filter((other) => other !== entry));
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
