import { createSignal, For } from "solid-js";
import {
	Button,
	Dock,
	type DockItem,
	Icon,
	PageHeader,
	SectionCard,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	WidgetCard,
	type WidgetSummary,
} from "../../src/solid";
import { DEMO_AREAS, DEMO_ENTITIES, DEMO_WIDGETS, DemoHost, type DemoWidget } from "../fixtures";

// Bespoke art: the one ground in the gallery the glass material is judged
// against, so it carries depth and a fine texture the blur can smear.
const WALLPAPER = [
	"radial-gradient(80% 62% at 10% -4%, color-mix(in srgb, var(--accent) 66%, transparent), transparent 70%)",
	"radial-gradient(70% 54% at 96% 0%, color-mix(in srgb, var(--love) 52%, transparent), transparent 68%)",
	"radial-gradient(66% 54% at 86% 58%, color-mix(in srgb, var(--primary) 62%, transparent), transparent 72%)",
	"radial-gradient(58% 46% at 20% 60%, color-mix(in srgb, var(--chart-2) 52%, transparent), transparent 74%)",
	"radial-gradient(130% 74% at 50% 116%, color-mix(in srgb, var(--chart-4) 52%, transparent), transparent 66%)",
	"linear-gradient(198deg, color-mix(in srgb, var(--foreground) 12%, transparent), transparent 48%)",
	"var(--background)",
].join(", ");

const WALLPAPER_TEXTURE =
	"repeating-linear-gradient(116deg, color-mix(in srgb, var(--foreground) 13%, transparent) 0 2px, transparent 2px 11px)";

interface WidgetDetail {
	description: string;
	rooms: string[];
	downloadCount: number;
	latestVersion: string;
	versionCount: number;
	isOfficial: boolean;
}

const WIDGET_DETAIL: Record<string, WidgetDetail> = {
	lights: {
		description: "Every lamp in the room on one dial, with a hold to set the colour.",
		rooms: ["living_room", "kitchen", "bedroom", "office"],
		downloadCount: 24_800,
		latestVersion: "2.4.1",
		versionCount: 18,
		isOfficial: true,
	},
	climate: {
		description: "Temperature and humidity, and the schedule that keeps them there.",
		rooms: ["living_room", "kitchen", "bedroom", "office"],
		downloadCount: 19_400,
		latestVersion: "1.9.0",
		versionCount: 12,
		isOfficial: true,
	},
	"now-playing": {
		description: "Whatever is playing in this room, with the artwork and the volume.",
		rooms: ["living_room", "kitchen", "office"],
		downloadCount: 15_200,
		latestVersion: "3.0.2",
		versionCount: 21,
		isOfficial: true,
	},
	weather: {
		description: "Today's sky and the next six hours, drawn from your own station.",
		rooms: ["living_room", "kitchen"],
		downloadCount: 31_600,
		latestVersion: "2.1.5",
		versionCount: 9,
		isOfficial: true,
	},
	"front-door": {
		description: "A live look at the porch, and the last person who rang.",
		rooms: ["living_room"],
		downloadCount: 8900,
		latestVersion: "0.9.4",
		versionCount: 6,
		isOfficial: false,
	},
	household: {
		description: "The shopping list and the chores, shared with everyone at home.",
		rooms: ["kitchen", "bedroom", "office"],
		downloadCount: 5400,
		latestVersion: "1.2.0",
		versionCount: 4,
		isOfficial: false,
	},
};

type ShelfWidget = DemoWidget & WidgetDetail;

const SHELF: ShelfWidget[] = DEMO_WIDGETS.flatMap((widget) => {
	const detail = WIDGET_DETAIL[widget.id];
	return detail ? [{ ...widget, ...detail }] : [];
});

function toSummary(widget: ShelfWidget): WidgetSummary {
	return {
		scope: "glasshome",
		name: widget.id,
		displayName: widget.title,
		icon: widget.icon,
		description: widget.description,
		isOfficial: widget.isOfficial,
		downloadCount: widget.downloadCount,
		latestVersion: widget.latestVersion,
		versionCount: widget.versionCount,
		ownerType: widget.isOfficial ? "organization" : "personal",
	};
}

const SUGGESTED = SHELF.filter((widget) => !widget.isOfficial || widget.id === "weather");

const DESTINATIONS = [
	{ id: "home", label: "Home", icon: "lucide:house" },
	{ id: "rooms", label: "Rooms", icon: "lucide:layout-grid" },
	{ id: "scenes", label: "Scenes", icon: "lucide:sparkles" },
	{ id: "energy", label: "Energy", icon: "lucide:zap" },
	{ id: "settings", label: "Settings", icon: "lucide:settings" },
];

export default function DashboardShape() {
	const [destination, setDestination] = createSignal("home");

	const dockItems = (): DockItem[] =>
		DESTINATIONS.map((entry) => ({
			id: entry.id,
			label: entry.label,
			icon: <Icon icon={entry.icon} width="24" height="24" />,
			isActive: destination() === entry.id,
			onClick: () => setDestination(entry.id),
			badge: entry.id === "settings" ? 2 : undefined,
		}));

	return (
		<DemoHost>
			<div
				data-screen="dashboard-shape"
				class="relative flex min-h-screen flex-col overflow-hidden"
				style={{ background: WALLPAPER }}
			>
				<div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
					<div class="absolute -top-40 -left-24 size-[30rem] rounded-full bg-chart-5/25" />
					<div class="absolute top-[38%] right-[-10rem] size-[34rem] rounded-full bg-love/20" />
					<div class="absolute bottom-[-14rem] left-[18%] size-[38rem] rounded-full bg-chart-2/25" />
					<div
						class="absolute inset-0 [mask-image:radial-gradient(130%_100%_at_50%_35%,black,transparent)]"
						style={{ "background-image": WALLPAPER_TEXTURE }}
					/>
				</div>
				<div class="relative flex flex-1 flex-col gap-4 px-3 pt-5 pb-6 sm:gap-5 sm:px-6 sm:pt-8">
					<PageHeader
						icon="lucide:house"
						title="Ellis Home"
						count={DEMO_ENTITIES.length}
						subtitle={`${DEMO_AREAS.length} rooms · everything reachable`}
						actions={
							<>
								<Button variant="outline" size="sm" class="hidden sm:inline-flex">
									<Icon icon="lucide:pencil" width={16} height={16} />
									Edit
								</Button>
								<Button size="sm">
									<Icon icon="lucide:plus" width={16} height={16} />
									Add widget
								</Button>
							</>
						}
					/>

					<Tabs defaultValue={DEMO_AREAS[0]?.id}>
						<TabsList>
							<For each={DEMO_AREAS}>
								{(area) => <TabsTrigger value={area.id}>{area.name}</TabsTrigger>}
							</For>
						</TabsList>
						<For each={DEMO_AREAS}>
							{(area) => (
								<TabsContent value={area.id}>
									<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
										<For each={SHELF.filter((widget) => widget.rooms.includes(area.id))}>
											{(widget) => <WidgetCard widget={toSummary(widget)} layout="tile" />}
										</For>
									</div>
								</TabsContent>
							)}
						</For>
					</Tabs>

					<SectionCard
						icon="lucide:sparkles"
						title="Suggested widgets"
						subtitle="Popular in homes with your devices"
						count={SUGGESTED.length}
						action={
							<Button variant="ghost" size="sm">
								Browse all
							</Button>
						}
					>
						<div class="flex flex-col gap-2">
							<For each={SUGGESTED}>
								{(widget) => <WidgetCard widget={toSummary(widget)} layout="row" />}
							</For>
						</div>
					</SectionCard>

					<div class="sticky bottom-4 mt-auto flex justify-center pt-6">
						<Dock items={dockItems()} dockMode="floating" aria-label="Home" />
					</div>
				</div>
			</div>
		</DemoHost>
	);
}
