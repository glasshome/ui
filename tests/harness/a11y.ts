import { virtual } from "@guidepup/virtual-screen-reader";
import axe from "axe-core";
import { computeAccessibleName, getRole } from "dom-accessibility-api";
import { findAll, type Input, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { trackPointer } from "./input";
import { focusedElement, settle } from "./mount";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

type Theme = "light" | "dark";

interface Gap {
  scenario: string;
  rule: string;
  item: string;
  theme?: Theme;
  /** The gap shows only where the browser reports `(hover: hover)`; headless CI reports none. */
  hover?: boolean;
}

const canHover = () => matchMedia("(hover: hover)").matches;

const GAP_FILES = import.meta.glob<Gap[]>(
  ["../../dev/components/*/a11y-gaps.json", "../../dev/blocks/*/a11y-gaps.json"],
  { eager: true, import: "default" },
);

/** Axe rules a scenario is known to break today in this theme, each naming its work item. */
export function knownGaps(folder: string, scenario: string, theme: Theme): string[] {
  const gaps =
    GAP_FILES[`../../dev/components/${folder}/a11y-gaps.json`] ??
    GAP_FILES[`../../dev/blocks/${folder}/a11y-gaps.json`] ??
    [];
  return gaps
    .filter(
      (g) =>
        g.scenario === scenario &&
        (g.theme ?? theme) === theme &&
        (g.hover === undefined || g.hover === canHover()),
    )
    .map((g) => g.rule);
}

/** A known gap must still fail somewhere in its scenario, so a gap that closes fails until its entry goes. */
export function expectGapsSeen(known: string[], seen: Iterable<string>): void {
  const found = new Set(seen);
  const closed = known.filter((rule) => !found.has(rule));
  if (closed.length > 0)
    throw new Error(`gap closed, drop its a11y-gaps.json entry: ${closed.join(", ")}`);
}

/** Axe over the whole document with the WCAG 2.2 AA rules and target-size; returns the known gaps it saw. */
export async function expectAxeClean(doc: Document, known: string[] = []): Promise<string[]> {
  const { violations } = await axe.run(doc, {
    runOnly: { type: "tag", values: TAGS },
    rules: { "target-size": { enabled: true } },
  });
  const fresh = violations.filter((v) => !known.includes(v.id));
  if (fresh.length === 0) return violations.map((v) => v.id);
  const lines = fresh.flatMap((v) =>
    v.nodes.map(
      (n) =>
        `${v.id} (${v.impact ?? "unknown"}): ${n.target.join(" ")}: ${n.any.map((c) => c.message).join("; ")}`,
    ),
  );
  throw new Error(`axe violations:\n${lines.join("\n")}`);
}

/** What the virtual screen reader says on mount, then after each step. */
export async function spokenTranscript(
  scope: () => ParentNode[],
  steps: Step[],
  input: Input,
): Promise<string[]> {
  await virtual.start({ container: document.body });
  try {
    const said: string[] = [];
    let heard = 0;
    // The reader speaks from async handlers, so a phrase can land frames after the step.
    const quietLog = async () => {
      let log = await virtual.spokenPhraseLog();
      for (;;) {
        await settle();
        const next = await virtual.spokenPhraseLog();
        if (next.length === log.length) return next;
        log = next;
      }
    };
    const take = async () => {
      const log = await quietLog();
      said.push(log.slice(heard).join(" | "));
      heard = log.length;
    };
    await take();
    const pointer = trackPointer(input);
    await runSteps(scope, steps, pointer.input, async () => {
      await pointer.rehover();
      await settle();
      await take();
    });
    return said;
  } finally {
    await virtual.stop();
  }
}

const STATEFUL = ["tab", "option", "button", "checkbox", "switch", "radio", "menuitem", "combobox"];

/** Focus plus every stateful control's role, name and selected, expanded and checked states. */
export function interactiveState(scope: ParentNode[]) {
  const describe = (el: Element) => ({
    role: getRole(el),
    name: computeAccessibleName(el),
    selected: el.getAttribute("aria-selected"),
    expanded: el.getAttribute("aria-expanded"),
    checked: el.getAttribute("aria-checked"),
  });
  const focused = focusedElement();
  return {
    focused: focused && focused !== document.body ? describe(focused) : null,
    controls: STATEFUL.flatMap((role) => findAll(scope, { role }).map(describe)),
  };
}

declare module "vitest/browser" {
  interface BrowserCommands {
    emulateMedia(media: {
      reducedMotion?: "reduce" | "no-preference";
      colorScheme?: "light" | "dark";
    }): Promise<void>;
  }
}
