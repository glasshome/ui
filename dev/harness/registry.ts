import type { ComponentScenarios, IndexedComponent, Scenario } from "./types";

const modules = import.meta.glob<{ default: ComponentScenarios }>("../components/*/scenarios.tsx", {
  eager: true,
});

const contracts = import.meta.glob<string>("../components/*/contract.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Rows of the contract's `| id | when | then |` table, header and rule dropped. */
export function contractRows(slug: string): string[][] {
  const source = contracts[`../components/${slug}/contract.md`] ?? "";
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

export const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export const findComponent = (component: string): ComponentScenarios | undefined =>
  COMPONENTS.find((c) => c.component === component || kebab(c.component) === component);

export const findScenario = (component: string, id: string): Scenario | undefined =>
  findComponent(component)?.scenarios.find((s) => s.id === id);

export const scenarioIndex = (): IndexedComponent[] =>
  COMPONENTS.map((c) => ({
    component: c.component,
    slug: kebab(c.component),
    scenarios: c.scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      within: s.within ?? "page",
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
