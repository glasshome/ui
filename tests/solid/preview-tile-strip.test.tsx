/* PreviewTileGroup in `scroll` mode: a sideways row on a phone, a grid from `sm` up,
 * with an empty tile and an action that sit among the pictures. */
import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";
import { setViewportWidth } from "../viewport.js";
import { PreviewTile, PreviewTileAction, PreviewTileGroup } from "../../src/solid/preview-tile.js";

afterEach(cleanup);

const NAMES = ["Empty", "Living room", "Kitchen", "Bedroom", "Hallway", "Garage"];

function Strip(props: { onMore?: () => void; initial?: string }) {
  const [value, setValue] = createSignal<string | null>(props.initial ?? NAMES[0] ?? null);
  return (
    <div style={{ width: "100%" }}>
      <PreviewTileGroup scroll columns={3} aria-label="Layouts" value={value()} onChange={setValue}>
        {NAMES.map((name, index) => (
          <PreviewTile value={name} label={name} dashed={index === 0}>
            <div />
          </PreviewTile>
        ))}
        <PreviewTileAction label="More" icon="lucide:layout-template" onClick={props.onMore} />
      </PreviewTileGroup>
      <output data-testid="picked">{value()}</output>
    </div>
  );
}

const strip = () => screen.getByRole("radiogroup", { name: "Layouts" });

describe("PreviewTileGroup scroll", () => {
  it("is one row that scrolls sideways on a phone", async () => {
    await setViewportWidth(390);
    onTestFinished(() => setViewportWidth(1024));
    render(() => <Strip />);
    const style = getComputedStyle(strip());
    expect(style.display).toBe("flex");
    expect(style.overflowX).toBe("auto");
    expect(strip().scrollWidth).toBeGreaterThan(strip().clientWidth);
  });

  it("is a grid of its columns from sm up", async () => {
    await setViewportWidth(800);
    onTestFinished(() => setViewportWidth(1024));
    render(() => <Strip />);
    const style = getComputedStyle(strip());
    expect(style.display).toBe("grid");
    expect(style.gridTemplateColumns.split(" ")).toHaveLength(3);
    expect(strip().scrollWidth).toBeLessThanOrEqual(strip().clientWidth);
  });

  it("brings a tile picked from outside into view", async () => {
    await setViewportWidth(390);
    onTestFinished(() => setViewportWidth(1024));
    const [value, setValue] = createSignal<string | null>("Empty");
    render(() => (
      <PreviewTileGroup scroll aria-label="Layouts" value={value()} onChange={setValue}>
        {NAMES.map((name) => (
          <PreviewTile value={name} label={name}>
            <div />
          </PreviewTile>
        ))}
      </PreviewTileGroup>
    ));
    setValue("Garage");
    const tile = screen.getByRole("radio", { name: "Garage" }).closest("[data-slot=preview-tile]");
    await vi.waitFor(() => {
      const edge = strip().getBoundingClientRect();
      const box = tile?.getBoundingClientRect();
      expect(box?.right).toBeLessThanOrEqual(edge.right + 1);
      expect(box?.left).toBeGreaterThanOrEqual(edge.left - 1);
    });
  });
});

describe("PreviewTile dashed", () => {
  it("draws its face with a dashed edge and still marks the pick", async () => {
    render(() => <Strip />);
    const face = screen
      .getByRole("radio", { name: "Empty" })
      .closest("[data-slot=preview-tile]")
      ?.querySelector("[data-slot=preview-tile-face]");
    expect(getComputedStyle(face as Element).borderTopStyle).toBe("dashed");
    expect(
      screen
        .getByRole("radio", { name: "Empty" })
        .closest("[data-slot=preview-tile]")
        ?.hasAttribute("data-checked"),
    ).toBe(true);
  });
});

describe("PreviewTileAction", () => {
  it("is a button among the pictures that picks nothing", async () => {
    let opened = 0;
    render(() => <Strip onMore={() => opened++} />);
    const more = screen.getByRole("button", { name: "More" });
    expect(more.closest("[data-slot=preview-tile]")).toBeNull();
    await press(more);
    expect(opened).toBe(1);
    expect(screen.getByTestId("picked").textContent).toBe("Empty");
    expect(screen.queryAllByRole("radio")).toHaveLength(NAMES.length);
  });

  it("is never reached by arrowing along the pictures", async () => {
    let opened = 0;
    render(() => <Strip initial="Garage" onMore={() => opened++} />);
    (screen.getByRole("radio", { name: "Garage" }) as HTMLInputElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByTestId("picked").textContent).toBe("Empty");
    expect(opened).toBe(0);
  });

  it("opens on Enter when focused", async () => {
    let opened = 0;
    render(() => <Strip onMore={() => opened++} />);
    screen.getByRole("button", { name: "More" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(opened).toBe(1);
  });
});
