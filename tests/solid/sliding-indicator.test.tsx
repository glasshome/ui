/* The admin tabs bug: only the container was under a ResizeObserver, so an
 * <iconify-icon>/webfont growing the active item after first paint left the
 * indicator at its stale width. These tests pin the fix at the DOM level:
 * the active item itself is observed, and a fonts.ready re-measure recovers
 * from a zero-size first pass. */
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlidingIndicator } from "../../src/solid/sliding-indicator.js";
import { useFakeTime } from "../../src/testing/index.js";

afterEach(() => {
  cleanup();
});

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

async function frames(count = 3) {
  for (let i = 0; i < count; i++) {
    vi.advanceTimersToNextFrame();
    await flush();
  }
  await flush();
}

async function resizeDelivered() {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
}

const box = (width: number, height = 32): JSX.CSSProperties => ({
  flex: "none",
  width: `${width}px`,
  height: `${height}px`,
  padding: "0",
  border: "0",
  margin: "0",
  "box-sizing": "border-box",
});

const row = (width: number, height = 32): JSX.CSSProperties => ({
  display: "flex",
  width: `${width}px`,
  height: `${height}px`,
});

function loadingFont() {
  const face = new FontFace("Late", "url(data:font/woff2;base64,AAAA)");
  document.fonts.add(face);
  face.load().catch(() => {});
  expect(document.fonts.status).toBe("loading");
  return () => document.fonts.delete(face);
}

function countWakes(target: Node) {
  let callbacks = 0;
  const observer = new MutationObserver(() => {
    callbacks += 1;
  });
  observer.observe(target, { subtree: true, childList: true, attributes: true });
  return () => callbacks;
}

describe("SlidingIndicator", () => {
  it("observes the active item, not just the container, and follows it when it resizes", async () => {
    const { container } = render(() => (
      <SlidingIndicator active={0} style={row(200)}>
        <button type="button" style={box(80)}>
          Overview
        </button>
        <button type="button" style={box(80)}>
          Activity
        </button>
      </SlidingIndicator>
    ));
    const root = container.querySelector("[data-slot], .relative") ?? container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    const active = buttons[0] as HTMLElement;
    if (!(root instanceof HTMLElement)) throw new Error("no root");

    await resizeDelivered();
    const indicator = () => container.querySelector<HTMLElement>("[data-sliding-indicator]");
    expect(indicator()?.style.width).toBe("80px");

    // The icon/webfont grows the active trigger after first paint; the container keeps its size.
    active.style.width = "140px";
    await resizeDelivered();

    expect(root.getBoundingClientRect().width).toBe(200);
    expect(indicator()?.style.width).toBe("140px");
  });

  it("re-measures once document.fonts.ready resolves", async () => {
    const unloadFont = loadingFont();
    let zoom: HTMLElement | undefined;
    // The font finishes loading: real geometry, then fonts.ready resolves.
    void document.fonts.ready.then(() => zoom?.style.setProperty("scale", "1"));
    const [active] = createSignal(0);
    const { container } = render(() => (
      <div style={{ scale: "0" }}>
        <SlidingIndicator active={active()} style={row(100)}>
          <button type="button" style={box(100)}>
            One
          </button>
        </SlidingIndicator>
      </div>
    ));
    zoom = container.firstElementChild as HTMLElement;
    // Zero size on the first pass: geometry not settled yet (pre-fonts-ready).
    await flush();
    expect(container.querySelector("[data-sliding-indicator]")).toBeNull();

    await document.fonts.ready;

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.width).toBe(
      "100px",
    );
    unloadFont();
  });

  it("retries after a zero-size pass instead of resting on it", async () => {
    useFakeTime();
    const { container } = render(() => (
      <div style={{ scale: "0" }}>
        <SlidingIndicator active={0} style={row(100)}>
          <button type="button" style={box(100)}>
            One
          </button>
        </SlidingIndicator>
      </div>
    ));
    const zoom = container.firstElementChild as HTMLElement;
    // A dialog still running its open transform: layout size is intact, the
    // rects are not, and nothing here observes the ancestor's animation.
    await flush();
    expect(container.querySelector("[data-sliding-indicator]")).toBeNull();

    // The transform settles. No resize, no animationend, no mutation.
    zoom.style.scale = "1";
    await frames();

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.width).toBe(
      "100px",
    );
  });

  it("treats one zero dimension as unmeasured, not as a zero-width item", async () => {
    const { container } = render(() => (
      <SlidingIndicator active={0} style={row(200)}>
        <button type="button" style={box(0)}>
          One
        </button>
      </SlidingIndicator>
    ));
    await flush();

    expect(container.querySelector("[data-sliding-indicator]")).toBeNull();
  });

  it("lands in layout pixels while an ancestor is mid-zoom", async () => {
    const { container } = render(() => (
      <div style={{ scale: "0.94" }}>
        <SlidingIndicator active={1} style={row(200)}>
          <button type="button" style={box(100)}>
            Edit
          </button>
          <button type="button" style={box(80)}>
            Debug
          </button>
        </SlidingIndicator>
      </div>
    ));
    await flush();

    const indicator = container.querySelector<HTMLElement>("[data-sliding-indicator]");
    expect(indicator?.style.transform).toBe("translateX(100px)");
    expect(indicator?.style.width).toBe("80px");
  });

  it("slides when the active item changes and lands at once when the same item re-measures", async () => {
    const [active, setActive] = createSignal(0);
    const { container } = render(() => (
      <SlidingIndicator
        active={active()}
        style={{
          display: "grid",
          "grid-template-columns": "80px 80px",
          width: "160px",
          height: "32px",
        }}
      >
        <button type="button" style={box(80)}>
          One
        </button>
        <button type="button" style={box(80)}>
          Two
        </button>
      </SlidingIndicator>
    ));
    const buttons = container.querySelectorAll("button");
    await flush();
    const indicator = () => container.querySelector<HTMLElement>("[data-sliding-indicator]");
    expect(indicator()?.style.transition).toBe("none");

    (buttons[0] as HTMLElement).style.width = "96px";
    await resizeDelivered();
    expect(indicator()?.style.width).toBe("96px");
    expect(indicator()?.style.transition).toBe("none");

    setActive(1);
    await flush();
    expect(indicator()?.style.transform).toBe("translateX(80px)");
    expect(indicator()?.style.transition).toContain("transform 220ms ease-in-out");
    expect(indicator()?.style.transition).toContain("width 220ms ease-in-out");
  });

  it("does not re-measure after unmount once document.fonts.ready resolves late", async () => {
    const unloadFont = loadingFont();
    const { container, unmount } = render(() => (
      <SlidingIndicator active={0} style={row(80)}>
        <button type="button" style={box(80)}>
          One
        </button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    await flush();

    // containerRef itself isn't nulled on unmount, so measure() would still
    // call getBoundingClientRect on it without the disposed guard.
    const rectSpy = vi.spyOn(root, "getBoundingClientRect");
    unmount();
    const callsAtUnmount = rectSpy.mock.calls.length;
    await document.fonts.ready;
    await flush();

    expect(rectSpy.mock.calls.length).toBe(callsAtUnmount);
    unloadFont();
  });
});

describe("SlidingIndicator with an attribute selector", () => {
  function renderPressedGroup() {
    const { container } = render(() => (
      <SlidingIndicator activeSelector="[data-pressed]" style={row(160)}>
        <button type="button" data-pressed="" style={box(80)}>
          One
        </button>
        <button type="button" style={box(80)}>
          Two
        </button>
      </SlidingIndicator>
    ));
    const root = container.firstElementChild;
    const buttons = container.querySelectorAll("button");
    if (!(root instanceof HTMLElement)) throw new Error("no root");
    const indicator = () => container.querySelector<HTMLElement>("[data-sliding-indicator]");
    return { root, buttons, indicator };
  }

  it("settles instead of re-measuring on its own style writes", async () => {
    useFakeTime();
    const { root, indicator } = renderPressedGroup();
    const callbacks = countWakes(root);
    await frames();

    expect(indicator()?.style.width).toBe("80px");
    expect(callbacks()).toBeLessThan(10);
  });

  it("settles even when every measure lands half a pixel from the last", async () => {
    useFakeTime();
    const { root, buttons } = renderPressedGroup();
    const first = buttons[0] as HTMLElement;
    let callbacks = 0;
    // Each indicator write moves the item half a pixel, so the next measure differs.
    const jitter = new MutationObserver((records) => {
      if (records.every((r) => r.target === first) || ++callbacks > 500) return;
      first.style.width = first.style.width === "80px" ? "80.5px" : "80px";
    });
    jitter.observe(root, { subtree: true, childList: true, attributes: true });
    await frames();
    jitter.disconnect();

    expect(callbacks).toBeGreaterThan(0);
    expect(callbacks).toBeLessThan(10);
  });

  it("follows an id-based selector when the id moves", async () => {
    const { container } = render(() => (
      <SlidingIndicator activeSelector="#current" style={row(160)}>
        <button type="button" id="current" style={box(80)}>
          One
        </button>
        <button type="button" style={box(80)}>
          Two
        </button>
      </SlidingIndicator>
    ));
    const buttons = container.querySelectorAll("button");
    await flush();

    buttons[0]?.removeAttribute("id");
    buttons[1]?.setAttribute("id", "current");
    await flush();

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.transform).toBe(
      "translateX(80px)",
    );
  });

  it("re-measures when the marker moves, not when an item's style changes", async () => {
    const { buttons, indicator } = renderPressedGroup();
    await flush();
    const first = buttons[0] as HTMLElement;
    const second = buttons[1] as HTMLElement;

    first.style.setProperty("--i", "3");
    first.style.width = "96px";
    await flush();
    expect(indicator()?.style.width).toBe("80px");

    first.style.width = "80px";
    first.removeAttribute("data-pressed");
    second.setAttribute("data-pressed", "");
    await flush();
    expect(indicator()?.style.transform).toBe("translateX(80px)");
  });

  it("follows a class-based selector when the class moves", async () => {
    const { container } = render(() => (
      <SlidingIndicator activeSelector=".is-active" style={row(160)}>
        <button type="button" class="is-active" style={box(80)}>
          One
        </button>
        <button type="button" style={box(80)}>
          Two
        </button>
      </SlidingIndicator>
    ));
    const buttons = container.querySelectorAll("button");
    await flush();

    buttons[0]?.classList.remove("is-active");
    buttons[1]?.classList.add("is-active");
    await flush();

    expect(container.querySelector<HTMLElement>("[data-sliding-indicator]")?.style.transform).toBe(
      "translateX(80px)",
    );
  });

  it("writes nothing when a re-measure finds the same place", async () => {
    const { root, indicator } = renderPressedGroup();
    await resizeDelivered();
    const el = indicator();
    if (!el) throw new Error("no indicator");
    const writes: MutationRecord[] = [];
    const watch = new MutationObserver((records) => writes.push(...records));
    watch.observe(el, { attributes: true });

    root.style.width = "200px";
    await resizeDelivered();
    watch.disconnect();

    expect(writes).toEqual([]);
  });
});
