import { describe, expect, it } from "vitest";
import { contrastRatio, parseThemeBlock } from "../../src/tokens";

const CSS = `
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.2 0 0);
  --radius-md: 0.75rem;
}
.dark {
  --background: oklch(0.17 0 0);
}
`;

describe("parseThemeBlock", () => {
	it("reads every declaration in a block", () => {
		const vars = parseThemeBlock(CSS, ":root");
		expect(vars["--background"]).toBe("oklch(0.99 0 0)");
		expect(vars["--radius-md"]).toBe("0.75rem");
	});

	it("reads the dark block separately", () => {
		expect(parseThemeBlock(CSS, ".dark")["--background"]).toBe("oklch(0.17 0 0)");
	});

	it("throws on a missing block", () => {
		expect(() => parseThemeBlock(CSS, ".nope")).toThrow(/block not found/);
	});
});

describe("contrastRatio", () => {
	it("is 21 for black against white", () => {
		expect(contrastRatio("oklch(1 0 0)", "oklch(0 0 0)")).toBeCloseTo(21, 0);
	});

	it("is symmetric", () => {
		const a = contrastRatio("oklch(0.99 0 0)", "oklch(0.2 0 0)");
		const b = contrastRatio("oklch(0.2 0 0)", "oklch(0.99 0 0)");
		expect(a).toBeCloseTo(b, 5);
	});
});
