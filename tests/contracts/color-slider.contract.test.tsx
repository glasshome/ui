import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { findAll, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { type Color, ColorSlider, parseColor } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

function helpers(scope: () => ParentNode[]) {
  const thumb = (name: string) => {
    const [only, ...rest] = findAll(scope(), { role: "slider", name }).filter(
      (el) => el.getAttribute("data-slot") === "color-slider-thumb",
    );
    if (!only || rest.length > 0) throw new Error(`not one thumb named ${name}`);
    return only;
  };
  const now = (name: string) => Number(thumb(name).getAttribute("aria-valuenow"));
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const trackWidth = (name: string) =>
    thumb(name)
      .closest('[data-slot="color-slider"]')
      ?.querySelector('[data-slot="color-slider-track"]')
      ?.getBoundingClientRect().width ?? 0;
  return { thumb, now, run, trackWidth };
}

async function mount(id: string) {
  const { scope } = await mountScenario("ColorSlider", id);
  return helpers(scope);
}

const range = (el: Element) =>
  ["aria-valuemin", "aria-valuemax", "aria-valuenow"].map((a) => el.getAttribute(a));

describe("ColorSlider contract", () => {
  it("CS1 a group holds one thumb, named by its label or channel, with the channel's range", async () => {
    const { thumb } = await mount("default");
    const hue = thumb("hue");
    expect(hue.closest('[data-slot="color-slider"]')?.getAttribute("role")).toBe("group");
    expect(hue.getAttribute("tabindex")).toBe("0");
    expect(range(hue)).toEqual(["0", "360", "200"]);
    expect(range(thumb("Saturation"))).toEqual(["0", "100", "100"]);
    expect(range(thumb("alpha"))).toEqual(["0", "1", "0.5"]);
  });

  it("CS2 the value text names the hue, the colour, or the alpha alone", async () => {
    const { thumb } = await mount("default");
    expect(thumb("hue").getAttribute("aria-valuetext")).toBe("200°, cyan blue");
    expect(thumb("Saturation").getAttribute("aria-valuetext")).toBe(
      "100%, light vibrant cyan blue",
    );
    expect(thumb("alpha").getAttribute("aria-valuetext")).toBe("50%");
  });

  it("CS3 keys move the channel a step, a page, or to its ends", async () => {
    const { now, run } = await mount("keyboard");
    await run({ key: "Tab" }, { key: "ArrowRight" });
    expect(now("Hue")).toBe(201);
    await run({ key: "PageUp" });
    expect(now("Hue")).toBe(237);
    await run({ key: "PageDown" }, { key: "ArrowLeft" });
    expect(now("Hue")).toBe(200);
    await run({ key: "Home" });
    expect(now("Hue")).toBe(0);
    await run({ key: "End" });
    expect(now("Hue")).toBe(360);
  });

  it("CS4 a dragged thumb moves the channel, reports the colour, and ends once", async () => {
    const changes: Color[] = [];
    const ends: Color[] = [];
    render(() => (
      <div class="w-72">
        <ColorSlider
          channel="hue"
          defaultValue={parseColor("hsl(180, 100%, 50%)")}
          onChange={(c: Color) => changes.push(c)}
          onChangeEnd={(c: Color) => ends.push(c)}
          aria-label="Hue"
        />
      </div>
    ));
    await settle();
    const { thumb, now, trackWidth } = helpers(scenarioScope);
    const expected = Math.round(180 + (60 / trackWidth("Hue")) * 360);
    await input.drag(thumb("Hue"), { x: 60, y: 0 });
    await settle();
    expect(now("Hue")).toBe(expected);
    expect(changes.at(-1)?.getChannelValue("hue")).toBe(expected);
    expect(changes.at(-1)?.getChannelValue("saturation")).toBe(100);
    expect(ends.map((c) => c.getChannelValue("hue"))).toEqual([expected]);
    expect(focusedElement()).toBe(thumb("Hue"));
  });

  it("CS5 a disabled colour slider says so and ignores a press or a key", async () => {
    const { thumb, now, run } = await mount("disabled");
    const hue = thumb("Hue");
    expect(hue.closest('[data-slot="color-slider"]')?.hasAttribute("data-disabled")).toBe(true);
    expect(hue.hasAttribute("data-disabled")).toBe(true);
    expect(hue.hasAttribute("tabindex")).toBe(false);
    await run({ press: { role: "group" } }, { key: "Tab" }, { key: "ArrowRight" });
    expect(now("Hue")).toBe(180);
  });

  it("CS6 a drag and a key move the hue inside a closed shadow root", async () => {
    const { now, run, trackWidth } = await mount("in-shadow-root");
    const dragged = Math.round(180 + (60 / trackWidth("Hue")) * 360);
    await run({ drag: { role: "slider", name: "Hue", by: { x: 60, y: 0 } } });
    expect(now("Hue"), "dragged in the shadow root").toBe(dragged);
    await run({ key: "ArrowRight" });
    expect(now("Hue"), "stepped in the shadow root").toBe(dragged + 1);
  });
});
