import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { findAll, runSteps, scenarioScope } from "../../dev/harness/steps";
import type { Step } from "../../dev/harness/types";
import { Slider } from "../../src/solid";
import { input } from "../harness/input";
import { focusedElement, mountScenario, settle } from "../harness/mount";

afterEach(cleanup);

function helpers(scope: () => ParentNode[]) {
  const thumbs = (name: string) =>
    findAll(scope(), { role: "slider", name }).filter(
      (el) => el.getAttribute("data-slot") === "slider-thumb",
    );
  const thumb = (name: string) => {
    const [only, ...rest] = thumbs(name);
    if (!only || rest.length > 0) throw new Error(`not one thumb named ${name}`);
    return only;
  };
  const now = (name: string) => thumbs(name).map((el) => Number(el.getAttribute("aria-valuenow")));
  const run = (...steps: Step[]) => runSteps(scope, steps, input, settle);
  const slot = (el: Element, name: string) => {
    const found = el.closest('[data-slot="slider"]')?.querySelector(`[data-slot="${name}"]`);
    if (!found) throw new Error(`no ${name}`);
    return found;
  };
  return { thumbs, thumb, now, run, slot };
}

async function mount(id: string) {
  const { scope } = await mountScenario("Slider", id);
  return helpers(scope);
}

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

async function pressAt(x: number, y: number) {
  await commands.mouse("move", x, y);
  await commands.mouse("down", x, y);
  await commands.mouse("up", x, y);
  await settle();
}

const shifted = (key: string) => userEvent.keyboard(`{Shift>}{${key}}{/Shift}`);

const Around = (props: { children: JSX.Element }) => (
  <div class="flex w-72 flex-col gap-4">
    <button type="button">Before</button>
    {props.children}
    <button type="button">After</button>
  </div>
);

describe("Slider contract", () => {
  it("SD1 a group of slider thumbs, each with its range, value and label", async () => {
    const { thumb, thumbs, slot } = await mount("default");
    const brightness = thumb("Brightness");
    const group = brightness.closest('[data-slot="slider"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("data-orientation")).toBe("horizontal");
    expect(brightness.getAttribute("tabindex")).toBe("0");
    expect(brightness.getAttribute("aria-valuemin")).toBe("0");
    expect(brightness.getAttribute("aria-valuemax")).toBe("100");
    expect(brightness.getAttribute("aria-valuenow")).toBe("40");
    expect(brightness.getAttribute("aria-orientation")).toBe("horizontal");
    expect(brightness.getAttribute("aria-valuetext")).toBe("40");
    expect(thumbs("Comfort range").map((el) => el.getAttribute("aria-valuetext"))).toEqual([
      "19",
      "23",
    ]);
    expect(slot(brightness, "slider-track")).toBeTruthy();
    expect(slot(brightness, "slider-fill")).toBeTruthy();
    render(() => <Slider defaultValue={[1500]} max={5000} aria-label="Power" />);
    await settle();
    const { thumb: own } = helpers(scenarioScope);
    expect(own("Power").getAttribute("aria-valuetext")).toBe(
      new Intl.NumberFormat(navigator.language).format(1500),
    );
  });

  it("SD2 arrows step the value, Shift with an arrow moves a page", async () => {
    const { now, run } = await mount("keyboard");
    await run({ press: { role: "slider", name: "Brightness" } });
    await run({ key: "ArrowRight" }, { key: "ArrowUp" });
    expect(now("Brightness")).toEqual([42]);
    await run({ key: "ArrowLeft" }, { key: "ArrowDown" }, { key: "ArrowLeft" });
    expect(now("Brightness")).toEqual([39]);
    await shifted("ArrowRight");
    await settle();
    expect(now("Brightness")).toEqual([49]);
    await shifted("ArrowDown");
    await settle();
    expect(now("Brightness")).toEqual([39]);
  });

  it("SD3 PageUp and PageDown move a page, Home and End go to the ends", async () => {
    const { now, run } = await mount("keyboard");
    await run({ key: "Tab" });
    await run({ key: "PageUp" });
    expect(now("Brightness")).toEqual([50]);
    await run({ key: "PageDown" }, { key: "PageDown" });
    expect(now("Brightness")).toEqual([30]);
    await run({ key: "End" });
    expect(now("Brightness")).toEqual([100]);
    await run({ key: "Home" });
    expect(now("Brightness")).toEqual([0]);
  });

  it("SD4 a dragged thumb follows the pointer, keeps focus, and ends once", async () => {
    const ends: number[][] = [];
    render(() => (
      <div class="w-72">
        <Slider
          defaultValue={[50]}
          onChangeEnd={(v: number[]) => ends.push(v)}
          aria-label="Brightness"
        />
      </div>
    ));
    await settle();
    const { thumb, now, slot } = helpers(scenarioScope);
    const width = slot(thumb("Brightness"), "slider-track").getBoundingClientRect().width;
    await input.drag(thumb("Brightness"), { x: 60, y: 0 });
    await settle();
    const expected = Math.round(50 + (60 / width) * 100);
    expect(now("Brightness")).toEqual([expected]);
    expect(focusedElement()).toBe(thumb("Brightness"));
    expect(ends).toEqual([[expected]]);
  });

  it("SD5 a press on the track brings the closest thumb there and focuses it", async () => {
    const { thumb, now, run } = await mount("track-press");
    await run({ press: { role: "group" } });
    expect(now("Brightness")).toEqual([50]);
    expect(focusedElement()).toBe(thumb("Brightness"));
  });

  it("SD6 two thumbs never cross, keep their distance, and the fill spans between them", async () => {
    render(() => (
      <div class="w-72">
        <Slider defaultValue={[20, 30]} minStepsBetweenThumbs={5} aria-label="Range" />
      </div>
    ));
    await settle();
    const { thumbs, now, run, slot } = helpers(scenarioScope);
    const [low, high] = thumbs("Range");
    if (!low || !high) throw new Error("two thumbs");
    const fill = slot(low, "slider-fill").getBoundingClientRect();
    const track = slot(low, "slider-track").getBoundingClientRect();
    expect(fill.left).toBeLessThan(centre(low).x);
    expect(fill.right).toBeGreaterThan(centre(high).x);
    expect(fill.left).toBeGreaterThan(track.left);
    await input.press(low);
    await settle();
    await run({ key: "End" });
    expect(now("Range")).toEqual([25, 30]);
    await run({ key: "ArrowRight" });
    expect(now("Range")).toEqual([25, 30]);
    await input.drag(low, { x: 200, y: 0 });
    await settle();
    expect(now("Range")).toEqual([25, 30]);
    const right = track.right - 1;
    await pressAt(right, centre(high).y);
    expect(now("Range")).toEqual([25, 100]);
    expect(focusedElement()).toBe(high);
  });

  it("SD6b a press where thumbs overlap takes the thumb nearest the pointer", async () => {
    render(() => (
      <div class="w-72">
        <Slider defaultValue={[25, 30]} minStepsBetweenThumbs={5} aria-label="Range" />
      </div>
    ));
    await settle();
    const { thumbs, now, slot } = helpers(scenarioScope);
    const [low, high] = thumbs("Range");
    if (!low || !high) throw new Error("two thumbs");
    const track = slot(low, "slider-track").getBoundingClientRect();
    const y = centre(low).y;
    const at = (value: number) => track.left + (track.width * value) / 100;
    expect(at(30) - at(25)).toBeLessThan(low.getBoundingClientRect().width / 2);
    await commands.mouse("move", at(25), y);
    await commands.mouse("down", at(25), y);
    await commands.mouse("move", at(25) + 100, y);
    await commands.mouse("up", at(25) + 100, y);
    await settle();
    expect(now("Range")).toEqual([25, 30]);
    await commands.mouse("move", at(30), y);
    await commands.mouse("down", at(30), y);
    await commands.mouse("move", at(30) + 40, y);
    await commands.mouse("up", at(30) + 40, y);
    await settle();
    expect(now("Range")[0]).toBe(25);
    expect(now("Range")[1]).toBeGreaterThan(30);
  });

  it("SD7 key changes report each step, and end once when focus leaves", async () => {
    const changes: number[][] = [];
    const ends: number[][] = [];
    render(() => (
      <Around>
        <Slider
          defaultValue={[50]}
          onChange={(v: number[]) => changes.push(v)}
          onChangeEnd={(v: number[]) => ends.push(v)}
          aria-label="Brightness"
        />
      </Around>
    ));
    await settle();
    const { run } = helpers(scenarioScope);
    await run({ press: { role: "button", name: "Before" } }, { key: "Tab" });
    await run({ key: "ArrowRight" }, { key: "ArrowRight" });
    expect(changes).toEqual([[51], [52]]);
    expect(ends).toEqual([]);
    await run({ key: "Tab" });
    expect(ends).toEqual([[52]]);
  });

  it("SD8 a disabled slider says so, leaves the tab order, and ignores a press or a key", async () => {
    const { thumb, now, run } = await mount("disabled");
    const volume = thumb("Brightness");
    expect(volume.closest('[data-slot="slider"]')?.hasAttribute("data-disabled")).toBe(true);
    expect(volume.hasAttribute("data-disabled")).toBe(true);
    expect(volume.hasAttribute("tabindex")).toBe(false);
    await run({ press: { role: "group" } });
    expect(now("Brightness")).toEqual([30]);
    await run({ key: "Tab" }, { key: "ArrowRight" });
    expect(focusedElement()).not.toBe(volume);
    expect(now("Brightness")).toEqual([30]);
  });

  it("SD9 controlled, a change reports the next values and shows only what value says", async () => {
    const changes: number[][] = [];
    const [value, setValue] = createSignal([50]);
    render(() => (
      <Around>
        <Slider
          value={value()}
          onChange={(v: number[]) => changes.push(v)}
          aria-label="Brightness"
        />
      </Around>
    ));
    await settle();
    const { now, run } = helpers(scenarioScope);
    await run({ press: { role: "button", name: "Before" } }, { key: "Tab" }, { key: "ArrowRight" });
    expect(changes).toEqual([[51]]);
    expect(now("Brightness")).toEqual([50]);
    setValue([70]);
    await settle();
    expect(now("Brightness")).toEqual([70]);
  });

  it("SD10 a marker sits at its value along the track", async () => {
    const { thumbs, slot } = await mount("default");
    const [low] = thumbs("Comfort range");
    if (!low) throw new Error("no comfort thumb");
    const group = low.closest('[data-slot="slider"]');
    expect(group?.querySelectorAll('[data-slot="slider-marker"]').length).toBe(1);
    const track = slot(low, "slider-track").getBoundingClientRect();
    const marker = centre(slot(low, "slider-marker"));
    expect(Math.abs(marker.x - (track.left + track.width * 0.55))).toBeLessThan(1);
  });

  it("SD11 a drag and a key move the thumb inside a closed shadow root", async () => {
    const { thumb, now, run, slot } = await mount("in-shadow-root");
    const width = slot(thumb("Brightness"), "slider-track").getBoundingClientRect().width;
    await run({ drag: { role: "slider", name: "Brightness", by: { x: 60, y: 0 } } });
    const dragged = Math.round(50 + (60 / width) * 100);
    expect(now("Brightness"), "dragged in the shadow root").toEqual([dragged]);
    await run({ key: "ArrowRight" });
    expect(now("Brightness"), "stepped in the shadow root").toEqual([dragged + 1]);
  });
});
