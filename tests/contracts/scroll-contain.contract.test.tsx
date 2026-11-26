import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { Dialog, DialogBody, DialogContent } from "../../src/solid";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
} from "../../src/solid/bottom-sheet/index.js";
import { settle } from "../harness/mount";
import { corner, find, openBlock, type Parts, pageY } from "./scroll-contain-parts";

afterEach(() => {
  cleanup();
  for (const spacer of document.querySelectorAll("[data-test-spacer]")) spacer.remove();
});

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

const scrollerOf = (panel: Element): Element => {
  const found = [...panel.querySelectorAll("*")].find((el) => el.scrollHeight > el.clientHeight);
  if (!found) throw new Error("no scrolling part");
  return found;
};

interface Subject {
  name: string;
  open: () => Promise<Parts>;
}

const spacer = () => {
  const tall = document.createElement("div");
  tall.setAttribute("data-test-spacer", "");
  tall.style.height = "3000px";
  document.body.append(tall);
};

const LONG = Array.from({ length: 60 }, (_, i) => <p>{`Line ${i + 1}`}</p>);

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
  await expect.poll(() => find('[role="dialog"]')).toBeTruthy();
  await settle();
  const panel = find('[role="dialog"]');
  return {
    scrim: find('[data-slot="dialog-overlay"]'),
    body: scrollerOf(panel),
    header: null,
    close: async () => {
      setDialogOpen(false);
      await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
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
  await expect.poll(() => find('[role="dialog"]')).toBeTruthy();
  await settle();
  const panel = find('[role="dialog"]');
  return {
    scrim: find('[data-slot="bottom-sheet-overlay"]'),
    body: scrollerOf(panel),
    header: null,
    close: async () => {
      setSheetOpen(false);
      await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
    },
  };
}

const SUBJECTS: Subject[] = [
  { name: "a centred modal", open: () => openBlock("modal", "page") },
  { name: "a sheet from the bottom", open: () => openBlock("sheet", "page") },
  { name: "the Dialog", open: openDialog },
  { name: "the BottomSheet", open: openSheet },
];

async function wheelOver(el: Element, deltaY: number) {
  const [x, y] = centre(el);
  await commands.wheel(x, y, deltaY);
}

async function wheelToEndOfBody(body: Element) {
  await expect
    .poll(async () => {
      await wheelOver(body, 2000);
      return body.scrollHeight - body.clientHeight - body.scrollTop;
    })
    .toBeLessThanOrEqual(1);
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
      expectRootsAs(before);
      await parts.close();
      await settle();
      expectRootsAs(before);
    });
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
