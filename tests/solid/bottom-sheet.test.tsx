import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { commands } from "vitest/browser";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "../../src/solid/bottom-sheet/bottom-sheet.js";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("BottomSheet trigger and close", () => {
  it("types the button it renders, and nothing else", () => {
    const { container } = render(() => (
      <BottomSheet>
        <BottomSheetTrigger>Open</BottomSheetTrigger>
        <BottomSheetTrigger as="a" href="#open">
          Open as link
        </BottomSheetTrigger>
        <BottomSheetClose as="a" href="#close">
          Close as link
        </BottomSheetClose>
      </BottomSheet>
    ));
    const button = container.querySelector<HTMLElement>('button[data-slot="bottom-sheet-trigger"]');
    expect(button?.getAttribute("type")).toBe("button");
    for (const link of container.querySelectorAll<HTMLElement>("a")) {
      expect(link.hasAttribute("type"), link.outerHTML).toBe(false);
    }
  });
});

describe("BottomSheet labelling", () => {
  it("names the panel from a caller's own title id", () => {
    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetContent>
            <BottomSheetTitle id="my-title">Rename</BottomSheetTitle>
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const panel = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-content"]');
    expect(panel?.getAttribute("aria-labelledby")).toBe("my-title");
    expect(document.getElementById("my-title")?.textContent).toBe("Rename");
  });

  it("follows a title id that changes after mount", () => {
    const [titleId, setTitleId] = createSignal("first-title");
    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetContent>
            <BottomSheetTitle id={titleId()}>Rename</BottomSheetTitle>
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const panel = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-content"]');
    expect(panel?.getAttribute("aria-labelledby")).toBe("first-title");
    setTitleId("second-title");
    expect(panel?.getAttribute("aria-labelledby")).toBe("second-title");
    expect(document.querySelector('[data-slot="bottom-sheet-title"]')?.id).toBe("second-title");
  });

  it("falls back to its own generated title id", () => {
    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetContent>
            <BottomSheetTitle>Rename</BottomSheetTitle>
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const panel = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-content"]');
    const title = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-title"]');
    expect(title?.id).not.toBe("");
    expect(panel?.getAttribute("aria-labelledby")).toBe(title?.id);
  });
});

describe("BottomSheet content style", () => {
  it("keeps the caller's style beside its own", () => {
    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetContent style={{ "--glass-tone": "red" }}>Body</BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const panel = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-content"]');
    expect(panel?.style.getPropertyValue("--glass-tone")).toBe("red");
    expect(panel?.style.getPropertyValue("touch-action")).toBe("none");
  });
});

describe("BottomSheet focus trap", () => {
  it("opens once over a focused control whose focus handlers write state", () => {
    const [touched, setTouched] = createSignal(0);
    const [open, setOpen] = createSignal(false);
    render(() => (
      <>
        <button
          type="button"
          data-testid="outside"
          onFocus={() => setTouched(touched() + 1)}
          onBlur={() => setTouched(touched() + 1)}
        >
          {touched()}
        </button>
        <BottomSheet open={open()} onOpenChange={setOpen}>
          <BottomSheetPortal>
            <BottomSheetContent ariaLabel="Thermostat">Controls</BottomSheetContent>
          </BottomSheetPortal>
        </BottomSheet>
      </>
    ));
    document.querySelector<HTMLElement>('[data-testid="outside"]')?.focus();
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    setOpen(true);
    expect(focus.mock.calls.length).toBeLessThanOrEqual(2);
    focus.mockRestore();
  });
});

describe("BottomSheet motion", () => {
  it("settles from opening to open once nothing animates", async () => {
    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetContent ariaLabel="Sheet">body</BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const panel = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-content"]');
    expect(panel?.getAttribute("data-state")).toBe("opening");
    await vi.waitFor(() => expect(panel?.getAttribute("data-state")).toBe("open"));
  });

  it("times no transition under reduced motion, a literal duration class included", async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    onTestFinished(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetOverlay />
          <BottomSheetContent ariaLabel="Sheet">body</BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const scrim = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-overlay"]');
    expect(scrim).not.toBeNull();
    const parts = [scrim, ...document.querySelectorAll('[data-slot="bottom-sheet-content"] *')];
    for (const el of parts) {
      if (!el) continue;
      const longest = Math.max(
        ...getComputedStyle(el).transitionDuration.split(",").map(parseFloat),
      );
      expect(longest, el.outerHTML.slice(0, 80)).toBeLessThan(0.001);
    }
  });
});

describe("BottomSheet body", () => {
  it("marks its body scrolled once the content leaves the top, and clears it back at the top", async () => {
    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetContent ariaLabel="Sheet">
            <BottomSheetBody>
              <div style={{ height: "3000px", flex: "none" }}>tall</div>
            </BottomSheetBody>
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    const body = document.querySelector<HTMLElement>('[data-slot="bottom-sheet-body"]');
    await vi.waitFor(() => expect(body?.hasAttribute("data-scrolled")).toBe(false));
    body?.scrollTo({ top: 120 });
    await vi.waitFor(() => expect(body?.hasAttribute("data-scrolled")).toBe(true));
    body?.scrollTo({ top: 0 });
    await vi.waitFor(() => expect(body?.hasAttribute("data-scrolled")).toBe(false));
  });
});
