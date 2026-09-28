/* AreaPicker's multi mode is additive: `values` turns rows into toggles and the
 * trigger into a count, while the single `value`/`onChange` API keeps closing on
 * pick. A selected area the home no longer has must stay visible (so nobody
 * silently loses a grant) yet leave the value on the next edit. */
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { AreaPicker } from "../../src/solid/area-picker.js";
import {
  type AreaViewLike,
  type EntityDataAdapter,
  EntityDataContext,
} from "../../src/solid/entity-data.js";

const AREAS: AreaViewLike[] = [
  { id: "kitchen", name: "Kitchen", icon: "mdi:silverware", entityIds: ["light.counter"] },
  { id: "bedroom", name: "Bedroom", icon: "mdi:bed", entityIds: ["light.nightstand"] },
  { id: "hall", name: "Hallway", icon: null, entityIds: [] },
];

const adapter: EntityDataAdapter = {
  entityIdsByDomain: () => ({}),
  useEntities: () => () => [],
  getEntityView: () => undefined,
  useAreas: () => () => AREAS,
};

// The popover portals its rows onto <body>, so the trigger is found in the
// render container and everything else document-wide.
function triggerOf(container: HTMLElement) {
  const button = container.querySelector("button");
  if (!button) throw new Error("no trigger");
  return button;
}

function row(name: string) {
  const found = Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="area-picker-row"]'),
  ).find((el) => el.textContent?.includes(name));
  if (!found) throw new Error(`no row for ${name}`);
  return found;
}

// Kobalte keeps closed content mounted for its exit animation, which never runs
// in happy-dom; the state lives on the data attribute.
function isOpen() {
  const content = document.querySelector('[data-slot="popover-content"]');
  return content !== null && !content.hasAttribute("data-closed");
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("AreaPicker multi mode", () => {
  it("toggles ids in pick order and stays open", () => {
    const [values, setValues] = createSignal<string[]>([]);
    const { container } = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker values={values()} onValuesChange={setValues} placeholder="Whole home" />
      </EntityDataContext.Provider>
    ));

    fireEvent.click(triggerOf(container));
    fireEvent.click(row("Kitchen"));
    expect(values()).toEqual(["kitchen"]);

    fireEvent.click(row("Bedroom"));
    expect(values()).toEqual(["kitchen", "bedroom"]);
    expect(isOpen()).toBe(true);

    fireEvent.click(row("Kitchen"));
    expect(values()).toEqual(["bedroom"]);
  });

  it("marks selected rows and labels the trigger by count", () => {
    const [values, setValues] = createSignal<string[]>([]);
    const { container } = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker values={values()} onValuesChange={setValues} placeholder="Whole home" />
      </EntityDataContext.Provider>
    ));

    expect(triggerOf(container).textContent).toContain("Whole home");

    fireEvent.click(triggerOf(container));
    expect(row("Kitchen").getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(row("Kitchen"));
    expect(row("Kitchen").getAttribute("aria-pressed")).toBe("true");
    expect(triggerOf(container).textContent).toContain("Kitchen");

    fireEvent.click(row("Bedroom"));
    expect(triggerOf(container).textContent).toContain("2 rooms");
  });

  it("greys an area the home no longer has and drops it on the next change", () => {
    const [values, setValues] = createSignal<string[]>(["ghost_room", "kitchen"]);
    const { container } = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker values={values()} onValuesChange={setValues} placeholder="Whole home" />
      </EntityDataContext.Provider>
    ));

    expect(triggerOf(container).textContent).toContain("Kitchen");

    fireEvent.click(triggerOf(container));
    const missing = document.querySelector<HTMLElement>('[data-slot="area-picker-missing"]');
    expect(missing?.textContent).toContain("ghost_room");
    expect(missing?.textContent).toContain("no longer exists");
    expect(missing?.className).toContain("text-muted-foreground/60");

    fireEvent.click(row("Bedroom"));
    expect(values()).toEqual(["kitchen", "bedroom"]);
  });
});

describe("AreaPicker disabled", () => {
  it("keeps the trigger shut and the value unchanged", () => {
    const [values, setValues] = createSignal<string[]>(["kitchen"]);
    const { container } = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker values={values()} onValuesChange={setValues} disabled />
      </EntityDataContext.Provider>
    ));

    const trigger = triggerOf(container);
    expect(trigger.hasAttribute("disabled")).toBe(true);
    expect(trigger.className).toContain("disabled:opacity-50");
    expect(trigger.textContent).toContain("Kitchen");

    fireEvent.click(trigger);
    expect(isOpen()).toBe(false);
    expect(values()).toEqual(["kitchen"]);
  });

  it("ignores a row click in single mode", () => {
    const [value, setValue] = createSignal("kitchen");
    const { container } = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker value={value()} onChange={setValue} disabled />
      </EntityDataContext.Provider>
    ));

    fireEvent.click(triggerOf(container));
    expect(document.querySelector('[data-slot="area-picker-row"]')).toBeNull();
    expect(value()).toBe("kitchen");
  });
});

describe("AreaPicker single mode", () => {
  it("reports one id and closes the popover", () => {
    const [value, setValue] = createSignal("");
    const { container } = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker value={value()} onChange={setValue} />
      </EntityDataContext.Provider>
    ));

    expect(triggerOf(container).textContent).toContain("Select area...");

    fireEvent.click(triggerOf(container));
    expect(row("Kitchen").getAttribute("aria-pressed")).toBeNull();

    fireEvent.click(row("Kitchen"));
    expect(value()).toBe("kitchen");
    expect(isOpen()).toBe(false);
    expect(triggerOf(container).textContent).toContain("Kitchen");
  });

  it("clears on a re-tap of the picked area, unless the caller forbids clearing", () => {
    const [value, setValue] = createSignal("kitchen");
    const single = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker value={value()} onChange={setValue} />
      </EntityDataContext.Provider>
    ));

    fireEvent.click(triggerOf(single.container));
    expect(document.body.textContent).not.toContain("Clear selection");
    fireEvent.click(row("Kitchen"));
    expect(value()).toBe("");

    cleanup();
    document.body.innerHTML = "";

    const [kept, setKept] = createSignal("kitchen");
    const pinned = render(() => (
      <EntityDataContext.Provider value={adapter}>
        <AreaPicker value={kept()} onChange={setKept} allowClear={false} />
      </EntityDataContext.Provider>
    ));
    fireEvent.click(triggerOf(pinned.container));
    fireEvent.click(row("Kitchen"));
    expect(kept()).toBe("kitchen");
  });
});
