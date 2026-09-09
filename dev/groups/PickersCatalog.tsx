import { createSignal } from "solid-js";
import {
	AreaPicker,
	type Color,
	ColorSlider,
	ColorWheel,
	EntitySelector,
	IconPicker,
	ImagePicker,
	MediaStoreContext,
	MediaTile,
	parseColor,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";
import { DEMO_MEDIA, DemoHost, demoMediaStore } from "../fixtures";

/**
 * Smart-home / rich pickers from @glasshome/ui. ColorWheel and ColorSlider
 * are fully self-contained and driven by local signals below.
 *
 * AreaPicker and EntitySelector read their options through EntityDataContext,
 * NOT from props. DemoHost (dev/fixtures.tsx) gives them a populated,
 * interactive specimen, so the glass trigger, popover, rows and selection
 * chrome are all live.
 */
export function PickersCatalog() {
	// Color pickers share one Color value across the wheel + channel sliders.
	const [color, setColor] = createSignal<Color>(parseColor("hsl(220, 90%, 56%)"));

	// AreaPicker / EntitySelector selection state.
	const [icon, setIcon] = createSignal("mdi:lightbulb");
	const [area, setArea] = createSignal<string>("");
	const [rooms, setRooms] = createSignal<string[]>([]);
	const [lightIds, setLightIds] = createSignal<string[]>([]);
	const [imageId, setImageId] = createSignal("");

	return (
		<DemoHost>
			<CatalogGroup id="cat-pickers" title="Pickers (smart-home)">
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

				<CatalogItem name="IconPicker" hint="curated set + host-provided search" span={2}>
					<div class="w-full max-w-sm">
						<IconPicker value={icon()} onChange={setIcon} placeholder="mdi:lightbulb" />
					</div>
					<CatalogNote>
						Opens as the field expanding: the panel is anchored to the trigger's top edge at the
						trigger's width and radius, so it covers the trigger instead of dropping in below it.
						Browsing the curated libraries needs no host wiring. Pass searchIcons to add live
						search: dash proxies Iconify same-origin so the design system carries no network or CSP
						policy of its own.
					</CatalogNote>
				</CatalogItem>

				<CatalogItem name="AreaPicker" hint="area combobox (EntityDataContext)" span={2}>
					<div class="w-full max-w-sm">
						<AreaPicker value={area()} onChange={setArea} placeholder="Select area..." />
					</div>
					<CatalogNote>
						options come from EntityDataContext (static demo adapter here). Open it: the panel
						covers the trigger, and the trigger drops its own edge and focus ring underneath, so the
						seam carries one border and no ring halo.
					</CatalogNote>
				</CatalogItem>

				<CatalogItem name="AreaPicker (disabled)" hint="read-only, still shows the value" span={2}>
					<div class="w-full max-w-sm">
						<AreaPicker value={area()} onChange={setArea} disabled />
					</div>
					<CatalogNote>
						a read-only caller renders the real picker dimmed, never a text line
					</CatalogNote>
				</CatalogItem>

				<CatalogItem name="AreaPicker (multi)" hint="values / onValuesChange" span={2}>
					<div class="w-full max-w-sm">
						<AreaPicker values={rooms()} onValuesChange={setRooms} placeholder="Whole home" />
					</div>
					<CatalogNote>
						rows toggle instead of closing; the trigger counts them ("2 rooms"). A selected id the
						home no longer has stays listed, greyed, until the next change drops it. The sliding
						indicator rests on a selected row, not on the first one.
					</CatalogNote>
				</CatalogItem>

				<CatalogItem name="EntitySelector" hint="entity combobox (EntityDataContext)" span={2}>
					<div class="w-full max-w-sm">
						<EntitySelector domain="light" entityIds={lightIds()} onEntityIdsChange={setLightIds} />
					</div>
					<CatalogNote>
						domain="light"; entities come from EntityDataContext (static demo adapter here). Rows
						are listbox options carrying the package Checkbox, never a copy of it.
					</CatalogNote>
				</CatalogItem>

				<CatalogItem name="ImagePicker" hint="household gallery (MediaStoreContext)" span={2}>
					<MediaStoreContext.Provider value={demoMediaStore}>
						<div class="w-full max-w-sm">
							<ImagePicker value={imageId()} onChange={setImageId} />
						</div>
					</MediaStoreContext.Provider>
					<CatalogNote>
						options come from MediaStoreContext (in-memory demo store here); upload and delete are
						both live against it. The panel owns no padding; the gallery body inside it does.
					</CatalogNote>
				</CatalogItem>

				<CatalogItem name="MediaTile" hint="one stored picture; picker + library share it" span={2}>
					<div class="grid w-full max-w-sm grid-cols-3 gap-2">
						<MediaTile
							item={DEMO_MEDIA[0]}
							thumbUrl={demoMediaStore.url(DEMO_MEDIA[0].id, "thumb")}
							label="Use demo-1"
							broken={false}
							markUnused
							selected
							onSelect={() => {}}
							onBroken={() => {}}
							onDelete={() => {}}
						/>
						<MediaTile
							item={DEMO_MEDIA[1]}
							thumbUrl={demoMediaStore.url(DEMO_MEDIA[1].id, "thumb")}
							label="Use demo-2"
							broken={false}
							onSelect={() => {}}
							onBroken={() => {}}
							onDelete={() => {}}
						/>
						<MediaTile
							item={DEMO_MEDIA[1]}
							thumbUrl=""
							label="Use demo-2"
							broken
							onSelect={() => {}}
							onBroken={() => {}}
						/>
					</div>
					<CatalogNote>
						selected + unused, plain, and a file whose bytes are gone. The click is the caller's:
						the picker chooses, the settings library opens a preview.
					</CatalogNote>
				</CatalogItem>
			</CatalogGroup>
		</DemoHost>
	);
}
