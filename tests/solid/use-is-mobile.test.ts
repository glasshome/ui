import { expect, it, vi } from "vitest";
import { createIsMobile } from "../../src/lib/use-is-mobile.js";
import { setViewportWidth } from "../viewport.js";

it("reads the width once for every caller and follows the breakpoint after", () => {
  setViewportWidth(1024);
  const width = vi.spyOn(window, "innerWidth", "get");
  const readers = Array.from({ length: 30 }, () => createIsMobile(900));
  expect(width).toHaveBeenCalledTimes(1);
  expect(readers.every((isMobile) => isMobile() === false)).toBe(true);

  setViewportWidth(800);
  expect(readers.every((isMobile) => isMobile() === true)).toBe(true);
  width.mockRestore();
});
