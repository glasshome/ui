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
 * Ported from @internationalized/color by way of Kobalte's colors module (MIT).
 */

export const COLOR_INTL_TRANSLATIONS = {
  hue: "Hue",
  saturation: "Saturation",
  lightness: "Lightness",
  brightness: "Brightness",
  red: "Red",
  green: "Green",
  blue: "Blue",
  alpha: "Alpha",
  colorName: (lightness: string, chroma: string, hue: string) => `${lightness} ${chroma} ${hue}`,
  transparentColorName: (
    lightness: string,
    chroma: string,
    hue: string,
    percentTransparent: string,
  ) => `${lightness} ${chroma} ${hue}, ${percentTransparent} transparent`,
  "very dark": "very dark",
  dark: "dark",
  light: "light",
  "very light": "very light",
  pale: "pale",
  grayish: "grayish",
  vibrant: "vibrant",
  black: "black",
  white: "white",
  gray: "gray",
  pink: "pink",
  "pink red": "pink red",
  "red orange": "red orange",
  brown: "brown",
  orange: "orange",
  "orange yellow": "orange yellow",
  "brown yellow": "brown yellow",
  yellow: "yellow",
  "yellow green": "yellow green",
  "green cyan": "green cyan",
  cyan: "cyan",
  "cyan blue": "cyan blue",
  "blue purple": "blue purple",
  purple: "purple",
  "purple magenta": "purple magenta",
  magenta: "magenta",
  "magenta pink": "magenta pink",
};

export type ColorIntlTranslations = typeof COLOR_INTL_TRANSLATIONS;
