import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { commands } from "vitest/browser";
import { findAll } from "../../dev/harness/steps";
import { createDismiss, type DismissReason } from "../../src/lib/behavior/dismiss";
import { type LayerKind, registerLayer } from "../../src/lib/behavior/layer-stack";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  BottomSheet,
  BottomSheetContent,
  BottomSheetPortal,
} from "../../src/solid";
import { useFakeTime } from "../../src/testing";
import { input } from "../harness/input";
import { focusedElement, settle } from "../harness/mount";
import { mount, OUTSIDE, press } from "./dismiss-parts";

const TIMERS: ("setTimeout" | "clearTimeout")[] = ["setTimeout", "clearTimeout"];
const LISTEN_DELAY_MS = 1;

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function watchWindow() {
  const seen: KeyboardEvent[] = [];
  const heard: KeyboardEvent[] = [];
  const first = (e: KeyboardEvent) => seen.push(e);
  const last = (e: KeyboardEvent) => heard.push(e);
  window.addEventListener("keydown", first, true);
  window.addEventListener("keydown", last);
  onTestFinished(() => {
    window.removeEventListener("keydown", first, true);
    window.removeEventListener("keydown", last);
  });
  return { seen, heard };
}

function stacked(options: {
  kind: LayerKind;
  top: number;
  dismiss?: boolean;
  escape?: boolean;
  trigger?: HTMLElement;
}) {
  const element = document.body.appendChild(document.createElement("div"));
  element.style.cssText = `position:fixed;left:20px;top:${options.top}px;width:200px;height:80px`;
  const button = element.appendChild(document.createElement("button"));
  button.type = "button";
  button.textContent = `Inside ${options.top}`;
  const [open, setOpen] = createSignal(true);
  const reasons: DismissReason[] = [];
  render(() => {
    const handle = registerLayer({
      kind: options.kind,
      open,
      element: () => element,
      escape: () => options.escape ?? true,
      trigger: options.trigger ? () => options.trigger : undefined,
      dismiss: () => setOpen(false),
    });
    if (options.dismiss !== false) {
      createDismiss({
        layer: handle,
        onDismiss: (why) => {
          reasons.push(why);
          setOpen(false);
        },
      });
    }
    return <></>;
  });
  return { element, button, open, reasons };
}

describe("dismiss contract", () => {
  it("DI1 a mouse press outside the top layer closes it and leaves focus where the press put it", async () => {
    const { dialogs, text, button, run } = await mount("outside");
    await run(press("Open Layer"));
    expect(dialogs()).toHaveLength(1);
    await input.pressAt(OUTSIDE.x, OUTSIDE.y);
    await settle();
    expect(dialogs()).toHaveLength(0);
    expect(text("Layer reason")).toBe("outside-press");
    expect(text("Layer dismissals")).toBe("1");
    expect(focusedElement()).not.toBe(button("Open Layer"));
  });

  it("DI2 a press inside, on the trigger, or inside a layer opened above leaves it open", async () => {
    useFakeTime({ toFake: TIMERS });
    const { dialogs, text, run } = await mount("outside");
    await run(press("Open Layer"));
    await vi.advanceTimersByTimeAsync(LISTEN_DELAY_MS);
    await input.press(findAll([document], { role: "textbox", name: "Layer field" })[0] as Element);
    await input.press(findAll([document], { role: "button", name: "Open Layer" })[0] as Element);
    await settle();
    expect(dialogs()).toHaveLength(1);
    expect(text("Layer dismissals")).toBe("0");
    cleanup();
    document.body.innerHTML = "";

    const lower = stacked({ kind: "popover", top: 20 });
    const upper = stacked({ kind: "popover", top: 160, dismiss: false });
    await settle();
    await vi.advanceTimersByTimeAsync(LISTEN_DELAY_MS);
    await input.press(upper.button);
    await settle();
    expect(lower.reasons).toEqual([]);
    expect(lower.open()).toBe(true);
    expect(upper.open()).toBe(true);
  });

  it("DI3 Escape with focus inside closes the layer, prevented, before any window listener", async () => {
    const watched = watchWindow();
    const { dialogs, text, run } = await mount("escape");
    await run(press("Open Layer"), { key: "Escape" });
    expect(dialogs()).toHaveLength(0);
    expect(text("Layer reason")).toBe("escape");
    expect(watched.seen).toHaveLength(1);
    expect(watched.seen[0]?.defaultPrevented).toBe(true);
    expect(watched.heard).toHaveLength(0);
  });

  it("DI4 Escape in a lower layer closes only a newer layer that takes no focus", async () => {
    const { dialogs, text, run } = await mount("nested");
    await run(press("Open Lower"), press("Open Upper"));
    expect(dialogs()).toHaveLength(2);
    await run({ key: "Escape" });
    expect(text("Upper dismissals")).toBe("1");
    expect(text("Lower dismissals")).toBe("0");
    expect(dialogs()).toHaveLength(1);
    await run({ key: "Escape" });
    expect(text("Lower dismissals")).toBe("1");
    expect(dialogs()).toHaveLength(0);
  });

  it("DI6 the press that opened the layer leaves it open", async () => {
    useFakeTime({ toFake: TIMERS });
    const { dialogs, text, run } = await mount("escape");
    await run(press("Open Layer"));
    await vi.advanceTimersByTimeAsync(LISTEN_DELAY_MS);
    await settle();
    expect(dialogs()).toHaveLength(1);
    expect(text("Layer dismissals")).toBe("0");
  });

  it("DI7 inside a closed shadow root a press beside the layer, the page outside, and Escape each close it once", async () => {
    const { dialogs, text, run } = await mount("shadow-root");
    await run(press("Open Layer"), press("Beside"));
    expect(dialogs()).toHaveLength(0);
    expect(text("Layer reason")).toBe("outside-press");
    expect(text("Layer dismissals")).toBe("1");
    await run(press("Open Layer"), { key: "Escape" });
    expect(dialogs()).toHaveLength(0);
    expect(text("Layer reason")).toBe("escape");
    expect(text("Layer dismissals")).toBe("2");
    await run(press("Open Layer"));
    const host = document.querySelector('[data-within="shadow-root"]')?.getBoundingClientRect();
    if (!host) throw new Error("no shadow-root host");
    await input.pressAt(host.x + host.width / 2, host.bottom + 40);
    await settle();
    expect(dialogs()).toHaveLength(0);
    expect(text("Layer reason")).toBe("outside-press");
    expect(text("Layer dismissals")).toBe("3");
  });

  it("DI8 Escape while an IME composes closes nothing and prevents nothing", async () => {
    const watched = watchWindow();
    const { dialogs, text, run } = await mount("escape");
    await run(press("Open Layer"));
    await commands.compose(true);
    onTestFinished(() => commands.compose(false));
    await run({ key: "Escape" });
    expect(watched.seen).toHaveLength(1);
    expect(watched.seen[0]?.isComposing).toBe(true);
    expect(watched.seen[0]?.defaultPrevented).toBe(false);
    expect(dialogs()).toHaveLength(1);
    expect(text("Layer dismissals")).toBe("0");
  });

  it("DI9 a mouse press that starts inside and is released outside leaves it open", async () => {
    const { dialogs, run } = await mount("outside");
    await run(press("Open Layer"));
    const field = findAll([document], { role: "textbox", name: "Layer field" })[0] as Element;
    const box = field.getBoundingClientRect();
    await commands.mouse("down", box.x + box.width / 2, box.y + box.height / 2);
    await commands.mouse("move", OUTSIDE.x, OUTSIDE.y);
    await commands.mouse("up", OUTSIDE.x, OUTSIDE.y);
    await settle();
    expect(dialogs()).toHaveLength(1);
  });

  it("DI10 Escape still closes the layer after its focused control was removed", async () => {
    const watched = watchWindow();
    const { dialogs, text, run } = await mount("escape");
    await run(press("Open Layer"), press("Remove row"));
    expect(findAll([document], { role: "button", name: "Remove row" })).toHaveLength(0);
    await run({ key: "Escape" });
    expect(dialogs()).toHaveLength(0);
    expect(text("Layer reason")).toBe("escape");
    expect(watched.heard).toHaveLength(0);
  });

  it("DI11 a dialog whose consumer vetoes Escape above a sheet leaves both open", async () => {
    const [notice, setNotice] = createSignal(false);
    render(() => (
      <>
        <BottomSheet defaultOpen>
          <BottomSheetPortal>
            <BottomSheetContent ariaLabel="Sheet">Body</BottomSheetContent>
          </BottomSheetPortal>
        </BottomSheet>
        <AlertDialog open={notice()}>
          <AlertDialogContent onEscapeKeyDown={(e: Event) => e.preventDefault()}>
            <AlertDialogTitle>Notice</AlertDialogTitle>
            <AlertDialogDescription>Stay</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      </>
    ));
    await settle();
    setNotice(true);
    await settle();
    expect(findAll([document], { role: "alertdialog" })).toHaveLength(1);
    await input.key("Escape");
    await settle();
    expect(findAll([document], { role: "alertdialog" })).toHaveLength(1);
    expect(document.querySelectorAll('[data-slot="bottom-sheet-content"]')).toHaveLength(1);
  });

  it("DI13 Escape with a tooltip on top closes it and prevents nothing", async () => {
    const watched = watchWindow();
    const tip = stacked({ kind: "tooltip", top: 20 });
    await settle();
    await input.key("Escape");
    expect(tip.reasons).toEqual(["escape"]);
    expect(watched.seen[0]?.defaultPrevented).toBe(false);
    expect(watched.heard).toHaveLength(1);
  });

  it("DI14 Escape with a tooltip over a modal closes both", async () => {
    const modal = stacked({ kind: "modal", top: 20 });
    const tip = stacked({ kind: "tooltip", top: 160 });
    modal.button.focus();
    await settle();
    await input.key("Escape");
    expect(tip.reasons).toEqual(["escape"]);
    expect(modal.reasons).toEqual(["escape"]);
  });

  it("DI15 Escape with a layer opened above a tooltip closes only that layer", async () => {
    const tip = stacked({ kind: "tooltip", top: 20 });
    const popover = stacked({ kind: "popover", top: 160 });
    popover.button.focus();
    await settle();
    await input.key("Escape");
    expect(popover.reasons).toEqual(["escape"]);
    expect(tip.reasons).toEqual([]);
  });

  it("DI16 Escape while an IME composes leaves a tooltip open", async () => {
    const tip = stacked({ kind: "tooltip", top: 20 });
    const field = document.body.appendChild(document.createElement("input"));
    field.focus();
    await settle();
    await commands.compose(true);
    onTestFinished(() => commands.compose(false));
    await input.key("Escape");
    expect(tip.reasons).toEqual([]);
    expect(tip.open()).toBe(true);
  });

  it("DI18 Escape in a lower layer closes the newer one through its own handler", async () => {
    const lower = stacked({ kind: "popover", top: 20 });
    const upper = stacked({ kind: "popover", top: 160 });
    lower.button.focus();
    await settle();
    await input.key("Escape");
    expect(upper.reasons).toEqual(["escape"]);
    expect(upper.open()).toBe(false);
    expect(lower.reasons).toEqual([]);
  });

  it("DI17 Escape in a modal that does not close on it stays in the layer", async () => {
    const watched = watchWindow();
    const modal = stacked({ kind: "modal", top: 20, escape: false });
    modal.button.focus();
    await settle();
    await input.key("Escape");
    expect(modal.reasons).toEqual([]);
    expect(modal.open()).toBe(true);
    expect(watched.seen[0]?.defaultPrevented).toBe(true);
    expect(watched.heard).toHaveLength(0);
  });

  it("DI12 a press outside a popover and the tooltip over it closes the popover and leaves the tooltip", async () => {
    useFakeTime({ toFake: TIMERS });
    const popover = stacked({ kind: "popover", top: 20 });
    const tooltip = stacked({ kind: "tooltip", top: 160, dismiss: false });
    const elsewhere = document.body.appendChild(document.createElement("button"));
    elsewhere.type = "button";
    elsewhere.textContent = "Elsewhere";
    elsewhere.style.cssText = "position:fixed;left:400px;top:20px";
    await settle();
    await vi.advanceTimersByTimeAsync(LISTEN_DELAY_MS);
    await input.press(tooltip.button);
    await settle();
    expect(popover.reasons).toEqual([]);
    await input.press(elsewhere);
    await settle();
    expect(popover.reasons).toEqual(["outside-press"]);
    expect(tooltip.open()).toBe(true);
  });
  it("DI19 with focusOutside, focus landing outside the layer closes it; inside or on its trigger it stays open", async () => {
    const button = (text: string, parent: HTMLElement = document.body) => {
      const el = parent.appendChild(document.createElement("button"));
      el.type = "button";
      el.textContent = text;
      return el;
    };
    const trigger = button("Trigger");
    const outside = button("Outside");
    const element = document.body.appendChild(document.createElement("div"));
    const inside = button("Inside", element);
    const [open, setOpen] = createSignal(true);
    const reasons: DismissReason[] = [];
    render(() => {
      const handle = registerLayer({
        kind: "popover",
        open,
        element: () => element,
        escape: () => true,
        trigger: () => trigger,
      });
      createDismiss({
        layer: handle,
        focusOutside: () => true,
        onDismiss: (why) => {
          reasons.push(why);
          setOpen(false);
        },
      });
      return <></>;
    });
    outside.focus();
    expect(reasons).toEqual([]);
    await settle();
    inside.focus();
    trigger.focus();
    expect(reasons).toEqual([]);
    outside.focus();
    expect(reasons).toEqual(["focus-outside"]);
    expect(open()).toBe(false);

    const plain = stacked({ kind: "popover", top: 20 });
    await settle();
    plain.button.focus();
    outside.focus();
    expect(plain.reasons).toEqual([]);
    expect(plain.open()).toBe(true);
  });
  it("DI20 a layer in a shadow root closes on a press in its root while a newer layer is open in another", async () => {
    useFakeTime({ toFake: TIMERS });
    const sealed = (top: number) => {
      const host = document.body.appendChild(document.createElement("div"));
      const root = host.attachShadow({ mode: "closed" });
      const element = root.appendChild(document.createElement("div"));
      element.style.cssText = `position:fixed;left:20px;top:${top}px;width:200px;height:80px`;
      const beside = root.appendChild(document.createElement("div"));
      beside.style.cssText = `position:fixed;left:300px;top:${top}px;width:120px;height:80px`;
      const [open, setOpen] = createSignal(true);
      const reasons: DismissReason[] = [];
      render(() => {
        const handle = registerLayer({
          kind: "popover",
          open,
          element: () => element,
          escape: () => true,
        });
        createDismiss({
          layer: handle,
          onDismiss: (why) => {
            reasons.push(why);
            setOpen(false);
          },
        });
        return <></>;
      });
      return { beside, open, reasons };
    };
    const older = sealed(20);
    const page = stacked({ kind: "popover", top: 300 });
    const newer = sealed(160);
    await settle();
    await vi.advanceTimersByTimeAsync(LISTEN_DELAY_MS);
    const box = older.beside.getBoundingClientRect();
    await input.pressAt(box.x + box.width / 2, box.y + box.height / 2);
    await settle();
    expect(older.reasons).toEqual(["outside-press"]);
    expect(newer.reasons).toEqual(["outside-press"]);
    expect(page.open()).toBe(true);
  });
});
