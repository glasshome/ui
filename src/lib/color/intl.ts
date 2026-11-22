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

import { englishUiText, type UiText } from "../text.js";

export function colorIntlTranslations(text: UiText) {
  return {
    hue: text("ui.color.hue"),
    saturation: text("ui.color.saturation"),
    lightness: text("ui.color.lightness"),
    brightness: text("ui.color.brightness"),
    red: text("ui.color.red"),
    green: text("ui.color.green"),
    blue: text("ui.color.blue"),
    alpha: text("ui.color.alpha"),
    colorName: (lightness: string, chroma: string, hue: string) =>
      text("ui.color.name", { lightness, chroma, hue }),
    transparentColorName: (
      lightness: string,
      chroma: string,
      hue: string,
      percentTransparent: string,
    ) => text("ui.color.transparent-name", { lightness, chroma, hue, percentTransparent }),
    "very dark": text("ui.color.very-dark"),
    dark: text("ui.color.dark"),
    light: text("ui.color.light"),
    "very light": text("ui.color.very-light"),
    pale: text("ui.color.pale"),
    grayish: text("ui.color.grayish"),
    vibrant: text("ui.color.vibrant"),
    black: text("ui.color.black"),
    white: text("ui.color.white"),
    gray: text("ui.color.gray"),
    pink: text("ui.color.pink"),
    "pink red": text("ui.color.pink-red"),
    "red orange": text("ui.color.red-orange"),
    brown: text("ui.color.brown"),
    orange: text("ui.color.orange"),
    "orange yellow": text("ui.color.orange-yellow"),
    "brown yellow": text("ui.color.brown-yellow"),
    yellow: text("ui.color.yellow"),
    "yellow green": text("ui.color.yellow-green"),
    "green cyan": text("ui.color.green-cyan"),
    cyan: text("ui.color.cyan"),
    "cyan blue": text("ui.color.cyan-blue"),
    "blue purple": text("ui.color.blue-purple"),
    purple: text("ui.color.purple"),
    "purple magenta": text("ui.color.purple-magenta"),
    magenta: text("ui.color.magenta"),
    "magenta pink": text("ui.color.magenta-pink"),
  };
}

export type ColorIntlTranslations = ReturnType<typeof colorIntlTranslations>;

export const COLOR_INTL_TRANSLATIONS: ColorIntlTranslations = colorIntlTranslations(englishUiText);
