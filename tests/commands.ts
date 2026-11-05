import type {} from "@vitest/browser-playwright";
import type { BrowserCommand } from "vitest/node";

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

// Chromium tracks the fingers down per session, so a finger's start and end share it.
const sessions = new WeakMap<Page, Promise<Cdp>>();
function touchSession(page: Page) {
  let session = sessions.get(page);
  if (!session) {
    session = page
      .context()
      .newCDPSession(page)
      .then(async (cdp) => {
        await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
        return cdp;
      });
    sessions.set(page, session);
  }
  return session;
}

const TOUCH = { down: "touchStart", up: "touchEnd", cancel: "touchCancel" } as const;

/** One real finger at a point of the test frame's viewport. */
export const touch: BrowserCommand<[action: keyof typeof TOUCH, x: number, y: number]> = async (
  ctx,
  action,
  x,
  y,
) => {
  const at = await toPage(ctx, x, y);
  const cdp = await touchSession(ctx.page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: TOUCH[action],
    touchPoints: action === "down" ? [{ ...at, id: 0 }] : [],
  });
};
