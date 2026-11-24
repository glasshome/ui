import { type CompiledCatalog, formatMessage } from "@glasshome/widget-contract/i18n-format";
import english, { type UiKey } from "../locales/compiled/en.js";
import { ENGLISH_FORMATTING, messageEnv } from "./format.js";

export type { UiKey };
export type UiTextArgs = Readonly<Record<string, string | number>>;
export type UiText = (key: UiKey, args?: UiTextArgs) => string;

export function translator(
  catalog: CompiledCatalog,
  language: string,
  formatting?: string,
): UiText {
  const env = messageEnv(language, formatting);
  return (key, args = {}) => formatMessage(catalog[key] ?? english[key], args, env);
}

export const englishUiText: UiText = translator(english, "en", ENGLISH_FORMATTING);
