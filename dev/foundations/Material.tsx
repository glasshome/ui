import { createSignal, For, onCleanup } from "solid-js";
import { CARD_SURFACE } from "../../src";
import { Badge, Button, Switch } from "../../src/solid";
import { FROSTED, type Material, resolveMaterial } from "../../src/tokens";

const SAMPLES: [name: string, material: Material][] = [
  ["Glass", FROSTED],
  ["Frosted", { v: 1, preset: "frost" }],
  ["Paper", { v: 1, preset: "paper" }],
  ["Neon", { v: 1, preset: "neon" }],
  ["Chalk", { v: 1, preset: "chalk" }],
];

const GROUND =
  "radial-gradient(38% 60% at 14% 10%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 70%), radial-gradient(36% 56% at 88% 90%, color-mix(in srgb, var(--primary) 40%, transparent), transparent 70%), radial-gradient(30% 40% at 60% 40%, color-mix(in srgb, var(--love) 26%, transparent), transparent 70%), var(--background)";

function usePageMode() {
  const read = (): "dark" | "light" =>
    document.documentElement.classList.contains("dark") ? "dark" : "light";
  const [mode, setMode] = createSignal(read());
  const observer = new MutationObserver(() => setMode(read()));
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  onCleanup(() => observer.disconnect());
  return mode;
}

export default function MaterialFoundation() {
  const mode = usePageMode();
  return (
    <section class="flex flex-col gap-4" data-foundation="material">
      <p class="text-muted-foreground text-sm">
        One card, one badge, one button, one switch, under each built-in material. The wrapper sets
        only the material variables, read for the page's mode; every surface and control inside
        multiplies them into its own knobs.
      </p>
      <div
        class="grid grid-cols-1 gap-6 overflow-hidden rounded-xl p-6 sm:grid-cols-2"
        style={{ background: GROUND }}
      >
        <For each={SAMPLES}>
          {([name, material]) => (
            <div style={resolveMaterial(material, "dynamic", mode())}>
              <div class={`flex flex-col gap-3 rounded-lg p-4 ${CARD_SURFACE}`}>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-foreground text-sm font-semibold">{name}</span>
                  <Badge tone="var(--success)">on</Badge>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <Button size="sm">Action</Button>
                  <Switch checked />
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
