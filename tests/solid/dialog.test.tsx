import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, Show } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../src/solid/alert-dialog.js";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
} from "../../src/solid/bottom-sheet/index.js";
import { Button } from "../../src/solid/button.js";
import { Dock } from "../../src/solid/dock.js";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../src/solid/dialog.js";
import { Sheet, SheetBody, SheetClose, SheetContent, SheetTitle } from "../../src/solid/sheet.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/solid/tabs.js";

afterEach(cleanup);

const panel = () => {
  const el = document.querySelector<HTMLElement>('[data-slot="dialog-content"]');
  if (!el) throw new Error("no dialog panel rendered");
  return el;
};

const scrollers = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>("*")).filter((el) =>
    el.className.includes("overflow-y-auto"),
  );

const pageLocked = () =>
  document.body.style.overflow === "hidden" || document.body.style.position === "fixed";

describe("Dialog scroll contract", () => {
  it("scrolls in Body only; the panel clips", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogBody>body</DialogBody>
          <DialogFooter>footer</DialogFooter>
        </DialogContent>
      </Dialog>
    ));

    const content = panel();
    expect(content.className).toContain("overflow-hidden");
    expect(content.className).not.toContain("overflow-y-auto");
    const found = scrollers(content);
    expect(found).toHaveLength(1);
    expect(found[0]?.getAttribute("data-slot")).toBe("dialog-body");
    expect(found[0]?.className).toContain("overscroll-contain");
    expect(found[0]?.className).toContain("gh-scroll");
  });

  it("pins Header and Footer as siblings of Body, never inside it", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogBody>body</DialogBody>
          <DialogFooter>footer</DialogFooter>
        </DialogContent>
      </Dialog>
    ));

    const content = panel();
    const slots = Array.from(content.children)
      .map((el) => el.getAttribute("data-slot"))
      .filter(Boolean);
    expect(slots).toEqual(["dialog-header", "dialog-body", "dialog-footer"]);
    const body = content.querySelector<HTMLElement>('[data-slot="dialog-body"]');
    expect(body?.querySelector('[data-slot="dialog-header"]')).toBeNull();
    expect(body?.querySelector('[data-slot="dialog-footer"]')).toBeNull();
    const header = content.querySelector<HTMLElement>('[data-slot="dialog-header"]');
    expect(header?.className).toContain("shrink-0");
    const footer = content.querySelector<HTMLElement>('[data-slot="dialog-footer"]');
    expect(footer?.className).toContain("shrink-0");
  });

  it("keeps two-finger zoom over the scrolling region", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogBody>body</DialogBody>
        </DialogContent>
      </Dialog>
    ));

    const body = panel().querySelector<HTMLElement>('[data-slot="dialog-body"]');
    expect(body?.className).toContain("pinch-zoom");
    expect(body?.className).not.toContain("touch-pan-y");
  });

  it("shortens the Body inset from its Header and Footer siblings, not from its position", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogBody>body</DialogBody>
          <DialogFooter>footer</DialogFooter>
        </DialogContent>
      </Dialog>
    ));

    const body = panel().querySelector<HTMLElement>('[data-slot="dialog-body"]');
    expect(body?.className).toContain("[[data-slot$='-header']~&]:pt-3");
    expect(body?.className).toContain("[&:has(~[data-slot$='-footer'])]:pb-3");
  });

  it("puts the inset padding on the parts, never on the panel", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogBody>body</DialogBody>
        </DialogContent>
      </Dialog>
    ));

    const content = panel();
    expect(content.className).not.toMatch(/(^|\s)p-\d/);
    expect(content.querySelector('[data-slot="dialog-body"]')?.className).toContain("pl-6");
  });
});

describe("Dialog header action", () => {
  it("renders the action beside the title column", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader action={<Button>Reset</Button>}>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogBody>body</DialogBody>
        </DialogContent>
      </Dialog>
    ));

    const header = panel().querySelector<HTMLElement>('[data-slot="dialog-header"]');
    if (!header) throw new Error("no header");
    // The text column takes the free width, so the action sits at the far edge
    // whether or not the header also carries media.
    expect(header.querySelector('[data-slot="dialog-header-text"]')?.className).toContain("grow");
    const parts = Array.from(header.children).map((el) => el.getAttribute("data-slot"));
    expect(parts).toEqual(["dialog-header-text", "dialog-header-action"]);
    expect(header.querySelector('[data-slot="dialog-header-action"]')?.textContent).toBe("Reset");
  });

  it("omits the action node when no action is passed", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    ));

    expect(document.querySelector('[data-slot="dialog-header-action"]')).toBeNull();
  });
});

describe("Dialog size", () => {
  it("maps size to a max width and lets a caller class win", () => {
    render(() => (
      <Dialog open>
        <DialogContent size="sm">a</DialogContent>
      </Dialog>
    ));
    expect(panel().className).toContain("max-w-sm");
    cleanup();

    render(() => (
      <Dialog open>
        <DialogContent>b</DialogContent>
      </Dialog>
    ));
    expect(panel().className).toContain("max-w-lg");
    cleanup();

    render(() => (
      <Dialog open>
        <DialogContent size="lg" class="max-w-2xl">
          c
        </DialogContent>
      </Dialog>
    ));
    expect(
      panel()
        .className.split(/\s+/)
        .filter((t) => t.startsWith("max-w-")),
    ).toEqual(["max-w-2xl"]);
  });
});

describe("Dialog labelling", () => {
  it("points aria-labelledby at the Title and aria-describedby at the Description", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename dashboard</DialogTitle>
            <DialogDescription>Pick a new name.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    ));

    const dialog = panel();
    const labelId = dialog.getAttribute("aria-labelledby");
    const describeId = dialog.getAttribute("aria-describedby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(String(labelId))?.textContent).toBe("Rename dashboard");
    expect(document.getElementById(String(describeId))?.textContent).toBe("Pick a new name.");
  });

  it("names an AlertDialog by its Title", () => {
    render(() => (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add clock</AlertDialogTitle>
            <AlertDialogDescription>Appears on every screen size.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Add</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ));

    expect(screen.getByRole("alertdialog", { name: "Add clock" })).toBeTruthy();
  });

  it("falls back to ariaLabel when there is no Title", () => {
    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="Quick actions">a</DialogContent>
      </Dialog>
    ));

    expect(panel().getAttribute("aria-labelledby")).toBeNull();
    expect(panel().getAttribute("aria-label")).toBe("Quick actions");
  });
});

describe("modal role", () => {
  it("states the role per family, never inheriting the primitive's default", () => {
    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="a">a</DialogContent>
      </Dialog>
    ));
    expect(panel().getAttribute("role")).toBe("dialog");
    cleanup();

    render(() => (
      <Sheet open>
        <SheetContent ariaLabel="b">b</SheetContent>
      </Sheet>
    ));
    expect(document.querySelector('[data-slot="sheet-content"]')?.getAttribute("role")).toBe(
      "dialog",
    );
    cleanup();

    render(() => (
      <AlertDialog open>
        <AlertDialogContent ariaLabel="c">c</AlertDialogContent>
      </AlertDialog>
    ));
    expect(document.querySelector('[data-slot="alert-dialog-content"]')?.getAttribute("role")).toBe(
      "alertdialog",
    );
  });
});

describe("Dialog trigger", () => {
  it("renders one button for Trigger as={Button} and opens on click", async () => {
    render(() => (
      <Dialog>
        <DialogTrigger as={Button}>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Opened</DialogTitle>
        </DialogContent>
      </Dialog>
    ));

    const buttons = document.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0] as HTMLButtonElement);
    expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
  });
});

describe("one page-scroll lock", () => {
  it("holds the dock's mode rim still while a dialog covers the page", async () => {
    const [open, setOpen] = createSignal(false);
    const two = ["a", "b"].map((id) => ({ id, icon: <span />, label: id, onClick: () => {} }));
    const { container } = render(() => (
      <>
        <Dock items={two} glow />
        <Dialog open={open()} onOpenChange={setOpen}>
          <DialogContent ariaLabel="Add widget">library</DialogContent>
        </Dialog>
      </>
    ));
    const orbit = container.querySelector('[data-slot="dock-glow"] > div');
    if (!orbit) throw new Error("no orbit");
    const playState = () => orbit.getAnimations().map((a) => a.playState);

    expect(playState()).toEqual(["running"]);
    setOpen(true);
    expect(playState()).toEqual(["paused"]);
    setOpen(false);
    await vi.waitFor(() => expect(playState()).toEqual(["running"]));
  });

  it("holds the lock until the last nested modal is gone", () => {
    const [inner, setInner] = createSignal(false);

    const { unmount } = render(() => (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Outer</DialogTitle>
          <Show when={inner()}>
            <AlertDialog open>
              <AlertDialogContent>
                <AlertDialogTitle>Inner</AlertDialogTitle>
                <AlertDialogBody>sure?</AlertDialogBody>
              </AlertDialogContent>
            </AlertDialog>
          </Show>
        </DialogContent>
      </Dialog>
    ));

    expect(pageLocked()).toBe(true);

    setInner(true);
    expect(document.querySelector('[data-slot="alert-dialog-content"]')).not.toBeNull();
    expect(pageLocked()).toBe(true);

    setInner(false);
    expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBeNull();
    expect(pageLocked()).toBe(true);

    unmount();
    expect(pageLocked()).toBe(false);
  });

  it("does not lock the page for a closed kobalte-family modal", () => {
    const { unmount } = render(() => (
      <>
        <Dialog>
          <DialogContent ariaLabel="d">d</DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogContent ariaLabel="a">a</AlertDialogContent>
        </AlertDialog>
        <Sheet>
          <SheetContent ariaLabel="s">s</SheetContent>
        </Sheet>
      </>
    ));

    expect(pageLocked()).toBe(false);
    unmount();
    expect(pageLocked()).toBe(false);
  });

  it("releases the lock when a Dialog closes", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent ariaLabel="d">d</DialogContent>
      </Dialog>
    ));

    expect(pageLocked()).toBe(true);
    setOpen(false);
    await vi.waitFor(() =>
      expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull(),
    );
    expect(pageLocked()).toBe(false);
  });

  it("releases the lock when an AlertDialog closes", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <AlertDialog open={open()} onOpenChange={setOpen}>
        <AlertDialogContent ariaLabel="a">a</AlertDialogContent>
      </AlertDialog>
    ));

    expect(pageLocked()).toBe(true);
    setOpen(false);
    await vi.waitFor(() =>
      expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBeNull(),
    );
    expect(pageLocked()).toBe(false);
  });

  it("releases the lock when a Sheet closes", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Sheet open={open()} onOpenChange={setOpen}>
        <SheetContent ariaLabel="s">s</SheetContent>
      </Sheet>
    ));

    expect(pageLocked()).toBe(true);
    setOpen(false);
    await vi.waitFor(() =>
      expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull(),
    );
    expect(pageLocked()).toBe(false);
  });

  it("does not lock the page for a bottom sheet that is mounted but closed", () => {
    const { unmount } = render(() => (
      <BottomSheet>
        <BottomSheetContent ariaLabel="Filters">rows</BottomSheetContent>
      </BottomSheet>
    ));

    expect(pageLocked()).toBe(false);
    unmount();
    expect(pageLocked()).toBe(false);
  });
});

describe("Sheet", () => {
  it("gives the side sheet the same Body scroller", () => {
    render(() => (
      <Sheet open>
        <SheetContent side="right">
          <SheetTitle>Settings</SheetTitle>
          <SheetBody>rows</SheetBody>
        </SheetContent>
      </Sheet>
    ));

    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    if (!content) throw new Error("no sheet content");
    expect(content.className).toContain("overflow-hidden");
    const found = scrollers(content);
    expect(found).toHaveLength(1);
    expect(found[0]?.getAttribute("data-slot")).toBe("sheet-body");
  });

  it("keeps the Body's own inset when an `above` node precedes it", () => {
    render(() => (
      <Sheet open>
        <SheetContent side="right" above={<span>toolbar</span>}>
          <SheetBody>rows</SheetBody>
        </SheetContent>
      </Sheet>
    ));

    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    const slots = Array.from(content?.children ?? [])
      .map((el) => el.getAttribute("data-slot"))
      .filter(Boolean);
    expect(slots).toEqual(["sheet-content-above", "sheet-body"]);
    const body = content?.querySelector<HTMLElement>('[data-slot="sheet-body"]');
    expect(body?.className).toContain("pt-6");
    expect(body?.className).toContain("pb-6");
    expect(body?.className).not.toContain("first-of-type");
  });

  it("slides from an edge, never from the bottom", () => {
    render(() => (
      <Sheet open>
        <SheetContent ariaLabel="s">rows</SheetContent>
      </Sheet>
    ));

    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    expect(content?.className).toContain("slide-in-from-right");
    expect(document.querySelector("[data-sheet-content]")).toBeNull();
  });
});

describe("modal close buttons", () => {
  it("lets the visible text name an AlertDialog action and its cancel", () => {
    render(() => (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this widget?</AlertDialogTitle>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    ));

    expect(screen.getByRole("button", { name: "Delete" }).dataset.slot).toBe("alert-dialog-action");
    expect(screen.getByRole("button", { name: "Cancel" }).dataset.slot).toBe("alert-dialog-cancel");
  });

  it("lets the visible text name DialogClose and SheetClose", () => {
    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="d">
          <DialogClose>Not now</DialogClose>
        </DialogContent>
      </Dialog>
    ));
    expect(screen.getByRole("button", { name: "Not now" }).dataset.slot).toBe("dialog-close");
    cleanup();

    render(() => (
      <Sheet open>
        <SheetContent ariaLabel="s">
          <SheetClose>Dismiss panel</SheetClose>
        </SheetContent>
      </Sheet>
    ));
    expect(screen.getByRole("button", { name: "Dismiss panel" }).dataset.slot).toBe("sheet-close");
  });

  it("keeps an explicit aria-label for an icon-only close", () => {
    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="d">
          <DialogClose aria-label="Close settings">
            <span aria-hidden="true">x</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    ));

    expect(screen.getByRole("button", { name: "Close settings" }).dataset.slot).toBe(
      "dialog-close",
    );
  });

  it("runs the bound `[handler, data]` form, then closes", async () => {
    const calls: Array<[string, string]> = [];
    render(() => (
      <Dialog defaultOpen>
        <DialogContent ariaLabel="d">
          <DialogClose
            onClick={[
              (data: string, event: MouseEvent) => calls.push([data, event.type]),
              "widget-7",
            ]}
          >
            Not now
          </DialogClose>
        </DialogContent>
      </Dialog>
    ));

    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(calls).toEqual([["widget-7", "click"]]);
    await vi.waitFor(() =>
      expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull(),
    );
  });

  it("still closes the modal it belongs to", async () => {
    render(() => (
      <Dialog defaultOpen>
        <DialogContent ariaLabel="d">
          <DialogClose>Not now</DialogClose>
        </DialogContent>
      </Dialog>
    ));

    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    await vi.waitFor(() =>
      expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull(),
    );
  });
});

describe("modal labelling precedence", () => {
  it("names a titled Dialog by its Title even when ariaLabel is passed", () => {
    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="Quick actions">
          <DialogTitle>Rename dashboard</DialogTitle>
        </DialogContent>
      </Dialog>
    ));

    expect(panel().getAttribute("aria-label")).toBeNull();
    expect(screen.getByRole("dialog", { name: "Rename dashboard" })).toBe(panel());
  });

  it("names a titled Sheet by its Title even when ariaLabel is passed", () => {
    render(() => (
      <Sheet open>
        <SheetContent ariaLabel="Quick actions">
          <SheetTitle>Widget settings</SheetTitle>
        </SheetContent>
      </Sheet>
    ));

    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    expect(content?.getAttribute("aria-label")).toBeNull();
    expect(screen.getByRole("dialog", { name: "Widget settings" })).toBe(content);
  });

  it("names a titled AlertDialog by its Title even when ariaLabel is passed", () => {
    render(() => (
      <AlertDialog open>
        <AlertDialogContent ariaLabel="Quick actions">
          <AlertDialogTitle>Delete this widget?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    ));

    const content = document.querySelector<HTMLElement>('[data-slot="alert-dialog-content"]');
    expect(content?.getAttribute("aria-label")).toBeNull();
    expect(content?.getAttribute("aria-labelledby")).toBeTruthy();
    expect(screen.getByRole("alertdialog", { name: "Delete this widget?" })).toBe(content);
  });

  it("falls back to ariaLabel on an untitled AlertDialog", () => {
    render(() => (
      <AlertDialog open>
        <AlertDialogContent ariaLabel="Quick actions">body</AlertDialogContent>
      </AlertDialog>
    ));

    const content = document.querySelector<HTMLElement>('[data-slot="alert-dialog-content"]');
    expect(content?.getAttribute("aria-labelledby")).toBeNull();
    expect(screen.getByRole("alertdialog", { name: "Quick actions" })).toBe(content);
  });

  it("names a titled bottom sheet by its Title even when ariaLabel is passed", () => {
    render(() => (
      <BottomSheet open>
        <BottomSheetContent ariaLabel="Quick actions">
          <BottomSheetTitle>Filters</BottomSheetTitle>
        </BottomSheetContent>
      </BottomSheet>
    ));

    const sheet = document.querySelector<HTMLElement>("[data-sheet-content]");
    expect(sheet?.getAttribute("aria-label")).toBeNull();
    expect(screen.getByRole("dialog", { name: "Filters" })).toBe(sheet);
  });

  it("falls back to ariaLabel on an untitled bottom sheet", () => {
    render(() => (
      <BottomSheet open>
        <BottomSheetContent ariaLabel="Quick actions">rows</BottomSheetContent>
      </BottomSheet>
    ));

    expect(screen.getByRole("dialog", { name: "Quick actions" })).toBe(
      document.querySelector("[data-sheet-content]"),
    );
  });
});

describe("modal header media", () => {
  it("renders the media column before the text column, action last", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader media={<span>avatar</span>} action={<Button>Reset</Button>}>
            <DialogTitle>Ada Lovelace</DialogTitle>
            <DialogDescription>Home Assistant account</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    ));

    const header = panel().querySelector<HTMLElement>('[data-slot="dialog-header"]');
    if (!header) throw new Error("no header");
    expect(Array.from(header.children).map((el) => el.getAttribute("data-slot"))).toEqual([
      "dialog-header-media",
      "dialog-header-text",
      "dialog-header-action",
    ]);
    expect(header.querySelector('[data-slot="dialog-header-media"]')?.textContent).toBe("avatar");
  });

  it("omits the media node when no media is passed", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    ));

    expect(document.querySelector('[data-slot="dialog-header-media"]')).toBeNull();
  });
});

describe("modal parts as", () => {
  it("renders the Body as a form that keeps the scroll contract and submits", async () => {
    let submitted = false;
    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="d">
          <DialogBody
            as="form"
            id="edit-widget"
            onSubmit={(event) => {
              event.preventDefault();
              submitted = true;
            }}
          >
            fields
            <button type="submit">Save</button>
          </DialogBody>
        </DialogContent>
      </Dialog>
    ));

    const body = panel().querySelector<HTMLElement>('[data-slot="dialog-body"]');
    expect(body?.tagName).toBe("FORM");
    expect(body?.getAttribute("id")).toBe("edit-widget");
    expect(body?.className).toContain("overflow-y-auto");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(submitted).toBe(true);
  });

  it("renders the Content as a form panel", () => {
    render(() => (
      <Dialog open>
        <DialogContent as="form" ariaLabel="d">
          <DialogBody>fields</DialogBody>
        </DialogContent>
      </Dialog>
    ));

    expect(panel().tagName).toBe("FORM");
  });
});

describe("a tab row hosted by the modal Header", () => {
  it("wraps the header on request and keeps Header, Body and Footer the panel's own children", () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <Tabs value="a" layout="split">
            <DialogHeader
              wrap
              action={
                <TabsList>
                  <TabsTrigger value="a">Controls</TabsTrigger>
                  <TabsTrigger value="b">Edit</TabsTrigger>
                </TabsList>
              }
            >
              <DialogTitle>Living room lamp</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <TabsContent value="a">controls</TabsContent>
              <TabsContent value="b">edit</TabsContent>
            </DialogBody>
            <DialogFooter>
              <Button>Save</Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    ));

    const content = panel();
    // display:contents on the Tabs root: the parts stay siblings of each other,
    // so the panel's flex column and the Body's `~` inset rules still apply.
    const tabsRoot = content.querySelector<HTMLElement>('[data-slot="tabs"]');
    if (!tabsRoot) throw new Error("no tabs root");
    expect(tabsRoot.className.split(/\s+/)).toContain("contents");
    expect(
      Array.from(tabsRoot.children)
        .map((el) => el.getAttribute("data-slot"))
        .filter(Boolean),
    ).toEqual(["dialog-header", "dialog-body", "dialog-footer"]);
    const header = content.querySelector<HTMLElement>('[data-slot="dialog-header"]');
    expect(header?.className).toContain("flex-wrap");
    expect(header?.querySelector('[data-slot="tabs-list"]')).not.toBeNull();
    expect(
      content.querySelector('[data-slot="dialog-body"] [data-slot="tabs-content"]'),
    ).not.toBeNull();
  });
});

describe("an anchored dialog", () => {
  const anchorAt = (left: number, top: number, width: number, height: number) => {
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;left:${left}px;top:${top}px;width:${width}px;height:${height}px`;
    document.body.appendChild(el);
    return el;
  };

  beforeEach(() => page.viewport(1440, 900));
  afterEach(async () => {
    document.body.innerHTML = "";
    await page.viewport(1024, 768);
  });

  it("grows out of the middle of the element that opened it", () => {
    const tile = anchorAt(500, 300, 200, 150);
    render(() => (
      <Dialog open>
        <DialogContent size="sm" anchor={tile} ariaLabel="Lights" style={{ height: "400px" }}>
          extras
        </DialogContent>
      </Dialog>
    ));

    expect(panel().style.left).toBe(`${500 + (200 - 384) / 2}px`);
    expect(panel().style.top).toBe(`${300 + (150 - 400) / 2}px`);
    expect(panel().style.width).toBe("384px");
    expect(panel().style.getPropertyValue("--morph-w")).toBe("200px");
    expect(panel().style.getPropertyValue("--morph-h")).toBe("150px");
    expect(panel().className).not.toContain("top-1/2");
  });

  it("shifts only as far as the screen needs, and starts from where the element is", () => {
    const tile = anchorAt(1100, 100, 300, 240);
    render(() => (
      <Dialog open>
        <DialogContent size="sm" anchor={tile} ariaLabel="Living Room" style={{ height: "300px" }}>
          extras
        </DialogContent>
      </Dialog>
    ));

    expect(panel().style.left).toBe(`${1440 - 16 - 384}px`);
    expect(panel().style.getPropertyValue("--morph-x")).toBe(`${1100 - (1440 - 16 - 384)}px`);
  });

  it("opens upward from an element near the bottom, keeping its full height", () => {
    const tile = anchorAt(300, 760, 200, 120);
    render(() => (
      <Dialog open>
        <DialogContent size="sm" anchor={tile} ariaLabel="Weather" style={{ height: "600px" }}>
          extras
        </DialogContent>
      </Dialog>
    ));

    expect(panel().style.top).toBe(`${900 - 16 - 600}px`);
    expect(panel().style.maxHeight).toBe(`${900 - 32}px`);
    expect(panel().style.getPropertyValue("--morph-y")).toBe(`${760 - (900 - 16 - 600)}px`);
  });
});

describe("Dialog body gutter", () => {
  const gutter = () =>
    document
      .querySelector<HTMLElement>('[data-slot="dialog-body"]')
      ?.style.getPropertyValue("--scrollbar-gutter");

  /* The platform's scrollbar kind, emulated the way a viewport is: overlay bars take no room. */
  const overlayScrollbars = (overlay: boolean) =>
    overlay
      ? cdp().send("Emulation.setDeviceMetricsOverride", {
          width: 0,
          height: 0,
          deviceScaleFactor: 0,
          mobile: true,
        })
      : cdp().send("Emulation.clearDeviceMetricsOverride");

  it.each([
    ["an overlay scrollbar", true, "0px"],
    ["a classic scrollbar", false, "10px"],
  ])("subtracts what %s reserves", async (_, overlay, expected) => {
    await overlayScrollbars(overlay);
    try {
      render(() => (
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogBody>Body</DialogBody>
          </DialogContent>
        </Dialog>
      ));
      expect(gutter()).toBe(expected);
    } finally {
      await overlayScrollbars(false);
    }
  });
});
