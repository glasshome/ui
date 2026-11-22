import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import fr from "../../src/locales/fr.json";
import { LocaleProvider } from "../../src/solid/locale.js";
import { NumberField } from "../../src/solid/number-field.js";
import { Spinner } from "../../src/solid/spinner.js";

afterEach(cleanup);

const spinnerLabel = (container: HTMLElement) =>
  container.querySelector('[role="status"]')?.getAttribute("aria-label");

describe("LocaleProvider", () => {
  it("speaks English with no provider", () => {
    const { container } = render(() => <Spinner />);
    expect(spinnerLabel(container)).toBe("Loading");
  });

  it("speaks the member's language once its catalog lands", async () => {
    expect(fr["ui.spinner.label"]).not.toBe("Loading");
    const { container } = render(() => (
      <LocaleProvider language="fr" formatting="fr-FR">
        <Spinner />
      </LocaleProvider>
    ));
    await expect.poll(() => spinnerLabel(container)).toBe(fr["ui.spinner.label"]);
  });

  it("stays English when the catalog fails to load", async () => {
    const failed = Promise.reject(new Error("chunk failed"));
    const { container } = render(() => (
      <LocaleProvider language="fr" formatting="fr-FR" catalog={() => failed}>
        <Spinner />
      </LocaleProvider>
    ));
    await failed.catch(() => undefined);
    await Promise.resolve();
    expect(spinnerLabel(container)).toBe("Loading");
  });

  it("formats a number field's spoken value in the formatting locale", () => {
    const { container } = render(() => (
      <LocaleProvider language="en" formatting="de-DE">
        <NumberField value={21.5} step={0.5} />
      </LocaleProvider>
    ));
    const field = container.querySelector('[data-slot="number-field"]');
    expect(field?.getAttribute("aria-valuetext")).toBe("21,5");
  });
});
