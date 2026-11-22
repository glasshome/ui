import { describe, expect, it } from "vitest";
import { compileUiCatalogs } from "../../scripts/compile-catalogs.js";
import de from "../../src/locales/compiled/de.js";
import en from "../../src/locales/compiled/en.js";
import enXA from "../../src/locales/compiled/en-XA.js";
import es from "../../src/locales/compiled/es.js";
import fr from "../../src/locales/compiled/fr.js";

describe("compiled ui catalogs", () => {
  it("match their sources: run `bun run catalogs` after editing a locale", () => {
    expect({ de, en, "en-XA": enXA, es, fr }).toEqual(compileUiCatalogs());
  });
});
