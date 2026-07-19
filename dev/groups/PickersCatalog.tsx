import { createSignal, onMount } from "solid-js";
import {
	AreaPicker,
	Calendar,
	type Color,
	ColorSlider,
	ColorWheel,
	EntitySelector,
	isDemoMode,
	loadDemoData,
	parseColor,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

/**
 * Smart-home / rich pickers from @glasshome/ui. Calendar, ColorWheel and
 * ColorSlider are fully self-contained and driven by local signals below.
 *
 * AreaPicker and EntitySelector read their options from the global
 * @glasshome/sync-layer store (via useAreas / useEntities), NOT from props. To
 * give them a populated, interactive specimen on this dev page we seed the
 * shared store with the demo fixtures (same areas + light entities the demo
 * dashboard uses) on mount, so the glass trigger, popover, rows and selection
 * chrome are all live.
 */
export function PickersCatalog() {
	// Populate the sync-layer store so the smart-home pickers have real options.
	onMount(() => {
		if (!isDemoMode()) void loadDemoData();
	});

	// Calendar
	const [date, setDate] = createSignal<Date>(new Date());

	// Color pickers share one Color value across the wheel + channel sliders.
	const [color, setColor] = createSignal<Color>(parseColor("hsl(220, 90%, 56%)"));

	// AreaPicker / EntitySelector selection state.
	const [area, setArea] = createSignal<string>("");
	const [lightIds, setLightIds] = createSignal<string[]>([]);

	return (
		<CatalogGroup id="cat-pickers" title="Pickers (smart-home)">
			<CatalogItem name="Calendar" hint="single-date, month nav" span={2}>
				<Calendar
					mode="single"
					selected={date()}
					onSelect={(d) => d instanceof Date && setDate(d)}
					class="rounded-lg border border-border/60"
				/>
				<CatalogNote>selected: {date().toLocaleDateString()}</CatalogNote>
			</CatalogItem>

			<CatalogItem name="ColorWheel" hint="hue ring (Kobalte)" span={2}>
				<div class="flex items-center gap-4">
					<ColorWheel value={color()} onChange={setColor} size={160} aria-label="Pick a hue" />
					<div class="flex flex-col gap-2">
						<div
							class="size-12 rounded-lg border border-border/60"
							style={{ background: color().toString("css") }}
						/>
						<code class="font-mono text-[10px] text-muted-foreground">
							{color().toString("hex")}
						</code>
					</div>
				</div>
				<CatalogNote>parseColor(...) value, shared with the sliders below</CatalogNote>
			</CatalogItem>

			<CatalogItem name="ColorSlider" hint="single-channel track">
				<div class="flex w-full flex-col gap-3">
					<ColorSlider channel="hue" value={color()} onChange={setColor} aria-label="Hue" />
					<ColorSlider
						channel="lightness"
						value={color()}
						onChange={setColor}
						aria-label="Lightness"
					/>
				</div>
				<CatalogNote>channel="hue" / "lightness"</CatalogNote>
			</CatalogItem>

			<CatalogItem name="AreaPicker" hint="area combobox (sync-layer)" span={2}>
				<div class="w-full max-w-sm">
					<AreaPicker value={area()} onChange={setArea} placeholder="Select area..." />
				</div>
				<CatalogNote>
					options come from the sync-layer store (seeded with demo areas here)
				</CatalogNote>
			</CatalogItem>

			<CatalogItem name="EntitySelector" hint="entity combobox (sync-layer)" span={2}>
				<div class="w-full max-w-sm">
					<EntitySelector domain="light" entityIds={lightIds()} onEntityIdsChange={setLightIds} />
				</div>
				<CatalogNote>
					domain="light"; entities come from the sync-layer store (seeded with demo lights here)
				</CatalogNote>
			</CatalogItem>
		</CatalogGroup>
	);
}
