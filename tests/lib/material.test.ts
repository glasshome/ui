import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FROSTED,
  MATERIAL_PRESETS,
  materialDials,
  materialTerms,
  resolveMaterial,
} from "../../src/tokens/material.js";

const INERT = {
  "--material-edge-width": "1px",
  "--material-edge-ink": "0",
  "--material-edge-accent": "0",
  "--material-glow": "0px",
  "--material-ink-level": "0",
  "--material-ink-lift": "0",
  "--_material-vibrancy": "1",
  "--_material-inset": "0",
  "--_material-light-cos": "1",
  "--_material-light-sin": "0",
  "--_material-rim-bottom": "0",
  "--_material-rim-around": "0",
  "--_material-glow-out": "1",
  "--_material-glow-in": "0",
  "--_material-inner-glow": "0",
  "--_material-inner-glow-hue": "1",
  "--_material-grain": "none",
  "--_material-wash-split": "3",
  "--_material-wash-angle": "135deg",
  "--_material-two-tone": "0",
  "--_material-face-raised": "0",
  "--material-control-track": "var(--input)",
  "--material-control-fill": "var(--material-accent)",
  "--material-control-knob": "oklch(1 0 0)",
  "--_material-relief": "1",
  "--material-accent": "var(--primary)",
  "--_material-fill": "0",
};

const theme = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../src/styles/theme.css"),
  "utf8",
);

describe("material presets", () => {
  it("Glass (the frosted id) resolves to the theme.css defaults, byte for byte", () => {
    const frosted = resolveMaterial(FROSTED, "dynamic");
    expect(frosted).toEqual({
      "--material-blur": "24px",
      "--material-clarity": "60%",
      "--material-depth": "1",
      "--material-tint": "1",
      "--_material-edge": "1",
      "--_material-sheen": "1",
      "--_material-shadow": "1",
      ...INERT,
    });
    for (const [name, value] of Object.entries(frosted)) {
      expect(theme).toContain(`${name}: ${value};`);
    }
  });

  it("a dial overrides its preset value and nothing else", () => {
    const dials = materialDials({ v: 1, preset: "paper", dials: { depth: 0.8 } });
    const { blur, clarity, tint, glow, ink } = MATERIAL_PRESETS.paper;
    expect(dials).toEqual({ blur, clarity, tint, glow, ink, depth: 0.8 });
  });

  it("Paper is matte, clean stock: no sheen, no grain", () => {
    const paper = { v: 1, preset: "paper" } as const;
    expect(materialTerms(paper).sheen).toBe(0);
    expect(resolveMaterial(paper, "dynamic", "dark")["--_material-grain"]).toBe("none");
  });

  it("depth leads edge, sheen and shadow until each is set on its own", () => {
    const led = materialTerms({ v: 1, preset: "chalk" });
    expect([led.edge, led.sheen, led.shadow]).toEqual([0.3, 0.3, 0.3]);
    const split = materialTerms({ v: 1, preset: "chalk", dials: { depth: 0.8, sheen: 0.3 } });
    expect([split.edge, split.sheen, split.shadow]).toEqual([0.8, 0.3, 0.8]);
  });

  it("dark mode scales edge, sheen and inset by the dark scale, never the shadow", () => {
    const material = {
      v: 1,
      preset: "frosted",
      dials: { inset: 0.5, darkScale: 0.3 },
    } as const;
    const dark = resolveMaterial(material, "dynamic", "dark");
    expect(dark["--_material-edge"]).toBe("0.3");
    expect(dark["--_material-sheen"]).toBe("0.3");
    expect(dark["--_material-inset"]).toBe("0.15");
    expect(dark["--_material-shadow"]).toBe("1");
    expect(resolveMaterial(material, "dynamic", "light")["--_material-edge"]).toBe("1");
  });

  it("light from turns today's offsets: a quarter turn swaps the axes", () => {
    const vars = resolveMaterial({ v: 1, preset: "frosted", dials: { lightFrom: 45 } }, "dynamic");
    expect(vars["--_material-light-cos"]).toBe("0");
    expect(vars["--_material-light-sin"]).toBe("1");
  });

  it("enum terms resolve to switches the recipe multiplies by", () => {
    const vars = resolveMaterial(
      {
        v: 1,
        preset: "frosted",
        dials: { rim: "top-bottom", glowAt: "inside", washStyle: "two-tone", face: "raised" },
      },
      "dynamic",
    );
    expect(vars["--_material-rim-bottom"]).toBe("1");
    expect(vars["--_material-glow-out"]).toBe("0");
    expect(vars["--_material-glow-in"]).toBe("1");
    expect(vars["--_material-wash-split"]).toBe("1");
    expect(vars["--_material-two-tone"]).toBe("1");
    expect(vars["--_material-face-raised"]).toBe("1");
  });

  it("grain bakes its strength into the noise tile; an accent is written as given", () => {
    const vars = resolveMaterial(
      { v: 1, preset: "frosted", dials: { grain: 0.5, accent: "oklch(0.65 0.26 0)" } },
      "dynamic",
    );
    expect(vars["--_material-grain"]).toContain("0 0 0 0.15 0");
    expect(vars["--material-accent"]).toBe("oklch(0.65 0.26 0)");
  });

  it("Frosted is Glass with a frost; Glass stays clear", () => {
    expect(resolveMaterial({ v: 1, preset: "frost" }, "dynamic")["--_material-grain"]).toContain(
      "0 0 0 0.12 0",
    );
    expect(resolveMaterial(FROSTED, "dynamic")["--_material-grain"]).toBe("none");
  });

  it("Paper and Neon carry their own terms; a dial never reaches a term", () => {
    const paper = resolveMaterial({ v: 1, preset: "paper", dials: { clarity: 50 } }, "dynamic");
    expect(paper["--material-edge-ink"]).toBe("0.3");
    expect(paper["--material-clarity"]).toBe("50%");
    const neon = resolveMaterial({ v: 1, preset: "neon" }, "dynamic");
    expect(neon["--material-glow"]).toBe("3px");
    expect(neon["--material-edge-width"]).toBe("1px");
    expect(neon["--material-edge-accent"]).toBe("0.35");
  });

  it("Chalk inks every surface and lifts the line toward the foreground", () => {
    const chalk = resolveMaterial({ v: 1, preset: "chalk" }, "dynamic");
    expect(chalk["--material-ink-level"]).toBe("1");
    expect(chalk["--material-ink-lift"]).toBe("1");
    expect(chalk["--material-blur"]).toBe("0px");
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
      "--_material-edge": "2",
      "--_material-sheen": "2",
      "--_material-shadow": "2",
      ...INERT,
    });
  });
});
