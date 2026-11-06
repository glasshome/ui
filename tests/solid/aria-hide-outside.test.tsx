import { cleanup, render } from "@solidjs/testing-library";
import { createEffect, createSignal, type JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "../../src/solid/alert-dialog.js";
import { Button } from "../../src/solid/button.js";
import { Dialog, DialogContent, DialogTitle } from "../../src/solid/dialog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../src/solid/dropdown-menu.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../src/solid/popover.js";
import { PortalMountContext } from "../../src/solid/portal-mount.js";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../src/solid/select.js";
import { Sheet, SheetContent, SheetTitle } from "../../src/solid/sheet.js";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const frames = async (count: number) => {
  for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
};

/** Kobalte hides through setTimeout then requestAnimationFrame, so a pass lands a few frames after the open. */
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 60));
  await frames(3);
  await new Promise((resolve) => setTimeout(resolve, 60));
};

function closedRoot() {
  const holder = document.createElement("div");
  document.body.appendChild(holder);
  const root = holder.attachShadow({ mode: "closed" });
  const mount = document.createElement("div");
  root.appendChild(mount);
  return mount;
}

/** The focused element climbs through shadow hosts to the document. */
function focusChain(): Element[] {
  const chain: Element[] = [];
  let node: Node | null = document.activeElement;
  while (node) {
    if (node instanceof Element) chain.push(node);
    const root: Node = node.getRootNode();
    node = node.parentNode ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return chain;
}

const describeEl = (el: Element) =>
  `${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? el.getAttribute("role") ?? el.className.toString().slice(0, 30)}]`;

const dump = () =>
  focusChain()
    .map(
      (el) =>
        `${describeEl(el)}${el.getAttribute("aria-hidden") ? " HIDDEN" : ""}${el.hasAttribute("data-top-layer") ? " TL" : ""}`,
    )
    .join(" < ");

const hiddenFocusChain = () =>
  focusChain().filter((el) => el.getAttribute("aria-hidden") === "true");

function watch() {
  const body: string[] = [];
  const onFocusPath: string[] = [];
  const observer = new MutationObserver((changes) => {
    for (const change of changes) {
      const el = change.target;
      if (!(el instanceof Element) || el.getAttribute("aria-hidden") !== "true") continue;
      if (el === document.body) body.push("body");
      if (focusChain().includes(el)) onFocusPath.push(el.tagName.toLowerCase());
    }
  });
  observer.observe(document, {
    attributes: true,
    attributeFilter: ["aria-hidden"],
    subtree: true,
  });
  const errors: string[] = [];
  const onError = (e: ErrorEvent) => errors.push(e.message);
  window.addEventListener("error", onError);
  return {
    body,
    onFocusPath,
    errors,
    stop() {
      observer.disconnect();
      window.removeEventListener("error", onError);
    },
  };
}

const fruit = ["Apple", "Banana"];

const alone: Record<string, () => JSX.Element> = {
  dialog: () => (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Edit</DialogTitle>
        <Button>Save</Button>
      </DialogContent>
    </Dialog>
  ),
  sheet: () => (
    <Sheet open>
      <SheetContent>
        <SheetTitle>Details</SheetTitle>
        <Button>Save</Button>
      </SheetContent>
    </Sheet>
  ),
  alertDialog: () => (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogTitle>Sure?</AlertDialogTitle>
        <Button>Yes</Button>
      </AlertDialogContent>
    </AlertDialog>
  ),
  popover: () => (
    <Popover open>
      <PopoverTrigger as={Button}>Open</PopoverTrigger>
      <PopoverContent>
        <Button>Inside</Button>
      </PopoverContent>
    </Popover>
  ),
  dropdownMenu: () => (
    <DropdownMenu open>
      <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>One</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  select: () => (
    <Select
      options={fruit}
      open
      itemComponent={(p) => <SelectItem item={p.item}>{String(p.item.rawValue)}</SelectItem>}
    >
      <SelectTrigger>Pick</SelectTrigger>
      <SelectContent />
    </Select>
  ),
};

const stacked: Record<string, (inner: () => boolean) => JSX.Element> = {
  "dialog over a select": (inner) => (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Edit</DialogTitle>
        <Select
          options={fruit}
          open={inner()}
          itemComponent={(p) => <SelectItem item={p.item}>{String(p.item.rawValue)}</SelectItem>}
        >
          <SelectTrigger>Pick</SelectTrigger>
          <SelectContent />
        </Select>
      </DialogContent>
    </Dialog>
  ),
  "dialog over a popover": (inner) => (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Edit</DialogTitle>
        <Popover open={inner()}>
          <PopoverTrigger as={Button}>Open</PopoverTrigger>
          <PopoverContent>
            <Button>Inside</Button>
          </PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>
  ),
  "dialog over a menu": (inner) => (
    <Dialog open>
      <DialogContent>
        <DialogTitle>Edit</DialogTitle>
        <DropdownMenu open={inner()}>
          <DropdownMenuTrigger as={Button}>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>One</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DialogContent>
    </Dialog>
  ),
  "sheet over an alert dialog": (inner) => (
    <Sheet open>
      <SheetContent>
        <SheetTitle>Details</SheetTitle>
        <AlertDialog open={inner()}>
          <AlertDialogContent>
            <AlertDialogTitle>Sure?</AlertDialogTitle>
            <Button>Yes</Button>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  ),
  "dialog handing off to a dialog": (inner) => {
    const [which, setWhich] = createSignal<"a" | "b" | null>("a");
    createEffect(() => inner() && setWhich("b"));
    return (
      <>
        <Dialog open={which() === "a"}>
          <DialogContent>
            <DialogTitle>A</DialogTitle>
            <Button>A button</Button>
          </DialogContent>
        </Dialog>
        <Dialog open={which() === "b"}>
          <DialogContent>
            <DialogTitle>B</DialogTitle>
            <Button>B button</Button>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

const seat = (ui: () => JSX.Element, shadow: boolean) => {
  const page = document.createElement("div");
  document.body.appendChild(page);
  const outside = document.createElement("button");
  outside.textContent = "page";
  page.appendChild(outside);
  if (!shadow) return render(ui, { container: page });
  const mount = closedRoot();
  return render(
    () => <PortalMountContext.Provider value={mount}>{ui()}</PortalMountContext.Provider>,
    {
      container: mount,
    },
  );
};

for (const [where, shadow] of [
  ["in the page", false],
  ["in a closed shadow root", true],
] as const) {
  describe(`hiding the rest of the page ${where}`, () => {
    const scenes = [
      ...Object.entries(alone).map(([name, ui]) => [name, () => ui()] as const),
      ...Object.entries(stacked),
    ];
    for (const [name, ui] of scenes) {
      it(`${name} never hides the body or the focused path`, async () => {
        const seen = watch();
        const [inner, setInner] = createSignal(false);
        seat(() => ui(inner), shadow);
        await settle();
        setInner(true);
        await settle();
        expect(document.body.getAttribute("aria-hidden")).not.toBe("true");
        expect(hiddenFocusChain().map(describeEl), dump()).toEqual([]);
        cleanup();
        await settle();
        seen.stop();
        expect(seen.body).toEqual([]);
        expect(seen.onFocusPath).toEqual([]);
        expect(seen.errors).toEqual([]);
        expect(document.body.getAttribute("aria-hidden")).not.toBe("true");
      });
    }
  });
}

describe("a modal in the page while a seat holds focus in a closed shadow root", () => {
  it("leaves the seat's focus path visible", async () => {
    const mount = closedRoot();
    const seatButton = document.createElement("button");
    seatButton.textContent = "seat";
    mount.appendChild(seatButton);
    seatButton.focus();
    const seen = watch();
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Edit</DialogTitle>
          <Button>Save</Button>
        </DialogContent>
      </Dialog>
    ));
    setOpen(true);
    await settle();
    setOpen(false);
    seatButton.focus();
    await settle();
    seen.stop();
    expect(document.body.getAttribute("aria-hidden")).not.toBe("true");
    expect(hiddenFocusChain().map((el) => el.tagName)).toEqual([]);
    expect(seen.body).toEqual([]);
  });
});
