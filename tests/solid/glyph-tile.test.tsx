/* GlyphTileGroup: a glyph over a name, picked or cleared by tapping, a row on a phone and a wrap from `sm`. */
import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";
import { setViewportWidth } from "../viewport.js";
import { GlyphTile, GlyphTileGroup } from "../../src/solid/glyph-tile.js";

afterEach(cleanup);

const ROOMS = ["Garage", "Kitchen", "Bedroom", "Hallway", "Office", "Garden", "Attic", "Cellar"];

function Rooms(props: { initial?: string | null }) {
  const [value, setValue] = createSignal<string | null>(props.initial ?? null);
  return (
    <div style={{ width: "100%" }}>
      <GlyphTileGroup aria-label="Rooms" value={value()} onChange={setValue}>
        {ROOMS.map((name) => (
          <GlyphTile value={name} icon="mdi:home" label={name} badge="lucide:link" />
        ))}
      </GlyphTileGroup>
      <output data-testid="picked">{value() ?? "none"}</output>
    </div>
  );
}

const tile = (name: string) => screen.getByRole("button", { name });

describe("GlyphTileGroup", () => {
  it("picks a tile and clears it when tapped again", async () => {
    render(() => <Rooms />);
    await press(tile("Kitchen"));
    expect(screen.getByTestId("picked").textContent).toBe("Kitchen");
    expect(tile("Kitchen").getAttribute("aria-pressed")).toBe("true");
    await press(tile("Kitchen"));
    expect(screen.getByTestId("picked").textContent).toBe("none");
    expect(tile("Kitchen").getAttribute("aria-pressed")).toBe("false");
  });

  it("moves the pick to another tile in one tap", async () => {
    render(() => <Rooms initial="Garage" />);
    await press(tile("Office"));
    expect(screen.getByTestId("picked").textContent).toBe("Office");
    expect(tile("Garage").getAttribute("aria-pressed")).toBe("false");
  });

  it("picks from the keyboard", async () => {
    render(() => <Rooms />);
    tile("Hallway").focus();
    await userEvent.keyboard(" ");
    expect(screen.getByTestId("picked").textContent).toBe("Hallway");
  });

  it("marks only the picked tile with its badge", () => {
    render(() => <Rooms initial="Attic" />);
    const shown = (name: string) => {
      const badge = tile(name).querySelector('[data-slot="glyph-tile-badge"]');
      return getComputedStyle(badge as Element).display !== "none";
    };
    expect(shown("Attic")).toBe(true);
    expect(shown("Cellar")).toBe(false);
  });

  it("is one row that scrolls sideways on a phone", async () => {
    await setViewportWidth(390);
    onTestFinished(() => setViewportWidth(1024));
    render(() => <Rooms />);
    const group = screen.getByRole("group", { name: "Rooms" });
    expect(getComputedStyle(group).overflowX).toBe("auto");
    expect(getComputedStyle(group).flexWrap).toBe("nowrap");
    expect(group.scrollWidth).toBeGreaterThan(group.clientWidth);
  });

  it("wraps onto further rows from sm up", async () => {
    await setViewportWidth(700);
    onTestFinished(() => setViewportWidth(1024));
    render(() => (
      <div style={{ width: "300px" }}>
        <Rooms />
      </div>
    ));
    const group = screen.getByRole("group", { name: "Rooms" });
    expect(getComputedStyle(group).flexWrap).toBe("wrap");
    const tops = new Set(ROOMS.map((name) => Math.round(tile(name).getBoundingClientRect().top)));
    expect(tops.size).toBeGreaterThan(1);
    expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
  });
});
