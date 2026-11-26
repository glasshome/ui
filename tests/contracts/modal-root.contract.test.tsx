import "../real-time-animations";
import { cleanup, render } from "@solidjs/testing-library";
import { createEffect, createSignal } from "solid-js";
import { type JSX } from "@solidjs/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { findAll } from "../../dev/harness/steps";
import { Within } from "../../dev/harness/Within";
import { layerStack } from "../../src/lib/behavior/layer-stack";
import { ModalFrame, ModalRoot, useDialogContext } from "../../src/lib/behavior/modal-root";
import { overAnchor } from "../../src/lib/anchor-placement";
import { MOTION_EXIT_MS } from "../../src/lib/motion-classes";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Toaster,
  toast,
} from "../../src/solid";
import { useFakeTime } from "../../src/testing";
import { input } from "../harness/input";
import { settle } from "../harness/mount";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const scope = (): ParentNode[] => [document, ...CLOSED_ROOTS];
const dialogs = () => findAll(scope(), { role: "dialog" });
const button = (name: string) => {
  const found = findAll(scope(), { role: "button", name })[0];
  if (!(found instanceof HTMLElement)) throw new Error(`no button ${name}`);
  return found;
};
const CORNER = { x: 6, y: 6 };

function page(children: () => JSX.Element) {
  const sibling = document.body.appendChild(document.createElement("button"));
  sibling.textContent = "Beside";
  render(children);
  return { sibling };
}

describe("modal root contract", () => {
  it("MR1 a registered Title names the panel over ariaLabel, ariaLabel names an untitled one, and the Description describes it", async () => {
    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="Fallback">
          <DialogTitle>Rename board</DialogTitle>
          <DialogDescription>Pick a new name.</DialogDescription>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const [titled] = findAll(scope(), { role: "dialog", name: "Rename board" });
    expect(titled).toBeDefined();
    expect(titled?.getAttribute("aria-label")).toBeNull();
    const described = document.getElementById(String(titled?.getAttribute("aria-describedby")));
    expect(described?.textContent).toBe("Pick a new name.");
    cleanup();

    render(() => (
      <Dialog open>
        <DialogContent ariaLabel="Quick actions">rows</DialogContent>
      </Dialog>
    ));
    await settle();
    const [untitled] = findAll(scope(), { role: "dialog", name: "Quick actions" });
    expect(untitled?.getAttribute("aria-labelledby")).toBeNull();
  });

  it("MR2 the trigger says it opens a dialog, whether it is open, and which panel it controls while open", async () => {
    render(() => (
      <Dialog>
        <DialogTrigger as={Button}>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Opened</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const trigger = button("Open");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("aria-controls")).toBe(false);
    await input.press(trigger);
    await settle();
    const [panel] = dialogs();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel?.id).toBeTruthy();
    expect(trigger.getAttribute("aria-controls")).toBe(panel?.id);
  });

  it("MR3 defaultOpen starts open, a close reports false, and the trigger reopens it", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const changes: boolean[] = [];
    render(() => (
      <Dialog defaultOpen onOpenChange={(open) => changes.push(open)}>
        <DialogTrigger as={Button}>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Opened</DialogTitle>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(dialogs()).toHaveLength(1);
    await input.press(button("Done"));
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.modal);
    expect(dialogs()).toHaveLength(0);
    await input.press(button("Open"));
    await settle();
    expect(dialogs()).toHaveLength(1);
    expect(changes).toEqual([false, true]);
  });

  it("MR4 a consumer that prevents Escape or an outside press keeps the dialog open", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent
          onEscapeKeyDown={(e: Event) => e.preventDefault()}
          onInteractOutside={(e: Event) => e.preventDefault()}
        >
          <DialogTitle>Notice</DialogTitle>
          <Button>Inside</Button>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    await input.key("Escape");
    await settle();
    await input.pressAt(CORNER.x, CORNER.y);
    await settle();
    expect(open()).toBe(true);
    expect(dialogs()).toHaveLength(1);
  });

  it("MR5 ref receives the panel, and other props reach it", async () => {
    let panel: HTMLElement | undefined;
    const keys: string[] = [];
    render(() => (
      <Dialog open>
        <DialogContent
          ref={(el: HTMLElement) => (panel = el)}
          data-testid="panel"
          onKeyDown={(e: KeyboardEvent) => keys.push(e.key)}
        >
          <DialogTitle>Edit</DialogTitle>
          <Button>Inside</Button>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const [dialog] = dialogs();
    expect(panel).toBe(dialog);
    expect(dialog?.getAttribute("data-testid")).toBe("panel");
    button("Inside").focus();
    await input.key("a");
    expect(keys).toContain("a");
  });

  it("MR6 inside a closed shadow root the dialog hides nothing on the page, and on the page it hides what is beside it", async () => {
    const shadow = page(() => (
      <Within mode="shadow-root">
        <Dialog open>
          <DialogContent>
            <DialogTitle>Sealed</DialogTitle>
          </DialogContent>
        </Dialog>
      </Within>
    ));
    await settle();
    expect(findAll(scope(), { role: "dialog", name: "Sealed" })).toHaveLength(1);
    expect(shadow.sibling.getAttribute("aria-hidden")).toBeNull();
    cleanup();
    document.body.innerHTML = "";

    const onPage = page(() => (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Page</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(onPage.sibling.getAttribute("aria-hidden")).toBe("true");
  });

  it("MR7 closing the dialog closes a list opened inside it", async () => {
    const [dialog, setDialog] = createSignal(true);
    const [list, setList] = createSignal(false);
    render(() => (
      <Dialog open={dialog()} onOpenChange={setDialog}>
        <DialogContent>
          <DialogTitle>Pick</DialogTitle>
          <Select
            options={["Apple", "Banana"]}
            open={list()}
            onOpenChange={setList}
            placeholder="Pick one"
            itemComponent={(item) => <SelectItem item={item.item}>{item.item.rawValue}</SelectItem>}
          >
            <SelectTrigger aria-label="Fruit">
              <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    await input.press(button("Fruit Pick one"));
    await settle();
    expect(list()).toBe(true);
    setDialog(false);
    await settle();
    expect(list()).toBe(false);
  });
  it("MR8 a dialog opened over a modal Popover takes presses, keeps focus and leaves the popover open", async () => {
    const [dialog, setDialog] = createSignal(false);
    const [popover, setPopover] = createSignal(true);
    const pressed: string[] = [];
    render(() => (
      <>
        <Popover modal open={popover()} onOpenChange={setPopover}>
          <PopoverTrigger as={Button}>Gallery</PopoverTrigger>
          <PopoverContent>
            <Button onClick={() => setDialog(true)}>Remove</Button>
          </PopoverContent>
        </Popover>
        <Dialog open={dialog()} onOpenChange={setDialog}>
          <DialogContent>
            <DialogTitle>Remove photo</DialogTitle>
            <Button onClick={() => pressed.push("Confirm")}>Confirm</Button>
            <DialogClose>Keep</DialogClose>
          </DialogContent>
        </Dialog>
      </>
    ));
    await settle();
    await input.press(button("Remove"));
    await settle();
    const [panel] = findAll(scope(), { role: "dialog", name: "Remove photo" });
    expect(panel?.closest("[aria-hidden]")).toBeNull();
    expect(panel?.contains(document.activeElement)).toBe(true);
    await input.press(button("Confirm"));
    expect(pressed).toEqual(["Confirm"]);
    await input.press(button("Keep"));
    await settle();
    expect(dialog()).toBe(false);
    expect(popover()).toBe(true);
  });
  it("MR9 a modal panel says it is modal, and a non-modal one says nothing", async () => {
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Modal</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(findAll(scope(), { role: "dialog", name: "Modal" })[0]?.getAttribute("aria-modal")).toBe(
      "true",
    );
    cleanup();

    render(() => (
      <Dialog open modal={false}>
        <DialogContent>
          <DialogTitle>Loose</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(findAll(scope(), { role: "dialog", name: "Loose" })[0]?.hasAttribute("aria-modal")).toBe(
      false,
    );
    cleanup();

    render(() => (
      <Within mode="shadow-root">
        <Dialog open>
          <DialogContent>
            <DialogTitle>Sealed</DialogTitle>
          </DialogContent>
        </Dialog>
      </Within>
    ));
    await settle();
    expect(
      findAll(scope(), { role: "dialog", name: "Sealed" })[0]?.hasAttribute("aria-modal"),
    ).toBe(false);
  });

  it("MR10 a toast raised while a modal is open is in the AX tree", async () => {
    render(() => (
      <>
        <Toaster />
        <Dialog open>
          <DialogContent>
            <DialogTitle>Busy</DialogTitle>
          </DialogContent>
        </Dialog>
      </>
    ));
    await settle();
    expect(findAll(scope(), { role: "dialog", name: "Busy" })[0]?.getAttribute("aria-modal")).toBe(
      "true",
    );
    toast("Scene saved");
    await settle();
    expect(await commands.axTree()).toContain("Scene saved");
    toast.dismiss();
  });

  it("MR11 a data-kb-top-layer button outside an open modal stays in the AX tree", async () => {
    const wake = document.body.appendChild(document.createElement("button"));
    wake.setAttribute("data-kb-top-layer", "");
    wake.textContent = "Wake screen";
    render(() => (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Asleep</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(
      findAll(scope(), { role: "dialog", name: "Asleep" })[0]?.getAttribute("aria-modal"),
    ).toBe("true");
    expect(await commands.axTree()).toContain('button "Wake screen"');
    wake.remove();
  });

  it("MR12 onCloseAutoFocus that prevents and focuses a page button outside every layer leaves focus there", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const [open, setOpen] = createSignal(true);
    const { sibling } = page(() => (
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(e: Event) => {
            e.preventDefault();
            sibling.focus();
          }}
        >
          <DialogTitle>Moved</DialogTitle>
          <Button>Inside</Button>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(dialogs()[0]?.contains(document.activeElement)).toBe(true);
    setOpen(false);
    await vi.advanceTimersByTimeAsync(MOTION_EXIT_MS.modal);
    expect(dialogs()).toHaveLength(0);
    await settle();
    expect(document.activeElement).toBe(sibling);
  });

  it("MR13 an outside press hands both handlers one event carrying the pointerdown, its target and isContextMenu", async () => {
    const seen: { name: string; event: CustomEvent }[] = [];
    const read: { target: EventTarget | null; original: EventTarget | null; menu: boolean }[] = [];
    const record =
      (name: string) =>
      (e: CustomEvent<{ originalEvent: PointerEvent | FocusEvent; isContextMenu: boolean }>) => {
        seen.push({ name, event: e });
        read.push({
          target: e.target,
          original: e.detail.originalEvent.target,
          menu: e.detail.isContextMenu,
        });
        e.preventDefault();
      };
    render(() => (
      <Dialog open>
        <DialogContent
          onPointerDownOutside={record("pointer")}
          onInteractOutside={record("interact")}
        >
          <DialogTitle>Outside</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    await input.pressAt(CORNER.x, CORNER.y);
    await settle();
    const scrim = document.querySelector('[data-slot="dialog-overlay"]');
    expect(scrim).not.toBeNull();
    expect(seen.map((entry) => entry.name)).toEqual(["pointer", "interact"]);
    expect(seen[0]?.event).toBe(seen[1]?.event);
    expect(seen[0]?.event.detail.originalEvent).toBeInstanceOf(PointerEvent);
    expect(read).toEqual([
      { target: scrim, original: scrim, menu: false },
      { target: scrim, original: scrim, menu: false },
    ]);
    expect(dialogs()).toHaveLength(1);
  });

  it("MR14 onEscapeKeyDown receives the keydown itself, whose target is the focused element", async () => {
    const keys: { event: KeyboardEvent; target: EventTarget | null; trusted: boolean }[] = [];
    render(() => (
      <Dialog open>
        <DialogContent
          onEscapeKeyDown={(e: KeyboardEvent) => {
            keys.push({ event: e, target: e.target, trusted: e.isTrusted });
            e.preventDefault();
          }}
        >
          <DialogTitle>Keys</DialogTitle>
          <Button>Inside</Button>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const inside = button("Inside");
    inside.focus();
    await input.key("Escape");
    await settle();
    expect(keys).toHaveLength(1);
    expect(keys[0]?.event.key).toBe("Escape");
    expect(keys[0]?.trusted).toBe(true);
    expect(keys[0]?.target).toBe(inside);
    expect(dialogs()).toHaveLength(1);
  });

  it("MR15 a context-menu press on the scrim leaves a modal open, and a plain press then closes it", async () => {
    const [open, setOpen] = createSignal(true);
    const menus: boolean[] = [];
    render(() => (
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent onPointerDownOutside={(e) => menus.push(e.detail.isContextMenu)}>
          <DialogTitle>Menu</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    await commands.mouse("move", CORNER.x, CORNER.y);
    await commands.mouse("down", CORNER.x, CORNER.y, "right");
    await commands.mouse("up", CORNER.x, CORNER.y, "right");
    await settle();
    expect(open()).toBe(true);
    await userEvent.keyboard("{Control>}");
    await input.pressAt(CORNER.x, CORNER.y);
    await userEvent.keyboard("{/Control}");
    await settle();
    expect(open()).toBe(true);
    await input.pressAt(CORNER.x, CORNER.y);
    await settle();
    expect(menus).toEqual([true, true, false]);
    expect(open()).toBe(false);
  });

  it("MR16 Escape with focus on a data-kb-top-layer button outside the modal closes it, and of two stacked modals only the top", async () => {
    const wake = document.body.appendChild(document.createElement("button"));
    wake.setAttribute("data-kb-top-layer", "");
    wake.textContent = "Wake screen";
    const [lower, setLower] = createSignal(true);
    const [upper, setUpper] = createSignal(false);
    render(() => (
      <>
        <Dialog open={lower()} onOpenChange={setLower}>
          <DialogContent>
            <DialogTitle>Lower</DialogTitle>
          </DialogContent>
        </Dialog>
        <Dialog open={upper()} onOpenChange={setUpper}>
          <DialogContent>
            <DialogTitle>Upper</DialogTitle>
          </DialogContent>
        </Dialog>
      </>
    ));
    await settle();
    wake.focus();
    expect(document.activeElement).toBe(wake);
    await input.key("Escape");
    await settle();
    expect(lower()).toBe(false);

    setLower(true);
    await settle();
    setUpper(true);
    await settle();
    wake.focus();
    await input.key("Escape");
    await settle();
    expect([lower(), upper()]).toEqual([true, false]);
    wake.focus();
    await input.key("Escape");
    await settle();
    expect([lower(), upper()]).toEqual([false, false]);
    wake.remove();
  });

  it("MR17 of two stacked modals Escape inside the top one closes only it, and its veto holds", async () => {
    const [lower, setLower] = createSignal(true);
    const [upper, setUpper] = createSignal(false);
    const [veto, setVeto] = createSignal(true);
    render(() => (
      <>
        <Dialog open={lower()} onOpenChange={setLower}>
          <DialogContent>
            <DialogTitle>Lower</DialogTitle>
          </DialogContent>
        </Dialog>
        <Dialog open={upper()} onOpenChange={setUpper}>
          <DialogContent onEscapeKeyDown={(e) => veto() && e.preventDefault()}>
            <DialogTitle>Upper</DialogTitle>
            <Button>Inside</Button>
          </DialogContent>
        </Dialog>
      </>
    ));
    await settle();
    setUpper(true);
    await settle();
    button("Inside").focus();
    await input.key("Escape");
    await settle();
    expect([lower(), upper()]).toEqual([true, true]);
    setVeto(false);
    await input.key("Escape");
    await settle();
    expect([lower(), upper()]).toEqual([true, false]);
  });

  it("MR18 a panel with no motion leaves after the exit duration current when it closes", async () => {
    useFakeTime({ toFake: ["setTimeout", "clearTimeout"] });
    const [open, setOpen] = createSignal(true);
    const [exitMs, setExitMs] = createSignal(100);
    render(() => (
      <ModalRoot open={open()} onOpenChange={setOpen}>
        <ModalFrame slot="probe" panelClass="" scrimClass="" exitMs={exitMs()} ariaLabel="Probe">
          rows
        </ModalFrame>
      </ModalRoot>
    ));
    await vi.advanceTimersByTimeAsync(100);
    expect(dialogs()).toHaveLength(1);
    setExitMs(400);
    setOpen(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(document.querySelector('[data-slot="probe-content"]')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(200);
    expect(document.querySelector('[data-slot="probe-content"]')).toBeNull();
  });
});

const EDGE_STOP = 'span[tabindex="0"][aria-hidden="true"]';
const content = (slot = "dialog") => {
  const el = document.querySelector(`[data-slot="${slot}-content"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`no ${slot} content`);
  return el;
};
const layerOf = (panel: HTMLElement) => {
  const el = panel.parentElement;
  if (!el) throw new Error("the panel has no layer root");
  return el;
};

async function reopen(slot: string, trigger: string) {
  await input.press(button(trigger));
  await settle();
  const panel = content(slot);
  const scrim = document.querySelector(`[data-slot="${slot}-overlay"]`);
  await input.press(button("Done"));
  await settle();
  const layer = layerOf(panel);
  expect(layer.hasAttribute("data-dormant")).toBe(true);
  const added: Node[] = [];
  const observer = new MutationObserver((records) => {
    for (const record of records) added.push(...record.addedNodes);
  });
  observer.observe(layer, { childList: true, subtree: true, characterData: true });
  await input.press(button(trigger));
  await settle();
  for (const record of observer.takeRecords()) added.push(...record.addedNodes);
  observer.disconnect();
  return { panel, scrim, added };
}

describe("kept modal contract", () => {
  it("DK1 going dormant writes data-dormant on the layer root, beside only the panel's ARIA and its cover", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Dialog keep open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Climate</DialogTitle>
          <Button>Warmer</Button>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const panel = content();
    const layer = layerOf(panel);
    expect(panel.hasAttribute("data-covering")).toBe(true);
    const box = (el: Element) => {
      const style = getComputedStyle(el);
      return { position: style.position, contain: style.contain, zIndex: style.zIndex };
    };
    const shown = box(layer);
    setOpen(false);
    const writes: string[] = [];
    const who = (node: Node) => (node === layer ? "root" : node === panel ? "panel" : "inside");
    const observer = new MutationObserver((records) => {
      for (const record of records) writes.push(`${who(record.target)} ${record.attributeName}`);
    });
    observer.observe(layer, { attributes: true, subtree: true });
    await settle();
    for (const record of observer.takeRecords())
      writes.push(`${who(record.target)} ${record.attributeName}`);
    observer.disconnect();
    expect(layer.hasAttribute("data-dormant")).toBe(true);
    expect(writes.toSorted()).toEqual([
      "panel aria-modal",
      "panel data-covering",
      "panel role",
      "root data-dormant",
    ]);
    expect(shown.position).toBe("fixed");
    expect(box(layer)).toEqual(shown);
  });

  it("DK2 a dormant Dialog's content leaves the Chromium AX tree, and returns on reopen", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Dialog keep open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Kept climate</DialogTitle>
          <Button>Kept warmer</Button>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(await commands.axTree()).toContain('button "Kept warmer"');
    setOpen(false);
    await settle();
    expect(layerOf(content()).hasAttribute("data-dormant")).toBe(true);
    const tree = await commands.axTree();
    expect(tree).not.toContain("Kept warmer");
    expect(tree).not.toContain("Kept climate");
    setOpen(true);
    await settle();
    expect(await commands.axTree()).toContain('dialog "Kept climate"');
  });

  it("DK3 a dormant panel carries no role and no aria-modal, and both return on reopen", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Dialog keep open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Climate</DialogTitle>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const panel = content();
    setOpen(false);
    await settle();
    expect(layerOf(panel).hasAttribute("data-dormant")).toBe(true);
    expect(panel.hasAttribute("role")).toBe(false);
    expect(panel.hasAttribute("aria-modal")).toBe(false);
    expect(dialogs()).toHaveLength(0);
    setOpen(true);
    await settle();
    expect(content()).toBe(panel);
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");
  });

  it("DK4 a dormant Dialog holds no layer, hides, traps and covers nothing, and reopens as it first opened", async () => {
    const pageRoot = document.body.appendChild(document.createElement("div"));
    pageRoot.setAttribute("data-page", "");
    const beside = pageRoot.appendChild(document.createElement("button"));
    beside.textContent = "Beside";
    const keptChanges: boolean[] = [];
    const [kept, setKept] = createSignal(false);
    const [top, setTop] = createSignal(false);
    render(() => (
      <>
        <Dialog
          keep
          open={kept()}
          onOpenChange={(next) => {
            keptChanges.push(next);
            setKept(next);
          }}
        >
          <DialogTrigger as={Button}>Climate</DialogTrigger>
          <DialogContent>
            <DialogTitle>Climate</DialogTitle>
            <Button>Warmer</Button>
            <DialogClose>Done</DialogClose>
          </DialogContent>
        </Dialog>
        <Dialog open={top()} onOpenChange={setTop}>
          <DialogContent>
            <DialogTitle>Rename</DialogTitle>
            <Button>Save</Button>
          </DialogContent>
        </Dialog>
      </>
    ));
    await settle();
    const trigger = button("Climate");
    await input.press(trigger);
    await settle();
    const panel = content();
    const first = document.activeElement;
    expect(panel.contains(first)).toBe(true);
    expect(pageRoot.hasAttribute("data-covered")).toBe(true);

    await input.press(button("Done"));
    await settle();
    const layer = layerOf(panel);
    expect(layer.hasAttribute("data-dormant")).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(layerStack.layers()).toEqual([]);
    expect(beside.hasAttribute("aria-hidden")).toBe(false);
    expect(layer.querySelectorAll(EDGE_STOP)).toHaveLength(0);
    expect(pageRoot.hasAttribute("data-covered")).toBe(false);

    setTop(true);
    await settle();
    await input.key("Escape");
    await settle();
    expect(top()).toBe(false);
    setTop(true);
    await settle();
    await input.pressAt(CORNER.x, CORNER.y);
    await settle();
    expect(top()).toBe(false);
    expect(keptChanges).toEqual([true, false]);

    await input.press(trigger);
    await settle();
    expect(content()).toBe(panel);
    expect(document.activeElement).toBe(first);
    expect(pageRoot.hasAttribute("data-covered")).toBe(true);
    await input.press(button("Done"));
    await settle();
    expect(document.activeElement).toBe(trigger);
  });

  it("DK5 a kept anchored Dialog is placed over its anchor's box as it is on each open", async () => {
    const anchor = document.body.appendChild(document.createElement("div"));
    Object.assign(anchor.style, {
      position: "fixed",
      top: "120px",
      left: "16px",
      width: "200px",
      height: "100px",
    });
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Dialog keep open={open()} onOpenChange={setOpen}>
        <DialogContent anchor={anchor} ariaLabel="Climate">
          rows
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const panel = content();
    const first = panel.style.left;
    setOpen(false);
    await settle();
    expect(layerOf(panel).hasAttribute("data-dormant")).toBe(true);
    anchor.style.left = "480px";
    setOpen(true);
    await settle();
    expect(panel.style.left).not.toBe(first);
    expect(panel.style.left).toBe(overAnchor(anchor, 512, panel.offsetHeight).left);
  });

  it("DK6 an exit ends at rest, invisible, for a centred and an anchored panel and their scrims", async () => {
    const anchor = document.body.appendChild(document.createElement("div"));
    Object.assign(anchor.style, {
      position: "fixed",
      top: "120px",
      left: "16px",
      width: "200px",
      height: "100px",
    });
    for (const anchored of [false, true]) {
      const [open, setOpen] = createSignal(true);
      render(() => (
        <Dialog keep open={open()} onOpenChange={setOpen}>
          <DialogContent anchor={anchored ? anchor : undefined} ariaLabel="Climate">
            rows
          </DialogContent>
        </Dialog>
      ));
      await settle();
      const panel = content();
      const scrim = document.querySelector('[data-slot="dialog-overlay"]');
      if (!scrim) throw new Error("no scrim");
      setOpen(false);
      expect(panel.getAnimations().length + scrim.getAnimations().length).toBeGreaterThan(0);
      await settle();
      expect(
        [getComputedStyle(panel).opacity, getComputedStyle(scrim).opacity],
        anchored ? "anchored" : "centred",
      ).toEqual(["0", "0"]);
      cleanup();
    }
  });

  it("DK7 a kept Dialog reopens on the same panel and scrim, adding no node inside them", async () => {
    render(() => (
      <Dialog keep>
        <DialogTrigger as={Button}>Climate</DialogTrigger>
        <DialogContent>
          <DialogTitle>Climate</DialogTitle>
          <Button>Warmer</Button>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    const { panel, scrim, added } = await reopen("dialog", "Climate");
    expect(content()).toBe(panel);
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBe(scrim);
    expect(added.filter((node) => panel.contains(node) || scrim?.contains(node))).toEqual([]);
    expect(added.filter((node) => !(node instanceof Element && node.matches(EDGE_STOP)))).toEqual(
      [],
    );
  });

  it("DK7 a kept ResponsiveDialog reopens on the same panel and scrim", async () => {
    render(() => (
      <ResponsiveDialog keep>
        <ResponsiveDialogTrigger as={Button}>Climate</ResponsiveDialogTrigger>
        <ResponsiveDialogContent>
          <ResponsiveDialogTitle>Climate</ResponsiveDialogTitle>
          <ResponsiveDialogClose>Done</ResponsiveDialogClose>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    ));
    await settle();
    const { panel, scrim, added } = await reopen("dialog", "Climate");
    expect(content()).toBe(panel);
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBe(scrim);
    expect(added.filter((node) => panel.contains(node) || scrim?.contains(node))).toEqual([]);
  });

  it("DK8 closing a kept Dialog closes a list opened inside it, and leaves no layer while dormant", async () => {
    const [dialog, setDialog] = createSignal(true);
    const [list, setList] = createSignal(false);
    render(() => (
      <Dialog keep open={dialog()} onOpenChange={setDialog}>
        <DialogContent>
          <DialogTitle>Pick</DialogTitle>
          <Select
            options={["Apple", "Banana"]}
            open={list()}
            onOpenChange={setList}
            placeholder="Pick one"
            itemComponent={(item) => <SelectItem item={item.item}>{item.item.rawValue}</SelectItem>}
          >
            <SelectTrigger aria-label="Fruit">
              <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </DialogContent>
      </Dialog>
    ));
    await settle();
    await input.press(button("Fruit Pick one"));
    await settle();
    expect(list()).toBe(true);
    setDialog(false);
    await settle();
    expect(list()).toBe(false);
    expect(layerOf(content()).hasAttribute("data-dormant")).toBe(true);
    expect(layerStack.layers()).toEqual([]);
  });

  it("DK9 content reads whether its layer is dormant", async () => {
    const seen: boolean[] = [];
    const Probe = () => {
      const ctx = useDialogContext();
      createEffect(() => seen.push(ctx.dormant()));
      return null;
    };
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Dialog keep open={open()} onOpenChange={setOpen}>
        <DialogContent ariaLabel="Climate">
          <Probe />
        </DialogContent>
      </Dialog>
    ));
    await settle();
    expect(seen).toEqual([true]);
    setOpen(true);
    await settle();
    expect(seen).toEqual([true, false]);
    setOpen(false);
    expect(seen).toEqual([true, false]);
    await settle();
    expect(seen).toEqual([true, false, true]);
    setOpen(true);
    await settle();
    expect(seen).toEqual([true, false, true, false]);
  });
});
