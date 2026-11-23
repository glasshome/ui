import { cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { findAll } from "../../dev/harness/steps";
import { frames } from "../frames.js";
import { press } from "../press.js";
import { mountScenario, settle } from "../harness/mount";

afterEach(async () => {
  cleanup();
  // The scroll a teardown clamps lands a frame later and would arm the next table's observer.
  await frames(2);
});

const rows = (scope: ParentNode[]) => findAll(scope, { role: "listitem" }).length;
const more = (scope: ParentNode[]) => findAll(scope, { role: "button", name: "Show more" });

describe("TableLoadMore contract", () => {
  it("TL1 one page of rows and a Show more button", async () => {
    const { scope } = await mountScenario("TableLoadMore", "load-more");
    expect(rows(scope())).toBe(5);
    expect(more(scope())).toHaveLength(1);
  });

  it("TL2 each press adds a page, and the button goes once every row is drawn", async () => {
    const { scope } = await mountScenario("TableLoadMore", "load-more");
    for (const expected of [10, 12]) {
      const [button] = more(scope());
      if (!button) throw new Error("no Show more button");
      await press(button);
      await settle();
      expect(rows(scope())).toBe(expected);
    }
    expect(more(scope())).toHaveLength(0);
  });

  it("TL3 scrolling to its end draws the next page without a press", async () => {
    const { scope } = await mountScenario("TableLoadMore", "long");
    expect(rows(scope())).toBe(50);
    more(scope())[0]?.scrollIntoView();
    await expect.poll(() => rows(scope())).toBe(100);
    more(scope())[0]?.scrollIntoView();
    await expect.poll(() => rows(scope())).toBe(120);
    expect(more(scope())).toHaveLength(0);
  });

  it("TL4 a long table nobody scrolls stays at one page", async () => {
    const { scope } = await mountScenario("TableLoadMore", "long");
    await frames(2);
    expect(rows(scope())).toBe(50);
  });
});
