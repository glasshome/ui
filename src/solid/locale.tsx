import type { CompiledCatalog } from "@glasshome/widget-contract/i18n-format";
import { createContext, createMemo, createResource, type JSX, useContext } from "solid-js";
import { englishFormat, type UiFormat, uiFormat } from "../lib/format.js";
import { englishUiText, translator, type UiText } from "../lib/text.js";
import english from "../locales/compiled/en.js";

export type { UiKey, UiText, UiTextArgs } from "../lib/text.js";
export type { UiFormat };
export type UiCatalogLoader = (language: string) => Promise<CompiledCatalog | undefined>;

const CHUNKS: Readonly<Record<string, () => Promise<{ default: CompiledCatalog }>>> = {
  fr: () => import("../locales/compiled/fr.js"),
  es: () => import("../locales/compiled/es.js"),
  de: () => import("../locales/compiled/de.js"),
  "en-XA": () => import("../locales/compiled/en-XA.js"),
};

export const loadUiCatalog: UiCatalogLoader = async (language) =>
  (await CHUNKS[language]?.())?.default;

interface UiLocale {
  text: UiText;
  format: UiFormat;
}

const ENGLISH: UiLocale = { text: englishUiText, format: englishFormat };

const LocaleContext = createContext<() => UiLocale>(() => ENGLISH);

export function LocaleProvider(props: {
  language: string;
  formatting: string;
  catalog?: UiCatalogLoader;
  messages?: CompiledCatalog;
  children: JSX.Element;
}): JSX.Element {
  const [loaded] = createResource(
    () => (props.messages ? false : props.language),
    async (language) => {
      if (language === "en") return undefined;
      try {
        return await (props.catalog ?? loadUiCatalog)(language);
      } catch {
        return undefined;
      }
    },
  );
  const current = createMemo((): UiLocale => {
    const catalog = props.messages ?? (loaded.state === "ready" ? loaded() : undefined);
    return {
      text: catalog
        ? translator(catalog, props.language, props.formatting)
        : translator(english, "en", props.formatting),
      format: uiFormat(props.formatting),
    };
  });
  return <LocaleContext.Provider value={current}>{props.children}</LocaleContext.Provider>;
}

export function useUiText(): UiText {
  const locale = useContext(LocaleContext);
  return (key, args) => locale().text(key, args);
}

export function useUiFormat(): UiFormat {
  const locale = useContext(LocaleContext);
  return {
    number: (value, options) => locale().format.number(value, options),
    dateTime: (value, options) => locale().format.dateTime(value, options),
    compare: (a, b) => locale().format.compare(a, b),
  };
}
