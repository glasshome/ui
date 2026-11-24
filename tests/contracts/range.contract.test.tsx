import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { findTarget, runSteps } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

async function mount(id: string) {
  const { scope } = await mountScenario("range", id);
  const thumb = (name: string) => findTarget(scope(), { role: "slider", name });
  const now = (name: string) => Number(thumb(name).getAttribute("aria-valuenow"));
  const track = () => {
    const found = thumb("Low").parentElement;
    if (!found) throw new Error("no track");
    return found;
  };
  const count = (name: "changes" | "ends") => Number(track().getAttribute(`data-${name}`));
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  return { thumb, now, track, count, run };
}

describe("range contract", () => {
  it("RA1 arrows step, Shift and PageUp or PageDown move a page, Home and End go to the bounds", async () => {
    const { now, run } = await mount("keyboard");
    await run({ key: "Tab" }, { key: "ArrowRight" });
    expect(now("Low")).toBe(25);
    await run({ key: "PageUp" });
    expect(now("Low")).toBe(35);
    await run({ key: "PageDown" }, { key: "ArrowDown" });
    expect(now("Low")).toBe(20);
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    await settle();
    expect(now("Low")).toBe(30);
    await run({ key: "Home" });
    expect(now("Low")).toBe(0);
    await run({ key: "End" });
    expect(now("Low")).toBe(50);
  });

  it("RA2 a thumb pushed at its neighbour stops short and never crosses", async () => {
    const { now, run } = await mount("keyboard");
    await run({ key: "Tab" }, { key: "End" }, { key: "ArrowRight" }, { key: "PageUp" });
    expect([now("Low"), now("High")]).toEqual([50, 60]);
    await run({ key: "Tab" }, { key: "Home" });
    expect([now("Low"), now("High")]).toEqual([50, 60]);
  });

  it("RA3 each key change reports, and the change ends once when focus leaves", async () => {
    const { count, run } = await mount("keyboard");
    await run({ key: "Tab" }, { key: "ArrowRight" }, { key: "ArrowRight" });
    expect(count("changes")).toBe(2);
    expect(count("ends")).toBe(0);
    await run({ key: "Tab" });
    expect(count("ends")).toBe(1);
  });

  it("RA4 the closest thumb follows a drag, which ends once at release", async () => {
    const { now, track, count, run } = await mount("drag");
    const width = track().getBoundingClientRect().width;
    await run({ drag: { role: "slider", name: "High", by: { x: 40, y: 0 }, stepMs: 16 } });
    expect(now("High")).toBe(Math.round((60 + (40 / width) * 100) / 5) * 5);
    expect(now("Low")).toBe(20);
    expect(count("ends")).toBe(1);
  });

  it("RA5 a press with another button moves nothing and ends nothing", async () => {
    const { now, track, count } = await mount("drag");
    const box = track().getBoundingClientRect();
    const [x, y] = [box.right - 4, box.y + box.height / 2];
    await commands.mouse("move", x, y);
    await commands.mouse("down", x, y, "right");
    await commands.mouse("move", x - 20, y);
    await commands.mouse("up", x - 20, y, "right");
    await settle();
    expect([now("Low"), now("High")]).toEqual([20, 60]);
    expect(count("ends")).toBe(0);
  });
});
