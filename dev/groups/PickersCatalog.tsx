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
	PickerRow,
	PickerSearch,
	parseColor,
} from "../../src/solid";
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";
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
				<Specimen name="ColorWheel" state={color().toString("hex")} span={2}>
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
				</Specimen>

				<Specimen name="ColorSlider">
					<Axis of="channel">
						<div class="flex w-full flex-col gap-3">
							<ColorSlider channel="hue" value={color()} onChange={setColor} aria-label="Hue" />
							<ColorSlider
								channel="lightness"
								value={color()}
								onChange={setColor}
								aria-label="Lightness"
							/>
						</div>
					</Axis>
				</Specimen>

				<Specimen name="IconPicker" try={icon()} span={2}>
					<div class="w-full max-w-sm">
						<IconPicker value={icon()} onChange={setIcon} placeholder="mdi:lightbulb" />
					</div>
				</Specimen>

				<Specimen name="AreaPicker" try="Choose a room..." span={2}>
					<Axis of="value">
						<div class="w-full max-w-sm">
							<AreaPicker value={area()} onChange={setArea} placeholder="Choose a room..." />
						</div>
					</Axis>
					<Axis of="disabled">
						<div class="w-full max-w-sm">
							<AreaPicker value={area()} onChange={setArea} disabled />
						</div>
					</Axis>
					<Axis of="values">
						<div class="w-full max-w-sm">
							<AreaPicker values={rooms()} onValuesChange={setRooms} placeholder="Whole home" />
						</div>
					</Axis>
				</Specimen>

				<Specimen name="EntitySelector" try="Select light entities..." span={2}>
					<Axis of="domain">
						<div class="w-full max-w-sm">
							<EntitySelector
								domain="light"
								entityIds={lightIds()}
								onEntityIdsChange={setLightIds}
							/>
						</div>
					</Axis>
				</Specimen>

				<Specimen name="ImagePicker" try="Choose image" span={2}>
					<MediaStoreContext.Provider value={demoMediaStore}>
						<div class="w-full max-w-sm">
							<ImagePicker value={imageId()} onChange={setImageId} />
						</div>
					</MediaStoreContext.Provider>
				</Specimen>

				<Specimen name="MediaTile" span={2}>
					<Axis of="selected">
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
						</div>
					</Axis>
					<Axis of="broken">
						<div class="grid w-full max-w-sm grid-cols-3 gap-2">
							<MediaTile
								item={DEMO_MEDIA[1]}
								thumbUrl=""
								label="Use demo-2"
								broken
								onSelect={() => {}}
								onBroken={() => {}}
							/>
						</div>
					</Axis>
				</Specimen>

				<Specimen name="PickerRow" span={2}>
					<Axis of="multi">
						<div class="w-full max-w-sm">
							<PickerRow
								icon="mdi:lightbulb"
								title="Ceiling light"
								subtitle="Living room"
								selected
								multi={false}
							/>
							<PickerRow
								icon="mdi:lightbulb"
								title="Reading lamp"
								subtitle="Living room"
								meta="Off"
								selected
								multi
							/>
						</div>
					</Axis>
					<Axis of="dimmed">
						<div class="w-full max-w-sm">
							<PickerRow
								icon="mdi:lightbulb"
								title="Porch light"
								subtitle="Unavailable"
								selected={false}
								multi
								dimmed
							/>
						</div>
					</Axis>
				</Specimen>

				<Specimen name="PickerSearch" span={2}>
					<Axis of="size">
						<div class="flex w-full max-w-sm flex-col gap-3">
							<PickerSearch
								placeholder="Search entities"
								value="kitchen"
								clearLabel="Clear search"
							/>
							<PickerSearch placeholder="Search entities" size="touch" />
						</div>
					</Axis>
				</Specimen>
			</CatalogGroup>
		</DemoHost>
	);
}
