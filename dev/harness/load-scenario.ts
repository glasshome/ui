import type { ComponentScenarios, Scenario } from "./types";

const modules = import.meta.glob<{ default: ComponentScenarios }>([
  "../components/*/scenarios.tsx",
  "../blocks/*/scenarios.tsx",
]);

export const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Loads only the named subject's scenarios, so a test links its own component and nothing else. */
export async function loadScenario(component: string, id: string): Promise<Scenario | undefined> {
  const slug = kebab(component);
  const load =
    modules[`../components/${slug}/scenarios.tsx`] ?? modules[`../blocks/${slug}/scenarios.tsx`];
  if (!load) return undefined;
  const { default: subject } = await load();
  return subject.scenarios.find((s) => s.id === id);
}
