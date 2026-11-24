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
  const at = { x: box.x + x * scale, y: box.y + y * scale };
  const [width, height] = await ctx.page.evaluate(() => [innerWidth, innerHeight]);
  // A point past the window's edge reaches no element, so the input would vanish without an error.
  if (at.x < 0 || at.y < 0 || at.x >= width || at.y >= height)
    throw new Error(`(${x}, ${y}) lies outside the ${width}x${height} browser window`);
  return at;
}

/** Puts the browser window back to the size Playwright last set, after anything resized it behind Playwright's back. */
export const fitWindow: BrowserCommand<[]> = async (ctx) => {
  const size = ctx.page.viewportSize();
  if (!size) return;
  // Playwright skips a size equal to the one it last sent; the test frame keeps its own size meanwhile.
  await ctx.page.setViewportSize({ ...size, height: size.height + 1 });
  await ctx.page.setViewportSize(size);
};

/** Real mouse input at a point of the test frame's viewport; `press` is a move, down and up in one trip. */
export const mouse: BrowserCommand<
  [action: "move" | "down" | "up" | "press", x: number, y: number, button?: "left" | "right"]
> = async (ctx, action, x, y, button = "left") => {
  const at = await toPage(ctx, x, y);
  await ctx.page.mouse.move(at.x, at.y);
  if (action === "down" || action === "press") await ctx.page.mouse.down({ button });
  if (action === "up" || action === "press") await ctx.page.mouse.up({ button });
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

type Point = { x: number; y: number };

/**
 * A real left-button drag from a point of the test frame's viewport. Its events carry stated
 * timestamps, `stepMs` apart from the frame's time origin, so `event.timeStamp` velocity is the
 * drag's own at any host speed.
 */
export const drag: BrowserCommand<[from: Point, by: Point, moves: number, stepMs: number]> = async (
  ctx,
  from,
  by,
  moves,
  stepMs,
) => {
  if (ctx.project.config.browser.name !== "chromium")
    throw new Error("a drag with stated timestamps needs CDP, which only Chromium has");
  const start = await toPage(ctx, from.x, from.y);
  const end = await toPage(ctx, from.x + by.x, from.y + by.y);
  const origin = await (await ctx.frame()).evaluate(() => performance.timeOrigin);
  await ctx.page.mouse.move(start.x, start.y);
  const cdp = await pointerSession(ctx.page);
  // CDP reads a timestamp as seconds since the epoch.
  const at = (i: number) => ({
    x: start.x + ((end.x - start.x) * i) / moves,
    y: start.y + ((end.y - start.y) * i) / moves,
    timestamp: (origin + i * stepMs) / 1000,
  });
  const left = { button: "left", clickCount: 1 } as const;
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    ...left,
    buttons: 1,
    ...at(0),
  });
  for (let i = 1; i <= moves; i++)
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      ...left,
      buttons: 1,
      ...at(i),
    });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    ...left,
    buttons: 0,
    ...at(moves),
  });
};

// Pointer media is fixed when a page is made: Chromium cannot undo touch emulation, so no command turns it on.
const FINGER_PROJECT = /-finger\b/;

const TOUCH = {
  down: "touchStart",
  move: "touchMove",
  up: "touchEnd",
  cancel: "touchCancel",
} as const;

/** One real finger at a point of the test frame's viewport, in a project whose pages have a touch screen. */
export const touch: BrowserCommand<[action: keyof typeof TOUCH, x: number, y: number]> = async (
  ctx,
  action,
  x,
  y,
) => {
  if (!FINGER_PROJECT.test(ctx.project.name))
    throw new Error("a finger needs a touch screen: put this test in a *-finger test file");
  const at = await toPage(ctx, x, y);
  const cdp = await pointerSession(ctx.page);
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
export const frameAxTree: BrowserCommand<[]> = async (ctx) => {
  const cdp = await pointerSession(ctx.page);
  const { frameTree } = await cdp.send("Page.getFrameTree");
  const frame = await ctx.frame();
  return treeText(cdp, frameIdOf(frameTree, frame.url()));
};

// Timers and clocks keep real time; WebKit has no CDP.
export const animationRate: BrowserCommand<[rate?: number]> = async (ctx, rate) => {
  if (ctx.project.config.browser.name !== "chromium") return;
  const cdp = await pointerSession(ctx.page);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", {
    playbackRate: rate ?? Number(process.env.UI_ANIMATION_RATE ?? 10),
  });
};
