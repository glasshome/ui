import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { formatCompact } from "../../src/solid/charts.js";
import { NumberField } from "../../src/solid/number-field.js";
import { formatWidgetCount } from "../../src/solid/widget-identity.js";

afterEach(cleanup);

describe("no LocaleProvider on a German browser", () => {
  it("runs in a German browser", () => {
    expect(navigator.language).toBe("de-DE");
    expect(new Intl.NumberFormat().format(21.5)).toBe("21,5");
  });

  it("formats a component in en-US", () => {
    const { container } = render(() => <NumberField value={21.5} step={0.5} />);
    const field = container.querySelector('[data-slot="number-field"]');
    expect(field?.getAttribute("aria-valuetext")).toBe("21.5");
  });

  it("formats exported helpers in en-US, as the components do", () => {
    expect(formatCompact(1234)).toBe("1.2k");
    expect(formatWidgetCount(1234)).toBe("1.2k");
  });
});
