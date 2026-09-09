import { For } from "solid-js";
import {
	Card,
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
	Overlay,
	SectionIcon,
} from "../../src/solid";
import { CatalogGroup } from "../CatalogKit";
import { GlassPlayground } from "../GlassPlayground";

/** The material itself, not a component: full-width blocks over a soft glow so
 *  the frost reads. Moves to the Foundations area. */

const STAGE = "relative flex w-full flex-wrap items-start gap-4 overflow-hidden rounded-lg p-6";
const STAGE_STYLE = {
	background:
		"radial-gradient(42% 68% at 18% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 72%), radial-gradient(38% 60% at 92% 100%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 72%), var(--background)",
};
const BLOCK = "sm:col-span-2 lg:col-span-3";

const KNOBS: [string, string, string][] = [
	["--glass-base", "card/60%", "ground color + opacity (overlays: --popover)"],
	["--glass-blur", "24px", "frost / backdrop-blur (panels only)"],
	["--glass-lift", "0.45", "soft shadow that floats the pane"],
	["--glass-tone", "transparent", "optional color — accent surfaces + chips"],
	["--glass-wash", "20%", "tone wash strength (tinted look via .glass-tint)"],
];

export function GlassCatalog() {
	return (
		<CatalogGroup id="cat-glass" title="Glass — the one material">
			<div class={BLOCK}>
				<GlassPlayground />
			</div>

			<div class={BLOCK}>
				<div class={STAGE} style={STAGE_STYLE}>
					<Card padding="md" class="w-48">
						<p class="font-semibold text-sm">Card</p>
						<p class="mt-1 text-muted-foreground text-xs">frosted · raised</p>
					</Card>
					<Card padding="md" class="w-48" style={{ "--glass-tone": "var(--accent)" }}>
						<p class="font-semibold text-sm">Card · accent</p>
						<p class="mt-1 text-muted-foreground text-xs">--glass-tone: var(--accent)</p>
					</Card>
					<Overlay class="w-48 p-4">
						<p class="font-semibold text-sm">Overlay</p>
						<p class="mt-1 text-muted-foreground text-xs">opaque · floats</p>
					</Overlay>
				</div>
			</div>

			<div class={BLOCK}>
				<div class={STAGE} style={STAGE_STYLE}>
					<Card padding="none" class="w-72 overflow-hidden">
						<ItemGroup>
							<Item>
								<ItemMedia>
									<SectionIcon icon="lucide:folder" size="sm" />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>Automations</ItemTitle>
									<ItemDescription>12 active, 3 paused</ItemDescription>
								</ItemContent>
							</Item>
							<ItemSeparator class="mx-4" />
							<Item>
								<ItemMedia>
									<SectionIcon icon="lucide:zap" size="sm" />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>Scenes</ItemTitle>
									<ItemDescription>3 configured</ItemDescription>
								</ItemContent>
							</Item>
						</ItemGroup>
					</Card>
				</div>
			</div>

			<div class={`${BLOCK} divide-y divide-border/40`}>
				<For each={KNOBS}>
					{([name, def, desc]) => (
						<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2">
							<code class="w-36 font-mono text-foreground text-xs">{name}</code>
							<code class="w-24 font-mono text-primary text-xs tabular-nums">{def}</code>
							<span class="text-muted-foreground text-xs">{desc}</span>
						</div>
					)}
				</For>
			</div>
		</CatalogGroup>
	);
}
