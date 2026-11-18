import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { findAll, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { type Color, ColorWheel, parseColor } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const angleOf = (x: number, y: number) =>
  Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360) % 360;

function helpers(scope: () => ParentNode[]) {
  const thumb = (name = "Hue") => {
    const [only, ...rest] = findAll(scope(), { role: "slider", name }).filter(
      (el) => el.getAttribute("data-slot") === "color-wheel-thumb",
    );
    if (!only || rest.length > 0) throw new Error(`not one thumb named ${name}`);
    return only;
  };
  const wheel = () => {
    const found = thumb().closest('[data-slot="color-wheel"]');
    if (!found) throw new Error("no wheel");
    return found;
  };
  const now = () => Number(thumb().getAttribute("aria-valuenow"));
  const offset = () => {
    const t = centre(thumb());
    const w = centre(wheel());
    return { x: t.x - w.x, y: t.y - w.y };
  };
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  return { thumb, wheel, now, offset, run };
}

async function mount(id: string) {
  const { scope } = await mountScenario("ColorWheel", id);
  return helpers(scope);
}

const dragged = (start: { x: number; y: number }) => angleOf(start.x - 40, start.y + 80);

describe("ColorWheel contract", () => {
  it("CW1 a group holds one hue thumb with its range, value and named hue", async () => {
    const { thumb, wheel } = await mount("default");
    expect(wheel().getAttribute("role")).toBe("group");
    const hue = thumb();
    expect(hue.getAttribute("tabindex")).toBe("0");
    expect(
      ["aria-valuemin", "aria-valuemax", "aria-valuenow"].map((a) => hue.getAttribute(a)),
    ).toEqual(["0", "360", "200"]);
    expect(hue.getAttribute("aria-valuetext")).toBe("200°, cyan blue");
    render(() => <ColorWheel aria-label="Accent" />);
    await settle();
    expect(helpers(scenarioScope).thumb("Accent").getAttribute("aria-valuenow")).toBe("0");
  });

  it("CW2 the thumb sits on the ring at the hue's angle, clockwise from three o'clock", async () => {
    const { offset, wheel } = await mount("default");
    const { x, y } = offset();
    expect(angleOf(x, y)).toBe(200);
    const radius = wheel().getBoundingClientRect().width / 2;
    expect(Math.hypot(x, y)).toBeGreaterThan(radius * 0.7);
    expect(Math.hypot(x, y)).toBeLessThan(radius);
  });

  it("CW3 arrows turn a degree, pages turn 15, and the hue wraps", async () => {
    const { now, run } = await mount("keyboard");
    await run({ key: "Tab" }, { key: "ArrowRight" }, { key: "ArrowUp" });
    expect(now()).toBe(202);
    await run({ key: "ArrowLeft" }, { key: "ArrowDown" });
    expect(now()).toBe(200);
    await run({ key: "PageUp" });
    expect(now()).toBe(210);
    await run({ key: "PageDown" });
    expect(now()).toBe(195);
    await run({ key: "Home" }, { key: "ArrowLeft" });
    expect(now()).toBe(359);
    await run({ key: "ArrowRight" });
    expect(now()).toBe(0);
  });

  it("CW4 Home and End both go to hue 0", async () => {
    const { now, run } = await mount("keyboard");
    await run({ key: "Tab" }, { key: "End" });
    expect(now()).toBe(0);
    await run({ key: "ArrowRight" }, { key: "Home" });
    expect(now()).toBe(0);
  });

  it("CW5 a dragged thumb follows the pointer's angle, keeps focus, and ends once", async () => {
    const ends: Color[] = [];
    render(() => (
      <ColorWheel
        defaultValue={parseColor("hsl(0, 100%, 50%)")}
        onChangeEnd={(c: Color) => ends.push(c)}
      />
    ));
    await settle();
    const { thumb, now, offset } = helpers(scenarioScope);
    const expected = dragged(offset());
    await input.drag(thumb(), { x: -40, y: 80 });
    await settle();
    expect(now()).toBe(expected);
    expect(focusedElement()).toBe(thumb());
    expect(ends.map((c) => c.getChannelValue("hue"))).toEqual([expected]);
  });

  it("CW6 a press on the ring jumps the hue to that angle", async () => {
    render(() => <ColorWheel defaultValue={parseColor("hsl(0, 100%, 50%)")} />);
    await settle();
    const { now, wheel, offset } = helpers(scenarioScope);
    const c = centre(wheel());
    const r = Math.hypot(offset().x, offset().y);
    await commands.mouse("move", c.x, c.y + r);
    await commands.mouse("down", c.x, c.y + r);
    await commands.mouse("up", c.x, c.y + r);
    await settle();
    expect(now()).toBe(90);
  });

  it("CW7 a disabled wheel says so and ignores a drag or a key", async () => {
    const { thumb, wheel, now, run } = await mount("disabled");
    expect(wheel().hasAttribute("data-disabled")).toBe(true);
    expect(thumb().hasAttribute("data-disabled")).toBe(true);
    expect(thumb().hasAttribute("tabindex")).toBe(false);
    await run({ drag: { role: "slider", name: "Hue", by: { x: -40, y: 80 } } });
    await run({ key: "Tab" }, { key: "ArrowRight" });
    expect(now()).toBe(0);
  });

  it("CW8 a drag and a key turn the hue inside a closed shadow root", async () => {
    const { now, run, offset } = await mount("in-shadow-root");
    const expected = dragged(offset());
    await run({ drag: { role: "slider", name: "Hue", by: { x: -40, y: 80 } } });
    expect(now(), "dragged in the shadow root").toBe(expected);
    await run({ key: "ArrowRight" });
    expect(now(), "stepped in the shadow root").toBe(expected + 1);
  });
});
