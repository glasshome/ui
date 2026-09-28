/* A stepper's position is a visual pattern (lit bars) plus a spoken one ("Step
 * 2 of 4"); both halves are asserted here because either alone leaves a group
 * of users without the position. */
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { StepIndicator } from "../../src/solid/step-indicator.js";

afterEach(cleanup);

function segments(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-slot="step-indicator-segment"]'),
  );
}

const lit = (el: HTMLElement) => el.className.includes("[--glass-tone:var(--primary)]");

describe("StepIndicator", () => {
  it("renders one bar per step and flags the current one", () => {
    const { container } = render(() => <StepIndicator count={4} index={1} />);
    const rendered = segments(container);
    expect(rendered).toHaveLength(4);
    expect(rendered.map((d) => d.getAttribute("aria-current"))).toEqual([null, "step", null, null]);
  });

  it("speaks the position for screen readers", () => {
    const { container } = render(() => <StepIndicator count={4} index={1} />);
    const label = container.querySelector<HTMLElement>(".sr-only");
    expect(label?.textContent).toBe("Step 2 of 4");
  });

  it("lights the done and current bars, leaves the rest recessed, passes its class through", () => {
    const { container } = render(() => <StepIndicator count={4} index={1} class="probe" />);
    const root = container.querySelector<HTMLElement>('[data-slot="step-indicator"]');
    expect(root?.className).toContain("probe");
    expect(segments(container).map(lit)).toEqual([true, true, false, false]);
    for (const bar of segments(container)) expect(bar.className).toContain("glass-sink");
  });
});
