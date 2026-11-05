import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, it } from "vitest";
import { DashboardPreview, type DashboardPreviewTile } from "../../src/solid/dashboard-preview.js";

afterEach(cleanup);

const tile = (over: Partial<DashboardPreviewTile>): DashboardPreviewTile => ({
  key: "t",
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  icon: "lucide:clock",
  label: "Clock",
  ...over,
});

it("draws a render as an image and a widget without one as an icon tile", () => {
  const { container } = render(() => (
    <DashboardPreview
      columns={12}
      tiles={[
        tile({ key: "a", src: "/clock-2x2.webp" }),
        tile({ key: "b", x: 2, label: "Thermostat", description: "Heat and cool" }),
      ]}
    />
  ));
  const tiles = container.querySelectorAll('[data-slot="dashboard-preview-tile"]');
  expect(tiles).toHaveLength(2);
  expect(tiles[0]?.querySelector("img")?.getAttribute("src")).toBe("/clock-2x2.webp");
  const icon = tiles[1]?.querySelector('[data-slot="dashboard-preview-icon-tile"]');
  expect(icon?.textContent).toContain("Thermostat");
  expect(icon?.textContent).toContain("Heat and cool");
});

it("keeps a small icon tile to its name", () => {
  const { container } = render(() => (
    <DashboardPreview columns={12} tiles={[tile({ w: 2, h: 1, description: "Heat and cool" })]} />
  ));
  expect(container.textContent).not.toContain("Heat and cool");
});

it("places a tile at its lattice position and sizes the board to the rows it shows", () => {
  const { container } = render(() => (
    <DashboardPreview columns={12} maxRows={2} tiles={[tile({ x: 6, y: 0, w: 6, h: 4 })]} />
  ));
  const board = container.querySelector<HTMLElement>('[data-slot="dashboard-preview"]');
  const placed = container.querySelector<HTMLElement>('[data-slot="dashboard-preview-tile"]');
  expect(board?.style.aspectRatio).toBe("1256 / 156");
  expect(placed?.style.left).toMatch(/%$/);
  expect(Number.parseFloat(placed?.style.left ?? "")).toBeCloseTo(((6 * 106) / 1256) * 100, 3);
});

it("wraps the board in a well only when staged", () => {
  const staged = render(() => <DashboardPreview stage columns={4} tiles={[tile({})]} />);
  expect(staged.container.querySelector('[data-slot="dashboard-preview-stage"]')).not.toBeNull();
  cleanup();
  const bare = render(() => <DashboardPreview columns={4} tiles={[tile({})]} />);
  expect(bare.container.querySelector('[data-slot="dashboard-preview-stage"]')).toBeNull();
});

const glyphPx = (host: HTMLElement) => {
  const icon = host.querySelector('[data-slot="dashboard-preview-icon-tile"] [data-slot="icon"]');
  return Number.parseFloat(getComputedStyle(icon as Element).fontSize);
};
const labelShown = (host: HTMLElement) => {
  const name = host.querySelector('[data-slot="dashboard-preview-icon-tile-label"]');
  return getComputedStyle(name as Element).display !== "none";
};
const iconBoard = (width: number) => (
  <div style={{ width: `${width}px` }}>
    <DashboardPreview columns={12} tiles={[tile({ w: 3, h: 3 })]} />
  </div>
);

it("fills a small picture's icon tile with its glyph and leaves the name out", () => {
  const { container } = render(() => iconBoard(200));
  expect(labelShown(container)).toBe(false);
  expect(glyphPx(container)).toBeGreaterThan(12);
});

it("keeps a large picture's glyph and name as they were", () => {
  const { container } = render(() => iconBoard(800));
  expect(labelShown(container)).toBe(true);
  expect(glyphPx(container)).toBeCloseTo(32 * (800 / 1256), 0);
});
