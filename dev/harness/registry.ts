import { kebab } from "./load-scenario";
import type { ComponentScenarios, IndexedComponent, Scenario } from "./types";

export { kebab };

const modules = import.meta.glob<{ default: ComponentScenarios }>("../components/*/scenarios.tsx", {
  eager: true,
});

const blockModules = import.meta.glob<{ default: ComponentScenarios }>(
  "../blocks/*/scenarios.tsx",
  {
    eager: true,
  },
);

const contracts = import.meta.glob<string>(
  ["../components/*/contract.md", "../blocks/*/contract.md"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);

/** Rows of the contract's `| id | when | then |` table, header and rule dropped. */
export function contractRows(slug: string): string[][] {
  const source =
    contracts[`../components/${slug}/contract.md`] ??
    contracts[`../blocks/${slug}/contract.md`] ??
    "";
  return source
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .slice(2)
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
}

export const COMPONENTS: ComponentScenarios[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.component.localeCompare(b.component));

export const BLOCKS: ComponentScenarios[] = Object.values(blockModules)
  .map((m) => ({ ...m.default, kind: "block" as const }))
  .sort((a, b) => a.component.localeCompare(b.component));

export const findComponent = (component: string): ComponentScenarios | undefined =>
  [...COMPONENTS, ...BLOCKS].find(
    (c) => c.component === component || kebab(c.component) === component,
  );

export const findScenario = (component: string, id: string): Scenario | undefined =>
  findComponent(component)?.scenarios.find((s) => s.id === id);

export const scenarioIndex = (): IndexedComponent[] =>
  [...COMPONENTS, ...BLOCKS].map((c) => ({
    component: c.component,
    slug: kebab(c.component),
    kind: c.kind ?? "component",
    scenarios: c.scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      within: s.within ?? "page",
      width: s.width ?? null,
      steps: s.steps ?? [],
      keyboard: s.keyboard ?? null,
    })),
  }));

export function scenarioPath(
  component: string,
  id: string,
  query: { theme?: "light" | "dark"; material?: string } = {},
): string {
  const params = new URLSearchParams();
  if (query.theme) params.set("theme", query.theme);
  if (query.material) params.set("material", query.material);
  const search = params.toString();
  return `#/components/${kebab(component)}/${id}${search ? `?${search}` : ""}`;
}
