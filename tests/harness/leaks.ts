import { cleanup } from "@solidjs/testing-library";
import { vi } from "vitest";
import { commands, page, server } from "vitest/browser";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { settleDom } from "../../dev/harness/settle";

const html = document.documentElement;
const body = document.body;
const OWN_CHILDREN = new Set(body.children);
const HELD = ["inert", "aria-hidden", "style"] as const;
const heldBy = (el: Element) => HELD.map((name) => el.getAttribute(name));
const AT_START = new Map([html, body].map((el) => [el, heldBy(el)]));

let fileRate: number | undefined;
const teardowns: (() => void)[] = [];

/** Undoes page state a test made outside its render; runs before the leak check reads the page. */
export function afterTest(undo: () => void): void {
  teardowns.push(undo);
}

/** The animation rate every test of this file starts at; unset, the suite's default. */
export async function setAnimationRate(rate: number): Promise<void> {
  fileRate = rate;
  await commands.animationRate(rate);
}

/**
 * Every test starts on the same page: light, motion allowed, the configured viewport, the file's
 * animation rate, and the pointer parked in a far corner by one real press, so hover and focus
 * modality never come from the test before.
 */
export async function resetPage(): Promise<void> {
  html.classList.remove("dark");
  await commands.emulateMedia({ reducedMotion: "no-preference", colorScheme: "light" });
  const { width, height } = server.config.browser.viewport;
  if (innerWidth !== width || innerHeight !== height) await page.viewport(width, height);
  await commands.animationRate(fileRate);
  await commands.mouse("press", innerWidth - 1, innerHeight - 1);
}

const name = (el: Element) => {
  const label = el.getAttribute("role") ?? el.getAttribute("data-slot") ?? el.id;
  return label ? `<${el.localName} ${label}>` : `<${el.localName}>`;
};
const finite = (a: Animation) =>
  a.playState === "running" && a.effect?.getComputedTiming().iterations !== Infinity;

function leaksOf(): string[] {
  const roots = [document, ...CLOSED_ROOTS];
  const leaks: string[] = [];
  const extra = [...body.children].filter((child) => !OWN_CHILDREN.has(child));
  if (extra.length) leaks.push(`body children ${extra.map(name).join(", ")}`);
  const open = roots.flatMap((r) => [...r.querySelectorAll(":modal, :popover-open")]);
  if (open.length) leaks.push(`open layers ${open.map(name).join(", ")}`);
  if (CLOSED_ROOTS.size) leaks.push(`${CLOSED_ROOTS.size} closed roots`);
  for (const [el, start] of AT_START) {
    heldBy(el).forEach((value, i) => {
      if (value !== start[i]) leaks.push(`<${el.localName}> ${HELD[i]}="${value}"`);
    });
  }
  const moving = roots.flatMap((r) => r.getAnimations()).filter(finite);
  if (moving.length) leaks.push(`${moving.length} running animations`);
  const focused = document.activeElement;
  if (focused && focused !== body) leaks.push(`focus on ${name(focused)}`);
  if (scrollX || scrollY) leaks.push(`window scrolled to ${scrollX},${scrollY}`);
  if (body.scrollTop || body.scrollLeft) leaks.push("body scrolled");
  return leaks;
}

function restore(): void {
  for (const child of [...body.children]) if (!OWN_CHILDREN.has(child)) child.remove();
  CLOSED_ROOTS.clear();
  for (const [el, start] of AT_START) {
    HELD.forEach((attribute, i) => {
      const value = start[i];
      if (value == null) el.removeAttribute(attribute);
      else el.setAttribute(attribute, value);
    });
  }
  for (const a of document.getAnimations()) a.cancel();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  scrollTo(0, 0);
  body.scrollTo(0, 0);
}

/** Unmounts what the test rendered, lets it settle, and fails the test if anything it made outlives it. */
export async function expectNoLeaks(): Promise<void> {
  for (const undo of teardowns.splice(0).reverse()) undo();
  cleanup();
  // An afterEach runs before useFakeTime's own restore, and settle needs real frames.
  vi.useRealTimers();
  await settleDom();
  const leaks = leaksOf();
  if (!leaks.length) return;
  restore();
  throw new Error(`the test left behind: ${leaks.join("; ")}`);
}
