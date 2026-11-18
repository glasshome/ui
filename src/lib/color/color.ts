/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * Ported from @internationalized/color by way of @kobalte/core's colors module (MIT).
 */

import { locale } from "../locale";
import type { ColorIntlTranslations } from "./intl";

type ColorFormat = "hex" | "hexa" | "rgb" | "rgba" | "hsl" | "hsla" | "hsb" | "hsba";
type ColorSpace = "rgb" | "hsl" | "hsb";
export type ColorChannel =
  | "hue"
  | "saturation"
  | "brightness"
  | "lightness"
  | "red"
  | "green"
  | "blue"
  | "alpha";
interface ColorAxes {
  xChannel: ColorChannel;
  yChannel: ColorChannel;
  zChannel: ColorChannel;
}
interface ColorChannelRange {
  minValue: number;
  maxValue: number;
  step: number;
  pageSize: number;
}

/** A color value; every method that changes it returns a new one. */
export interface Color {
  toFormat(format: ColorFormat): Color;
  toString(format?: ColorFormat | "css"): string;
  clone(): Color;
  toHexInt(): number;
  /** Throws when the channel is not in the color's space. */
  getChannelValue(channel: ColorChannel): number;
  /** Throws when the channel is not in the color's space. */
  withChannelValue(channel: ColorChannel, value: number): Color;
  getChannelRange(channel: ColorChannel): ColorChannelRange;
  getChannelName(channel: ColorChannel, translations: ColorIntlTranslations): string;
  getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions;
  formatChannelValue(channel: ColorChannel): string;
  getColorSpace(): ColorSpace;
  getColorSpaceAxes(xyChannels: { xChannel?: ColorChannel; yChannel?: ColorChannel }): ColorAxes;
  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel];
  getColorName(translations: ColorIntlTranslations): string;
  getHueName(translations: ColorIntlTranslations): string;
}

type HueName = keyof ColorIntlTranslations;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const format = (value: number, options: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(locale, options).format(value);

/** Parses a color from a string value. Throws an error if the string could not be parsed. */
export function parseColor(value: string): Color {
  const res = RGBColor.parse(value) || HSBColor.parse(value) || HSLColor.parse(value);
  if (res) return res;
  throw new Error(`Invalid color value: ${value}`);
}

function normalizeHue(hue: number): number {
  if (hue === 360) return hue;
  return ((hue % 360) + 360) % 360;
}

const ORANGE_LIGHTNESS_THRESHOLD = 0.68;
const YELLOW_GREEN_LIGHTNESS_THRESHOLD = 0.85;
const MAX_DARK_LIGHTNESS = 0.55;
const GRAY_THRESHOLD = 0.001;

const OKLCH_HUES: [number, HueName][] = [
  [0, "pink"],
  [15, "red"],
  [48, "orange"],
  [94, "yellow"],
  [135, "green"],
  [175, "cyan"],
  [264, "blue"],
  [284, "purple"],
  [320, "magenta"],
  [349, "pink"],
];

abstract class ColorBase implements Color {
  abstract toFormat(format: ColorFormat): Color;
  abstract toString(format?: ColorFormat | "css"): string;
  abstract clone(): Color;
  abstract getChannelRange(channel: ColorChannel): ColorChannelRange;
  abstract getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions;
  abstract formatChannelValue(channel: ColorChannel): string;
  abstract getColorSpace(): ColorSpace;
  abstract getColorChannels(): [ColorChannel, ColorChannel, ColorChannel];

  toHexInt(): number {
    return this.toFormat("rgb").toHexInt();
  }

  getChannelValue(channel: ColorChannel): number {
    if (channel in this) return (this as unknown as Record<ColorChannel, number>)[channel];
    throw new Error(`Unsupported color channel: ${channel}`);
  }

  withChannelValue(channel: ColorChannel, value: number): Color {
    if (channel in this) {
      const x = this.clone();
      (x as unknown as Record<ColorChannel, number>)[channel] = value;
      return x;
    }
    throw new Error(`Unsupported color channel: ${channel}`);
  }

  getChannelName(channel: ColorChannel, translations: ColorIntlTranslations): string {
    return translations[channel];
  }

  getColorSpaceAxes(xyChannels: { xChannel?: ColorChannel; yChannel?: ColorChannel }): ColorAxes {
    const { xChannel, yChannel } = xyChannels;
    const channels = this.getColorChannels();
    const xCh = xChannel || channels.find((c) => c !== yChannel);
    const yCh = yChannel || channels.find((c) => c !== xCh);
    const zCh = channels.find((c) => c !== xCh && c !== yCh);
    return { xChannel: xCh, yChannel: yCh, zChannel: zCh } as ColorAxes;
  }

  getColorName(translations: ColorIntlTranslations): string {
    let [l, c, h] = toOKLCH(this);
    if (l > 0.999) return translations.white;
    if (l < 0.001) return translations.black;
    let hue: string;
    [hue, l] = this.getOklchHue(l, c, h, translations);
    let lightness: "" | HueName = "";
    let chroma: "" | HueName = "";
    if (c <= 0.1 && c >= GRAY_THRESHOLD) {
      chroma = l >= 0.7 ? "pale" : "grayish";
    } else if (c >= 0.15) {
      chroma = "vibrant";
    }
    if (l < 0.3) lightness = "very dark";
    else if (l < MAX_DARK_LIGHTNESS) lightness = "dark";
    else if (l < 0.7) lightness = "";
    else if (l < 0.85) lightness = "light";
    else lightness = "very light";
    const chromaText = chroma ? (translations[chroma] as string) : "";
    const lightnessText = lightness ? (translations[lightness] as string) : "";
    const alpha = this.getChannelValue("alpha");
    if (alpha < 1) {
      const percentTransparent = format(1 - alpha, { style: "percent" });
      return translations
        .transparentColorName(lightnessText, chromaText, hue, percentTransparent)
        .replace(/\s+/g, " ")
        .trim();
    }
    return translations.colorName(lightnessText, chromaText, hue).replace(/\s+/g, " ").trim();
  }

  getOklchHue(
    lightness: number,
    c: number,
    h: number,
    translations: ColorIntlTranslations,
  ): [string, number] {
    let l = lightness;
    if (c < GRAY_THRESHOLD) return [translations.gray, l];
    for (let i = 0; i < OKLCH_HUES.length; i++) {
      let [hue, hueName] = OKLCH_HUES[i] as [number, HueName];
      const [nextHue, nextHueName] = OKLCH_HUES[i + 1] ?? [360, "pink"];
      if (h >= hue && h < nextHue) {
        if (hueName === "orange") {
          if (l < ORANGE_LIGHTNESS_THRESHOLD) hueName = "brown";
          else l = l - ORANGE_LIGHTNESS_THRESHOLD + MAX_DARK_LIGHTNESS;
        }
        if (h > hue + (nextHue - hue) / 2 && hueName !== nextHueName) {
          hueName = `${hueName} ${nextHueName}` as HueName;
        } else if (hueName === "yellow" && l < YELLOW_GREEN_LIGHTNESS_THRESHOLD) {
          hueName = "yellow green";
        }
        return [translations[hueName] as string, l];
      }
    }
    throw new Error("Unexpected hue");
  }

  getHueName(translations: ColorIntlTranslations): string {
    const [l, c, h] = toOKLCH(this);
    const [name] = this.getOklchHue(l, c, h, translations);
    return name;
  }
}

class RGBColor extends ColorBase {
  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = ["red", "green", "blue"];

  constructor(
    public red: number,
    public green: number,
    public blue: number,
    public alpha: number,
  ) {
    super();
  }

  static parse(value: string): RGBColor | undefined {
    let colors: (number | undefined)[] = [];
    if (/^#[\da-f]+$/i.test(value) && [4, 5, 7, 9].includes(value.length)) {
      const values = (value.length < 6 ? value.replace(/[^#]/gi, "$&$&") : value)
        .slice(1)
        .split("");
      while (values.length > 0) colors.push(Number.parseInt(values.splice(0, 2).join(""), 16));
      colors[3] = colors[3] !== undefined ? colors[3] / 255 : undefined;
    }
    const match = value.match(/^rgba?\((.*)\)$/);
    if (match?.[1]) {
      colors = match[1]
        .replace(/(\d+)%$/u, (_substring, numberValue: string) =>
          (Number(numberValue) / 100).toString(),
        )
        .replaceAll(/,|\//gu, " ")
        .replaceAll(/\s{2,}/gu, " ")
        .split(" ")
        .map((part) => Number(part.trim()));
      colors = colors.map((num, i) => clamp(num ?? 0, 0, i < 3 ? 255 : 1));
    }
    const [red, green, blue, alpha] = colors;
    if (red === undefined || green === undefined || blue === undefined) return undefined;
    return colors.length < 3 ? undefined : new RGBColor(red, green, blue, alpha ?? 1);
  }

  toString(format: ColorFormat | "css" = "css"): string {
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    switch (format) {
      case "hex":
        return `#${(hex(this.red) + hex(this.green) + hex(this.blue)).toUpperCase()}`;
      case "hexa":
        return `#${(hex(this.red) + hex(this.green) + hex(this.blue) + hex(Math.round(this.alpha * 255))).toUpperCase()}`;
      case "css":
      case "rgb":
        return `rgb(${this.red}, ${this.green}, ${this.blue}${this.alpha !== 1 && this.alpha !== 100 ? ` / ${this.alpha}` : ""})`;
      case "rgba":
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
      default:
        return this.toFormat(format).toString(format);
    }
  }

  toFormat(format: ColorFormat): Color {
    switch (format) {
      case "hex":
      case "hexa":
      case "rgb":
      case "rgba":
        return this;
      case "hsb":
      case "hsba":
        return this.toHSB();
      case "hsl":
      case "hsla":
        return this.toHSL();
      default:
        throw new Error(`Unsupported color conversion: rgb -> ${format as string}`);
    }
  }

  override toHexInt(): number {
    return (this.red << 16) | (this.green << 8) | this.blue;
  }

  /** https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB */
  private toHSB(): Color {
    const red = this.red / 255;
    const green = this.green / 255;
    const blue = this.blue / 255;
    const min = Math.min(red, green, blue);
    const brightness = Math.max(red, green, blue);
    const chroma = brightness - min;
    const saturation = brightness === 0 ? 0 : chroma / brightness;
    let hue = 0;
    if (chroma !== 0) {
      switch (brightness) {
        case red:
          hue = (green - blue) / chroma + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / chroma + 2;
          break;
        case blue:
          hue = (red - green) / chroma + 4;
          break;
      }
      hue /= 6;
    }
    return new HSBColor(
      toFixedNumber(hue * 360, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(brightness * 100, 2),
      this.alpha,
    );
  }

  /** https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB */
  private toHSL(): Color {
    const red = this.red / 255;
    const green = this.green / 255;
    const blue = this.blue / 255;
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    const lightness = (max + min) / 2;
    const chroma = max - min;
    let hue: number;
    let saturation: number;
    if (chroma === 0) {
      hue = saturation = 0;
    } else {
      saturation = chroma / (lightness < 0.5 ? max + min : 2 - max - min);
      switch (max) {
        case red:
          hue = (green - blue) / chroma + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / chroma + 2;
          break;
        default:
          hue = (red - green) / chroma + 4;
          break;
      }
      hue /= 6;
    }
    return new HSLColor(
      toFixedNumber(hue * 360, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(lightness * 100, 2),
      this.alpha,
    );
  }

  clone(): Color {
    return new RGBColor(this.red, this.green, this.blue, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case "red":
      case "green":
      case "blue":
        return { minValue: 0, maxValue: 255, step: 1, pageSize: 17 };
      case "alpha":
        return { minValue: 0, maxValue: 1, step: 0.01, pageSize: 0.1 };
      default:
        throw new Error(`Unknown color channel: ${channel}`);
    }
  }

  getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case "red":
      case "green":
      case "blue":
        return { style: "decimal" };
      case "alpha":
        return { style: "percent", maximumFractionDigits: 2 };
      default:
        throw new Error(`Unknown color channel: ${channel}`);
    }
  }

  formatChannelValue(channel: ColorChannel): string {
    const options = this.getChannelFormatOptions(channel);
    return format(this.getChannelValue(channel), options);
  }

  getColorSpace(): ColorSpace {
    return "rgb";
  }

  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return RGBColor.colorChannels;
  }
}

const HSB_REGEX =
  /hsb\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsba\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

/** The numbers of an `hsb(...)` or `hsl(...)` match: three channels and an optional alpha. */
function channelsOf(m: RegExpMatchArray): [number, number, number, number | undefined] {
  const [a = 0, b = 0, c = 0, d] = (m[1] ?? m[2] ?? "")
    .split(",")
    .map((n) => Number(n.trim().replace("%", "")));
  return [a, b, c, d];
}

class HSBColor extends ColorBase {
  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = [
    "hue",
    "saturation",
    "brightness",
  ];

  constructor(
    public hue: number,
    public saturation: number,
    public brightness: number,
    public alpha: number,
  ) {
    super();
  }

  static parse(value: string): HSBColor | undefined {
    const m = value.match(HSB_REGEX);
    if (!m) return undefined;
    const [h, s, b, a] = channelsOf(m);
    return new HSBColor(normalizeHue(h), clamp(s, 0, 100), clamp(b, 0, 100), clamp(a ?? 1, 0, 1));
  }

  toString(format: ColorFormat | "css" = "css"): string {
    switch (format) {
      case "css":
        return this.toHSL().toString("css");
      case "hex":
        return this.toRGB().toString("hex");
      case "hexa":
        return this.toRGB().toString("hexa");
      case "hsb":
        return `hsb(${this.hue} ${toFixedNumber(this.saturation, 2)}% ${toFixedNumber(this.brightness, 2)}%)`;
      case "hsba":
        return `hsba(${this.hue} ${toFixedNumber(this.saturation, 2)}% ${toFixedNumber(this.brightness, 2)}% ${this.alpha})`;
      default:
        return this.toFormat(format).toString(format);
    }
  }

  toFormat(format: ColorFormat): Color {
    switch (format) {
      case "hsb":
      case "hsba":
        return this;
      case "hsl":
      case "hsla":
        return this.toHSL();
      case "rgb":
      case "rgba":
        return this.toRGB();
      default:
        throw new Error(`Unsupported color conversion: hsb -> ${format}`);
    }
  }

  /** https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL */
  private toHSL(): Color {
    let saturation = this.saturation / 100;
    const brightness = this.brightness / 100;
    const lightness = brightness * (1 - saturation / 2);
    saturation =
      lightness === 0 || lightness === 1
        ? 0
        : (brightness - lightness) / Math.min(lightness, 1 - lightness);
    return new HSLColor(
      toFixedNumber(this.hue, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(lightness * 100, 2),
      this.alpha,
    );
  }

  /** https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative */
  private toRGB(): Color {
    const hue = this.hue;
    const saturation = this.saturation / 100;
    const brightness = this.brightness / 100;
    const fn = (n: number, k = (n + hue / 60) % 6) =>
      brightness - saturation * brightness * Math.max(Math.min(k, 4 - k, 1), 0);
    return new RGBColor(
      Math.round(fn(5) * 255),
      Math.round(fn(3) * 255),
      Math.round(fn(1) * 255),
      this.alpha,
    );
  }

  clone(): Color {
    return new HSBColor(this.hue, this.saturation, this.brightness, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case "hue":
        return { minValue: 0, maxValue: 360, step: 1, pageSize: 15 };
      case "saturation":
      case "brightness":
        return { minValue: 0, maxValue: 100, step: 1, pageSize: 10 };
      case "alpha":
        return { minValue: 0, maxValue: 1, step: 0.01, pageSize: 0.1 };
      default:
        throw new Error(`Unknown color channel: ${channel}`);
    }
  }

  getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case "hue":
        return { style: "unit", unit: "degree", unitDisplay: "narrow" };
      case "saturation":
      case "brightness":
      case "alpha":
        return { style: "percent", maximumFractionDigits: 2 };
      default:
        throw new Error(`Unknown color channel: ${channel}`);
    }
  }

  formatChannelValue(channel: ColorChannel): string {
    const options = this.getChannelFormatOptions(channel);
    let value = this.getChannelValue(channel);
    if (channel === "saturation" || channel === "brightness") value /= 100;
    return format(value, options);
  }

  getColorSpace(): ColorSpace {
    return "hsb";
  }

  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSBColor.colorChannels;
  }
}

const HSL_REGEX =
  /hsl\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%)\)|hsla\(([-+]?\d+(?:.\d+)?\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d+(?:.\d+)?%\s*,\s*[-+]?\d(.\d+)?)\)/;

class HSLColor extends ColorBase {
  static colorChannels: [ColorChannel, ColorChannel, ColorChannel] = [
    "hue",
    "saturation",
    "lightness",
  ];

  constructor(
    public hue: number,
    public saturation: number,
    public lightness: number,
    public alpha: number,
  ) {
    super();
  }

  static parse(value: string): HSLColor | undefined {
    const m = value.match(HSL_REGEX);
    if (!m) return undefined;
    const [h, s, l, a] = channelsOf(m);
    return new HSLColor(normalizeHue(h), clamp(s, 0, 100), clamp(l, 0, 100), clamp(a ?? 1, 0, 1));
  }

  toString(format: ColorFormat | "css" = "css"): string {
    switch (format) {
      case "hex":
        return this.toRGB().toString("hex");
      case "hexa":
        return this.toRGB().toString("hexa");
      case "hsl":
        return `hsl(${this.hue} ${toFixedNumber(this.saturation, 2)}% ${toFixedNumber(this.lightness, 2)}%${this.alpha !== 1 && this.alpha !== 100 ? ` / ${this.alpha}` : ""})`;
      case "css":
      case "hsla":
        return `hsla(${this.hue} ${toFixedNumber(this.saturation, 2)}% ${toFixedNumber(this.lightness, 2)}% / ${this.alpha})`;
      default:
        return this.toFormat(format).toString(format);
    }
  }

  toFormat(format: ColorFormat): Color {
    switch (format) {
      case "hsl":
      case "hsla":
        return this;
      case "hsb":
      case "hsba":
        return this.toHSB();
      case "rgb":
      case "rgba":
        return this.toRGB();
      default:
        throw new Error(`Unsupported color conversion: hsl -> ${format}`);
    }
  }

  /** https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_HSV */
  private toHSB(): Color {
    let saturation = this.saturation / 100;
    const lightness = this.lightness / 100;
    const brightness = lightness + saturation * Math.min(lightness, 1 - lightness);
    saturation = brightness === 0 ? 0 : 2 * (1 - lightness / brightness);
    return new HSBColor(
      toFixedNumber(this.hue, 2),
      toFixedNumber(saturation * 100, 2),
      toFixedNumber(brightness * 100, 2),
      this.alpha,
    );
  }

  /** https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative */
  private toRGB(): Color {
    const hue = this.hue;
    const saturation = this.saturation / 100;
    const lightness = this.lightness / 100;
    const a = saturation * Math.min(lightness, 1 - lightness);
    const fn = (n: number, k = (n + hue / 30) % 12) =>
      lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return new RGBColor(
      Math.round(fn(0) * 255),
      Math.round(fn(8) * 255),
      Math.round(fn(4) * 255),
      this.alpha,
    );
  }

  clone(): Color {
    return new HSLColor(this.hue, this.saturation, this.lightness, this.alpha);
  }

  getChannelRange(channel: ColorChannel): ColorChannelRange {
    switch (channel) {
      case "hue":
        return { minValue: 0, maxValue: 360, step: 1, pageSize: 15 };
      case "saturation":
      case "lightness":
        return { minValue: 0, maxValue: 100, step: 1, pageSize: 10 };
      case "alpha":
        return { minValue: 0, maxValue: 1, step: 0.01, pageSize: 0.1 };
      default:
        throw new Error(`Unknown color channel: ${channel}`);
    }
  }

  getChannelFormatOptions(channel: ColorChannel): Intl.NumberFormatOptions {
    switch (channel) {
      case "hue":
        return { style: "unit", unit: "degree", unitDisplay: "narrow" };
      case "saturation":
      case "lightness":
      case "alpha":
        return { style: "percent", maximumFractionDigits: 2 };
      default:
        throw new Error(`Unknown color channel: ${channel}`);
    }
  }

  formatChannelValue(channel: ColorChannel): string {
    const options = this.getChannelFormatOptions(channel);
    let value = this.getChannelValue(channel);
    if (channel === "saturation" || channel === "lightness") value /= 100;
    return format(value, options);
  }

  getColorSpace(): ColorSpace {
    return "hsl";
  }

  getColorChannels(): [ColorChannel, ColorChannel, ColorChannel] {
    return HSLColor.colorChannels;
  }
}

function toOKLCH(color: Color): [number, number, number] {
  const rgb = color.toFormat("rgb");
  const [red, green, blue] = linearSRGB(
    rgb.getChannelValue("red") / 255,
    rgb.getChannelValue("green") / 255,
    rgb.getChannelValue("blue") / 255,
  );
  const [x, y, z] = linearSRGBToXYZ(red, green, blue);
  const [l, a, b] = xyzToOKLab(x, y, z);
  return okLabToOKLCH(l, a, b);
}

function okLabToOKLCH(l: number, a: number, b: number): [number, number, number] {
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return [l, Math.sqrt(a ** 2 + b ** 2), hue >= 0 ? hue : hue + 360];
}

function linearSRGB(r: number, g: number, b: number): [number, number, number] {
  return [linearComponent(r), linearComponent(g), linearComponent(b)];
}

function linearComponent(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  if (abs <= 0.04045) return val / 12.92;
  return sign * ((abs + 0.055) / 1.055) ** 2.4;
}

function linearSRGBToXYZ(r: number, g: number, b: number): [number, number, number] {
  const M = [
    506752 / 1228815,
    87881 / 245763,
    12673 / 70218,
    87098 / 409605,
    175762 / 245763,
    12673 / 175545,
    7918 / 409605,
    87881 / 737289,
    1001167 / 1053270,
  ] as const;
  return multiplyMatrix(M, r, g, b);
}

function xyzToOKLab(x: number, y: number, z: number): [number, number, number] {
  const XYZtoLMS = [
    0.819022437996703, 0.3619062600528904, -0.1288737815209879, 0.0329836539323885,
    0.9292868615863434, 0.0361446663506424, 0.0481771893596242, 0.2642395317527308,
    0.6335478284694309,
  ] as const;
  const LMStoOKLab = [
    0.210454268309314, 0.7936177747023054, -0.0040720430116193, 1.9779985324311684,
    -2.42859224204858, 0.450593709617411, 0.0259040424655478, 0.7827717124575296,
    -0.8086757549230774,
  ] as const;
  const [a, b, c] = multiplyMatrix(XYZtoLMS, x, y, z);
  return multiplyMatrix(LMStoOKLab, Math.cbrt(a), Math.cbrt(b), Math.cbrt(c));
}

type Matrix = readonly [number, number, number, number, number, number, number, number, number];

function multiplyMatrix(m: Matrix, x: number, y: number, z: number): [number, number, number] {
  return [
    m[0] * x + m[1] * y + m[2] * z,
    m[3] * x + m[4] * y + m[5] * z,
    m[6] * x + m[7] * y + m[8] * z,
  ];
}

function toFixedNumber(value: number, digits: number, base = 10): number {
  const pow = base ** digits;
  return Math.round(value * pow) / pow;
}
