/* Under Trusted Types (Chromium) an Icon whose props re-run with the same icon keeps its
 * svg's children: a widget re-rendering a pill on every sensor tick must not repaint it. */
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, expect, it } from "vitest";
import { Icon, provideIcons } from "../../src/solid/icon.js";

afterEach(() => {
  cleanup();
  provideIcons({ bundled: {} });
});

it("keeps the svg's children when a prop re-runs with the same icon", async () => {
  provideIcons({
    bundled: { "lucide:plus": { body: '<path d="M5 12h14"/>', width: 24, height: 24 } },
  });
  const [pill, setPill] = createSignal({ icon: "lucide:plus", on: false });
  const { container } = render(() => (
    <Icon icon={pill().icon} style={pill().on ? { color: "red" } : undefined} />
  ));
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("no svg");
  const mutations: MutationRecord[] = [];
  const observer = new MutationObserver((list) => mutations.push(...list));
  observer.observe(svg, { childList: true });
  setPill({ icon: "lucide:plus", on: true });
  setPill({ icon: "lucide:plus", on: false });
  await Promise.resolve();
  observer.disconnect();
  expect(mutations).toEqual([]);
  expect(svg.innerHTML).toContain("M5 12h14");
});
