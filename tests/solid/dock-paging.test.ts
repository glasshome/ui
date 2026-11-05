import { describe, expect, it } from "vitest";
import {
  edgeZone,
  moveId,
  pageCount,
  pageOf,
  pageOffset,
  slotAt,
  stripWidth,
} from "../../src/solid/dock-paging.js";

describe("dock paging", () => {
  it("one page while everything fits", () => {
    expect(pageCount(400, 400)).toBe(1);
    expect(pageCount(320, 400)).toBe(1);
  });

  it("counts a page per viewport of strip, the last one part-full", () => {
    expect(pageCount(800, 400)).toBe(2);
    expect(pageCount(900, 400)).toBe(3);
  });

  it("a strip a sub-pixel over its viewport is still one page", () => {
    expect(pageCount(726, 725.606)).toBe(1);
    expect(pageCount(401, 400)).toBe(1);
  });

  it("an unmeasured strip has a single page", () => {
    expect(pageCount(0, 0)).toBe(1);
    expect(pageCount(800, 0)).toBe(1);
  });

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

  it("trims the strip to the last whole item", () => {
    expect(stripWidth(222, 40, 2)).toBe(208);
    expect(stripWidth(208, 40, 2)).toBe(208);
  });

  it("keeps one item when not even one fits", () => {
    expect(stripWidth(30, 40, 2)).toBe(30);
  });

  it("leaves an unmeasured strip alone", () => {
    expect(stripWidth(222, 0, 2)).toBe(222);
    expect(stripWidth(0, 40, 2)).toBe(0);
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
