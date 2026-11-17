import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { CDPSession, Page } from "playwright";
import type { IndexedComponent, Step, Target } from "../harness/types";
import { PKG } from "./serve";

export const WIDTHS = {
  phone: [390, 844],
  tablet: [834, 1112],
  desktop: [1280, 900],
} as const;
export type Width = keyof typeof WIDTHS;
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export class UsageError extends Error {}

export const oneOf = <T extends string>(value: string, allowed: readonly T[], flag: string): T => {
  const hit = allowed.find((a) => a === value);
  if (hit === undefined) throw new UsageError(`--${flag} takes one of: ${allowed.join(", ")}`);
  return hit;
};

/** Read from disk so a bad name fails before any server or browser starts. */
export const componentSlugs = (pkg = PKG) =>
  ["dev/components", "dev/blocks"]
    .flatMap((root) =>
      existsSync(join(pkg, root))
        ? readdirSync(join(pkg, root), { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
        : [],
    )
    .toSorted();

export function requireSlug(name: string, pkg = PKG): string {
  const slugs = componentSlugs(pkg);
  const slug = slugs.find((s) => s === name.toLowerCase());
  if (slug === undefined) {
    throw new UsageError(`no component ${name}; known: ${slugs.join(", ")}`);
  }
  return slug;
}

export async function readIndex(page: Page, stageUrl: string): Promise<IndexedComponent[]> {
  await page.goto(stageUrl);
  const json = await page.locator("#scenario-index").textContent();
  return JSON.parse(json ?? "[]");
}

export const findComponent = (index: IndexedComponent[], name: string) =>
  index.find((c) => c.slug === name || c.component.toLowerCase() === name.toLowerCase());

export const stageHash = (slug: string, id: string, theme: Theme, material?: string) =>
  `#/components/${slug}/${id}?theme=${theme}${material ? `&material=${material}` : ""}`;

export const describeTarget = (t: Target) =>
  t.name === undefined ? t.role : `${t.role} "${t.name}"`;

async function locate(cdp: CDPSession, target: Target): Promise<{ x: number; y: number }> {
  const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodes } = await cdp.send("Accessibility.queryAXTree", {
    backendNodeId: root.backendNodeId,
    role: target.role,
    accessibleName: target.name,
  });
  const hits = nodes.filter((n) => !n.ignored && n.backendDOMNodeId !== undefined);
  const [only] = hits;
  if (only?.backendDOMNodeId === undefined) throw new Error(`no ${describeTarget(target)}`);
  if (hits.length > 1) throw new Error(`${hits.length} matches for ${describeTarget(target)}`);
  const backendNodeId = only.backendDOMNodeId;
  await cdp.send("DOM.scrollIntoViewIfNeeded", { backendNodeId });
  const { quads } = await cdp.send("DOM.getContentQuads", { backendNodeId });
  const quad = quads[0];
  if (quad?.length !== 8) throw new Error(`${describeTarget(target)} has no box`);
  const mean = (offset: number) =>
    quad.filter((_, i) => i % 2 === offset).reduce((a, b) => a + b) / 4;
  return { x: mean(0), y: mean(1) };
}

/** Resolves the target at rate 1 and returns the input alone, so a throttled step measures only the input. */
export async function prepare(
  page: Page,
  cdp: CDPSession,
  step: Step,
): Promise<() => Promise<void>> {
  if ("key" in step) return () => page.keyboard.press(step.key);
  if ("type" in step) return () => page.keyboard.type(step.type);
  if ("pressAt" in step) {
    const { x, y } = step.pressAt;
    return async () => {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.up();
    };
  }
  if ("press" in step) {
    const { x, y } = await locate(cdp, step.press);
    return async () => {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.up();
    };
  }
  if ("touch" in step) {
    const { x, y } = await locate(cdp, step.touch);
    return () => page.touchscreen.tap(x, y);
  }
  const { x, y } = await locate(cdp, step.hover);
  return () => page.mouse.move(x, y);
}
