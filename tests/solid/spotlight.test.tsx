import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { Z_CLASS } from "../../src/lib/layers.js";
import { TRAVEL_MOTION } from "../../src/lib/motion-classes.js";
import { OVERLAY_SURFACE_OPAQUE, SCRIM_CLASS } from "../../src/lib/overlay-classes.js";
import { Spotlight } from "../../src/solid/spotlight.js";
import { useFakeTime } from "../../src/testing/index.js";

const TAIL_SIZE = 20;
const BUBBLE_GAP = 12;

function targetAt(x: number, y: number, width: number, height: number) {
  const el = document.createElement("button");
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${width}px;height:${height}px`;
  document.body.append(el);
  return el;
}

const nextFrame = () => new Promise(requestAnimationFrame);

/* What the browser serialises for these path commands, e.g. "M104 192" as "M 104 192". */
function pathCommands(d: string): string {
  const probe = document.createElement("div");
  probe.style.clipPath = `path("${d}")`;
  return probe.style.clipPath.slice('path("'.length, -'")'.length);
}

/* What the browser serialises for a translate's y, which it rounds. */
function translateY(y: number): string | undefined {
  const probe = document.createElement("div");
  probe.style.translate = `0px ${y}px`;
  return probe.style.translate.split(" ")[1];
}

/* CDP evaluates in the top frame; resolving our document lands in this test frame's realm. */
async function inThisFrame(expression: string): Promise<string> {
  const { result: frame } = await cdp().send("Runtime.evaluate", {
    expression: `[...document.querySelectorAll("iframe")].find((f) => f.contentWindow.location.href === ${JSON.stringify(location.href)})`,
  });
  const { node } = await cdp().send("DOM.describeNode", {
    objectId: frame.objectId,
    depth: 1,
    pierce: true,
  });
  const { object } = await cdp().send("DOM.resolveNode", {
    backendNodeId: node.contentDocument?.backendNodeId,
  });
  const { result } = await cdp().send("Runtime.callFunctionOn", {
    objectId: object.objectId,
    functionDeclaration: `function () { return this.defaultView.${expression}; }`,
  });
  if (!result.objectId) throw new Error(`no object for ${expression}`);
  return result.objectId;
}

async function listenerTypes(target: "window" | "document"): Promise<string[]> {
  const objectId = await inThisFrame(target);
  const { listeners } = await cdp().send("DOMDebugger.getEventListeners", { objectId });
  return listeners.map((l) => l.type);
}

async function liveResizeObservers(): Promise<number> {
  await cdp().send("HeapProfiler.collectGarbage");
  const prototypeObjectId = await inThisFrame("ResizeObserver.prototype");
  const objectGroup = "live-resize-observers";
  const { objects } = await cdp().send("Runtime.queryObjects", { prototypeObjectId, objectGroup });
  const { result } = await cdp().send("Runtime.callFunctionOn", {
    objectId: objects.objectId,
    functionDeclaration: "function () { return this.length; }",
    returnByValue: true,
  });
  /* The inspector holds what it returned until the group is released. */
  await cdp().send("Runtime.releaseObjectGroup", { objectGroup });
  return result.value as number;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Spotlight", () => {
  it("cuts the hole over the target's rect", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim>
        Hold the dock
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.style.clipPath).toContain(pathCommands("M104 192"));
  });

  it("draws no scrim when scrim is off, and still draws the bubble", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim={false}>
        Drag it
      </Spotlight>
    ));
    expect(document.querySelector('[data-slot="spotlight-scrim"]')).toBeNull();
    expect(document.querySelector('[data-slot="spotlight-bubble"]')?.textContent).toContain(
      "Drag it",
    );
  });

  it("re-measures the bubble one frame later, so content that grows after the target changes is placed from the grown height", async () => {
    const a = targetAt(100, 200, 300, 50);
    const b = targetAt(500, 600, 100, 40);
    const [target, setTarget] = createSignal<Element>(a);
    const [grow, setGrow] = createSignal(0);
    render(() => (
      <Spotlight target={target()} scrim={false}>
        Step
        <div style={{ height: `${grow()}px` }} />
      </Spotlight>
    ));
    const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
    const width = bubble?.offsetWidth ?? 0;
    const chrome = bubble?.offsetHeight ?? 0;
    setGrow(116 - chrome);
    await nextFrame();
    setTarget(b);
    setGrow(137 - chrome);
    await nextFrame();
    /* The tail's half-diagonal (8√2) grows the gap below BUBBLE_GAP=12. */
    const gap = BUBBLE_GAP + (TAIL_SIZE * Math.SQRT2) / 2;
    const [x, y] = (bubble?.style.translate ?? "").split(" ");
    expect(x).toBe(`${500 + 100 / 2 - width / 2}px`);
    expect(y).toBe(translateY(600 - gap - 137));
  });

  it("keeps re-measuring for the full window even when the target's motion starts late", () => {
    useFakeTime({ toFake: ["requestAnimationFrame"] });
    const el = targetAt(100, 220, 300, 50);
    render(() => (
      <Spotlight target={el} scrim>
        Step
      </Spotlight>
    ));
    const scrim = () => document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim()?.style.clipPath).toContain(pathCommands("M104 212"));

    /* A grid tile whose transition starts a few frames after mount: it only starts
     * moving on frame 5, and has landed by frame 12. */
    let callsInWindow = vi.getTimerCount();
    for (let frame = 1; frame <= 40; frame++) {
      const top = frame < 5 ? 220 : frame < 12 ? 220 - (frame - 4) * 3 : 200;
      el.style.top = `${top}px`;
      vi.advanceTimersToNextFrame();
      callsInWindow += vi.getTimerCount();
    }
    expect(scrim()?.style.clipPath).toContain(pathCommands("M104 192"));

    expect(callsInWindow).toBeGreaterThan(20);

    vi.advanceTimersToNextFrame();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("follows a new target", () => {
    const a = targetAt(100, 200, 300, 50);
    const b = targetAt(500, 600, 100, 40);
    const [target, setTarget] = createSignal<Element>(a);
    render(() => (
      <Spotlight target={target()} scrim>
        Step
      </Spotlight>
    ));
    setTarget(b);
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.style.clipPath).toContain(pathCommands("M504 592"));
  });

  it("requests no more frames once the settle window ends", () => {
    useFakeTime({ toFake: ["requestAnimationFrame"] });
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim>
        Step
      </Spotlight>
    ));
    for (let i = 0; i < 45; i++) vi.advanceTimersToNextFrame();
    let requested = 0;
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersToNextFrame();
      requested += vi.getTimerCount();
    }
    expect(requested).toBe(0);
  });

  it("calls onSkip on Escape", async () => {
    const onSkip = vi.fn();
    render(() => (
      <Spotlight target={undefined} scrim onSkip={onSkip}>
        Step
      </Spotlight>
    ));
    await userEvent.keyboard("{Escape}");
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("blocks no presses when the target is unmeasured", () => {
    render(() => (
      <Spotlight target={undefined} scrim>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.classList.contains("pointer-events-none")).toBe(true);
  });

  it("blocks presses outside a measured target", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.classList.contains("pointer-events-none")).toBe(false);
  });

  it("blocks presses on an unmeasured target when blocking", () => {
    render(() => (
      <Spotlight target={undefined} scrim blocking>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.classList.contains("pointer-events-none")).toBe(false);
  });

  it("keeps blocking presses off when no blocking is set", () => {
    render(() => (
      <Spotlight target={undefined} scrim>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.classList.contains("pointer-events-none")).toBe(true);
  });

  it("leaves a measured target unaffected by blocking", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim blocking>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.classList.contains("pointer-events-none")).toBe(false);
  });

  it("observes the bubble element too, so its own size change re-places it", async () => {
    const raf = window.requestAnimationFrame.bind(window);
    const realFrame = () => new Promise(raf);
    /* Frozen frames, so only the ResizeObserver can re-place the bubble. */
    useFakeTime({ toFake: ["requestAnimationFrame"] });
    const el = targetAt(500, 600, 100, 40);
    const [grow, setGrow] = createSignal(0);
    render(() => (
      <Spotlight target={el} scrim>
        Step
        <div style={{ height: `${grow()}px` }} />
      </Spotlight>
    ));
    await realFrame();
    await realFrame();
    const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
    const gap = BUBBLE_GAP + (TAIL_SIZE * Math.SQRT2) / 2;
    setGrow(100);
    const grown = bubble?.offsetHeight ?? 0;
    await realFrame();
    await realFrame();
    const [, y] = (bubble?.style.translate ?? "").split(" ");
    expect(y).toBe(translateY(600 - gap - grown));
  });

  it("skips the scrim style write when a remeasure finds the same rect", async () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim>
        Step
      </Spotlight>
    ));
    await nextFrame();
    await nextFrame();
    const scroller = document.createElement("div");
    scroller.style.cssText = "position:fixed;left:0;top:0;width:50px;height:50px;overflow:auto";
    scroller.innerHTML = '<div style="height:200px"></div>';
    document.body.append(scroller);
    const writes = new MutationObserver(() => {});
    writes.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style"] });
    const scrolled = new Promise((resolve) =>
      scroller.addEventListener("scroll", resolve, { once: true }),
    );
    scroller.scrollTop = 40;
    await scrolled;
    expect(writes.takeRecords()).toEqual([]);
    writes.disconnect();
  });

  it("wears the modal scrim recipe", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    for (const token of SCRIM_CLASS.split(" ")) {
      expect(scrim?.classList.contains(token)).toBe(true);
    }
  });

  it("keeps the travel transition", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    for (const token of TRAVEL_MOTION.split(" ")) {
      expect(scrim?.classList.contains(token)).toBe(true);
    }
  });

  it("cuts the hole with a custom pad", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim pad={0}>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.style.clipPath).toContain(pathCommands("M112 200"));
  });

  it("leaves no listener or observer behind", async () => {
    const count = (types: string[], type: string) => types.filter((t) => t === type).length;
    const windowBefore = await listenerTypes("window");
    const documentBefore = await listenerTypes("document");
    const observersBefore = await liveResizeObservers();
    const el = targetAt(0, 0, 10, 10);
    const { unmount } = render(() => (
      <Spotlight target={el} scrim>
        Step
      </Spotlight>
    ));
    expect(await liveResizeObservers()).toBe(observersBefore + 1);
    unmount();
    expect(await liveResizeObservers()).toBe(observersBefore);
    const windowAfter = await listenerTypes("window");
    for (const type of ["resize", "scroll"]) {
      expect(count(windowAfter, type)).toBe(count(windowBefore, type));
    }
    expect(count(await listenerTypes("document"), "keydown")).toBe(
      count(documentBefore, "keydown"),
    );
  });

  it("points the tail at the target on a below-placed bubble", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim={false}>
        Step
      </Spotlight>
    ));
    expect(bubbleSide()).toBe("below");
    const tail = document.querySelector<HTMLElement>('[data-slot="spotlight-tail"]');
    expect(tail?.getAttribute("data-side")).toBe("below");
    const width = document.querySelector<HTMLElement>(
      '[data-slot="spotlight-bubble"]',
    )?.offsetWidth;
    const rawX = 100 + 300 / 2 - (width ?? 0) / 2;
    const anchorCentre = 100 + 300 / 2;
    expect(tail?.style.left).toBe(`${anchorCentre - rawX - TAIL_SIZE / 2}px`);
  });

  it("points the tail at the target on an above-placed bubble", () => {
    const el = targetAt(400, 700, 200, 60);
    render(() => (
      <Spotlight target={el} scrim={false}>
        Step
      </Spotlight>
    ));
    expect(bubbleSide()).toBe("above");
    const tail = document.querySelector<HTMLElement>('[data-slot="spotlight-tail"]');
    expect(tail?.getAttribute("data-side")).toBe("above");
  });

  it("paints the panel over the tail's inner half, so only the outer half shows", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim={false}>
        Step
      </Spotlight>
    ));
    const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
    const tail = bubble?.querySelector('[data-slot="spotlight-tail"]');
    const panel = bubble?.querySelector('[data-slot="spotlight-panel"]');
    expect(tail).toBeTruthy();
    expect(panel).toBeTruthy();
    expect(tail?.compareDocumentPosition(panel as Node) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      true,
    );
    expect(panel?.classList.contains("relative")).toBe(true);
  });

  it("carries the overlay layer on the positioner, so the panel never outranks the scrim", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim={false}>
        Step
      </Spotlight>
    ));
    const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
    const panel = document.querySelector<HTMLElement>('[data-slot="spotlight-panel"]');
    expect(bubble?.classList.contains(Z_CLASS.overlay)).toBe(true);
    expect(panel?.classList.contains(Z_CLASS.overlay)).toBe(false);
  });

  it("wears the opaque recipe on both the panel and the tail, so the tail reads as part of the panel", () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim={false}>
        Step
      </Spotlight>
    ));
    const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
    const tail = bubble?.querySelector('[data-slot="spotlight-tail"]');
    const panel = bubble?.querySelector('[data-slot="spotlight-panel"]');
    for (const token of OVERLAY_SURFACE_OPAQUE.split(" ")) {
      expect(tail?.classList.contains(token)).toBe(true);
      expect(panel?.classList.contains(token)).toBe(true);
    }
  });

  it(`grows the tail to ${TAIL_SIZE}px`, () => {
    const el = targetAt(100, 200, 300, 50);
    render(() => (
      <Spotlight target={el} scrim={false}>
        Step
      </Spotlight>
    ));
    const tail = document.querySelector<HTMLElement>('[data-slot="spotlight-tail"]');
    expect(tail?.style.width).toBe(`${TAIL_SIZE}px`);
    expect(tail?.style.height).toBe(`${TAIL_SIZE}px`);
  });

  it("draws no tail when the bubble is centred with no target", () => {
    render(() => (
      <Spotlight target={undefined} scrim={false}>
        Step
      </Spotlight>
    ));
    expect(bubbleSide()).toBe("center");
    expect(document.querySelector('[data-slot="spotlight-tail"]')).toBeNull();
  });

  it("anchors the bubble and its tail to a different element than the target's hole", () => {
    const target = targetAt(100, 200, 300, 50);
    const anchor = targetAt(500, 200, 60, 30);
    render(() => (
      <Spotlight target={target} anchor={anchor} scrim>
        Step
      </Spotlight>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="spotlight-scrim"]');
    expect(scrim?.style.clipPath).toContain(pathCommands("M104 192"));
    const bubble = document.querySelector<HTMLElement>('[data-slot="spotlight-bubble"]');
    const gap = BUBBLE_GAP + (TAIL_SIZE * Math.SQRT2) / 2;
    const rawX = 500 + 60 / 2 - (bubble?.offsetWidth ?? 0) / 2;
    const [x, y] = (bubble?.style.translate ?? "").split(" ");
    expect(x).toBe(`${rawX}px`);
    expect(y).toBe(translateY(200 + 30 + gap));
  });
});

function bubbleSide() {
  return document.querySelector('[data-slot="spotlight-bubble"]')?.getAttribute("data-side");
}
