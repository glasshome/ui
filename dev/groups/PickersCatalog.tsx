import { createMemo, createSignal } from "solid-js";
import {
	AreaPicker,
	type AreaViewLike,
	type Color,
	ColorSlider,
	ColorWheel,
	type EntityDataAdapter,
	EntityDataContext,
	EntitySelector,
	type EntityViewLike,
	IconPicker,
	ImagePicker,
	type MediaStore,
	MediaStoreContext,
	MediaTile,
	parseColor,
	type StoredMedia,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

const DEMO_AREAS: AreaViewLike[] = [
	{
		id: "living_room",
		name: "Living Room",
		icon: "mdi:sofa",
		entityIds: ["light.sofa", "light.reading_lamp"],
	},
	{
		id: "kitchen",
		name: "Kitchen",
		icon: "mdi:silverware-fork-knife",
		entityIds: ["light.counter"],
	},
	{ id: "bedroom", name: "Bedroom", icon: "mdi:bed", entityIds: ["light.nightstand"] },
];

function demoLight(
	id: string,
	name: string,
	areaId: string | null,
	state: "on" | "off",
): EntityViewLike {
	return {
		id,
		state,
		name,
		friendlyName: name,
		aliases: [],
		areaId,
		icon: "mdi:lightbulb",
		entityCategory: null,
		isHidden: false,
		isDisabled: false,
	};
}

const DEMO_ENTITIES: EntityViewLike[] = [
	demoLight("light.sofa", "Sofa Lamp", "living_room", "on"),
	demoLight("light.reading_lamp", "Reading Lamp", "living_room", "off"),
	demoLight("light.counter", "Counter Light", "kitchen", "on"),
	demoLight("light.nightstand", "Nightstand", "bedroom", "off"),
	demoLight("light.hallway", "Hallway Spot", null, "off"),
];

const DEMO_BY_ID = new Map(DEMO_ENTITIES.map((e) => [e.id, e]));

const DEMO_MEDIA: [StoredMedia, StoredMedia] = [
	{ id: "demo-1", mimeType: "image/png", width: 96, height: 64, size: 42_000, usedBy: 0 },
	{ id: "demo-2", mimeType: "image/png", width: 96, height: 64, size: 88_000, usedBy: 1 },
];

// In-memory stand-in for the host's media store: keeps the picker's upload,
// delete and quota-error paths interactive without a real backend.
function createDemoMediaStore(): MediaStore {
	let images = [...DEMO_MEDIA];
	let nextId = 3;
	return {
		index: async () => ({
			media: images,
			usage: {
				bytes: images.reduce((sum, image) => sum + image.size, 0),
				limitBytes: 262_144_000,
				files: images.length,
				limitFiles: 200,
			},
		}),
		upload: async (file) => {
			const stored = {
				id: `demo-${nextId++}`,
				mimeType: file.type,
				width: 96,
				height: 64,
				size: file.size,
				usedBy: 0,
			};
			images = [...images, stored];
			return stored;
		},
		remove: async (id) => {
			images = images.filter((image) => image.id !== id);
		},
		url: (_id, variant) =>
			variant === "thumb" ? "https://placehold.co/48x32/png" : "https://placehold.co/96x64/png",
	};
}

const demoMediaStore = createDemoMediaStore();

// Static in-memory stand-in for the host's sync-layer adapter, so the pickers
// render live options without the design system depending on the HA runtime.
const demoAdapter: EntityDataAdapter = {
	entityIdsByDomain: () => ({ light: DEMO_ENTITIES.map((e) => e.id) }),
	useEntities: (ids) => createMemo(() => ids().flatMap((id) => DEMO_BY_ID.get(id) ?? [])),
	getEntityView: (id) => DEMO_BY_ID.get(id),
	useAreas: () => () => DEMO_AREAS,
};

/**
 * Smart-home / rich pickers from @glasshome/ui. ColorWheel and ColorSlider
 * are fully self-contained and driven by local signals below.
 *
 * AreaPicker and EntitySelector read their options through EntityDataContext,
 * NOT from props. The static demo adapter above gives them a populated,
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
		<EntityDataContext.Provider value={demoAdapter}>
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
		</EntityDataContext.Provider>
	);
}
