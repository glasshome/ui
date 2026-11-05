/* The slot button is the dock's own slot shape, so what a form picks looks like what lands in the dock. */
import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { press } from "../press.js";
import { setViewportWidth } from "../viewport.js";
import { Dock } from "../../src/solid/dock.js";
import { IconPicker } from "../../src/solid/icon-picker.js";
import { SlotButton } from "../../src/solid/slot-button.js";

afterEach(cleanup);

const box = (el: Element | null | undefined) => {
  const rect = (el as Element).getBoundingClientRect();
  return { w: Math.round(rect.width), h: Math.round(rect.height) };
};

describe("SlotButton", () => {
  it.each([390, 1024])("is the dock item's size and corner at %ipx", async (width) => {
    await setViewportWidth(width);
    onTestFinished(() => setViewportWidth(1024));
    const { container } = render(() => (
      <>
        <Dock items={[{ id: "a", icon: <span />, label: "A" }]} />
        <SlotButton aria-label="Slot">
          <span />
        </SlotButton>
      </>
    ));
    const item = container.querySelector('[data-slot="dock-item"]');
    const slot = screen.getByRole("button", { name: "Slot" });
    expect(box(slot)).toEqual(box(item));
    expect(getComputedStyle(slot.firstElementChild as Element).borderTopLeftRadius).toBe(
      getComputedStyle(item as Element).borderTopLeftRadius,
    );
  });

  it("draws an empty place with a dashed edge", () => {
    render(() => <SlotButton aria-label="Empty" dashed />);
    const face = screen.getByRole("button", { name: "Empty" }).firstElementChild as Element;
    expect(getComputedStyle(face).borderTopStyle).toBe("dashed");
  });

  it("names itself by its label, shown under the slot", () => {
    render(() => (
      <SlotButton label="Garage">
        <span />
      </SlotButton>
    ));
    const slot = screen.getByRole("button", { name: "Garage" });
    expect(slot.querySelector('[data-slot="slot-button-label"]')?.textContent).toBe("Garage");
  });
});

describe("IconPicker slot", () => {
  function Host(props: { initial?: string }) {
    const [icon, setIcon] = createSignal(props.initial ?? "");
    return (
      <>
        <IconPicker variant="slot" aria-label="Icon" value={icon()} onChange={setIcon} />
        <output data-testid="icon">{icon()}</output>
      </>
    );
  }

  it("wears a slot and shows the icon picked", async () => {
    render(() => <Host initial="mdi:home" />);
    const trigger = screen.getByRole("button", { name: "Icon" });
    expect(trigger.querySelector('[data-slot="slot-button-face"]')).not.toBeNull();
    expect(trigger.querySelector('[data-icon="mdi:home"]')).not.toBeNull();
  });

  it("opens a panel wider than the slot, picks an icon and closes", async () => {
    render(() => <Host />);
    await press(screen.getByRole("button", { name: "Icon" }));
    const panel = await screen.findByRole("dialog");
    expect(panel.getBoundingClientRect().width).toBeGreaterThan(250);
    const first = panel.querySelector<HTMLElement>("button[title]");
    const title = first?.getAttribute("title") ?? "";
    await press(first as Element);
    expect(screen.getByTestId("icon").textContent).toBe(title);
  });

  it("clears the icon when the picked one is chosen again", async () => {
    render(() => <Host initial="mdi:home" />);
    await press(screen.getByRole("button", { name: "Icon" }));
    const panel = await screen.findByRole("dialog");
    const again = panel.querySelector<HTMLElement>('button[title="mdi:home"]');
    expect(again?.getAttribute("aria-pressed")).toBe("true");
    await press(again as Element);
    expect(screen.getByTestId("icon").textContent).toBe("");
  });
});
