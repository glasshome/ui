import { computeAccessibleName, getRole } from "dom-accessibility-api";
import { CLOSED_ROOTS } from "./closed-roots";
import type { Step, Target } from "./types";

export interface Input {
  press(el: Element): Promise<void>;
  pressAt(x: number, y: number): Promise<void>;
  touch(el: Element): Promise<void>;
  hover(el: Element): Promise<void>;
  contextMenu(el: Element): Promise<void>;
  hold(el: Element): Promise<void>;
  key(key: string): Promise<void>;
  type(text: string): Promise<void>;
}

function* elementsIn(scope: ParentNode): Generator<Element> {
  for (const el of scope.querySelectorAll("*")) {
    yield el;
    if (el.shadowRoot) yield* elementsIn(el.shadowRoot);
  }
}

function hiddenFromAssistiveTech(el: Element): boolean {
  let node: Element | null = el;
  while (node) {
    if (node.getAttribute("aria-hidden") === "true" || node.hasAttribute("inert")) return true;
    const root = node.getRootNode();
    node = node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return false;
}

const describeTarget = (t: Target) => (t.name === undefined ? t.role : `${t.role} "${t.name}"`);

export function findAll(scope: ParentNode[], target: Target): Element[] {
  const seen = new Set<Element>();
  for (const s of scope) for (const el of elementsIn(s)) seen.add(el);
  return [...seen].filter(
    (el) =>
      getRole(el) === target.role &&
      (target.name === undefined || computeAccessibleName(el) === target.name) &&
      !hiddenFromAssistiveTech(el),
  );
}

export function findTarget(scope: ParentNode[], target: Target): Element {
  const matches = findAll(scope, target);
  const [only] = matches;
  if (!only) throw new Error(`no ${describeTarget(target)}`);
  if (matches.length > 1)
    throw new Error(`${matches.length} matches for ${describeTarget(target)}`);
  return only;
}

/** The document plus every closed shadow root a scenario opened; read per step, since lists portal in as they open. */
export const scenarioScope = (): ParentNode[] => [document, ...CLOSED_ROOTS];

type Pointer = "press" | "touch" | "hover" | "contextMenu" | "hold";

async function runStep(scope: ParentNode[], step: Step, input: Input): Promise<void> {
  if ("key" in step) return input.key(step.key);
  if ("type" in step) return input.type(step.type);
  if ("pressAt" in step) return input.pressAt(step.pressAt.x, step.pressAt.y);
  const [verb, target] = Object.entries(step)[0] as [Pointer, Target];
  return input[verb](findTarget(scope, target));
}

export async function runSteps(
  scope: () => ParentNode[],
  steps: Step[],
  input: Input,
  after?: (index: number) => Promise<void>,
): Promise<void> {
  for (const [index, step] of steps.entries()) {
    await runStep(scope(), step, input);
    await after?.(index);
  }
}
