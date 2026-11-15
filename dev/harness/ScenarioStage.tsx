import { Show } from "solid-js";
import { MATERIAL_PRESETS, type MaterialPresetId, resolveMaterial } from "../../src/tokens";
import { findComponent, findScenario } from "./registry";
import { Within } from "./Within";

const isPreset = (name: string): name is MaterialPresetId => Object.hasOwn(MATERIAL_PRESETS, name);

export function ScenarioStage(props: {
  component: string;
  id: string;
  material: string | null;
  dark: boolean;
}) {
  const scenario = () => findScenario(props.component, props.id);
  const name = () => findComponent(props.component)?.component ?? props.component;
  const style = () => {
    const preset = props.material;
    if (!preset || !isPreset(preset)) return {};
    return resolveMaterial({ v: 1, preset }, "dynamic", props.dark ? "dark" : "light");
  };
  return (
    <Show
      when={scenario()}
      keyed
      fallback={<p data-scenario-missing>{`no scenario ${props.component}/${props.id}`}</p>}
    >
      {(s) => (
        <div data-scenario={`${name()}/${s.id}`} class="p-6" style={style()}>
          <Within mode={s.within ?? "page"}>{s.render()}</Within>
        </div>
      )}
    </Show>
  );
}
