import { describe, expect, it } from "vitest";
import {
	FROSTED,
	MATERIAL_PRESETS,
	materialDials,
	resolveMaterial,
} from "../../src/tokens/material.js";

describe("material presets", () => {
	it("Frosted resolves to the theme.css defaults, byte for byte", () => {
		expect(resolveMaterial(FROSTED, "dynamic")).toEqual({
			"--material-blur": "24px",
			"--material-clarity": "60%",
			"--material-depth": "1",
			"--material-tint": "1",
		});
	});

	it("a dial overrides its preset value and nothing else", () => {
		const dials = materialDials({ v: 1, preset: "paper", dials: { depth: 0.8 } });
		expect(dials).toEqual({ ...MATERIAL_PRESETS.paper, depth: 0.8 });
	});

	it("no-blur mode drops the blur and lifts clarity to the readable floor", () => {
		const vars = resolveMaterial({ v: 1, preset: "frosted", dials: { clarity: 30 } }, "none");
		expect(vars["--material-blur"]).toBe("0px");
		expect(vars["--material-clarity"]).toBe("85%");
	});

	it("performant mode keeps the blur value: the host rasterizes at it", () => {
		expect(resolveMaterial(FROSTED, "performant")["--material-blur"]).toBe("24px");
	});

	it("every preset differs from every other on at least one dial", () => {
		const ids = Object.keys(MATERIAL_PRESETS) as (keyof typeof MATERIAL_PRESETS)[];
		for (const a of ids) {
			for (const b of ids) {
				if (a === b) continue;
				expect(MATERIAL_PRESETS[a]).not.toEqual(MATERIAL_PRESETS[b]);
			}
		}
	});

	it("dials are clamped to their ranges", () => {
		const vars = resolveMaterial(
			{ v: 1, preset: "frosted", dials: { blur: 900, clarity: -5, depth: 9, tint: -1 } },
			"dynamic",
		);
		expect(vars).toEqual({
			"--material-blur": "48px",
			"--material-clarity": "0%",
			"--material-depth": "2",
			"--material-tint": "0",
		});
	});
});
