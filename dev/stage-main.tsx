// One entry, no chrome (stage.html#/screens/settings-shape?theme=dark); the theme rides in the hash because a class on the parent's documentElement stops at the iframe.
import { bundled } from "virtual:gallery-icons";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Dynamic, render } from "solid-js/web";
import { provideIcons, Toaster } from "../src/solid";
import { ScenarioStage } from "./harness/ScenarioStage";
import { findEntry } from "./routes";
import "./styles.css";

provideIcons({ bundled });

interface StageRoute {
  parts: string[];
  theme: string | null;
  material: string | null;
}

function readRoute(): StageRoute {
  const [path = "", query = ""] = window.location.hash.replace(/^#\/?/, "").split("?");
  const params = new URLSearchParams(query);
  return {
    parts: path.split("/").filter(Boolean),
    theme: params.get("theme"),
    material: params.get("material"),
  };
}

function useStageRoute() {
  const [route, setRoute] = createSignal(readRoute());
  const onChange = () => setRoute(readRoute());
  window.addEventListener("hashchange", onChange);
  onCleanup(() => window.removeEventListener("hashchange", onChange));
  return route;
}

function StageEntry() {
  const route = useStageRoute();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const dark = () => {
    const theme = route().theme;
    return theme === null ? prefersDark.matches : theme === "dark";
  };
  const isScenario = () => route().parts[0] === "components" && route().parts.length === 3;
  const entry = () => findEntry(route().parts[0] ?? "", route().parts[1] ?? "");

  createEffect(() => document.documentElement.classList.toggle("dark", dark()));

  return (
    <div class="bg-background text-foreground min-h-screen">
      <Show
        when={isScenario()}
        fallback={<Show when={entry()}>{(e) => <Dynamic component={e().component} />}</Show>}
      >
        <ScenarioStage
          component={route().parts[1] ?? ""}
          id={route().parts[2] ?? ""}
          material={route().material}
          dark={dark()}
        />
      </Show>
      <Toaster />
    </div>
  );
}

render(() => <StageEntry />, document.getElementById("root") as HTMLElement);
