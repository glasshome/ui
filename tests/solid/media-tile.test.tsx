import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StoredMedia } from "../../src/solid/media-store.js";
import { MediaTile } from "../../src/solid/media-tile.jsx";

const image = (usedBy = 0): StoredMedia => ({
  id: "a",
  mimeType: "image/png",
  width: 100,
  height: 80,
  size: 1234,
  usedBy,
});

const noop = () => {};

afterEach(cleanup);

describe("MediaTile", () => {
  it("badges an unused image, and only when asked", () => {
    render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken={false}
        markUnused
        onSelect={noop}
        onBroken={noop}
      />
    ));
    const badge = screen.getByTestId("media-tile-unused");
    expect(badge.textContent).toBe("Unused");
  });

  it("leaves a used image unbadged", () => {
    render(() => (
      <MediaTile
        item={image(2)}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken={false}
        markUnused
        onSelect={noop}
        onBroken={noop}
      />
    ));
    expect(screen.queryByTestId("media-tile-unused")).toBeNull();
  });

  it("takes its accessible label from the caller's action", () => {
    render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="View a"
        broken={false}
        onSelect={noop}
        onBroken={noop}
      />
    ));
    expect(screen.getByTestId("media-tile").getAttribute("aria-label")).toBe("View a");
  });

  it("reports the click and the image failing to load", () => {
    const onSelect = vi.fn();
    const onBroken = vi.fn();
    render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken={false}
        onSelect={onSelect}
        onBroken={onBroken}
      />
    ));
    fireEvent.error(screen.getByTestId("media-tile").querySelector("img") as HTMLImageElement);
    expect(onBroken).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("media-tile"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("swaps a broken image for a glyph, not a blank grey square", () => {
    render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken
        onSelect={noop}
        onBroken={noop}
      />
    ));
    expect(screen.getByTestId("media-tile").querySelector("img")).toBeNull();
    expect(screen.getByTestId("media-tile-broken")).toBeTruthy();
  });

  it("shows a delete control only when the caller can delete, outside the tile button", () => {
    const onDelete = vi.fn();
    const { unmount } = render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken={false}
        onSelect={noop}
        onBroken={noop}
      />
    ));
    expect(document.querySelector('[data-slot="media-tile-delete"]')).toBeNull();
    unmount();

    render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken={false}
        onSelect={noop}
        onBroken={noop}
        onDelete={onDelete}
      />
    ));
    const del = document.querySelector('[data-slot="media-tile-delete"]') as HTMLButtonElement;
    expect(screen.getByTestId("media-tile").contains(del)).toBe(false);
    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalledTimes(1);
    // jsdom lays nothing out, so this only pins the touch-target expansion, not its size.
    expect(del.className).toContain("after:-inset-1.5");
    expect(del.className).toContain("size-8");
  });

  it("marks the selected tile for a picker and stays silent otherwise", () => {
    const { unmount } = render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken={false}
        selected
        onSelect={noop}
        onBroken={noop}
      />
    ));
    expect(screen.getByTestId("media-tile").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("media-tile").className).toContain("ring-primary");
    unmount();

    render(() => (
      <MediaTile
        item={image()}
        thumbUrl="/api/media/a/thumb"
        label="Use a"
        broken={false}
        onSelect={noop}
        onBroken={noop}
      />
    ));
    expect(screen.getByTestId("media-tile").hasAttribute("aria-pressed")).toBe(false);
  });
});
