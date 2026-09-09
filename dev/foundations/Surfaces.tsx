import { For } from "solid-js";
import {
	CARD_SURFACE,
	FIELD_CHROME,
	INPUT_SURFACE,
	OVERLAY_SURFACE,
	SCRIM_CLASS,
	TRACK_SURFACE,
} from "../../src";

const RECIPES: [name: string, recipe: string, wear: string][] = [
	["CARD_SURFACE", CARD_SURFACE, "panels, via <Card>"],
	["OVERLAY_SURFACE", OVERLAY_SURFACE, "anything floating"],
	["INPUT_SURFACE", INPUT_SURFACE, "text fields and pickers"],
	["FIELD_CHROME", FIELD_CHROME, "toggle chrome and rails"],
	["TRACK_SURFACE", TRACK_SURFACE, "segmented tracks"],
	["SCRIM_CLASS", SCRIM_CLASS, "modal backdrop"],
];

const GROUND =
	"radial-gradient(38% 60% at 14% 10%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 70%), radial-gradient(36% 56% at 88% 90%, color-mix(in srgb, var(--primary) 40%, transparent), transparent 70%), radial-gradient(30% 40% at 60% 40%, color-mix(in srgb, var(--love) 26%, transparent), transparent 70%), var(--background)";

export default function Surfaces() {
	return (
		<section class="flex flex-col gap-4" data-foundation="surfaces">
			<p class="text-muted-foreground text-sm">
				The sanctioned recipes, one per panel, over one ground. Nothing here hand-rolls a
				translucent plate.
			</p>
			<div
				class="grid grid-cols-1 gap-6 overflow-hidden rounded-xl p-6 sm:grid-cols-2 lg:grid-cols-3"
				style={{ background: GROUND }}
			>
				<For each={RECIPES}>
					{([name, recipe, wear]) => (
						<div class={`flex h-32 flex-col justify-end gap-1 rounded-lg p-4 ${recipe}`}>
							<code class="font-mono font-semibold text-foreground text-xs">{name}</code>
							<span class="text-[11px] text-muted-foreground">{wear}</span>
						</div>
					)}
				</For>
			</div>
		</section>
	);
}
