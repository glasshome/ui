import { type Component, ErrorBoundary, type JSX } from "solid-js";
import { ActionsCatalog } from "./groups/ActionsCatalog";
import { AppKitCatalog } from "./groups/AppKitCatalog";
import { DataCatalog } from "./groups/DataCatalog";
import { FeedbackCatalog } from "./groups/FeedbackCatalog";
import { FormsCatalog } from "./groups/FormsCatalog";
import { GlassCatalog } from "./groups/GlassCatalog";
import { LayoutCatalog } from "./groups/LayoutCatalog";
import { NavCatalog } from "./groups/NavCatalog";
import { OverlaysCatalog } from "./groups/OverlaysCatalog";
import { PickersCatalog } from "./groups/PickersCatalog";
import { WidgetCardCatalog } from "./groups/WidgetCardCatalog";

/**
 * The @glasshome/ui component catalog: a live, at-a-glance overview of every
 * component the package ships, grouped by kind. Mounted client:only on
 * /dev/design. This is the systematic "keep a visual eye on the design system"
 * view — one scroll, every primitive, real instances (not screenshots), theme
 * following the page. Add a new component to the package → add a <CatalogItem>
 * to the matching group.
 *
 * Each group is wrapped in an ErrorBoundary so one component that throws at
 * mount (e.g. a picker that expects a live Home Assistant store) degrades to a
 * single visible error card instead of blanking the whole catalog.
 */
function Guard(props: { name: string; children: JSX.Element }) {
	return (
		<ErrorBoundary
			fallback={(err) => (
				<div class="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive text-sm">
					<p class="font-semibold">{props.name} failed to render</p>
					<p class="mt-1 font-mono text-xs opacity-80">{String(err?.message ?? err)}</p>
				</div>
			)}
		>
			{props.children}
		</ErrorBoundary>
	);
}

const GROUPS: Array<[string, Component]> = [
	["Glass", GlassCatalog],
	["Actions", ActionsCatalog],
	["Forms", FormsCatalog],
	["Data", DataCatalog],
	["Widget card", WidgetCardCatalog],
	["Feedback", FeedbackCatalog],
	["Navigation", NavCatalog],
	["Overlays", OverlaysCatalog],
	["Layout", LayoutCatalog],
	["Pickers", PickersCatalog],
	["App kit", AppKitCatalog],
];

export default function PackageCatalog() {
	return (
		<div class="space-y-10">
			{GROUPS.map(([name, Group]) => (
				<Guard name={name}>
					<Group />
				</Guard>
			))}
		</div>
	);
}
