import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { runSteps } from "../../dev/harness/steps";
import {
  type LayerHandle,
  type LayerOptions,
  layerStack,
  registerLayer,
} from "../../src/lib/behavior/layer-stack";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetPortal,
} from "../../src/solid/bottom-sheet/bottom-sheet";
import { input } from "../harness/input";
import { mountScenario, settle } from "../harness/mount";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const press = (name: string) => ({ press: { role: "button", name } });
const text = (name: string) =>
  document.querySelector(`[role="status"][aria-label="${name}"]`)?.textContent ?? "";
const shown = () => document.querySelector(":popover-open");

function mounted(
  options: Omit<LayerOptions, "open" | "element"> & { open?: boolean; element?: HTMLElement },
) {
  const [open, setOpen] = createSignal(options.open ?? true);
  const element = options.element ?? document.body.appendChild(document.createElement("div"));
  const holder: { handle?: LayerHandle } = {};
  const view = render(() => {
    holder.handle = registerLayer({ ...options, open, element: () => element });
    return <></>;
  });
  return { element, open, setOpen, handle: holder.handle as LayerHandle, view };
}

describe("layer-stack contract", () => {
  it("LS1 layers list in open order and the newest is the top", async () => {
    const { scope } = await mountScenario("layer-stack", "nested");
    await runSteps(
      scope,
      [press("Open One"), press("Open Two"), press("Open Three")],
      input,
      settle,
    );
    expect(text("Stack")).toBe("One Two Three");
    expect(text("Top")).toBe("Three");
  });

  it("LS2 a layer that closes leaves and the others keep their order", async () => {
    const { scope } = await mountScenario("layer-stack", "nested");
    await runSteps(
      scope,
      [press("Open One"), press("Open Two"), press("Open Three"), press("Close Two")],
      input,
      settle,
    );
    expect(text("Stack")).toBe("One Three");
    expect(text("Top")).toBe("Three");
  });

  it("LS3 a press path holds a layer, its trigger or a layer above it, and nothing else", () => {
    const trigger = document.body.appendChild(document.createElement("button"));
    const outside = document.body.appendChild(document.createElement("div"));
    const lower = mounted({ kind: "popover", escape: () => true, trigger: () => trigger });
    const upper = mounted({ kind: "popover", escape: () => true });
    expect(lower.handle.containsPath([lower.element, document.body])).toBe(true);
    expect(lower.handle.containsPath([trigger, document.body])).toBe(true);
    expect(lower.handle.containsPath([upper.element, document.body])).toBe(true);
    expect(upper.handle.containsPath([lower.element, document.body])).toBe(false);
    expect(lower.handle.containsPath([outside, document.body])).toBe(false);

    const inner = document.createElement("button");
    const host = document.body.appendChild(document.createElement("div"));
    const root = host.attachShadow({ mode: "closed" });
    root.append(inner);
    const sealed = mounted({ kind: "popover", escape: () => true, element: inner });
    expect(sealed.handle.containsPath([inner, root, host, document.body])).toBe(true);
    expect(sealed.handle.containsPath([host, document.body])).toBe(false);
  });

  it("LS4 a layer whose owner unmounts without closing leaves the stack", async () => {
    mounted({ kind: "modal", escape: () => true });
    await settle();
    expect(layerStack.layers()).toHaveLength(1);
    cleanup();
    await settle();
    expect(layerStack.layers()).toHaveLength(0);
  });

  it("LS5 nothing registers before the owner mounts", async () => {
    const element = document.body.appendChild(document.createElement("div"));
    let during = -1;
    render(() => {
      registerLayer({
        kind: "modal",
        escape: () => true,
        open: () => true,
        element: () => element,
      });
      during = layerStack.layers().length;
      return <></>;
    });
    expect(during).toBe(0);
    await settle();
    expect(layerStack.layers()).toHaveLength(1);
  });

  it("LS6 a tooltip over a popover leaves the popover on top", async () => {
    const popover = mounted({ kind: "popover", escape: () => true });
    const tooltip = mounted({ kind: "tooltip", escape: () => false });
    await settle();
    expect(layerStack.layers()).toHaveLength(2);
    expect(layerStack.top()?.element()).toBe(popover.element);
    expect(popover.handle.isTop()).toBe(true);
    expect(tooltip.handle.isTop()).toBe(false);
    const elsewhere = document.body.appendChild(document.createElement("div"));
    expect(popover.handle.containsPath([tooltip.element, document.body])).toBe(true);
    expect(popover.handle.containsPath([elsewhere, document.body])).toBe(false);
    expect(tooltip.handle.containsPath([elsewhere, document.body])).toBe(false);
  });

  it("LS7 a press on a marked top-layer element is inside, and the sheet stays open", async () => {
    const marked = document.body.appendChild(document.createElement("div"));
    marked.dataset.kbTopLayer = "";
    marked.style.cssText = "position:fixed;top:0;left:0;width:60px;height:60px;z-index:99999";
    const lone = mounted({ kind: "popover", escape: () => true });
    expect(lone.handle.containsPath([marked, document.body])).toBe(true);
    lone.setOpen(false);

    render(() => (
      <BottomSheet open>
        <BottomSheetPortal>
          <BottomSheetContent ariaLabel="Sheet">Body</BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    ));
    await settle();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await input.press(marked);
    await settle();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("LS8 a layer the browser closes dismisses once and stays closed", async () => {
    const { scope } = await mountScenario("layer-stack", "light-dismiss");
    await runSteps(scope, [press("Toggle")], input, settle);
    expect(text("State")).toBe("Open");
    expect(shown()?.getAttribute("aria-label")).toBe("Part");
    await input.pressAt(300, 400);
    await settle();
    expect(text("State")).toBe("Closed");
    expect(text("Dismissals")).toBe("1");
    expect(shown()).toBeNull();
    await settle();
    expect(text("State")).toBe("Closed");

    await runSteps(scope, [press("Toggle")], input, settle);
    expect(shown()).not.toBeNull();
    await input.key("Escape");
    await settle();
    expect(text("State")).toBe("Closed");
    expect(text("Dismissals")).toBe("2");
    expect(shown()).toBeNull();
  });

  it("LS9 a top-layer layer leaves the top layer when it closes or its owner unmounts", async () => {
    const { scope } = await mountScenario("layer-stack", "top-layer");
    await runSteps(scope, [press("Toggle")], input, settle);
    expect(shown()?.getAttribute("aria-label")).toBe("Part");
    await runSteps(scope, [press("Toggle")], input, settle);
    expect(shown()).toBeNull();
    cleanup();

    const layer = mounted({ kind: "popover", escape: () => true, topLayer: "manual" });
    await settle();
    expect(layer.element.matches(":popover-open")).toBe(true);
    cleanup();
    await settle();
    expect(layer.element.matches(":popover-open")).toBe(false);
    expect(layerStack.layers()).toHaveLength(0);
  });
  it("LS10 a pointer-blocking layer takes the page's pointer events and leaves its own and those above", async () => {
    const lower = mounted({ kind: "popover", escape: () => true, blockPointer: () => true });
    const upper = mounted({ kind: "popover", escape: () => true });
    await settle();
    expect(getComputedStyle(document.body).pointerEvents).toBe("none");
    expect(getComputedStyle(lower.element).pointerEvents).toBe("auto");
    expect(getComputedStyle(upper.element).pointerEvents).toBe("auto");
    lower.setOpen(false);
    await settle();
    expect(document.body.hasAttribute("style")).toBe(false);
    expect(lower.element.style.pointerEvents).toBe("");
    expect(upper.element.style.pointerEvents).toBe("");
  });
});
