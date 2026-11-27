import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";
import { provideIcons } from "../../src/solid/icon.js";
import { ICON_SEARCH_DEBOUNCE_MS, IconPicker } from "../../src/solid/icon-picker.js";
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

it("two searches answering out of order show only the latest", async () => {
  useFakeTime();
  const answers = new Map<string, (icons: string[]) => void>();
  provideIcons({
    bundled: {},
    search: (query) => new Promise<string[]>((resolve) => answers.set(query, resolve)),
  });
  const [value, setValue] = createSignal("");
  render(() => <IconPicker value={value()} onChange={setValue} />);
  await press(document.querySelector('[data-slot="icon-picker-trigger"]') as HTMLElement);
  const input = document.querySelector('input[aria-label="Search icons"]') as HTMLInputElement;
  const shown = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>("button[title]"), (b) => b.title);

  await userEvent.fill(input, "lamp");
  await vi.advanceTimersByTimeAsync(ICON_SEARCH_DEBOUNCE_MS);
  await userEvent.fill(input, "lampshade");
  await vi.advanceTimersByTimeAsync(ICON_SEARCH_DEBOUNCE_MS);
  expect([...answers.keys()]).toEqual(["lamp", "lampshade"]);

  answers.get("lampshade")?.(["mdi:lamps"]);
  await vi.advanceTimersByTimeAsync(0);
  expect(shown()).toEqual(["mdi:lamps"]);

  answers.get("lamp")?.(["mdi:desk-lamp"]);
  await vi.advanceTimersByTimeAsync(0);
  expect(shown()).toEqual(["mdi:lamps"]);
});

it("an older search answering first never shows its icons", async () => {
  useFakeTime();
  const answers = new Map<string, (icons: string[]) => void>();
  provideIcons({
    bundled: {},
    search: (query) => new Promise<string[]>((resolve) => answers.set(query, resolve)),
  });
  const [value, setValue] = createSignal("");
  render(() => <IconPicker value={value()} onChange={setValue} />);
  await press(document.querySelector('[data-slot="icon-picker-trigger"]') as HTMLElement);
  const input = document.querySelector('input[aria-label="Search icons"]') as HTMLInputElement;
  const shown = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>("button[title]"), (b) => b.title);

  await userEvent.fill(input, "lamp");
  await vi.advanceTimersByTimeAsync(ICON_SEARCH_DEBOUNCE_MS);
  await userEvent.fill(input, "lampshade");
  await vi.advanceTimersByTimeAsync(ICON_SEARCH_DEBOUNCE_MS);

  answers.get("lamp")?.(["mdi:desk-lamp"]);
  await vi.advanceTimersByTimeAsync(0);
  expect(shown()).not.toContain("mdi:desk-lamp");

  answers.get("lampshade")?.(["mdi:lamps"]);
  await vi.advanceTimersByTimeAsync(0);
  expect(shown()).toEqual(["mdi:lamps"]);
});
