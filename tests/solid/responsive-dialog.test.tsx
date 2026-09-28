import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Button } from "../../src/solid/button.js";
import { setViewportWidth } from "../viewport.js";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "../../src/solid/responsive-dialog.js";

const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 390;

afterEach(() => {
  cleanup();
  setViewportWidth(DESKTOP_WIDTH);
});

beforeEach(() => setViewportWidth(DESKTOP_WIDTH));

function Specimen(props: { class?: string }) {
  return (
    <ResponsiveDialog open>
      <ResponsiveDialogContent class={props.class} size="sm">
        <ResponsiveDialogHeader action={<Button>Reset</Button>}>
          <ResponsiveDialogTitle>Edit widget</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Change what it shows.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>rows</ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button>Save</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

const dialogEl = () => {
  const el = document.querySelector<HTMLElement>('[role="dialog"]');
  if (!el) throw new Error("no dialog rendered");
  return el;
};

const scrollers = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>("*")).filter((el) =>
    el.className.includes("overflow-y-auto"),
  );

describe("ResponsiveDialog desktop branch", () => {
  it("renders a centered dialog panel, not a bottom sheet", () => {
    render(() => <Specimen />);
    expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
    expect(document.querySelector("[data-sheet-content]")).toBeNull();
  });

  it("labels the dialog from the Title and describes it from the Description", () => {
    render(() => <Specimen />);
    const el = dialogEl();
    expect(document.getElementById(String(el.getAttribute("aria-labelledby")))?.textContent).toBe(
      "Edit widget",
    );
    expect(document.getElementById(String(el.getAttribute("aria-describedby")))?.textContent).toBe(
      "Change what it shows.",
    );
  });

  it("scrolls in the Body only", () => {
    render(() => <Specimen />);
    const found = scrollers(dialogEl());
    expect(found).toHaveLength(1);
    expect(found[0]?.getAttribute("data-slot")).toBe("responsive-dialog-body");
  });

  it("puts a caller class on the panel and honours size", () => {
    render(() => <Specimen class="border-dashed" />);
    const el = dialogEl();
    expect(el.className).toContain("border-dashed");
    expect(el.className).toContain("max-w-sm");
  });
});

describe("ResponsiveDialog mobile branch", () => {
  beforeEach(() => setViewportWidth(PHONE_WIDTH));

  it("renders the bottom sheet, not the centered dialog", () => {
    render(() => <Specimen />);
    expect(document.querySelector("[data-sheet-content]")).not.toBeNull();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();
  });

  it("labels the sheet from the Title and describes it from the Description", () => {
    render(() => <Specimen />);
    const el = dialogEl();
    expect(document.getElementById(String(el.getAttribute("aria-labelledby")))?.textContent).toBe(
      "Edit widget",
    );
    expect(document.getElementById(String(el.getAttribute("aria-describedby")))?.textContent).toBe(
      "Change what it shows.",
    );
  });

  it("scrolls in the Body only", () => {
    render(() => <Specimen />);
    const found = scrollers(dialogEl());
    expect(found).toHaveLength(1);
    expect(found[0]?.getAttribute("data-slot")).toBe("responsive-dialog-body");
  });

  it("puts a caller class on the sheet panel and leaves it spanning the viewport", () => {
    render(() => <Specimen class="border-dashed" />);
    const el = dialogEl();
    expect(el.className).toContain("border-dashed");
    // The desktop `size` clamp must not reach the sheet: it is edge to edge.
    expect(el.className).toContain("inset-x-0");
    expect(el.className.split(/\s+/).filter((t) => t.startsWith("max-w-"))).toEqual([]);
  });

  it("keeps Header and Footer out of the scrolling Body", () => {
    render(() => <Specimen />);
    const body = document.querySelector<HTMLElement>('[data-slot="responsive-dialog-body"]');
    expect(body?.querySelector('[data-slot="responsive-dialog-header"]')).toBeNull();
    expect(body?.querySelector('[data-slot="responsive-dialog-footer"]')).toBeNull();
  });
});

describe("ResponsiveDialog trigger", () => {
  it("renders one button for Trigger as={Button} and opens on click", () => {
    render(() => (
      <ResponsiveDialog>
        <ResponsiveDialogTrigger as={Button}>Open</ResponsiveDialogTrigger>
        <ResponsiveDialogContent>
          <ResponsiveDialogTitle>Opened</ResponsiveDialogTitle>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    ));

    const buttons = document.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0] as HTMLButtonElement);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe("ResponsiveDialogClose", () => {
  it("is named by its visible text, on both branches", () => {
    for (const width of [DESKTOP_WIDTH, PHONE_WIDTH]) {
      setViewportWidth(width);
      render(() => (
        <ResponsiveDialog open>
          <ResponsiveDialogContent>
            <ResponsiveDialogTitle>Edit widget</ResponsiveDialogTitle>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose>Not now</ResponsiveDialogClose>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      ));

      expect(screen.getByRole("button", { name: "Not now" }).dataset.slot).toBe(
        "responsive-dialog-close",
      );
      cleanup();
    }
  });
});
