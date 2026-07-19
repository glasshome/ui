import { Button, WidgetCard, type WidgetSummary } from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

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

export function WidgetCardCatalog() {
	return (
		<CatalogGroup id="cat-widget-card" title="Widget card">
			<CatalogItem
				name="WidgetCard · row"
				hint="dense lists, admin tables, pickers — Card sm + nucleus + right meta"
				span={3}
			>
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
				<CatalogNote>
					official = decagram check, community = muted people glyph; chevron when interactive,
					custom trailing otherwise
				</CatalogNote>
			</CatalogItem>

			<CatalogItem
				name="WidgetCard · tile"
				hint="grids and galleries — Card md, description, download + version footer"
				span={3}
			>
				<div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<WidgetCard layout="tile" widget={OFFICIAL_WIDGET} href="#cat-widget-card" />
					<WidgetCard layout="tile" widget={COMMUNITY_WIDGET} href="#cat-widget-card" />
				</div>
				<CatalogNote>
					meta stays pinned to the footer even when descriptions differ in length
				</CatalogNote>
			</CatalogItem>
		</CatalogGroup>
	);
}
