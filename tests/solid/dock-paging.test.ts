import { describe, expect, it } from "vitest";
import { edgeZone, moveId, pageOf, pageOffset, slotAt } from "../../src/solid/dock-paging.js";

describe("dock paging", () => {
  it("reads the page from where the strip is scrolled", () => {
    expect(pageOf(0, 400)).toBe(0);
    expect(pageOf(180, 400)).toBe(0);
    expect(pageOf(240, 400)).toBe(1);
    expect(pageOf(800, 400)).toBe(2);
  });

  it("scrolls to the start of a page, never past the end", () => {
    expect(pageOffset(0, 400, 900)).toBe(0);
    expect(pageOffset(1, 400, 900)).toBe(400);
    expect(pageOffset(2, 400, 900)).toBe(500);
    expect(pageOffset(9, 400, 900)).toBe(500);
  });
});

describe("dock reorder", () => {
  it("lands a dragged item in the slot nearest the pointer", () => {
    expect(slotAt([20, 70, 120], 10)).toBe(0);
    expect(slotAt([20, 70, 120], 80)).toBe(1);
    expect(slotAt([20, 70, 120], 400)).toBe(2);
  });

  it("moves one id and keeps the rest in order", () => {
    expect(moveId(["a", "b", "c", "d"], "a", 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveId(["a", "b", "c", "d"], "d", 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveId(["a", "b"], "z", 0)).toEqual(["a", "b"]);
  });
});

describe("dock edge zones", () => {
  const viewport = { width: 1000, height: 800 };

  it("names the side an outer quarter points at", () => {
    expect(edgeZone({ x: 100, y: 300 }, viewport)).toBe("left");
    expect(edgeZone({ x: 900, y: 300 }, viewport)).toBe("right");
  });

  it("names the bottom for the lower middle and nothing for the upper middle", () => {
    expect(edgeZone({ x: 500, y: 700 }, viewport)).toBe("bottom");
    expect(edgeZone({ x: 500, y: 200 }, viewport)).toBeNull();
  });

  it("names nothing before the viewport is measured", () => {
    expect(edgeZone({ x: 0, y: 0 }, { width: 0, height: 0 })).toBeNull();
  });
});
