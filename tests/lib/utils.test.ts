import { describe, expect, it } from "vitest";
import { cn } from "../../src/lib/utils.js";

describe("cn", () => {
	it("joins class names", () => {
		expect(cn("a", "b")).toBe("a b");
	});

	it("drops falsy values", () => {
		expect(cn("a", false, undefined, null, "b")).toBe("a b");
	});

	it("resolves tailwind conflicts, last one wins", () => {
		expect(cn("px-4", "px-2")).toBe("px-2");
		expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
	});

	it("keeps unrelated utilities intact", () => {
		expect(cn("rounded-xl border", "px-2")).toBe("rounded-xl border px-2");
	});

	it("handles conditional objects", () => {
		expect(cn({ a: true, b: false }, "c")).toBe("a c");
	});
});
