import { describe, expect, it } from "vitest";
import { type AnchorPlace, type Box, placeBeside } from "../../src/lib/anchor-placement.js";

const VIEWPORT = { width: 1000, height: 800 };
const ANCHOR: Box = { left: 400, top: 300, width: 100, height: 40 };
const PART = { width: 120, height: 60 };
const PLACE: AnchorPlace = { side: "bottom", align: "center", offset: 6, matchAnchorWidth: false };

const beside = (over: Partial<AnchorPlace> = {}, anchor: Box = ANCHOR, part = PART) =>
  placeBeside(anchor, part, VIEWPORT, { ...PLACE, ...over });

describe("placeBeside", () => {
  it("opens below, centred on the anchor, offset from its edge", () => {
    expect(beside()).toMatchObject({ side: "bottom", top: 346, left: 390 });
  });

  it("opens above, its bottom edge the offset above the anchor", () => {
    expect(beside({ side: "top" })).toMatchObject({ side: "top", top: 234, left: 390 });
  });

  it("opens to the right, centred on the anchor's height", () => {
    expect(beside({ side: "right" })).toMatchObject({ side: "right", left: 506, top: 290 });
  });

  it("opens to the left, its right edge the offset before the anchor", () => {
    expect(beside({ side: "left" })).toMatchObject({ side: "left", left: 274, top: 290 });
  });

  it("aligns to the start or the end of the anchor's edge", () => {
    expect(beside({ align: "start" }).left).toBe(400);
    expect(beside({ align: "end" }).left).toBe(380);
    expect(beside({ side: "right", align: "start" }).top).toBe(300);
    expect(beside({ side: "right", align: "end" }).top).toBe(280);
  });

  it("flips above when the part does not fit below", () => {
    expect(beside({}, { ...ANCHOR, top: 740 })).toMatchObject({ side: "top", top: 674 });
  });

  it("flips below when the part does not fit above", () => {
    expect(beside({ side: "top" }, { ...ANCHOR, top: 20 })).toMatchObject({
      side: "bottom",
      top: 66,
    });
  });

  it("flips to the side with the room when it is the larger", () => {
    const short = { width: VIEWPORT.width, height: 120 };
    const placed = placeBeside(
      { left: 0, top: 30, width: 100, height: 20 },
      { width: 40, height: 40 },
      short,
      { ...PLACE, side: "top" },
    );
    expect(placed).toMatchObject({ side: "bottom", top: 56 });
  });

  it("flips left and right the same way", () => {
    expect(beside({ side: "right" }, { ...ANCHOR, left: 900 })).toMatchObject({
      side: "left",
      left: 774,
    });
    expect(beside({ side: "left" }, { ...ANCHOR, left: 10 })).toMatchObject({
      side: "right",
      left: 116,
    });
  });

  it("keeps the side chosen when neither has room for the part", () => {
    const tiny = { width: 1000, height: 100 };
    const placed = placeBeside(
      { left: 0, top: 40, width: 100, height: 20 },
      { width: 40, height: 80 },
      tiny,
      { ...PLACE, side: "bottom" },
    );
    expect(placed.side).toBe("bottom");
  });

  it("clamps to 16px inside the viewport on the cross axis", () => {
    const wide = { width: 200, height: 60 };
    expect(beside({}, { left: 0, top: 300, width: 20, height: 40 }, wide).left).toBe(16);
    expect(beside({}, { left: 980, top: 300, width: 20, height: 40 }, wide).left).toBe(784);
    expect(beside({ side: "right" }, { left: 400, top: 0, width: 20, height: 20 }, PART).top).toBe(
      16,
    );
  });

  it("clamps to 16px inside the viewport on the main axis when neither side fits", () => {
    const tall = { width: 120, height: 900 };
    const placed = beside({}, ANCHOR, tall);
    expect(placed.top).toBe(16);
    expect(placed.maxHeight).toBe(768);
  });

  it("is at least as wide as the anchor with matchAnchorWidth", () => {
    const narrow = { width: 50, height: 60 };
    expect(beside({ matchAnchorWidth: true }, ANCHOR, narrow).left).toBe(400);
    expect(beside({ matchAnchorWidth: false }, ANCHOR, narrow).left).toBe(425);
  });

  it("reports the room inside the viewport as max width and max height", () => {
    expect(beside()).toMatchObject({ maxWidth: 968, maxHeight: 768 });
  });
});
