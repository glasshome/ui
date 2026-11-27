import { cleanup, render, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";
import {
  type EntityDataAdapter,
  EntityDataContext,
  type EntityViewLike,
} from "../../src/solid/entity-data.js";
import { EntitySelector } from "../../src/solid/entity-selector.js";

const NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];

const LIGHTS: EntityViewLike[] = NAMES.map((name) => ({
  id: `light.${name.toLowerCase()}`,
  state: "on",
  name,
  friendlyName: `${name} Lamp`,
  aliases: [],
  areaId: "hall",
  icon: "mdi:lightbulb",
  entityCategory: null,
  isHidden: false,
  isDisabled: false,
}));

const adapter: EntityDataAdapter = {
  entityIdsByDomain: () => ({ light: LIGHTS.map((l) => l.id) }),
  useEntities: () => () => LIGHTS,
  getEntityView: (id) => LIGHTS.find((l) => l.id === id),
  useAreas: () => () => [{ id: "hall", name: "Hall", icon: "mdi:door", entityIds: [] }],
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const optionIndex = (id: string | null) => id?.match(/-option-(\d+)$/)?.[1];

describe("EntitySelector search", () => {
  it("a new query names its first match on the input in one write", async () => {
    const { container } = render(() => (
      <EntityDataContext value={adapter}>
        <EntitySelector domain="light" entityIds={[]} onEntityIdsChange={() => {}} />
      </EntityDataContext>
    ));
    const trigger = container.querySelector("button");
    if (!trigger) throw new Error("no trigger");
    await press(trigger);
    const input = await waitFor(() => {
      const el = document.querySelector<HTMLInputElement>('[data-slot="picker-search-input"]');
      if (!el) throw new Error("no search input");
      return el;
    });
    await waitFor(() => expect(document.activeElement).toBe(input));
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    // Alpha, Beta, Delta, Epsilon, Gamma, Zeta: the fourth step rests on Epsilon.
    expect(optionIndex(input.getAttribute("aria-activedescendant"))).toBe("4");

    const named: (string | undefined)[] = [];
    const observer = new MutationObserver(() =>
      named.push(optionIndex(input.getAttribute("aria-activedescendant"))),
    );
    observer.observe(input, { attributeFilter: ["aria-activedescendant"] });
    await userEvent.keyboard("e");
    await waitFor(() => expect(input.value).toBe("e"));
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));
    observer.disconnect();
    expect(optionIndex(input.getAttribute("aria-activedescendant"))).toBe("0");
    expect(named).toEqual(["0"]);
  });
});
