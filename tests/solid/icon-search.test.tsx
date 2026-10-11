import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { afterEach, expect, it, vi } from "vitest";
import { provideIcons } from "../../src/solid/icon.js";
import { ICON_SEARCH_DEBOUNCE_MS } from "../../src/solid/icon-picker.js";
import { SchemaForm } from "../../src/solid/schema-form.js";
import { useFakeTime } from "../harness/fake-time.js";

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
  fireEvent.click(document.querySelector('[data-slot="icon-picker-trigger"]') as HTMLElement);
  const input = document.querySelector('input[aria-label="Search icons"]') as HTMLInputElement;
  fireEvent.input(input, { target: { value: "transmi" } });
  await vi.advanceTimersByTimeAsync(ICON_SEARCH_DEBOUNCE_MS);
  expect(queries).toEqual([["transmi", ["mdi", "lucide", "solar", "tabler", "ph", "fluent"]]]);
  expect(document.querySelector('button[title="mdi:transmission-tower"]')).not.toBeNull();
});
