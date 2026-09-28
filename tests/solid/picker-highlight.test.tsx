/* Every MENU_ITEM row is rounded-sm, so the one sliding highlight behind it
 * must be too: a rounded-lg default pill overhangs the row's corners. */
import { cleanup, fireEvent, render, waitFor } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { AreaPicker } from "../../src/solid/area-picker.js";
import {
  type AreaViewLike,
  type EntityDataAdapter,
  EntityDataContext,
  type EntityViewLike,
} from "../../src/solid/entity-data.js";
import { EntitySelector } from "../../src/solid/entity-selector.js";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../src/solid/select.js";

const AREAS: AreaViewLike[] = [
  { id: "kitchen", name: "Kitchen", icon: "mdi:silverware", entityIds: ["light.counter"] },
];

const LIGHTS: EntityViewLike[] = [
  {
    id: "light.counter",
    state: "on",
    name: "Counter",
    friendlyName: "Counter Light",
    aliases: [],
    areaId: "kitchen",
    icon: "mdi:lightbulb",
    entityCategory: null,
    isHidden: false,
    isDisabled: false,
  },
];

const adapter: EntityDataAdapter = {
  entityIdsByDomain: () => ({ light: LIGHTS.map((l) => l.id) }),
  useEntities: () => () => LIGHTS,
  getEntityView: (id) => LIGHTS.find((l) => l.id === id),
  useAreas: () => () => AREAS,
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

// The indicator only paints once it measures real geometry; happy-dom reports
// zeros, so the whole assertion runs under a faked layout.
async function withMeasurableLayout<T>(fn: () => Promise<T>): Promise<T> {
  const rect = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "getBoundingClientRect");
  const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 34, width: 200, height: 34 }) as DOMRect;
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 200,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 34,
  });
  try {
    return await fn();
  } finally {
    if (rect) Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", rect);
    if (width) Object.defineProperty(HTMLElement.prototype, "clientWidth", width);
    if (height) Object.defineProperty(HTMLElement.prototype, "clientHeight", height);
  }
}

async function highlightRadius(open: () => void, rowSelector: string) {
  return withMeasurableLayout(async () => {
    open();
    const row = await waitFor(() => {
      const el = document.querySelector<HTMLElement>(rowSelector);
      if (!el) throw new Error(`no row for ${rowSelector}`);
      return el;
    });
    row.setAttribute("data-highlighted", "");
    await waitFor(() => {
      const indicator = document.querySelector("[data-sliding-indicator]");
      if (!indicator) throw new Error("indicator never painted");
      return indicator;
    });
    return document.querySelector<HTMLElement>("[data-sliding-indicator]")?.className ?? "";
  });
}

const withData = (ui: () => JSX.Element) =>
  render(() => <EntityDataContext.Provider value={adapter}>{ui()}</EntityDataContext.Provider>);

describe("picker highlight radius", () => {
  it("Select highlights an item at the row radius", async () => {
    render(() => (
      <Select
        options={["Apple", "Banana"]}
        open
        itemComponent={(p) => <SelectItem item={p.item}>{String(p.item.rawValue)}</SelectItem>}
      >
        <SelectTrigger>Pick</SelectTrigger>
        <SelectContent />
      </Select>
    ));
    expect(await highlightRadius(() => {}, '[data-slot="select-item"]')).toContain("rounded-sm");
  });

  it("AreaPicker highlights a row at the row radius", async () => {
    const { container } = withData(() => <AreaPicker value="" onChange={() => {}} />);
    const trigger = container.querySelector("button");
    if (!trigger) throw new Error("no trigger");
    expect(
      await highlightRadius(() => fireEvent.click(trigger), '[data-slot="area-picker-row"]'),
    ).toContain("rounded-sm");
  });

  it("EntitySelector highlights a row at the row radius", async () => {
    const { container } = withData(() => (
      <EntitySelector domain="light" entityIds={[]} onEntityIdsChange={() => {}} />
    ));
    const trigger = container.querySelector("button");
    if (!trigger) throw new Error("no trigger");
    expect(
      await highlightRadius(() => fireEvent.click(trigger), '[data-slot="entity-selector-row"]'),
    ).toContain("rounded-sm");
  });
});
