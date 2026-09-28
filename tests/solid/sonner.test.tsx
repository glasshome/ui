import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real outlet renders nothing until a toast is queued; the position is the
// only thing under test, so the outlet is a stub that reports what it was given.
vi.mock("solid-sonner", () => ({
  Toaster: (props: { position?: string }) => <div data-position={props.position} />,
  toast: Object.assign(() => "", {
    success: () => "",
    error: () => "",
    warning: () => "",
    info: () => "",
    loading: () => "",
    message: () => "",
    custom: () => "",
    dismiss: () => "",
    promise: () => "",
    getHistory: () => [],
    getToasts: () => [],
  }),
}));

import { MOBILE_BREAKPOINT } from "../../src/lib/use-is-mobile.js";
import { Toaster } from "../../src/solid/sonner.js";

afterEach(cleanup);

function positionAt(width: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  const { container } = render(() => <Toaster />);
  const outlet = container.querySelector<HTMLElement>("[data-position]");
  if (!outlet) throw new Error("toast outlet did not render");
  return outlet.dataset.position;
}

describe("Toaster position", () => {
  it("flips to the top on the one shared mobile breakpoint, not a second one", () => {
    expect(positionAt(MOBILE_BREAKPOINT - 1)).toBe("top-center");
    cleanup();
    // 700px read as mobile while sonner kept its own 768 copy of the detector.
    expect(positionAt(MOBILE_BREAKPOINT + 60)).toBe("bottom-right");
  });
});
