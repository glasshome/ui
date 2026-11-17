import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { findScenario } from "../../dev/harness/registry";
import { runSteps, scenarioScope } from "../../dev/harness/steps";
import { Within } from "../../dev/harness/Within";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
  Dialog,
  DialogBody,
  DialogContent,
} from "../../src/solid";
import { expectGap } from "../harness/gap";
import { input } from "../harness/input";
import { settle } from "../harness/mount";

afterEach(() => {
  cleanup();
  for (const spacer of document.querySelectorAll("[data-test-spacer]")) spacer.remove();
});

const pageY = () => document.scrollingElement?.scrollTop ?? 0;

const rootsState = () =>
  [document.documentElement, document.body]
    .map((el) =>
      [
        el.tagName,
        ...[...el.attributes]
          .filter((a) => a.name !== "style" || a.value !== "")
          .map((a) => `${a.name}="${a.value}"`),
      ].join(" "),
    )
    .join(" | ");

const expectRootsAs = (before: string) => {
  const now = rootsState();
  expect(now === before, `html and body now read: ${now}`).toBe(true);
};

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return [box.x + box.width / 2, box.y + box.height / 2] as const;
};

function find(selector: string): Element {
  for (const root of scenarioScope()) {
    const hit = root.querySelector(selector);
    if (hit) return hit;
  }
  throw new Error(`no ${selector}`);
}

const scrollerOf = (panel: Element): Element => {
  const found = [...panel.querySelectorAll("*")].find((el) => el.scrollHeight > el.clientHeight);
  if (!found) throw new Error("no scrolling part");
  return found;
};

interface Parts {
  scrim: Element;
  body: Element;
  header: Element | null;
  close: () => Promise<void>;
}

interface Subject {
  name: string;
  open: () => Promise<Parts>;
  /** What the primitive still writes on body while open; Phase 3 of 2026-11-15-ui-owns-its-primitives removes Kobalte. */
  writesWhileOpen?: string;
}

const spacer = () => {
  const tall = document.createElement("div");
  tall.setAttribute("data-test-spacer", "");
  tall.style.height = "3000px";
  document.body.append(tall);
};

const LONG = Array.from({ length: 60 }, (_, i) => <p>{`Line ${i + 1}`}</p>);

async function openBlock(id: string, within: "page" | "shadow-root"): Promise<Parts> {
  const scenario = findScenario("scroll-contain", id);
  if (!scenario) throw new Error(`no scenario ${id}`);
  render(() => <Within mode={within}>{scenario.render()}</Within>);
  await settle();
  await runSteps(scenarioScope, [{ press: { role: "button", name: "Open modal" } }], input, settle);
  return {
    scrim: find('[data-slot="scroll-contain-scrim"]'),
    body: find('[data-slot="scroll-contain-body"]'),
    header: find('[data-slot="scroll-contain-header"]'),
    close: () =>
      runSteps(scenarioScope, [{ press: { role: "button", name: "Close modal" } }], input, settle),
  };
}

const [dialogOpen, setDialogOpen] = createSignal(false);

async function openDialog(): Promise<Parts> {
  spacer();
  setDialogOpen(false);
  render(() => (
    <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
      <DialogContent ariaLabel="Real dialog">
        <DialogBody>{LONG}</DialogBody>
      </DialogContent>
    </Dialog>
  ));
  setDialogOpen(true);
  await vi.waitFor(() => find('[role="dialog"]'));
  await settle();
  const panel = find('[role="dialog"]');
  return {
    scrim: find('[data-slot="dialog-overlay"]'),
    body: scrollerOf(panel),
    header: null,
    close: async () => {
      setDialogOpen(false);
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    },
  };
}

const [sheetOpen, setSheetOpen] = createSignal(false);

async function openSheet(): Promise<Parts> {
  spacer();
  setSheetOpen(false);
  const view = (): JSX.Element => (
    <BottomSheet open={sheetOpen()} onOpenChange={setSheetOpen}>
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <BottomSheetContent>
          <BottomSheetBody>
            <BottomSheetTitle>Real sheet</BottomSheetTitle>
            {LONG}
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
  render(view);
  setSheetOpen(true);
  await vi.waitFor(() => find('[role="dialog"]'));
  await settle();
  const panel = find('[role="dialog"]');
  return {
    scrim: find('[data-slot="bottom-sheet-overlay"]'),
    body: scrollerOf(panel),
    header: null,
    close: async () => {
      setSheetOpen(false);
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    },
  };
}

const SUBJECTS: Subject[] = [
  { name: "a centred modal", open: () => openBlock("modal", "page") },
  { name: "a sheet from the bottom", open: () => openBlock("sheet", "page") },
  { name: "the Dialog", open: openDialog, writesWhileOpen: 'BODY style="pointer-events: none;"' },
  { name: "the BottomSheet", open: openSheet },
];

async function wheelOver(el: Element, deltaY: number) {
  const [x, y] = centre(el);
  await commands.wheel(x, y, deltaY);
}

const corner = { x: 8, y: 8 };

async function wheelToEndOfBody(body: Element) {
  await vi.waitFor(async () => {
    await wheelOver(body, 2000);
    expect(body.scrollTop + body.clientHeight).toBeGreaterThanOrEqual(body.scrollHeight - 1);
  });
}

/** The page's scroll position after a wheel past the end of the body, then after one over the scrim. */
async function pageYAfterWheels(parts: Parts) {
  await wheelToEndOfBody(parts.body);
  await wheelOver(parts.body, 1500);
  await settle();
  const pastBody = pageY();
  await commands.wheel(corner.x, corner.y, 1500);
  await settle();
  return [pastBody, pageY()];
}

describe("scroll-contain contract", () => {
  describe.each(SUBJECTS)("$name", (subject) => {
    it("SC1 a wheel at the end of the body and over the scrim leaves the page where it is", async () => {
      expect(await pageYAfterWheels(await subject.open())).toEqual([0, 0]);
    });

    it("SC3 open and close leave html and body as they were", async () => {
      const before = rootsState();
      const parts = await subject.open();
      const whileOpen = () => expectRootsAs(before);
      if (subject.writesWhileOpen) await expectGap(whileOpen, subject.writesWhileOpen);
      else whileOpen();
      await parts.close();
      await settle();
      expectRootsAs(before);
    });
  });

  it("SC2 a touch drag on the scrim leaves the page where it is", async () => {
    const parts = await openBlock("modal", "page");
    await commands.pointer("finger");
    const { x, y } = corner;
    await commands.touch("down", x, y + 400);
    for (let step = 1; step <= 8; step++) await commands.touch("move", x, y + 400 - step * 45);
    await commands.touch("up", x, y);
    await settle();
    await commands.pointer("mouse");
    expect(pageY()).toBe(0);
    expect(parts.scrim.isConnected).toBe(true);
  });

  it("SC4 a wheel over the header of the modal", async () => {
    const parts = await openBlock("modal", "page");
    if (!parts.header) throw new Error("no header");
    await wheelOver(parts.header, 1500);
    await settle();
    expect(pageY()).toBe(0);
  });

  it("SC5 inside a closed shadow root the page stays still and html and body are untouched", async () => {
    const before = rootsState();
    const parts = await openBlock("modal", "shadow-root");
    expectRootsAs(before);
    expect(await pageYAfterWheels(parts)).toEqual([0, 0]);
    await parts.close();
    await settle();
    expectRootsAs(before);
  });
});
