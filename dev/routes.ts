import type { Component } from "solid-js";
import PackageCatalog from "./PackageCatalog";

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
	{ id: "foundations", title: "Foundations", icon: "lucide:palette", entries: [] },
	{
		id: "components",
		title: "Components",
		icon: "lucide:box",
		entries: [{ id: "all", title: "All components", component: PackageCatalog }],
	},
	{ id: "screens", title: "Screens", icon: "lucide:layout-dashboard", entries: [] },
];

export function findEntry(areaId: string, entryId: string): Entry | undefined {
	return AREAS.find((a) => a.id === areaId)?.entries.find((e) => e.id === entryId);
}
