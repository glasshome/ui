import { expect } from "vitest";
import { findAll, findTarget } from "../../dev/harness/steps";
import type { Target } from "../../dev/harness/types";
import { mountScenario, settle } from "../harness/mount";

export type Scope = () => ParentNode[];

const AREA: Target = { role: "region", name: "Canvas" };
export const menus = (scope: Scope) => findAll(scope(), { role: "menu" });
export const item = (scope: Scope, name: string) =>
  findTarget(scope(), { role: "menuitem", name }) as HTMLElement;
export const chosen = (scope: Scope) =>
  findTarget(scope(), { role: "status", name: "Chosen" }).textContent;

export const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return [box.x + box.width / 2, box.y + box.height / 2] as const;
};

export async function step(run: Promise<void>) {
  await run;
  await settle();
}

export async function mount(id = "closed") {
  const { scope } = await mountScenario("ContextMenu", id);
  return { scope, area: findTarget(scope(), AREA) as HTMLElement };
}

const GUTTER = 2;

export const expectCornerAt = (menu: Element | undefined, x: number, y: number) => {
  const box = menu?.getBoundingClientRect();
  expect(Math.abs((box?.left ?? -1) - (x + GUTTER))).toBeLessThanOrEqual(1);
  expect(Math.abs((box?.top ?? -1) - y)).toBeLessThanOrEqual(1);
};
