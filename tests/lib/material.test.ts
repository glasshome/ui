import { describe, expect, it } from "vitest";
import {
	FROSTED,
	MATERIAL_PRESETS,
	materialDials,
	resolveMaterial,
} from "../../src/tokens/material.js";

const INERT = {
	"--material-edge-width": "1px",
	"--material-edge-ink": "0",
	"--material-edge-accent": "0",
	"--material-glow": "0px",
	"--material-ink-level": "0",
};

describe("material presets", () => {
	it("Frosted resolves to the theme.css defaults, byte for byte", () => {
		expect(resolveMaterial(FROSTED, "dynamic")).toEqual({
			"--material-blur": "24px",
			"--material-clarity": "60%",
			"--material-depth": "1",
			"--material-tint": "1",
			...INERT,
		});
	});

	it("a dial overrides its preset value and nothing else", () => {
		const dials = materialDials({ v: 1, preset: "paper", dials: { depth: 0.8 } });
		const { blur, clarity, tint, glow, ink } = MATERIAL_PRESETS.paper;
		expect(dials).toEqual({ blur, clarity, tint, glow, ink, depth: 0.8 });
	});

	it("Paper and Neon carry their own terms; a dial never reaches a term", () => {
		const paper = resolveMaterial({ v: 1, preset: "paper", dials: { clarity: 50 } }, "dynamic");
		expect(paper["--material-edge-ink"]).toBe("0.3");
		expect(paper["--material-clarity"]).toBe("50%");
		const neon = resolveMaterial({ v: 1, preset: "neon" }, "dynamic");
		expect(neon["--material-glow"]).toBe("18px");
		expect(neon["--material-edge-width"]).toBe("1.5px");
		expect(neon["--material-edge-accent"]).toBe("1");
	});

	it("ink is a dial: Paper inks at any level, clamped to 0..1", () => {
		expect(
			resolveMaterial({ v: 1, preset: "paper", dials: { ink: 0.6 } }, "dynamic")[
				"--material-ink-level"
			],
		).toBe("0.6");
		expect(materialDials({ v: 1, preset: "paper", dials: { ink: 3 } }).ink).toBe(1);
	});

	it("glow is a dial: any preset can bloom, and the dial is clamped to its range", () => {
		expect(
			resolveMaterial({ v: 1, preset: "neon", dials: { glow: 30 } }, "dynamic")["--material-glow"],
		).toBe("30px");
		expect(
			resolveMaterial({ v: 1, preset: "frosted", dials: { glow: 12 } }, "dynamic")[
				"--material-glow"
			],
		).toBe("12px");
		expect(materialDials({ v: 1, preset: "neon", dials: { glow: 99 } }).glow).toBe(40);
	});

	it("no-blur mode drops the blur and lifts clarity to the readable floor", () => {
		const vars = resolveMaterial({ v: 1, preset: "frosted", dials: { clarity: 30 } }, "none");
		expect(vars["--material-blur"]).toBe("0px");
		expect(vars["--material-clarity"]).toBe("85%");
	});

	it("performant mode keeps the blur value: the host rasterizes at it", () => {
		expect(resolveMaterial(FROSTED, "performant")["--material-blur"]).toBe("24px");
	});

	it("every preset differs from every other on at least one value", () => {
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
			...INERT,
		});
	});
});
