import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { BusyPage } from "../../dev/blocks/busy-page";
import { BLOCKS, COMPONENTS, findScenario, scenarioPath } from "../../dev/harness/registry";
import type { Within } from "../../dev/harness/types";
import { Within as WithinStage } from "../../dev/harness/Within";
import * as overlayClasses from "../../src/lib/overlay-classes.js";
import * as solid from "../../src/solid/index.js";

afterEach(cleanup);

describe("scenario registry", () => {
  it("holds the pilot components", () => {
    const names = COMPONENTS.map((c) => c.component);
    expect(names).toEqual(expect.arrayContaining(["Select", "Tabs"]));
  });

  it("every component name is an export of src/solid/index.ts", () => {
    for (const { component } of COMPONENTS) expect(Object.keys(solid)).toContain(component);
  });

  it("scenario ids are unique within a component and kebab-case", () => {
    for (const { component, scenarios } of COMPONENTS) {
      const ids = scenarios.map((s) => s.id);
      expect(new Set(ids).size, component).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("finds a scenario by component and id, and names its stage route", () => {
    expect(findScenario("Tabs", "keyboard-nav")?.id).toBe("keyboard-nav");
    expect(findScenario("Tabs", "missing")).toBeUndefined();
    expect(scenarioPath("Tabs", "keyboard-nav", { theme: "dark" })).toBe(
      "#/components/tabs/keyboard-nav?theme=dark",
    );
  });
});

const RENDERED: Record<Within, (container: HTMLElement) => boolean> = {
  page: (container) => container.querySelector("[data-slot]") !== null,
  dialog: () => document.querySelector('[role="dialog"] [data-slot]') !== null,
  sheet: () => document.querySelector('[role="dialog"] [data-slot]') !== null,
  "shadow-root": (container) => {
    const host = container.querySelector<HTMLElement>('[data-within="shadow-root"]');
    return host !== null && host.shadowRoot === null && host.getBoundingClientRect().height > 0;
  },
};

const CASES = COMPONENTS.flatMap((c) =>
  c.scenarios.map((s) => [`${c.component} ${s.id}`, s] as const),
);

describe("every scenario", () => {
  it.each(CASES)("%s renders inside its Within", async (_name, scenario) => {
    const within = scenario.within ?? "page";
    const { container } = render(() => (
      <WithinStage mode={within}>{scenario.render()}</WithinStage>
    ));
    await expect.poll(() => RENDERED[within](container)).toBe(true);
  });
});

const BEHAVIOR_FILES = Object.keys(import.meta.glob("../../src/lib/behavior/*.{ts,tsx}")).map(
  (path) => (path.split("/").at(-1) ?? "").replace(/\.tsx?$/, ""),
);

const CSS_BLOCKS = Object.keys(overlayClasses).map((name) =>
  name.toLowerCase().replaceAll("_", "-"),
);

const BLOCK_SOURCES = import.meta.glob<string>("../../dev/blocks/*/scenarios.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("block registry", () => {
  it("holds a pilot block", () => {
    expect(BLOCKS.map((b) => b.component)).toContain("solid");
  });

  it("a block's name matches a file in src/lib/behavior or a class in overlay-classes", () => {
    for (const block of BLOCKS) {
      expect(block.kind, block.component).toBe("block");
      expect([...BEHAVIOR_FILES, ...CSS_BLOCKS], block.component).toContain(block.component);
    }
  });

  it("a block scenario imports nothing from src/solid", () => {
    for (const [path, source] of Object.entries(BLOCK_SOURCES)) {
      const imports = source.split("\n").filter((line) => /^\s*(import|\} from)\b/.test(line));
      expect(
        imports.filter((line) => line.includes("src/solid")),
        path,
      ).toEqual([]);
    }
  });

  it("finds a block scenario by name, as a component is found", () => {
    expect(findScenario("solid", "effect-attribute")?.id).toBe("effect-attribute");
  });
});

const BLOCK_CASES = BLOCKS.flatMap((b) =>
  b.scenarios.map((s) => [`${b.component} ${s.id}`, s] as const),
);

describe("every block scenario", () => {
  it.each(BLOCK_CASES)("%s renders beside the 1,000-element page", async (_name, scenario) => {
    const { container } = render(() => <BusyPage>{scenario.render()}</BusyPage>);
    await expect.poll(() => container.querySelectorAll("*").length).toBeGreaterThan(1000);
    expect(container.querySelector("button")).not.toBeNull();
  });
});
