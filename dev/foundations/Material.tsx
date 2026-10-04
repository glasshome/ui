import { For } from "solid-js";
import { CARD_SURFACE } from "../../src";
import { Badge, Button, Switch } from "../../src/solid";
import { FROSTED, type Material, resolveMaterial } from "../../src/tokens";

const SAMPLES: [name: string, material: Material][] = [
  ["Frosted", FROSTED],
  ["Paper", { v: 1, preset: "paper" }],
  ["Paper, inked", { v: 1, preset: "paper", dials: { ink: 1 } }],
  ["Neon", { v: 1, preset: "neon" }],
  ["Frosted, depth 0.3", { v: 1, preset: "frosted", dials: { depth: 0.3 } }],
  [
    "Frosted, tint 1.6, clarity 30%",
    { v: 1, preset: "frosted", dials: { tint: 1.6, clarity: 30 } },
  ],
  [
    "Liquid Glass Standard (coasting24)",
    {
      v: 1,
      preset: "frosted",
      dials: {
        clarity: 16,
        vibrancy: 0.72,
        edge: 1.9,
        rim: "top-bottom",
        darkScale: 0.32,
        innerGlow: 0.92,
        innerGlowHue: 0,
      },
    },
  ],
  [
    "Neon Pink (coasting24)",
    {
      v: 1,
      preset: "frosted",
      dials: {
        blur: 8,
        clarity: 92,
        depth: 0.4,
        tint: 0.9,
        glow: 10,
        face: "raised",
        accent: "oklch(0.65 0.26 0)",
      },
    },
  ],
  [
    "Neon v2",
    {
      v: 1,
      preset: "neon",
      dials: {
        blur: 9,
        clarity: 57,
        tint: 0.6,
        vibrancy: 1.3,
        edge: 0.25,
        sheen: 0.3,
        shadow: 1,
        glow: 5,
        innerGlow: 0.35,
        accent: "oklch(0.68 0.27 340)",
      },
    },
  ],
];

const GROUND =
  "radial-gradient(38% 60% at 14% 10%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 70%), radial-gradient(36% 56% at 88% 90%, color-mix(in srgb, var(--primary) 40%, transparent), transparent 70%), radial-gradient(30% 40% at 60% 40%, color-mix(in srgb, var(--love) 26%, transparent), transparent 70%), var(--background)";

export default function MaterialFoundation() {
  return (
    <section class="flex flex-col gap-4" data-foundation="material">
      <p class="text-muted-foreground text-sm">
        One card, one badge, one button, one switch, under the presets, two dialled Frosteds and
        three looks built from terms alone. The wrapper sets only the material variables (light mode
        readings); every surface and control inside multiplies them into its own knobs.
      </p>
      <div
        class="grid grid-cols-1 gap-6 overflow-hidden rounded-xl p-6 sm:grid-cols-2"
        style={{ background: GROUND }}
      >
        <For each={SAMPLES}>
          {([name, material]) => (
            <div style={resolveMaterial(material, "dynamic")}>
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
