import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { StaleVeil } from "../../src/solid/index.js";

afterEach(async () => {
  cleanup();
  document.documentElement.classList.remove("reduce-motion");
  await commands.emulateMedia({ reducedMotion: "no-preference" });
});

const veil = () => document.querySelector<HTMLElement>('[data-slot="stale-veil"]');

const stateDuration = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duration-state"));

const settled = (el: Element) => Promise.all(el.getAnimations().map((a) => a.finished));

function Tile(props: { shown: boolean; onPress?: () => void }) {
  return (
    <div
      data-testid="tile"
      style={{ position: "relative", width: "240px", height: "160px", "border-radius": "24px" }}
    >
      <button type="button" style={{ width: "100%", height: "100%" }} onClick={props.onPress}>
        Hallway light
      </button>
      <StaleVeil shown={props.shown} />
    </div>
  );
}

describe("StaleVeil", () => {
  it("fades in once on the state duration, then runs no animation", async () => {
    const [shown, setShown] = createSignal(false);
    render(() => <Tile shown={shown()} />);
    expect(veil()).toBeNull();

    setShown(true);
    const el = veil() as HTMLElement;
    const running = el.getAnimations();
    expect(running).toHaveLength(1);
    const timing = running[0]?.effect?.getComputedTiming();
    expect(timing?.iterations).toBe(1);
    expect(timing?.duration).toBe(stateDuration());
    expect(getComputedStyle(el).opacity).toBe("0");

    await settled(el);
    expect(el.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(el).opacity).toBe("1");
  });

  it("a veil shown from mount fades once", async () => {
    render(() => <Tile shown />);
    const el = veil() as HTMLElement;
    const running = el.getAnimations();
    expect(running).toHaveLength(1);
    expect(running[0]?.effect?.getComputedTiming().iterations).toBe(1);

    await settled(el);
    expect(el.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(el).opacity).toBe("1");
  });

  it("reduced motion shows it without a fade", async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    render(() => <Tile shown />);
    const el = veil() as HTMLElement;
    expect(el.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(el).opacity).toBe("1");
  });

  it("the reduce-motion class shows it without a fade", () => {
    document.documentElement.classList.add("reduce-motion");
    render(() => <Tile shown />);
    const el = veil() as HTMLElement;
    expect(el.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(el).opacity).toBe("1");
  });

  it("the veil takes no press and no focus", async () => {
    let presses = 0;
    render(() => <Tile shown onPress={() => (presses += 1)} />);
    const el = veil() as HTMLElement;
    const button = document.querySelector("button") as HTMLButtonElement;
    const box = el.getBoundingClientRect();
    expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(button);

    await userEvent.click(button);
    expect(presses).toBe(1);
    expect(document.activeElement).toBe(button);

    await userEvent.tab();
    expect(el.contains(document.activeElement)).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.tabIndex).toBe(-1);
  });

  it("covers its parent's box and corners and moves nothing", () => {
    const [shown, setShown] = createSignal(false);
    render(() => <Tile shown={shown()} />);
    const tile = document.querySelector('[data-testid="tile"]') as HTMLElement;
    const before = tile.getBoundingClientRect().toJSON();
    setShown(true);
    const el = veil() as HTMLElement;
    expect(el.getBoundingClientRect().toJSON()).toEqual(tile.getBoundingClientRect().toJSON());
    expect(tile.getBoundingClientRect().toJSON()).toEqual(before);
    expect(getComputedStyle(el).borderRadius).toBe(getComputedStyle(tile).borderRadius);
    expect(getComputedStyle(el).position).toBe("absolute");
  });

  it("a shown veil is 40% of the background colour", () => {
    render(() => <Tile shown />);
    expect(getComputedStyle(veil() as HTMLElement).backgroundColor).toMatch(/\/ 0\.4\)$|, 0\.4\)$/);
  });

  it("hiding it removes the cover", () => {
    const [shown, setShown] = createSignal(true);
    render(() => <Tile shown={shown()} />);
    expect(veil()).not.toBeNull();
    setShown(false);
    expect(veil()).toBeNull();
    const button = document.querySelector("button") as HTMLButtonElement;
    const box = button.getBoundingClientRect();
    expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(button);
  });
});
