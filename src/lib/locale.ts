import { isServer } from "solid-js/web";

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
