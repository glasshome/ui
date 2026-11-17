import type {} from "@vitest/browser-playwright";
import type { BrowserCommand } from "vitest/node";
import { axTree as treeText } from "../dev/drive/ax";

type Page = Parameters<BrowserCommand<[]>>[0]["page"];
type Ctx = Parameters<BrowserCommand<[]>>[0];
type Cdp = Awaited<ReturnType<ReturnType<Page["context"]>["newCDPSession"]>>;

async function toPage(ctx: Ctx, x: number, y: number) {
  const frame = await ctx.frame();
  const box = await (await frame.frameElement()).boundingBox();
  if (!box) throw new Error("the test frame has no box");
  const scale = box.width / (await frame.evaluate(() => innerWidth));
  return { x: box.x + x * scale, y: box.y + y * scale };
}

/** Real mouse input at a point of the test frame's viewport. */
export const mouse: BrowserCommand<[action: "move" | "down" | "up", x: number, y: number]> = async (
  ctx,
  action,
  x,
  y,
) => {
  const at = await toPage(ctx, x, y);
  await ctx.page.mouse.move(at.x, at.y);
  if (action === "down") await ctx.page.mouse.down();
  if (action === "up") await ctx.page.mouse.up();
};

// Chromium tracks the fingers down and the touch screen per session, so every pointer command shares one.
const sessions = new WeakMap<Page, Promise<Cdp>>();
function pointerSession(page: Page) {
  let session = sessions.get(page);
  if (!session) {
    session = page.context().newCDPSession(page);
    sessions.set(page, session);
  }
  return session;
}

const touchScreen = (cdp: Cdp, on: boolean) =>
  cdp.send("Emulation.setTouchEmulationEnabled", { enabled: on, maxTouchPoints: on ? 5 : 1 });

/** Whether the page's main pointer is a finger (pointer: coarse) or a mouse; it lasts until the next call or finger. */
export const pointer: BrowserCommand<[kind: "finger" | "mouse"]> = async (ctx, kind) => {
  await touchScreen(await pointerSession(ctx.page), kind === "finger");
};

const TOUCH = {
  down: "touchStart",
  move: "touchMove",
  up: "touchEnd",
  cancel: "touchCancel",
} as const;

/** One real finger at a point of the test frame's viewport. */
export const touch: BrowserCommand<[action: keyof typeof TOUCH, x: number, y: number]> = async (
  ctx,
  action,
  x,
  y,
) => {
  const at = await toPage(ctx, x, y);
  const cdp = await pointerSession(ctx.page);
  await touchScreen(cdp, true);
  await cdp.send("Input.dispatchTouchEvent", {
    type: TOUCH[action],
    touchPoints: action === "down" || action === "move" ? [{ ...at, id: 0 }] : [],
  });
};

/** A real wheel turn of `deltaY` pixels over a point of the test frame's viewport. */
export const wheel: BrowserCommand<[x: number, y: number, deltaY: number]> = async (
  ctx,
  x,
  y,
  deltaY,
) => {
  const at = await toPage(ctx, x, y);
  await ctx.page.mouse.move(at.x, at.y);
  await ctx.page.mouse.wheel(0, deltaY);
};

/** An IME composition running in the focused control, so the next key is one `isComposing` marks. */
export const compose: BrowserCommand<[on: boolean]> = async (ctx, on) => {
  const cdp = await pointerSession(ctx.page);
  await cdp.send("Input.imeSetComposition", {
    text: on ? "あ" : "",
    selectionStart: on ? 1 : 0,
    selectionEnd: on ? 1 : 0,
  });
};

type Media = { reducedMotion?: "reduce" | "no-preference"; colorScheme?: "light" | "dark" };

/** Emulated media features for the page and its test frame. */
export const emulateMedia: BrowserCommand<[media: Media]> = async (ctx, media) => {
  await ctx.page.emulateMedia(media);
};

interface FrameNode {
  frame: { id: string; url: string };
  childFrames?: FrameNode[];
}

function frameIdOf(node: FrameNode, url: string): string | undefined {
  if (node.frame.url === url) return node.frame.id;
  for (const child of node.childFrames ?? []) {
    const found = frameIdOf(child, url);
    if (found) return found;
  }
  return undefined;
}

/** The Chromium accessibility tree of the test frame, one `role "name"` line per kept node. */
export const axTree: BrowserCommand<[]> = async (ctx) => {
  const cdp = await pointerSession(ctx.page);
  const { frameTree } = await cdp.send("Page.getFrameTree");
  const frame = await ctx.frame();
  return treeText(cdp, frameIdOf(frameTree, frame.url()));
};
