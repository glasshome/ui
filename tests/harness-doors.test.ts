import { expect, it, vi } from "vitest";
import { useFakeTime } from "../src/testing/index.js";
import { settle } from "./harness/mount";

it("useFakeTime turns fake timers on", () => {
  useFakeTime();
  expect(vi.isFakeTimers()).toBe(true);
});

it("fake time is gone in the next test", () => {
  expect(vi.isFakeTimers()).toBe(false);
});

it("an element reports no running animation", () => {
  expect(getComputedStyle(document.body).animationName).toBe("none");
});

it("settle refuses frozen frames instead of waiting on them forever", async () => {
  useFakeTime({ toFake: ["requestAnimationFrame"] });
  await expect(settle()).rejects.toThrow("settle needs real frames");
});
