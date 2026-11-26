import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, flush, onCleanup, Show } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPresence,
  type MotionEvent,
  PRESENCE_TIMEOUT_MS,
  type Presence,
} from "../../src/lib/behavior/presence";
import { useFakeTime } from "../../src/testing";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const EXIT_MS = 300;

function setup(options: {
  present?: boolean;
  keep?: boolean;
  exitMs?: number;
  accept?: (e: MotionEvent) => boolean;
  style?: string;
}) {
  useFakeTime();
  const [present, setPresent] = createSignal(options.present ?? false);
  const [keep, setKeep] = createSignal(options.keep ?? false);
  const [element, setElement] = createSignal<HTMLElement>();
  const held: { presence?: Presence } = {};
  const Panel = () => {
    onCleanup(() => setElement(undefined));
    return (
      <div ref={setElement} data-testid="panel" style={options.style}>
        <span data-testid="child" />
      </div>
    );
  };
  const view = render(() => {
    const presence = createPresence({
      present,
      element,
      exitMs: options.exitMs ?? EXIT_MS,
      accept: options.accept,
      keep,
    });
    held.presence = presence;
    return (
      <Show when={presence.mounted()}>
        <Panel />
      </Show>
    );
  });
  const presence = () => {
    if (!held.presence) throw new Error("presence not created");
    return held.presence;
  };
  const panel = () => view.queryByTestId("panel");
  const emit = (target: Element, type: string, init: AnimationEventInit = {}) => {
    target.dispatchEvent(new AnimationEvent(type, { bubbles: true, ...init }));
    flush();
  };
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    flush();
  };
  const settled =
    <T,>(write: (value: T) => unknown) =>
    (value: T) => {
      write(value);
      flush();
    };
  return {
    present,
    setPresent: settled(setPresent),
    keep,
    setKeep: settled(setKeep),
    view,
    presence,
    panel,
    emit,
    advance,
  };
}

describe("presence", () => {
  it("PR1 present turns true: mounted at once in opening, open when the enter motion ends", () => {
    const t = setup({});
    expect(t.panel()).toBeNull();
    t.setPresent(true);
    expect(t.panel()).not.toBeNull();
    expect(t.presence().phase()).toBe("opening");
    t.emit(t.panel() as HTMLElement, "animationend");
    expect(t.presence().phase()).toBe("open");
  });

  it("PR2 present turns false: stays mounted until the exit motion ends, then unmounts", async () => {
    const t = setup({ present: true });
    t.emit(t.panel() as HTMLElement, "animationend");
    t.setPresent(false);
    expect(t.presence().phase()).toBe("closing");
    await t.advance(EXIT_MS / 2);
    expect(t.panel()).not.toBeNull();
    t.emit(t.panel() as HTMLElement, "animationend");
    expect(t.panel()).toBeNull();
    expect(t.presence().phase()).toBe("closed");
  });

  it("PR3 no motion runs: unmounts exitMs after the close, never later than the timeout", async () => {
    const t = setup({ present: true });
    t.emit(t.panel() as HTMLElement, "animationend");
    t.setPresent(false);
    await t.advance(EXIT_MS - 1);
    expect(t.panel()).not.toBeNull();
    await t.advance(1);
    expect(t.panel()).toBeNull();

    const slow = setup({ present: true, exitMs: PRESENCE_TIMEOUT_MS * 5 });
    slow.emit(slow.panel() as HTMLElement, "animationend");
    slow.setPresent(false);
    await slow.advance(PRESENCE_TIMEOUT_MS - 1);
    expect(slow.panel()).not.toBeNull();
    await slow.advance(1);
    expect(slow.panel()).toBeNull();
  });

  it("PR4 a child's animation ends first: the element stays until its own motion ends", async () => {
    const t = setup({ present: true });
    t.emit(t.panel() as HTMLElement, "animationend");
    t.setPresent(false);
    t.emit(t.view.getByTestId("child"), "animationend");
    t.emit(t.view.getByTestId("child"), "animationcancel");
    expect(t.panel()).not.toBeNull();
    t.emit(t.panel() as HTMLElement, "animationcancel");
    expect(t.panel()).toBeNull();
  });

  it("PR5 an exit motion starts and never ends: unmounts at min(exitMs, timeout)", async () => {
    const sheet = document.head.appendChild(document.createElement("style"));
    sheet.textContent = "@keyframes presence-never { to { opacity: 0.5 } }";
    const t = setup({ present: true, style: "animation: presence-never 100s linear both" });
    t.emit(t.panel() as HTMLElement, "animationend");
    t.setPresent(false);
    await t.advance(EXIT_MS - 1);
    expect(t.panel()).not.toBeNull();
    await t.advance(1);
    expect(t.panel()).toBeNull();
    sheet.remove();
  });

  it("PR6 present turns true again while closing: back to open without unmounting", async () => {
    const t = setup({ present: true });
    t.emit(t.panel() as HTMLElement, "animationend");
    const node = t.panel();
    t.setPresent(false);
    await t.advance(EXIT_MS / 2);
    t.setPresent(true);
    expect(t.presence().phase()).toBe("open");
    await t.advance(EXIT_MS * 2);
    expect(t.panel()).toBe(node);
    expect(t.presence().phase()).toBe("open");
  });

  it("PR7 the owner unmounts mid-exit: no listener or timer remains", async () => {
    const accept = vi.fn(() => true);
    const t = setup({ present: true, accept });
    const node = t.panel() as HTMLElement;
    t.emit(node, "animationend");
    accept.mockClear();
    t.setPresent(false);
    t.view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    t.emit(node, "animationend");
    expect(accept).not.toHaveBeenCalled();
  });

  it("PR8 the exit carries a delay within exitMs: the element stays until the delayed motion ends", async () => {
    const sheet = document.head.appendChild(document.createElement("style"));
    sheet.textContent = "@keyframes presence-delayed { to { opacity: 0.5 } }";
    const t = setup({
      present: true,
      style: "animation: presence-delayed 100ms linear 150ms both",
    });
    t.emit(t.panel() as HTMLElement, "animationend");
    t.setPresent(false);
    await t.advance(120);
    expect(t.panel()).not.toBeNull();
    await t.advance(100);
    expect(t.panel()).not.toBeNull();
    t.emit(t.panel() as HTMLElement, "animationend");
    expect(t.panel()).toBeNull();
    sheet.remove();
  });

  it("PR9 an infinite animation and a pseudo-element animation do not end the exit early", () => {
    const t = setup({ present: true });
    t.emit(t.panel() as HTMLElement, "animationend");
    t.setPresent(false);
    t.emit(t.panel() as HTMLElement, "animationiteration");
    t.emit(t.panel() as HTMLElement, "animationend", { pseudoElement: "::after" });
    t.emit(t.panel() as HTMLElement, "animationcancel", { pseudoElement: "::before" });
    expect(t.panel()).not.toBeNull();
    t.emit(t.panel() as HTMLElement, "animationend");
    expect(t.panel()).toBeNull();
  });

  it("PR9 accept filters the events that count", () => {
    const t = setup({
      present: true,
      accept: (e) => (e as AnimationEvent).animationName === "out",
    });
    t.emit(t.panel() as HTMLElement, "animationend", { animationName: "in" });
    t.setPresent(false);
    t.emit(t.panel() as HTMLElement, "animationend", { animationName: "other" });
    expect(t.panel()).not.toBeNull();
    t.emit(t.panel() as HTMLElement, "animationend", { animationName: "out" });
    expect(t.panel()).toBeNull();
  });
});

describe("presence keep", () => {
  it("PK1 keep true, present never true: mounted, dormant, phase closed", () => {
    const t = setup({ keep: true });
    expect(t.panel()).not.toBeNull();
    expect(t.presence().dormant()).toBe(true);
    expect(t.presence().phase()).toBe("closed");
  });

  it("PK2 keep true, present true then false: after the exit motion, mounted and dormant", async () => {
    const t = setup({ keep: true, present: true });
    t.emit(t.panel() as HTMLElement, "animationend");
    expect(t.presence().dormant()).toBe(false);
    t.setPresent(false);
    expect(t.presence().dormant()).toBe(false);
    t.emit(t.panel() as HTMLElement, "animationend");
    expect(t.panel()).not.toBeNull();
    expect(t.presence().dormant()).toBe(true);
  });

  it("PK3 keep turns false while dormant: unmounts at once", () => {
    const t = setup({ keep: true });
    t.setKeep(false);
    expect(t.panel()).toBeNull();
    expect(t.presence().mounted()).toBe(false);
  });

  it("PK4 keep turns false while open: nothing until the close, then unmounts after the exit", async () => {
    const t = setup({ keep: true, present: true });
    t.emit(t.panel() as HTMLElement, "animationend");
    t.setKeep(false);
    expect(t.panel()).not.toBeNull();
    t.setPresent(false);
    expect(t.panel()).not.toBeNull();
    await t.advance(EXIT_MS);
    expect(t.panel()).toBeNull();
  });

  it("PK5 present true again while dormant: the same nodes, phase opening then open", () => {
    const t = setup({ keep: true });
    const node = t.panel();
    expect(node).not.toBeNull();
    t.setPresent(true);
    expect(t.panel()).toBe(node);
    expect(t.presence().phase()).toBe("opening");
    expect(t.presence().dormant()).toBe(false);
    t.emit(t.panel() as HTMLElement, "animationend");
    expect(t.presence().phase()).toBe("open");
    expect(t.panel()).toBe(node);
  });
});
