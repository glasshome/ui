import { describe, expect, it } from "vitest";
import { isSheetMotion } from "../../src/solid/bottom-sheet/sheet-motion.js";

const animation = (fields: Record<string, string>): Animation =>
  Object.assign(Object.create(Animation.prototype) as Animation, fields);

describe("isSheetMotion", () => {
  it.each(["bs-slide-up", "bs-slide-down"])("matches the %s animation", (animationName) => {
    expect(isSheetMotion(animation({ animationName }))).toBe(true);
  });

  it("matches a transform transition", () => {
    expect(isSheetMotion(animation({ transitionProperty: "transform" }))).toBe(true);
  });

  it.each([
    ["another keyframe animation", { animationName: "fade-in" }],
    ["an opacity transition", { transitionProperty: "opacity" }],
    ["a script animation", {}],
  ])("rejects %s", (_name, fields) => {
    expect(isSheetMotion(animation(fields))).toBe(false);
  });
});
