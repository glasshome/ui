/* FaceToggleGroup: people and screens as faces to turn on and off; a locked face always counts. */
import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";
import { FaceToggle, FaceToggleGroup } from "../../src/solid/face-toggle.js";

afterEach(cleanup);

function Faces(props: { initial?: string[]; locked?: string[] }) {
  const [value, setValue] = createSignal<string[]>(props.initial ?? []);
  return (
    <>
      <FaceToggleGroup
        aria-label="Who sees it"
        value={value()}
        lockedIds={props.locked}
        onChange={setValue}
      >
        <FaceToggle id="m1" name="Maya" kind="person" />
        <FaceToggle id="m2" name="Leo" kind="person" />
        <FaceToggle id="d1" name="Kitchen tablet" kind="screen" />
      </FaceToggleGroup>
      <output data-testid="value">{JSON.stringify(value())}</output>
    </>
  );
}

const face = (name: string | RegExp) => screen.getByRole("button", { name });
const value = () => JSON.parse(screen.getByTestId("value").textContent ?? "[]") as string[];

describe("FaceToggleGroup", () => {
  it("turns a face on and off by tapping it", async () => {
    render(() => <Faces />);
    await press(face("Maya"));
    expect(value()).toEqual(["m1"]);
    expect(face("Maya").getAttribute("aria-pressed")).toBe("true");
    await press(face("Maya"));
    expect(value()).toEqual([]);
    expect(face("Maya").getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps several faces on at once", async () => {
    render(() => <Faces />);
    await press(face("Maya"));
    await press(face("Kitchen tablet"));
    expect(value().sort()).toEqual(["d1", "m1"]);
  });

  it("turns a face on from the keyboard", async () => {
    render(() => <Faces />);
    face("Leo").focus();
    await userEvent.keyboard(" ");
    expect(value()).toEqual(["m2"]);
  });

  it("shows a person by an initial and a screen by a device glyph", () => {
    render(() => <Faces />);
    expect(face("Maya").textContent).toContain("M");
    expect(
      face("Kitchen tablet").querySelector('[data-icon="lucide:monitor-smartphone"]'),
    ).not.toBeNull();
  });
});

describe("the badge on a face", () => {
  const shown = (el: Element) => getComputedStyle(el).display !== "none";

  it("is a check while a face is on and hidden while it is off", async () => {
    render(() => <Faces />);
    const check = () => face("Leo").querySelector('[data-slot="face-toggle-check"]');
    expect(check()).not.toBeNull();
    expect(shown(check() as Element)).toBe(false);
    await press(face("Leo"));
    expect(shown(check() as Element)).toBe(true);
  });

  it("is a lock, not a check, on a face that is always on", () => {
    render(() => <Faces locked={["m1"]} />);
    expect(face(/Maya/).querySelector('[data-slot="face-toggle-lock"]')).not.toBeNull();
    expect(face(/Maya/).querySelector('[data-slot="face-toggle-check"]')).toBeNull();
  });
});

describe("a locked face", () => {
  it("starts on, says it always sees it, and stays on when tapped", async () => {
    render(() => <Faces locked={["m1"]} />);
    const maya = face(/Maya/);
    expect(maya.getAttribute("aria-pressed")).toBe("true");
    expect(maya.textContent).toContain("always sees it");
    await press(maya, { force: true });
    expect(maya.getAttribute("aria-pressed")).toBe("true");
    expect(value()).toEqual([]);
  });

  it("stays focusable, unlike a disabled button", () => {
    render(() => <Faces locked={["m1"]} />);
    const maya = face(/Maya/);
    expect(maya.hasAttribute("disabled")).toBe(false);
    expect(maya.getAttribute("aria-disabled")).toBe("true");
    maya.focus();
    expect(document.activeElement).toBe(maya);
  });

  it("does not stop other faces from toggling", async () => {
    render(() => <Faces locked={["m1"]} />);
    await press(face("Leo"));
    expect(value()).toEqual(["m2"]);
    expect(face(/Maya/).getAttribute("aria-pressed")).toBe("true");
  });
});
