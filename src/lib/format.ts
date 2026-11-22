import type { FormatEnv } from "@glasshome/widget-contract/i18n-format";
import { isServer } from "solid-js/web";

export type ReadingDirection = "ltr" | "rtl";

export interface UiFormat {
  number(value: number, options?: Intl.NumberFormatOptions): string;
  dateTime(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  compare(a: string, b: string): number;
}

const RTL_SCRIPTS = new Set([
  "Arab",
  "Syrc",
  "Samr",
  "Mand",
  "Thaa",
  "Mend",
  "Nkoo",
  "Adlm",
  "Rohg",
  "Hebr",
]);

const RTL_LANGS = new Set([
  "ae",
  "ar",
  "arc",
  "bcc",
  "bqi",
  "ckb",
  "dv",
  "fa",
  "glk",
  "he",
  "ku",
  "mzn",
  "nqo",
  "pnb",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
]);

function directionOf(locale: string): ReadingDirection {
  if (typeof Intl.Locale === "function") {
    const script = new Intl.Locale(locale).maximize().script ?? "";
    return RTL_SCRIPTS.has(script) ? "rtl" : "ltr";
  }
  return RTL_LANGS.has(locale.split("-")[0] ?? "") ? "rtl" : "ltr";
}

function browserLocale(): string {
  const language = typeof navigator === "undefined" ? undefined : navigator.language;
  if (!language) return "en-US";
  try {
    Intl.DateTimeFormat.supportedLocalesOf([language]);
    return language;
  } catch {
    return "en-US";
  }
}

// The server renders en-US, as Kobalte did.
export const readingDirection: ReadingDirection = directionOf(isServer ? "en-US" : browserLocale());

const cache = new Map<string, unknown>();

function cached<T>(
  kind: string,
  locale: string | undefined,
  options: object | undefined,
  make: () => T,
): T {
  const id = `${kind}|${locale ?? ""}|${JSON.stringify(options ?? {})}`;
  let hit = cache.get(id) as T | undefined;
  if (hit === undefined) {
    hit = make();
    cache.set(id, hit);
  }
  return hit;
}

function validTag(locale: string | undefined): string | undefined {
  if (locale === undefined) return undefined;
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
}

export function uiFormat(formatting?: string): UiFormat {
  const locale = validTag(formatting);
  return {
    number: (value, options) =>
      cached("number", locale, options, () => new Intl.NumberFormat(locale, options)).format(value),
    dateTime: (value, options) =>
      cached("date", locale, options, () => new Intl.DateTimeFormat(locale, options)).format(value),
    compare: (a, b) =>
      cached("collator", locale, undefined, () => new Intl.Collator(locale)).compare(a, b),
  };
}

export function messageEnv(language: string, formatting?: string): FormatEnv {
  const plural = validTag(language) ?? "en";
  const rules = cached("plural", plural, undefined, () => new Intl.PluralRules(plural));
  const format = uiFormat(formatting);
  return { plural: (n) => rules.select(n), number: (n) => format.number(n) };
}
