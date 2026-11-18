import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { findTarget, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { type Color, ColorDisc, parseColor } from "../../src/solid";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

// Full saturation sits this far inside the rim, so the thumb stays on the disc.
const RIM_INSET = 17;

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

function helpers(scope: () => ParentNode[]) {
  const thumb = () => findTarget(scope(), { role: "slider", name: "Colour" });
  const disc = () => {
    const found = thumb().closest('[data-slot="color-disc"]');
    if (!found) throw new Error("no disc");
    return found;
  };
  const text = () => thumb().getAttribute("aria-valuetext");
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const picked = (by: { x: number; y: number }) => {
    const t = centre(thumb());
    const d = centre(disc());
    const x = t.x + by.x - d.x;
    const y = t.y + by.y - d.y;
    const hue = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
    const rim = disc().getBoundingClientRect().width / 2 - RIM_INSET;
    return `Hue ${hue}, saturation ${Math.round(Math.min(100, (Math.hypot(x, y) / rim) * 100))}%`;
  };
  return { thumb, disc, text, run, picked };
}

async function mount(id: string) {
  const { scope } = await mountScenario("ColorDisc", id);
  return helpers(scope);
}

const Spied = (props: { changes: Color[]; ends: Color[] }) => {
  const [colour, setColour] = createSignal(parseColor("hsb(0, 50%, 100%)"));
  return (
    <ColorDisc
      value={colour()}
      onChange={(c: Color) => {
        props.changes.push(c);
        setColour(c);
      }}
      onChangeEnd={(c: Color) => props.ends.push(c)}
    />
  );
};

const hueOf = (colours: Color[]) => colours.map((c) => c.getChannelValue("hue"));

describe("ColorDisc contract", () => {
  it("CD1 one thumb carries the hue as its value and both channels in its text", async () => {
    const { thumb, text } = await mount("default");
    const colour = thumb();
    expect(colour.getAttribute("data-slot")).toBe("color-disc-thumb");
    expect(colour.getAttribute("tabindex")).toBe("0");
    expect(
      ["aria-valuemin", "aria-valuemax", "aria-valuenow"].map((a) => colour.getAttribute(a)),
    ).toEqual(["0", "360", "0"]);
    expect(text()).toBe("Hue 0, saturation 50%");
  });

  it("CD2 Left and Right turn the hue 2 degrees, 10 with Shift, and each key reports", async () => {
    const changes: Color[] = [];
    const ends: Color[] = [];
    render(() => <Spied changes={changes} ends={ends} />);
    await settle();
    const { text, run } = helpers(scenarioScope);
    await run({ key: "Tab" }, { key: "ArrowRight" }, { key: "ArrowLeft" }, { key: "ArrowLeft" });
    expect(text()).toBe("Hue 358, saturation 50%");
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    await settle();
    expect(text()).toBe("Hue 8, saturation 50%");
    expect(hueOf(changes)).toEqual([2, 0, 358, 8]);
    expect(hueOf(ends)).toEqual([2, 0, 358, 8]);
  });

  it("CD3 Up and Down move the saturation 2, held between 0 and 100", async () => {
    const { text, run } = await mount("keyboard");
    await run({ key: "Tab" }, { key: "ArrowUp" });
    expect(text()).toBe("Hue 0, saturation 52%");
    await run({ key: "ArrowDown" }, { key: "ArrowDown" });
    expect(text()).toBe("Hue 0, saturation 48%");
    for (let i = 0; i < 30; i++) await run({ key: "ArrowUp" });
    expect(text()).toBe("Hue 0, saturation 100%");
  });

  it("CD4 a drag picks the hue by angle and the saturation by distance, and ends once", async () => {
    const changes: Color[] = [];
    const ends: Color[] = [];
    render(() => <Spied changes={changes} ends={ends} />);
    await settle();
    const { thumb, text, picked } = helpers(scenarioScope);
    const expected = picked({ x: 0, y: 60 });
    await input.drag(thumb(), { x: 0, y: 60 });
    await settle();
    expect(text()).toBe(expected);
    expect(ends).toHaveLength(1);
    expect(changes.length).toBeGreaterThan(1);
  });

  it("CD5 a disabled disc leaves the tab order and ignores a drag or a key", async () => {
    const { thumb, text, run } = await mount("disabled");
    expect(thumb().getAttribute("tabindex")).toBe("-1");
    await run({ drag: { role: "slider", name: "Colour", by: { x: 0, y: 60 } } });
    await run({ key: "Tab" }, { key: "ArrowRight" });
    expect(text()).toBe("Hue 0, saturation 50%");
  });

  it("CD6 a drag picks the colour inside a closed shadow root", async () => {
    const { text, run, picked } = await mount("in-shadow-root");
    const expected = picked({ x: 0, y: 60 });
    await run({ drag: { role: "slider", name: "Colour", by: { x: 0, y: 60 } } });
    expect(text(), "picked in the shadow root").toBe(expected);
  });
});
