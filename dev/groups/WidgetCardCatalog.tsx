import { Button, WidgetCard, type WidgetSummary } from "../../src/solid";
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";

// The registry's most-repeated surface: every list, grid, gallery, and admin
// table composes it. A <Card> + the WidgetIdentity/WidgetMeta nucleus.
const OFFICIAL_WIDGET: WidgetSummary = {
	scope: "glasshome",
	name: "energy-flow",
	displayName: "Energy Flow",
	description: "Live power flow between grid, solar, battery, and home in one animated card.",
	icon: "lucide:zap",
	isOfficial: true,
	latestVersion: "1.2.0",
	ownerType: "organization",
	downloadCount: 4820,
	versionCount: 7,
};

const COMMUNITY_WIDGET: WidgetSummary = {
	scope: "ihsen",
	name: "presence-map",
	displayName: "Presence Map",
	description: "Who is home, on a floor plan you can theme.",
	icon: "lucide:map-pin",
	isOfficial: false,
	latestVersion: "0.4.1",
	ownerType: "personal",
	downloadCount: 980,
	versionCount: 3,
};

const BARE_WIDGET: WidgetSummary = {
	scope: "ihsen",
	name: "door-chime",
	displayName: "Door Chime",
	icon: "lucide:bell",
	latestVersion: "1.0.0",
	ownerType: "personal",
	downloadCount: 140,
};

const UNLISTED_WIDGET: WidgetSummary = {
	...COMMUNITY_WIDGET,
	name: "house-sitter",
	displayName: "House Sitter",
	isUnlisted: true,
};

const UNPUBLISHED_WIDGET: WidgetSummary = {
	...COMMUNITY_WIDGET,
	name: "solar-forecast",
	displayName: "Solar Forecast",
	isUnpublished: true,
};

export function WidgetCardCatalog() {
	return (
		<CatalogGroup id="cat-widget-card" title="Widget card">
			<Specimen name="WidgetCard" span={3}>
				<Axis of="layout">
					<div class="w-full max-w-xl space-y-2">
						<WidgetCard widget={OFFICIAL_WIDGET} href="#cat-widget-card" showScopeIndicator />
						<WidgetCard widget={COMMUNITY_WIDGET} href="#cat-widget-card" showVersions />
						<WidgetCard
							widget={COMMUNITY_WIDGET}
							onClick={() => {}}
							trailing={
								<Button variant="outline" size="sm" class="shrink-0">
									Install
								</Button>
							}
						/>
					</div>
					<div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<WidgetCard layout="tile" widget={OFFICIAL_WIDGET} href="#cat-widget-card" />
						<WidgetCard layout="tile" widget={BARE_WIDGET} href="#cat-widget-card" />
						<WidgetCard
							layout="tile"
							widget={COMMUNITY_WIDGET}
							href="#cat-widget-card"
							showDescription={false}
						/>
					</div>
				</Axis>
				<Axis of="state">
					<div class="w-full max-w-xl space-y-2">
						<WidgetCard widget={UNLISTED_WIDGET} onClick={() => {}} showVersions />
						<WidgetCard widget={UNPUBLISHED_WIDGET} onClick={() => {}} showVersions />
					</div>
				</Axis>
			</Specimen>
		</CatalogGroup>
	);
}
