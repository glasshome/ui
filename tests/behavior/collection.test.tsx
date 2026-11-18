import { createRoot } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { createCollection } from "../../src/lib/behavior/collection";

describe("createCollection", () => {
  afterEach(() => document.body.replaceChildren());

  it("keeps the tab stop on an item that held focus before the collection attached", async () => {
    const root = document.createElement("div");
    for (const key of ["a", "b", "c"]) {
      const item = document.createElement("button");
      item.dataset.key = key;
      item.textContent = key;
      root.append(item);
    }
    document.body.append(root);
    root.querySelector<HTMLElement>('[data-key="b"]')?.focus();

    const { tabIndex, dispose } = createRoot((stop) => {
      const collection = createCollection({
        root: () => root,
        itemSelector: "[data-key]",
        orientation: () => "horizontal",
        focus: "roving",
        preferred: () => ["a"],
      });
      return { tabIndex: collection.tabIndex, dispose: stop };
    });
    await Promise.resolve();

    expect(["a", "b", "c"].map(tabIndex)).toEqual([-1, 0, -1]);
    dispose();
  });
});
