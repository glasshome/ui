import { createMemo, type JSX } from "solid-js";
import {
	type AreaViewLike,
	type EntityDataAdapter,
	EntityDataContext,
	type EntityViewLike,
	type MediaStore,
	type StoredMedia,
} from "../src/solid";

export const DEMO_AREAS: AreaViewLike[] = [
	{
		id: "living_room",
		name: "Living Room",
		icon: "mdi:sofa",
		entityIds: [
			"light.sofa",
			"light.reading_lamp",
			"switch.tv_backlight",
			"sensor.living_room_temperature",
			"media_player.living_room_tv",
		],
	},
	{
		id: "kitchen",
		name: "Kitchen",
		icon: "mdi:silverware-fork-knife",
		entityIds: [
			"light.counter",
			"switch.coffee_maker",
			"sensor.kitchen_humidity",
			"media_player.kitchen_speaker",
		],
	},
	{
		id: "bedroom",
		name: "Bedroom",
		icon: "mdi:bed",
		entityIds: ["light.nightstand", "switch.bedroom_fan", "sensor.bedroom_temperature"],
	},
	{
		id: "office",
		name: "Office",
		icon: "mdi:desk",
		entityIds: ["light.desk", "sensor.office_air_quality", "media_player.office_speaker"],
	},
];

function demoEntity(
	entity: Pick<EntityViewLike, "id" | "name" | "state" | "areaId" | "icon"> &
		Partial<EntityViewLike>,
): EntityViewLike {
	return {
		friendlyName: entity.name,
		aliases: [],
		entityCategory: null,
		isHidden: false,
		isDisabled: false,
		...entity,
	};
}

function demoLight(
	id: string,
	name: string,
	areaId: string | null,
	state: "on" | "off",
): EntityViewLike {
	return demoEntity({ id, name, areaId, state, icon: "mdi:lightbulb" });
}

export const DEMO_ENTITIES: EntityViewLike[] = [
	demoLight("light.sofa", "Sofa Lamp", "living_room", "on"),
	demoLight("light.reading_lamp", "Reading Lamp", "living_room", "off"),
	demoLight("light.counter", "Counter Light", "kitchen", "on"),
	demoLight("light.nightstand", "Nightstand", "bedroom", "off"),
	demoLight("light.desk", "Desk Lamp", "office", "on"),
	demoLight("light.hallway", "Hallway Spot", null, "off"),
	demoEntity({
		id: "switch.coffee_maker",
		name: "Coffee Maker",
		areaId: "kitchen",
		state: "on",
		icon: "mdi:toggle-switch",
	}),
	demoEntity({
		id: "switch.tv_backlight",
		name: "TV Backlight",
		areaId: "living_room",
		state: "off",
		icon: "mdi:toggle-switch",
	}),
	demoEntity({
		id: "switch.bedroom_fan",
		name: "Bedroom Fan",
		areaId: "bedroom",
		state: "off",
		icon: "mdi:toggle-switch",
	}),
	demoEntity({
		id: "sensor.living_room_temperature",
		name: "Living Room Temperature",
		areaId: "living_room",
		state: "21.5",
		icon: "mdi:thermometer",
		deviceClass: "temperature",
		unitOfMeasurement: "°C",
	}),
	demoEntity({
		id: "sensor.bedroom_temperature",
		name: "Bedroom Temperature",
		areaId: "bedroom",
		state: "19.0",
		icon: "mdi:thermometer",
		deviceClass: "temperature",
		unitOfMeasurement: "°C",
	}),
	demoEntity({
		id: "sensor.kitchen_humidity",
		name: "Kitchen Humidity",
		areaId: "kitchen",
		state: "43",
		icon: "mdi:water-percent",
		deviceClass: "humidity",
		unitOfMeasurement: "%",
	}),
	demoEntity({
		id: "sensor.office_air_quality",
		name: "Office Air Quality",
		areaId: "office",
		state: "612",
		icon: "mdi:molecule-co2",
		deviceClass: "carbon_dioxide",
		unitOfMeasurement: "ppm",
	}),
	demoEntity({
		id: "media_player.living_room_tv",
		name: "Living Room TV",
		areaId: "living_room",
		state: "playing",
		icon: "mdi:television",
	}),
	demoEntity({
		id: "media_player.kitchen_speaker",
		name: "Kitchen Speaker",
		areaId: "kitchen",
		state: "paused",
		icon: "mdi:speaker",
	}),
	demoEntity({
		id: "media_player.office_speaker",
		name: "Office Speaker",
		areaId: "office",
		state: "idle",
		icon: "mdi:speaker",
	}),
];

export const DEMO_BY_ID = new Map(DEMO_ENTITIES.map((e) => [e.id, e]));

const DEMO_IDS_BY_DOMAIN = DEMO_ENTITIES.reduce<Record<string, string[]>>((byDomain, entity) => {
	const [domain = ""] = entity.id.split(".");
	byDomain[domain] = [...(byDomain[domain] ?? []), entity.id];
	return byDomain;
}, {});

export const DEMO_MEDIA: [StoredMedia, StoredMedia] = [
	{ id: "demo-1", mimeType: "image/png", width: 96, height: 64, size: 42_000, usedBy: 0 },
	{ id: "demo-2", mimeType: "image/png", width: 96, height: 64, size: 88_000, usedBy: 1 },
];

export interface DemoPerson {
	id: string;
	name: string;
	avatar?: string;
}

export const DEMO_PEOPLE: DemoPerson[] = [
	{ id: "person.maya", name: "Maya Ellis" },
	{ id: "person.daniel", name: "Daniel Ellis" },
	{ id: "person.sofia", name: "Sofia Ellis" },
	{ id: "person.ben", name: "Ben Ellis" },
];

export interface DemoWidget {
	id: string;
	title: string;
	icon: string;
	w: number;
	h: number;
}

export const DEMO_WIDGETS: DemoWidget[] = [
	{ id: "lights", title: "Lights", icon: "lucide:lightbulb", w: 2, h: 2 },
	{ id: "climate", title: "Climate", icon: "lucide:thermometer", w: 2, h: 1 },
	{ id: "now-playing", title: "Now Playing", icon: "lucide:music", w: 3, h: 2 },
	{ id: "weather", title: "Weather", icon: "lucide:cloud-sun", w: 2, h: 2 },
	{ id: "front-door", title: "Front Door", icon: "lucide:camera", w: 2, h: 3 },
	{ id: "household", title: "Household", icon: "lucide:list-todo", w: 1, h: 2 },
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

export const demoMediaStore = createDemoMediaStore();

// Static in-memory stand-in for the host's sync-layer adapter, so the pickers
// render live options without the design system depending on the HA runtime.
export const demoAdapter: EntityDataAdapter = {
	entityIdsByDomain: () => DEMO_IDS_BY_DOMAIN,
	useEntities: (ids) => createMemo(() => ids().flatMap((id) => DEMO_BY_ID.get(id) ?? [])),
	getEntityView: (id) => DEMO_BY_ID.get(id),
	useAreas: () => () => DEMO_AREAS,
};

export function DemoHost(props: { children: JSX.Element }) {
	return (
		<EntityDataContext.Provider value={demoAdapter}>{props.children}</EntityDataContext.Provider>
	);
}
