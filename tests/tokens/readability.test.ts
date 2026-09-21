import { describe, expect, it } from "vitest";
import { THEME_PRESETS } from "../../src/tokens/presets";
import { findUnreadable, fixReadable } from "../../src/tokens/readability";
import type { ThemeColors } from "../../src/tokens/theme-colors";
import { resolveRecipe } from "../../src/tokens/theme-recipe";

const light = (over: Partial<ThemeColors> = {}): ThemeColors => ({
	...resolveRecipe({
		v: 1,
		accent: "oklch(0.55 0.16 250)",
		surface: "oklch(0.98 0.005 250)",
		radius: 0.75,
		background: { type: "solid", id: "default", themed: true },
		darkLinked: true,
		set: { light: {}, dark: {} },
	}).light,
	...over,
});

describe("findUnreadable", () => {
	it("finds grey text too pale for a white ground", () => {
		const issues = findUnreadable(light({ mutedForeground: "oklch(0.75 0 0)" }));
		expect(issues.map((i) => `${i.text} on ${i.surface}`)).toContain(
			"mutedForeground on background",
		);
		expect(issues[0]?.ratio).toBeLessThan(4.5);
	});

	// dash docs/work/2026-09-22-presets-fail-indicator-contrast-in-light: a ratchet, fixing a preset shortens it.
	const KNOWN = [
		"sunrise-studio light: primary on background",
		"sunrise-studio light: primary on card",
		"sunrise-studio light: ring on background",
		"forest-zen light: ring on background",
		"lavender-dreams light: ring on background",
		"coral-reef light: ring on background",
		"ocean-breeze light: ring on background",
	];

	it("passes every shipped preset in both modes, but for the filed ones", () => {
		const failing = THEME_PRESETS.flatMap((preset) =>
			(["light", "dark"] as const).flatMap((mode) =>
				findUnreadable(preset.colors[mode]).map(
					(i) => `${preset.id} ${mode}: ${i.text} on ${i.surface}`,
				),
			),
		);
		expect(failing).toEqual(KNOWN);
	});
});

describe("fixReadable", () => {
	it("moves only the lightness, the least it can, and the result passes", () => {
		const colors = light({ mutedForeground: "oklch(0.75 0.02 250)" });
		const fixed = fixReadable(colors, "mutedForeground");
		expect(fixed).toMatch(/^oklch\([\d.]+ 0\.02 250\)$/);
		expect(findUnreadable({ ...colors, mutedForeground: fixed ?? "" })).toEqual([]);
	});

	it("a freshly derived theme has nothing to fix", () => {
		expect(findUnreadable(light())).toEqual([]);
	});

	it("says so when no lightness can clear surfaces that disagree", () => {
		const colors = light({
			background: "oklch(0.98 0 0)",
			card: "oklch(0.1 0 0)",
			muted: "oklch(0.5 0 0)",
		});
		expect(fixReadable(colors, "mutedForeground")).toBeNull();
	});
});

describe("a derived theme", () => {
	it("reads well for any accent and surface, with nothing left for the author to fix", () => {
		const offenders: string[] = [];
		for (const h of [0, 45, 90, 150, 215, 280, 330]) {
			for (const l of [0.45, 0.7, 0.88]) {
				for (const surface of ["oklch(0.98 0.005 215)", "oklch(0.93 0.03 80)"]) {
					for (const darkLinked of [true, false]) {
						const colors = resolveRecipe({
							v: 1,
							accent: `oklch(${l} 0.15 ${h})`,
							surface,
							radius: 0.75,
							background: { type: "solid", id: "default", themed: true },
							darkLinked,
							set: { light: {}, dark: {} },
						});
						for (const mode of ["light", "dark"] as const) {
							for (const issue of findUnreadable(colors[mode])) {
								offenders.push(`${h}/${l}/${mode}: ${issue.text} on ${issue.surface}`);
							}
						}
					}
				}
			}
		}
		expect(offenders).toEqual([]);
	});
});
