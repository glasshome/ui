import { describe, expect, it } from "vitest";
import { OVERLAY_SURFACE, RISE_MOTION } from "../../src/solid/index.js";

describe("solid entry", () => {
	it("exports the surface and motion recipes an app-side floating panel needs", () => {
		expect(typeof OVERLAY_SURFACE).toBe("string");
		expect(RISE_MOTION).toContain("data-[closed]:opacity-0");
	});
});
