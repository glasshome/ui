import type { ComponentScenarios, Scenario } from "./types";

const modules = import.meta.glob<{ default: ComponentScenarios }>("../components/*/scenarios.tsx", {
  eager: true,
});

export const COMPONENTS: ComponentScenarios[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.component.localeCompare(b.component));

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export const findComponent = (component: string): ComponentScenarios | undefined =>
  COMPONENTS.find((c) => c.component === component || kebab(c.component) === component);

export const findScenario = (component: string, id: string): Scenario | undefined =>
  findComponent(component)?.scenarios.find((s) => s.id === id);

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
