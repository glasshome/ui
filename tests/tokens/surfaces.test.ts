/* The light theme's surface ladder. The dark theme has always had one
 * (background 0.12, card 0.17, popover 0.11); the light theme painted page,
 * card and popover within 1.06:1 of each other, so a dialog read as a shape on
 * the page rather than a layer over it, and its scrim (--background at 70% over
 * a --background page) was arithmetically the page colour: 1.000:1.
 *
 * Parsed out of theme.css rather than a rendered page, so the rule holds with
 * no DOM. Floors are ratios, not lightness deltas: two oklch steps of the same
 * size read differently at different lightness. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { oklchToHex } from "../../src/tokens/hex.js";

const css = readFileSync(
  path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../src/styles/theme.css"),
  "utf8",
);

const lightBlock = css.slice(css.indexOf(":root"), css.indexOf(".dark"));

function lightValue(name: string): string {
  const match = lightBlock.match(new RegExp(`${name}:\\s*([^;]+);`));
  const value = match?.[1];
  if (!value) throw new Error(`light ${name} not found in theme.css`);
  return value.trim();
}

function luminance(oklch: string): number {
  const hex = oklchToHex(oklch);
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** A step small enough to be missed on a phone in daylight is not a rung. */
const RUNG_FLOOR = 1.07;
/** A card edge on a near-white page is a hairline; it has to earn its pixel. */
const EDGE_FLOOR = 1.35;

describe("light theme surfaces", () => {
  it("does not paint card and background the same", () => {
    expect(lightValue("--card")).not.toBe(lightValue("--background"));
  });

  it("keeps the ring on the primary hue", () => {
    expect(lightValue("--ring")).toBe(lightValue("--primary"));
  });

  it.each([
    ["--background", "--card"],
    ["--card", "--popover"],
  ])("steps %s and %s apart", (lower, upper) => {
    expect(contrast(lightValue(lower), lightValue(upper))).toBeGreaterThanOrEqual(RUNG_FLOOR);
  });

  it("draws a card edge that survives on the page", () => {
    expect(contrast(lightValue("--border"), lightValue("--card"))).toBeGreaterThanOrEqual(
      EDGE_FLOOR,
    );
    expect(contrast(lightValue("--border"), lightValue("--background"))).toBeGreaterThanOrEqual(
      EDGE_FLOOR,
    );
  });

  it("sinks the toggle well below the card it sits on", () => {
    expect(contrast(lightValue("--input"), lightValue("--card"))).toBeGreaterThanOrEqual(
      EDGE_FLOOR,
    );
  });

  it("darkens behind a modal instead of washing over it", () => {
    const scrim = lightValue("--scrim");
    const parts = scrim.match(/oklch\(\s*([\d.]+)[^/]*\/\s*([\d.]+)\s*\)/);
    const [lightness, alpha] = [Number(parts?.[1]), Number(parts?.[2])];
    expect(lightness, `--scrim: ${scrim}`).toBeLessThan(0.5);
    expect(alpha, `--scrim: ${scrim}`).toBeGreaterThanOrEqual(0.35);
  });
});
