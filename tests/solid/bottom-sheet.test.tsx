import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
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
    expect(panel?.style.getPropertyValue("touch-action")).toBe("pan-y");
  });
});
