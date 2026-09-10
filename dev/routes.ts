import type { Component } from "solid-js";
import ColourRoles from "./foundations/ColourRoles";
import Elevation from "./foundations/Elevation";
import GlassPlayground from "./foundations/GlassPlayground";
import Motion from "./foundations/Motion";
import Radii from "./foundations/Radii";
import Surfaces from "./foundations/Surfaces";
import PackageCatalog from "./PackageCatalog";
import DashboardShape from "./screens/dashboard-shape";
import EntityModalShape from "./screens/entity-modal-shape";
import SettingsShape from "./screens/settings-shape";
import WizardShape from "./screens/wizard-shape";

export interface Entry {
	id: string;
	title: string;
	component: Component;
}

export interface Area {
	id: string;
	title: string;
	icon: string;
	entries: Entry[];
}

export const AREAS: Area[] = [
	{
		id: "foundations",
		title: "Foundations",
		icon: "lucide:palette",
		entries: [
			{ id: "colour-roles", title: "Colour roles", component: ColourRoles },
			{ id: "radii", title: "Radii", component: Radii },
			{ id: "elevation", title: "Elevation", component: Elevation },
			{ id: "motion", title: "Motion", component: Motion },
			{ id: "surfaces", title: "Surfaces", component: Surfaces },
			{ id: "glass-playground", title: "Glass playground", component: GlassPlayground },
		],
	},
	{
		id: "components",
		title: "Components",
		icon: "lucide:box",
		entries: [{ id: "all", title: "All components", component: PackageCatalog }],
	},
	{
		id: "screens",
		title: "Screens",
		icon: "lucide:layout-dashboard",
		entries: [
			{ id: "settings-shape", title: "Settings", component: SettingsShape },
			{ id: "dashboard-shape", title: "Dashboard", component: DashboardShape },
			{ id: "wizard-shape", title: "Wizard step", component: WizardShape },
			{ id: "entity-modal-shape", title: "Entity modal", component: EntityModalShape },
		],
	},
];

export function findEntry(areaId: string, entryId: string): Entry | undefined {
	return AREAS.find((a) => a.id === areaId)?.entries.find((e) => e.id === entryId);
}
