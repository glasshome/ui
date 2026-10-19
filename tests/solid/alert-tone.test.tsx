import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, expect, it, vi } from "vitest";

import { ALERT_TONES, type AlertTone } from "../../src/lib/alert-tones.js";
import { glassToneText } from "../../src/lib/glass-tone.js";
import { Alert, AlertDescription, AlertTitle } from "../../src/solid/alert.js";

// happy-dom drops color-mix() values, so the test reads what the component asked to paint.
const setProperty = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");

afterEach(() => {
  cleanup();
  setProperty.mockClear();
});

const TONES = Object.keys(ALERT_TONES) as AlertTone[];

it.each(TONES)("a child AlertTitle carries the %s tone", (tone) => {
  render(() => (
    <Alert tone={tone}>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Body</AlertDescription>
    </Alert>
  ));
  expect(screen.getByText("Heads up")).toBeTruthy();
  // No title prop is passed, so the child AlertTitle is the only part that paints tone text.
  expect(setProperty.mock.calls).toContainEqual(["color", glassToneText(ALERT_TONES[tone].color)]);
});
