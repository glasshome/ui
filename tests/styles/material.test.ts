import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CARD_SURFACE_BASE, SECTION_ROW_SURFACE } from "../../src/lib/card-classes.js";

// Read from disk: happy-dom computes no cascade, so the shipped text is the only
// place this contract exists at test time.
const here = dirname(fileURLToPath(import.meta.url));
const globals = readFileSync(resolve(here, "../../src/styles/globals.css"), "utf8");
const theme = readFileSync(resolve(here, "../../src/styles/theme.css"), "utf8");

const property = (name: string) => {
	const start = globals.indexOf(`@property ${name} {`);
	if (start === -1) throw new Error(`${name} is not registered`);
	return globals.slice(start, globals.indexOf("}", start));
};

describe("the material tier", () => {
	it.each([
		["--material-blur", "<length>", "24px"],
		["--material-clarity", "<percentage>", "60%"],
		["--material-depth", "<number>", "1"],
		["--material-tint", "<number>", "1"],
		["--material-edge-width", "<length>", "1px"],
		["--material-edge-ink", "<number>", "0"],
		["--material-cast", "<length>", "0px"],
		["--material-glow", "<length>", "0px"],
	])("%s is registered, inheriting, with the Frosted default", (name, syntax, initial) => {
		const block = property(name);
		expect(block).toContain(`syntax: "${syntax}"`);
		expect(block).toContain("inherits: true");
		expect(block).toContain(`initial-value: ${initial}`);
	});

	it("the theme declares the tier once and aliases the published blur name", () => {
		expect(theme).toContain("--material-blur: 24px;");
		expect(theme).toContain("--glass-blur: var(--material-blur);");
		expect(theme).toContain("--material-clarity: 60%;");
		expect(theme).toContain("--material-cast: 0px;");
	});

	it("the preset terms sit in the formula, inert at zero", () => {
		expect(globals).toContain("border: var(--material-edge-width) solid");
		expect(globals).toContain("var(--foreground) calc(var(--material-edge-ink) * 100%)");
		expect(globals).toContain("var(--material-cast) var(--material-cast) 0 0");
		expect(globals).toContain(
			"0 0 var(--material-glow) color-mix(in srgb, var(--primary) 40%, transparent)",
		);
	});

	it("depth scales sheen, shade, rim and lift; tint scales the wash", () => {
		expect(globals).toContain("oklch(1 0 0 / calc(var(--glass-light) * var(--material-depth)))");
		expect(globals).toContain("oklch(0 0 0 / calc(var(--glass-shade) * var(--material-depth)))");
		expect(globals).toContain("calc(0.22 * var(--glass-rim) * var(--material-depth))");
		expect(globals).toContain("oklch(0 0 0 / calc(var(--glass-lift) * var(--material-depth)))");
		expect(globals).toContain("var(--glass-tone) calc(var(--glass-wash) * var(--material-tint))");
		expect(globals).toContain(
			"var(--glass-tone-2) calc(var(--glass-wash-2) * var(--material-tint))",
		);
	});

	it("depth and tint morph with the other knobs on a theme switch", () => {
		expect(globals).toMatch(/--glass-transition:[\s\S]*--material-depth, --material-tint/);
	});

	it("card surfaces take their translucency from clarity", () => {
		expect(CARD_SURFACE_BASE).toContain(
			"[--glass-base:color-mix(in_srgb,var(--card)_var(--material-clarity),transparent)]",
		);
		expect(SECTION_ROW_SURFACE).toContain("var(--material-clarity)");
	});
});
