/* Icon renders one inline <svg> from the host's source: bundled data on the
 * first paint, loaded data when a batch resolves, a 1em placeholder when the
 * name is unknown, and the same node kept throughout (no remount). */
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Icon, provideIcons } from "../../src/solid/icon.js";

const PLUS = { body: '<path d="M5 12h14m-7-7v14"/>', width: 24, height: 24 };

afterEach(() => {
  cleanup();
  provideIcons({ bundled: {} });
});

describe("Icon", () => {
  it("renders a bundled icon synchronously as an inline svg", () => {
    provideIcons({ bundled: { "lucide:plus": PLUS } });
    const { container } = render(() => <Icon icon="lucide:plus" width={18} class="text-primary" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-slot")).toBe("icon");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg?.getAttribute("width")).toBe("18");
    expect(svg?.getAttribute("height")).toBe("18");
    expect(svg?.getAttribute("class")).toBe("text-primary");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.innerHTML).toContain("M5 12h14");
    expect(container.querySelector("svg")?.shadowRoot).toBeNull();
  });

  it("defaults to 1em when no size is given", () => {
    provideIcons({ bundled: { "lucide:plus": PLUS } });
    const { container } = render(() => <Icon icon="lucide:plus" />);
    expect(container.querySelector("svg")?.getAttribute("height")).toBe("1em");
  });

  it("holds a 1em placeholder for an unknown icon and fills it when the batch resolves", async () => {
    const asked: string[][] = [];
    provideIcons({
      bundled: {},
      load: async (names) => {
        asked.push(names);
        return { "mdi:cctv": PLUS, "mdi:nope": null };
      },
    });
    const { container } = render(() => (
      <>
        <Icon icon="mdi:cctv" width={16} />
        <Icon icon="mdi:nope" width={16} />
      </>
    ));
    const [first, second] = [...container.querySelectorAll("svg")];
    expect(first?.innerHTML).toBe("");
    expect(first?.getAttribute("width")).toBe("16");
    await new Promise((r) => setTimeout(r, 0));
    expect(asked).toEqual([["mdi:cctv", "mdi:nope"]]);
    expect(first?.innerHTML).toContain("M5 12h14");
    expect(second?.innerHTML).toBe("");
    expect(container.querySelectorAll("svg")[0]).toBe(first);
    await new Promise((r) => setTimeout(r, 0));
    expect(asked.length).toBe(1);
  });

  it("re-resolves every mounted icon when a source arrives later", async () => {
    const { container } = render(() => <Icon icon="lucide:plus" />);
    expect(container.querySelector("svg")?.innerHTML).toBe("");
    provideIcons({ bundled: { "lucide:plus": PLUS } });
    expect(container.querySelector("svg")?.innerHTML).toContain("M5 12h14");
  });
});
