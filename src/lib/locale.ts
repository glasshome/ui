import { isServer } from "solid-js/web";

export type ReadingDirection = "ltr" | "rtl";

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
export const locale: string = isServer ? "en-US" : browserLocale();

export const readingDirection: ReadingDirection = directionOf(locale);
