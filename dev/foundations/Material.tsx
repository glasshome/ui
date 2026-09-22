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
];

const GROUND =
	"radial-gradient(38% 60% at 14% 10%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 70%), radial-gradient(36% 56% at 88% 90%, color-mix(in srgb, var(--primary) 40%, transparent), transparent 70%), radial-gradient(30% 40% at 60% 40%, color-mix(in srgb, var(--love) 26%, transparent), transparent 70%), var(--background)";

export default function MaterialFoundation() {
	return (
		<section class="flex flex-col gap-4" data-foundation="material">
			<p class="text-muted-foreground text-sm">
				One card, one badge, one button, one switch, under the four presets and two dialled
				Frosteds. The wrapper sets only the four tier variables; every surface inside multiplies
				them into its own knobs.
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
									<span class="font-semibold text-foreground text-sm">{name}</span>
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
