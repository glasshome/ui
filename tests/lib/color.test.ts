// @vitest-environment happy-dom
import {
  COLOR_INTL_TRANSLATIONS as KOBALTE_TRANSLATIONS,
  parseColor as kobalteParse,
} from "@kobalte/core/colors";
import { describe, expect, it } from "vitest";
import { type Color, COLOR_INTL_TRANSLATIONS, parseColor } from "../../src/lib/color/index.js";

type Parse = (value: string) => Color;

const FORMATS = ["hex", "hexa", "rgb", "rgba", "hsl", "hsla", "hsb", "hsba"] as const;
const CHANNELS = [
  "hue",
  "saturation",
  "brightness",
  "lightness",
  "red",
  "green",
  "blue",
  "alpha",
] as const;
const SETS = [0, 0.5, 1, 37.25, 100, 255, 360];

const INPUTS = [
  "#fff",
  "#FFFFFF",
  "#abc",
  "#0000",
  "#11223344",
  "#ff9f3f",
  "#fff4e6",
  "#d6e6ff",
  "#000000",
  "#7f7f7f",
  "#1e90ff",
  "rgb(255, 0, 0)",
  "rgb(0 128 255)",
  "rgba(10, 20, 30, 0.5)",
  "rgb(10 20 30 / 0.25)",
  "rgb(300, -5, 12)",
  "rgba(1,2,3,50%)",
  "rgb(12, 34, 56)",
  "hsl(200, 98%, 39%)",
  "hsl(0, 100%, 50%)",
  "hsla(120, 50%, 50%, 0.3)",
  "hsl(360, 0%, 100%)",
  "hsl(-30, 40%, 20%)",
  "hsl(725.5, 150%, 50%)",
  "hsl(48, 90%, 60%)",
  "hsb(0, 0%, 100%)",
  "hsb(100, 50%, 100%)",
  "hsb(36, 42%, 100%)",
  "hsba(270, 60%, 70%, 0.5)",
  "hsb(214, 28%, 100%)",
  "hsb(25, 92%, 100%)",
  "hsb(0, 0%, 0%)",
];

const INVALID = ["red", "", "#12", "hsl(1, 2, 3)", "rgb()", "hsb(10, 20, 30)"];

const attempt = <T>(run: () => T): T | { throws: string } => {
  try {
    return run();
  } catch (error) {
    return { throws: error instanceof Error ? error.message : String(error) };
  }
};

/** Every method of the interface, read into plain data. */
function surface(color: Color) {
  const t = COLOR_INTL_TRANSLATIONS;
  const show = (c: Color) => ({ css: c.toString(), space: c.getColorSpace() });
  const clone = color.clone();
  return {
    toString: [undefined, "css" as const, ...FORMATS].map((f) => attempt(() => color.toString(f))),
    toFormat: FORMATS.map((f) => attempt(() => show(color.toFormat(f)))),
    toHexInt: attempt(() => color.toHexInt()),
    space: color.getColorSpace(),
    channels: color.getColorChannels(),
    axes: [
      {},
      { xChannel: color.getColorChannels()[2] },
      { yChannel: color.getColorChannels()[0] },
      { xChannel: color.getColorChannels()[1], yChannel: color.getColorChannels()[2] },
    ].map((xy) => color.getColorSpaceAxes(xy)),
    perChannel: CHANNELS.map((channel) => ({
      channel,
      value: attempt(() => color.getChannelValue(channel)),
      range: attempt(() => color.getChannelRange(channel)),
      options: attempt(() => color.getChannelFormatOptions(channel)),
      formatted: attempt(() => color.formatChannelValue(channel)),
      name: color.getChannelName(channel, t),
      set: SETS.map((v) =>
        attempt(() => {
          const next = color.withChannelValue(channel, v);
          return { css: next.toString("css"), value: next.getChannelValue(channel) };
        }),
      ),
    })),
    colorName: attempt(() => color.getColorName(t)),
    hueName: attempt(() => color.getHueName(t)),
    clone: { css: clone.toString(), distinct: clone !== color },
  };
}

const read = (parse: Parse, input: string) => attempt(() => surface(parse(input)));

describe("the owned Color matches Kobalte's", () => {
  it("keeps the translations table", () => {
    expect(Object.keys(COLOR_INTL_TRANSLATIONS)).toEqual(Object.keys(KOBALTE_TRANSLATIONS));
    expect(COLOR_INTL_TRANSLATIONS.colorName("a", "b", "c")).toBe(
      KOBALTE_TRANSLATIONS.colorName("a", "b", "c"),
    );
  });

  it.each(INPUTS)("%s, through every method", (input) => {
    const kobalte = read(kobalteParse, input);
    expect(kobalte).not.toHaveProperty("throws");
    expect(read(parseColor, input)).toEqual(kobalte);
  });

  it.each(INVALID)("refuses %j with the same error", (input) => {
    expect(attempt(() => parseColor(input))).toEqual(attempt(() => kobalteParse(input)));
    expect(attempt(() => parseColor(input))).toHaveProperty("throws");
  });

  it("names every hue the same, around the wheel and down the lightness", () => {
    const names = (parse: Parse) => {
      const out: string[] = [];
      for (let h = 0; h < 360; h += 5)
        for (const l of [8, 25, 45, 60, 75, 92])
          for (const s of [0, 4, 30, 100]) {
            const c = parse(`hsl(${h}, ${s}%, ${l}%)`);
            out.push(
              `${c.getColorName(COLOR_INTL_TRANSLATIONS)} / ${c.getHueName(COLOR_INTL_TRANSLATIONS)}`,
            );
          }
      return out;
    };
    expect(names(parseColor)).toEqual(names(kobalteParse));
  });

  it("keeps the strings published widgets read", () => {
    expect(parseColor("hsb(25, 92%, 100%)").toString("css")).toBe(
      kobalteParse("hsb(25, 92%, 100%)").toString("css"),
    );
    expect(parseColor("hsb(100, 50%, 100%)").withChannelValue("hue", 110).toString("hsb")).toMatch(
      /hsb\(110,? 50%/,
    );
  });
});
