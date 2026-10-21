import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";
import { provideIcons } from "../../src/solid/icon.js";
import { ICON_SEARCH_DEBOUNCE_MS } from "../../src/solid/icon-picker.js";
import { SchemaForm } from "../../src/solid/schema-form.js";
import { useFakeTime } from "../../src/testing/index.js";

afterEach(() => {
  cleanup();
  provideIcons({ bundled: {} });
});

it("a schema icon field searches through the host's icon source", async () => {
  useFakeTime();
  const queries: [string, string[]][] = [];
  provideIcons({
    bundled: {},
    search: async (query, prefixes) => {
      queries.push([query, prefixes]);
      return ["mdi:transmission-tower"];
    },
  });
  render(() => (
    <SchemaForm
      schema={{ type: "object", properties: { icon: { type: "string", formType: "icon-picker" } } }}
      data={{ icon: "" }}
      onChange={() => {}}
    />
  ));
  await press(document.querySelector('[data-slot="icon-picker-trigger"]') as HTMLElement);
  const input = document.querySelector('input[aria-label="Search icons"]') as HTMLInputElement;
  await userEvent.fill(input, "transmi");
  await vi.advanceTimersByTimeAsync(ICON_SEARCH_DEBOUNCE_MS);
  expect(queries).toEqual([["transmi", ["mdi", "lucide", "solar", "tabler", "ph", "fluent"]]]);
  expect(document.querySelector('button[title="mdi:transmission-tower"]')).not.toBeNull();
});
