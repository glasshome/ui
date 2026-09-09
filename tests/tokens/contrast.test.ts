/* WCAG floors for the semantic roles, read straight out of styles/theme.css (the
 * palette's source of truth; check-tokens.ts keeps presets.ts equal to it).
 *
 * These roles are one value per role used as BOTH a fill and as text — consumers
 * render money in --success and failures in --destructive — so each has to clear
 * 4.5:1 against every ground it lands on. --ring is a focus indicator, so 3:1.
 * The dark theme has always cleared this; the light theme did not until the
 * values were relit against its L=0.975 ground. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseThemeBlock } from "../../src/tokens";

const css = readFileSync(
	path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../src/styles/theme.css"),
	"utf8",
);

/** Throws rather than silently comparing `undefined`, which reads as pure white. */
function role(vars: Record<string, string>, name: string): string {
	const value = vars[name];
	if (!value?.startsWith("oklch(")) {
		throw new Error(`theme.css does not declare ${name} as a literal oklch()`);
	}
	return value;
}

const TEXT_FLOOR = 4.5;
const INDICATOR_FLOOR = 3;

describe.each([
	["light", ":root"],
	["dark", ".dark"],
])("%s theme semantic roles", (_mode, block) => {
	const vars = parseThemeBlock(css, block);
	const grounds = ["--background", "--card", "--popover", "--muted"] as const;

	it.each([
		"--success",
		"--warning",
		"--destructive",
		"--muted-foreground",
	])("%s reads as text on every ground", (name) => {
		for (const ground of grounds) {
			expect(
				contrastRatio(role(vars, name), role(vars, ground)),
				`${name} on ${ground}`,
			).toBeGreaterThanOrEqual(TEXT_FLOOR);
		}
	});

	it("--ring clears the focus-indicator floor", () => {
		for (const ground of grounds) {
			expect(
				contrastRatio(role(vars, "--ring"), role(vars, ground)),
				`--ring on ${ground}`,
			).toBeGreaterThanOrEqual(INDICATOR_FLOOR);
		}
	});
});

/* Light only: --destructive is also worn as a filled surface with
 * --destructive-foreground (white) on it. The dark theme's destructive is a
 * high-lightness red that white cannot sit on (2.8:1); nothing in this package
 * pairs them that way (the destructive Button is a tinted glass pill with
 * glassToneText), so that pairing is a consumer's own call there. */
it("white sits on the light-theme destructive fill", () => {
	const vars = parseThemeBlock(css, ":root");
	expect(
		contrastRatio(role(vars, "--destructive-foreground"), role(vars, "--destructive")),
	).toBeGreaterThanOrEqual(TEXT_FLOOR);
});
