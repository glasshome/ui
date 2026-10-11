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

/** The row's own highlight, inside a selection scope: it inherits the row's radius and box. */
async function rowHighlight(open: () => void, rowSelector: string) {
  open();
  const row = await waitFor(() => {
    const el = document.querySelector<HTMLElement>(rowSelector);
    if (!el) throw new Error(`no row for ${rowSelector}`);
    return el;
  });
  expect(row.closest("[data-selection-scope]")).not.toBeNull();
  return row.firstElementChild;
}

const withData = (ui: () => JSX.Element) =>
  render(() => <EntityDataContext.Provider value={adapter}>{ui()}</EntityDataContext.Provider>);

describe("picker highlight", () => {
  it("Select rows carry their own highlight", async () => {
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
    const highlight = await rowHighlight(() => {}, '[data-slot="select-item"]');
    expect(highlight?.getAttribute("data-on")).toBe("highlighted");
  });

  it("AreaPicker rows carry their own highlight", async () => {
    const { container } = withData(() => <AreaPicker value="" onChange={() => {}} />);
    const trigger = container.querySelector("button");
    if (!trigger) throw new Error("no trigger");
    const highlight = await rowHighlight(
      () => fireEvent.click(trigger),
      '[data-slot="area-picker-row"]',
    );
    expect(highlight?.getAttribute("data-on")).toBe("highlighted");
  });

  it("EntitySelector rows carry their own highlight", async () => {
    const { container } = withData(() => (
      <EntitySelector domain="light" entityIds={[]} onEntityIdsChange={() => {}} />
    ));
    const trigger = container.querySelector("button");
    if (!trigger) throw new Error("no trigger");
    const highlight = await rowHighlight(
      () => fireEvent.click(trigger),
      '[data-slot="entity-selector-row"]',
    );
    expect(highlight?.getAttribute("data-on")).toBe("highlighted");
  });
});
