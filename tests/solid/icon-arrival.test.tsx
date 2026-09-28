/* A batch landing redraws only the icons it answered. Under Trusted Types every
 * redraw rewrites the svg body, so an icon woken for nothing costs a DOM write. */
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, it } from "vitest";

Object.assign(globalThis, {
  trustedTypes: {
    createPolicy: (_: string, rules: { createHTML: (s: string) => string }) => ({
      createHTML: (s: string) => ({ toString: () => rules.createHTML(s) }),
    }),
  },
});
const { Icon, provideIcons } = await import("../../src/solid/icon.js");

const PLUS = { body: "<path d='plus'/>", width: 24, height: 24 };
const CCTV = { body: "<path d='cctv'/>", width: 24, height: 24 };

afterEach(() => {
  cleanup();
  provideIcons({ bundled: {} });
});

it("draws a loaded icon without redrawing the ones already drawn", async () => {
  let answer = (_: Record<string, typeof CCTV>) => {};
  provideIcons({
    bundled: { "lucide:plus": PLUS },
    load: () => new Promise((resolve) => (answer = resolve)),
  });
  const { container } = render(() => (
    <>
      <Icon icon="lucide:plus" />
      <Icon icon="mdi:cctv" />
    </>
  ));
  await new Promise((r) => setTimeout(r, 0));
  const [plus, cctv] = [...container.querySelectorAll("svg")];
  let redrawn = 0;
  new MutationObserver((records) => (redrawn += records.length)).observe(plus as Element, {
    childList: true,
  });
  answer({ "mdi:cctv": CCTV });
  await new Promise((r) => setTimeout(r, 0));
  expect(cctv?.innerHTML).toContain("cctv");
  expect(redrawn).toBe(0);
});
