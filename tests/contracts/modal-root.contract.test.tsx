import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { CLOSED_ROOTS } from "../../dev/harness/closed-roots";
import { findAll } from "../../dev/harness/steps";
import { Within } from "../../dev/harness/Within";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Toaster,
  toast,
} from "../../src/solid";
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
    await vi.waitFor(() => expect(dialogs()).toHaveLength(0));
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
    await vi.waitFor(async () => expect(await commands.axTree()).toContain("Scene saved"));
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
});
