import type { Accessor } from "solid-js";
import type { LayerHandle } from "./layer-stack";
import { effect } from "./solid";

const KEPT = '[aria-live], [role="status"], [role="alert"], [data-kb-top-layer]';
const ELEMENT = 1;
const DOCUMENT = 9;
const FRAGMENT = 11;

export interface HideOutsideOptions {
  layer: LayerHandle;
  active: Accessor<boolean>;
}

const holds = new Map<Element, { count: number; prior: string | null }>();

function hide(element: Element) {
  const held = holds.get(element);
  if (held) held.count++;
  else holds.set(element, { count: 1, prior: element.getAttribute("aria-hidden") });
  element.setAttribute("aria-hidden", "true");
}

function release(element: Element) {
  const held = holds.get(element);
  if (!held || --held.count > 0) return;
  holds.delete(element);
  if (held.prior === null) element.removeAttribute("aria-hidden");
  else element.setAttribute("aria-hidden", held.prior);
}

function branchOf(element: Element): Element {
  let branch = element;
  for (let parent = branch.parentNode; parent; parent = branch.parentNode) {
    if (parent.nodeType === DOCUMENT || parent.nodeType === FRAGMENT) break;
    if (parent === branch.ownerDocument?.body) break;
    if (parent.nodeType !== ELEMENT) break;
    branch = parent as Element;
  }
  return branch;
}

function hiddenAround(parent: ParentNode, layers: Element[], live: Element[]): Element[] {
  const hidden: Element[] = [];
  for (const child of Array.from(parent.children)) {
    if (layers.some((layer) => child.contains(layer)) || live.includes(child)) continue;
    if (live.some((region) => child.contains(region)))
      hidden.push(...hiddenAround(child, layers, live));
    else hidden.push(child);
  }
  return hidden;
}

export function createHideOutside(options: HideOutsideOptions): void {
  effect(
    () => [options.active(), options.layer.layer()?.element()] as const,
    ([active, element]) => {
      if (!active || !element) return;
      const parent = branchOf(element).parentNode;
      if (!parent) return;
      const layers = [element];
      for (const above of options.layer.above()) {
        const aboveElement = above.element();
        if (aboveElement) layers.push(aboveElement);
      }
      const hidden = hiddenAround(parent, layers, Array.from(parent.querySelectorAll(KEPT)));
      for (const child of hidden) hide(child);
      return () => {
        for (const child of hidden) release(child);
      };
    },
  );
}
