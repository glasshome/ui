import { createMemo, createSignal, For, type JSX, Show } from "solid-js";
import { createStore } from "solid-js/store";
import {
	AreaChart,
	type AreaViewLike,
	Badge,
	BarList,
	Button,
	Dock,
	type DockItem,
	type EntityViewLike,
	Icon,
	ItemDescription,
	ItemTitle,
	ListRow,
	PageHeader,
	Progress,
	RangeToggle,
	SectionCard,
	SectionIcon,
	SectionMeta,
	SectionRow,
	Slider,
	StackedBar,
	SwitchRow,
} from "../../src/solid";
import { DEMO_AREAS, DEMO_BY_ID, DEMO_ENTITIES, DemoHost } from "../fixtures";

// Bespoke art: the one ground the glass is judged against, textured so the blur has something to smear.
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

const TODAY = Date.UTC(2026, 8, 11);
const DAY_MS = 86_400_000;

const ENERGY_USES = [
	{ key: "heating", label: "Heating", tone: "var(--chart-1)" },
	{ key: "water", label: "Hot water", tone: "var(--chart-2)" },
	{ key: "kitchen", label: "Kitchen", tone: "var(--chart-3)" },
	{ key: "laundry", label: "Laundry", tone: "var(--chart-4)" },
	{ key: "other", label: "Everything else", tone: "var(--chart-5)" },
] as const;

type EnergyDay = { day: string } & Record<(typeof ENERGY_USES)[number]["key"], number>;

function energyDay(daysAgo: number): EnergyDay {
	const date = new Date(TODAY - daysAgo * DAY_MS);
	const yearFraction = (date.getUTCMonth() + date.getUTCDate() / 31) / 12;
	const winter = (Math.cos(yearFraction * 2 * Math.PI) + 1) / 2;
	const wobble = (Math.sin(daysAgo * 12.9898) + 1) / 2;
	const weekend = [0, 6].includes(date.getUTCDay());
	return {
		day: date.toISOString().slice(0, 10),
		heating: winter * winter * 9 + wobble * winter * 2,
		water: 1.9 + wobble * 0.8,
		kitchen: (weekend ? 2.9 : 2.1) + wobble * 0.5,
		laundry: daysAgo % 3 === 1 ? 1.7 : 0,
		other: 1.5 + winter * 0.7,
	};
}

const ENERGY_YEAR = Array.from({ length: 365 }, (_, index) => energyDay(364 - index));

function dayTotal(day: EnergyDay): number {
	return ENERGY_USES.reduce((sum, use) => sum + day[use.key], 0);
}

const RANGE_WORDS: Record<number, string> = {
	7: "the last 7 days",
	30: "the last 30 days",
	90: "the last 90 days",
	365: "the last year",
};

const LIVING_ROOM_TODAY = [
	20.4, 20.1, 19.9, 19.7, 19.5, 19.4, 19.6, 20.3, 20.8, 21.0, 21.1, 21.3, 21.6, 21.9, 22.1, 22.3,
	22.2, 21.9, 21.7, 21.5,
].map((celsius, hour) => ({ hour: `${String(hour).padStart(2, "0")}:00`, celsius }));

// AreaChart plots from zero; the floor keeps a three-degree swing readable and the formatter adds it back.
const TEMPERATURE_FLOOR = 18;

const DRAWING_NOW = [
	{ label: "Dishwasher", sublabel: "Kitchen", value: 1240 },
	{ label: "Living Room TV", sublabel: "Living Room", value: 118 },
	{ label: "Fridge", sublabel: "Kitchen", value: 64 },
	{ label: "Router", sublabel: "Hallway", value: 22 },
	{ label: "Desk Lamp", sublabel: "Office", value: 9 },
];

const SWITCHES: Record<string, { icon: string; description: string }> = {
	"switch.tv_backlight": { icon: "mdi:television-ambient-light", description: "Follows the TV" },
	"switch.coffee_maker": { icon: "mdi:coffee-maker", description: "Warms up at 06:45 on weekdays" },
	"switch.bedroom_fan": { icon: "mdi:fan", description: "Turns off at 07:00" },
};

interface Track {
	title: string;
	detail: string;
	elapsed: number;
	length: number;
}

const TRACKS: Record<string, Track> = {
	"media_player.living_room_tv": {
		title: "Planet Earth III",
		detail: "Episode 4, Ocean",
		elapsed: 1264,
		length: 3250,
	},
	"media_player.kitchen_speaker": {
		title: "Kind of Blue",
		detail: "Miles Davis",
		elapsed: 412,
		length: 2760,
	},
};

const READINGS: Record<string, (entity: EntityViewLike) => string> = {
	temperature: (entity) => `${Number(entity.state).toFixed(1)} °C`,
	humidity: (entity) => `${entity.state}% humidity`,
	carbon_dioxide: (entity) => `${entity.state} ppm CO₂`,
};

const ROOM_BRIGHTNESS: Record<string, number> = {
	living_room: 70,
	kitchen: 100,
	bedroom: 30,
	office: 85,
};

// Two stacks, so a tall room never leaves a hole beside a short one.
const ROOM_COLUMNS = [0, 1].map((column) => DEMO_AREAS.filter((_, index) => index % 2 === column));

const DESTINATIONS = [
	{ id: "home", label: "Home", icon: "lucide:house" },
	{ id: "rooms", label: "Rooms", icon: "lucide:layout-grid" },
	{ id: "scenes", label: "Scenes", icon: "lucide:sparkles" },
	{ id: "energy", label: "Energy", icon: "lucide:zap" },
	{ id: "settings", label: "Settings", icon: "lucide:settings" },
];

const dateLabel = (day: string) =>
	new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});

const kwh = (value: number) =>
	value >= 100 ? Math.round(value).toLocaleString("en-US") : value.toFixed(1).replace(/\.0$/, "");

const watts = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)} kW` : `${value} W`);

const clock = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function entitiesIn(area: AreaViewLike, domain: string): EntityViewLike[] {
	return area.entityIds.flatMap((id) => {
		const entity = DEMO_BY_ID.get(id);
		return entity && id.startsWith(`${domain}.`) ? [entity] : [];
	});
}

function Figure(props: { value: string; unit: string; class?: string }) {
	return (
		<p class="flex items-baseline gap-1 text-foreground">
			<span class={props.class ?? "font-semibold text-4xl tracking-tight"}>{props.value}</span>
			<span class="font-medium text-base text-muted-foreground">{props.unit}</span>
		</p>
	);
}

function StatTile(props: {
	icon: string;
	label: string;
	value: string;
	unit: string;
	detail: string;
	status?: JSX.Element;
}) {
	return (
		<SectionCard>
			<div class="flex flex-col">
				<div class="flex min-h-7 items-center justify-between gap-2">
					<SectionIcon icon={props.icon} size="sm" />
					{props.status}
				</div>
				<Figure
					value={props.value}
					unit={props.unit}
					class="mt-3 font-semibold text-4xl tracking-tight lg:text-5xl"
				/>
				<SectionMeta class="mt-1 font-medium text-foreground text-sm">{props.label}</SectionMeta>
				<SectionMeta class="mt-0.5">{props.detail}</SectionMeta>
			</div>
		</SectionCard>
	);
}

function EnergyCard(props: { class?: string }) {
	const [range, setRange] = createSignal(7);
	const days = createMemo(() => ENERGY_YEAR.slice(-range()));
	const series = createMemo(() => days().map((day) => ({ day: day.day, count: dayTotal(day) })));
	const total = createMemo(() => series().reduce((sum, point) => sum + point.count, 0));
	const peak = createMemo(() =>
		series().reduce((best, point) => (point.count > best.count ? point : best)),
	);
	const segments = createMemo(() =>
		ENERGY_USES.map((use) => ({
			label: use.label,
			tone: use.tone,
			value: Math.round(days().reduce((sum, day) => sum + day[use.key], 0)),
		})),
	);

	return (
		<SectionCard
			icon="lucide:zap"
			title="Energy"
			subtitle="Whole home, day by day"
			class={props.class}
			toolbar={<RangeToggle value={range()} onChange={setRange} />}
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<div class="flex flex-col gap-0.5">
						<Figure value={kwh(total())} unit="kWh" />
						<SectionMeta class="text-sm">Used in {RANGE_WORDS[range()]}</SectionMeta>
					</div>
					<div class="flex flex-col gap-0.5 sm:items-end">
						<SectionMeta class="text-sm">
							{(total() / range()).toFixed(1)} kWh a day on average
						</SectionMeta>
						<SectionMeta>
							Highest {peak().count.toFixed(1)} kWh on {dateLabel(peak().day)}
						</SectionMeta>
					</div>
				</div>
				<div class="flex flex-col gap-1.5">
					<AreaChart data={series()} height={168} format={(value) => `${value.toFixed(1)} kWh`} />
					<div class="flex justify-between">
						<SectionMeta>{dateLabel(series()[0]?.day ?? "")}</SectionMeta>
						<SectionMeta>Today</SectionMeta>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<SectionMeta class="font-medium text-foreground text-sm">
						Where it went, in kWh
					</SectionMeta>
					<StackedBar segments={segments()} />
				</div>
			</div>
		</SectionCard>
	);
}

function PowerCard() {
	const total = DRAWING_NOW.reduce((sum, item) => sum + item.value, 0);
	return (
		<SectionCard icon="lucide:plug-zap" title="Using power now" subtitle="Live draw by device">
			<div class="flex flex-col gap-3">
				<div class="flex flex-col gap-0.5">
					<Figure value={(total / 1000).toFixed(1)} unit="kW" />
					<SectionMeta class="text-sm">Across {DRAWING_NOW.length} devices</SectionMeta>
				</div>
				<BarList items={DRAWING_NOW} format={watts} />
			</div>
		</SectionCard>
	);
}

function ClimateCard() {
	const now = LIVING_ROOM_TODAY[LIVING_ROOM_TODAY.length - 1];
	const low = LIVING_ROOM_TODAY.reduce((a, b) => (b.celsius < a.celsius ? b : a));
	const high = LIVING_ROOM_TODAY.reduce((a, b) => (b.celsius > a.celsius ? b : a));
	return (
		<SectionCard
			icon="lucide:thermometer"
			title="Living Room today"
			subtitle="Temperature since midnight"
		>
			<div class="flex flex-col gap-3">
				<div class="flex flex-col gap-0.5">
					<Figure value={(now?.celsius ?? 0).toFixed(1)} unit="°C" />
					<SectionMeta class="text-sm">
						Low {low.celsius.toFixed(1)}° at {low.hour}, high {high.celsius.toFixed(1)}° at{" "}
						{high.hour}
					</SectionMeta>
				</div>
				<div class="flex flex-col gap-1.5">
					<AreaChart
						data={LIVING_ROOM_TODAY.map((point) => ({
							day: point.hour,
							count: point.celsius - TEMPERATURE_FLOOR,
						}))}
						height={112}
						format={(value) => `${(value + TEMPERATURE_FLOOR).toFixed(1)} °C`}
					/>
					<div class="flex justify-between">
						<SectionMeta>00:00</SectionMeta>
						<SectionMeta>Now</SectionMeta>
					</div>
				</div>
			</div>
		</SectionCard>
	);
}

function MediaPlayer(props: { entity: EntityViewLike; track: Track }) {
	const [playing, setPlaying] = createSignal(true);
	const [volume, setVolume] = createSignal(35);
	return (
		<SectionRow class="flex flex-col gap-3">
			<div class="flex items-center gap-3">
				<SectionIcon icon={props.entity.icon ?? "mdi:television"} size="lg" tone="var(--primary)" />
				<div class="flex min-w-0 flex-1 flex-col gap-0.5">
					<ItemTitle>{props.track.title}</ItemTitle>
					<ItemDescription class="text-xs">
						{props.entity.name}, {props.track.detail}
					</ItemDescription>
				</div>
			</div>
			<div class="flex flex-col gap-1.5">
				<Progress
					value={(props.track.elapsed / props.track.length) * 100}
					aria-label="Playback position"
				/>
				<div class="flex justify-between">
					<SectionMeta class="tabular-nums">{clock(props.track.elapsed)}</SectionMeta>
					<SectionMeta class="tabular-nums">
						{clock(props.track.length - props.track.elapsed)} left
					</SectionMeta>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex shrink-0 items-center gap-1">
					<Button variant="ghost" size="icon" class="size-11" aria-label="Previous">
						<Icon icon="lucide:skip-back" width={20} height={20} />
					</Button>
					<Button
						size="icon"
						class="size-11"
						aria-label={playing() ? "Pause" : "Play"}
						onClick={() => setPlaying((value) => !value)}
					>
						<Icon icon={playing() ? "lucide:pause" : "lucide:play"} width={20} height={20} />
					</Button>
					<Button variant="ghost" size="icon" class="size-11" aria-label="Next">
						<Icon icon="lucide:skip-forward" width={20} height={20} />
					</Button>
				</div>
				<div class="flex min-w-0 flex-1 items-center gap-2">
					<Icon
						icon="lucide:volume-2"
						width={18}
						height={18}
						class="shrink-0 text-muted-foreground"
					/>
					<Slider
						value={[volume()]}
						onChange={(values) => setVolume(values[0] ?? 0)}
						aria-label={`${props.entity.name} volume`}
					/>
				</div>
			</div>
		</SectionRow>
	);
}

function RoomCard(props: {
	area: AreaViewLike;
	power: Record<string, boolean>;
	brightness: number;
	onPower: (ids: string[], on: boolean) => void;
	onBrightness: (value: number) => void;
}) {
	const lights = () => entitiesIn(props.area, "light");
	const lightsOn = () => lights().filter((light) => props.power[light.id]).length;
	const lightNames = () =>
		lights()
			.map((light) => light.name)
			.join(", ");
	const lightDescription = () => {
		const level = lightsOn() > 0 ? `${props.brightness}%` : "Off";
		return lights().length === 1 ? level : `${level} · ${lightNames()}`;
	};
	const lightSummary = () => {
		const count = lights().length;
		if (count === 0) return undefined;
		if (count === 1) return lightsOn() ? "Light on" : "Light off";
		return `${lightsOn()} of ${count} lights on`;
	};
	const subtitle = () =>
		[
			...entitiesIn(props.area, "sensor").flatMap((sensor) => {
				const reading = READINGS[sensor.deviceClass ?? ""];
				return reading ? [reading(sensor)] : [];
			}),
			lightSummary(),
		]
			.filter(Boolean)
			.join(" · ");
	const co2 = () =>
		entitiesIn(props.area, "sensor").find((s) => s.deviceClass === "carbon_dioxide");

	return (
		<SectionCard
			icon={props.area.icon ?? "mdi:home"}
			title={props.area.name}
			subtitle={subtitle()}
			action={
				<Show when={co2()}>
					{(sensor) => (
						<Badge tone={Number(sensor().state) < 800 ? "var(--success)" : "var(--warning)"}>
							{Number(sensor().state) < 800 ? "Fresh air" : "Open a window"}
						</Badge>
					)}
				</Show>
			}
		>
			<div class="flex flex-col gap-2">
				<Show when={lights().length > 0}>
					<SectionRow class="flex flex-col gap-2">
						<SwitchRow
							icon="lucide:lamp"
							label={lights().length === 1 ? lightNames() : "Lights"}
							description={lightDescription()}
							checked={lightsOn() > 0}
							onChange={(on) =>
								props.onPower(
									lights().map((light) => light.id),
									on,
								)
							}
						/>
						<Slider
							value={[props.brightness]}
							onChange={(values) => props.onBrightness(values[0] ?? 0)}
							disabled={lightsOn() === 0}
							aria-label={`${props.area.name} brightness`}
						/>
					</SectionRow>
				</Show>
				<For each={entitiesIn(props.area, "switch")}>
					{(entity) => (
						<SectionRow>
							<SwitchRow
								icon={SWITCHES[entity.id]?.icon}
								label={entity.name}
								description={SWITCHES[entity.id]?.description}
								checked={props.power[entity.id] ?? false}
								onChange={(on) => props.onPower([entity.id], on)}
							/>
						</SectionRow>
					)}
				</For>
				<For each={entitiesIn(props.area, "media_player")}>
					{(entity) => {
						const track = TRACKS[entity.id];
						return (
							<Show
								when={entity.state === "playing" && track}
								fallback={
									<ListRow
										leading={<SectionIcon icon={entity.icon ?? "mdi:speaker"} size="sm" />}
										title={entity.name}
										subtitle={track ? `Paused, ${track.title}` : "Nothing playing"}
										actions={
											<Show when={track}>
												<Button variant="ghost" size="icon" aria-label={`Play ${entity.name}`}>
													<Icon icon="lucide:play" width={18} height={18} />
												</Button>
											</Show>
										}
									/>
								}
							>
								{(playing) => <MediaPlayer entity={entity} track={playing()} />}
							</Show>
						);
					}}
				</For>
			</div>
		</SectionCard>
	);
}

export default function DashboardShape() {
	const [destination, setDestination] = createSignal("home");
	const [home, setHome] = createStore({
		power: Object.fromEntries(
			DEMO_ENTITIES.filter((entity) => /^(light|switch)\./.test(entity.id)).map((entity) => [
				entity.id,
				entity.state === "on",
			]),
		) as Record<string, boolean>,
		brightness: ROOM_BRIGHTNESS,
	});

	const onIds = (domain: string) =>
		Object.entries(home.power).filter(([id, on]) => on && id.startsWith(`${domain}.`)).length;
	const devicesOn = () => onIds("light") + onIds("switch");
	const setPower = (ids: string[], on: boolean) => {
		for (const id of ids) setHome("power", id, on);
	};

	const temperatures = DEMO_ENTITIES.filter((entity) => entity.deviceClass === "temperature");
	const indoor =
		temperatures.reduce((sum, entity) => sum + Number(entity.state), 0) / temperatures.length;
	const humidity = DEMO_ENTITIES.find((entity) => entity.deviceClass === "humidity");
	const today = dayTotal(ENERGY_YEAR[ENERGY_YEAR.length - 1] ?? energyDay(0));
	const yesterday = dayTotal(ENERGY_YEAR[ENERGY_YEAR.length - 2] ?? energyDay(1));
	const change = Math.round((today / yesterday - 1) * 100);

	const dockItems = createMemo((): DockItem[] =>
		DESTINATIONS.map((entry) => ({
			id: entry.id,
			label: entry.label,
			icon: <Icon icon={entry.icon} width="24" height="24" />,
			isActive: destination() === entry.id,
			onClick: () => setDestination(entry.id),
			badge: entry.id === "settings" ? 2 : undefined,
		})),
	);

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
				<div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 pt-5 pb-6 sm:gap-4 sm:px-6 sm:pt-8">
					<PageHeader
						icon="lucide:house"
						title="Ellis Home"
						subtitle={`${DEMO_AREAS.length} rooms · ${plural(devicesOn(), "device", "devices")} on`}
						actions={
							<>
								<Button variant="ghost" size="sm" class="hidden sm:inline-flex">
									<Icon icon="lucide:pencil" width={16} height={16} />
									Edit
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPower(Object.keys(home.power), false)}
								>
									<Icon icon="lucide:power" width={16} height={16} />
									All off
								</Button>
							</>
						}
					/>

					<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
						<StatTile
							icon="lucide:thermometer"
							label="Indoor temperature"
							value={indoor.toFixed(1)}
							unit="°C"
							detail={`Average of ${plural(temperatures.length, "room", "rooms")}`}
						/>
						<StatTile
							icon="lucide:droplets"
							label="Humidity"
							value={humidity?.state ?? "–"}
							unit="%"
							detail="Kitchen"
							status={<Badge tone="var(--success)">Comfortable</Badge>}
						/>
						<StatTile
							icon="lucide:zap"
							label="Energy today"
							value={today.toFixed(1)}
							unit="kWh"
							detail={`${Math.abs(change)}% ${change <= 0 ? "less" : "more"} than yesterday`}
						/>
						<StatTile
							icon="lucide:power"
							label="Devices on"
							value={String(devicesOn())}
							unit={`of ${Object.keys(home.power).length}`}
							detail={`${plural(onIds("light"), "light", "lights")}, ${plural(onIds("switch"), "switch", "switches")}`}
						/>
					</div>

					<div class="grid gap-3 sm:gap-4 md:grid-cols-2">
						<EnergyCard class="md:col-span-2" />
						<PowerCard />
						<ClimateCard />
					</div>

					<div class="grid items-start gap-3 sm:gap-4 md:grid-cols-2">
						<For each={ROOM_COLUMNS}>
							{(column) => (
								<div class="flex flex-col gap-3 sm:gap-4">
									<For each={column}>
										{(area) => (
											<RoomCard
												area={area}
												power={home.power}
												brightness={home.brightness[area.id] ?? 60}
												onPower={setPower}
												onBrightness={(value) => setHome("brightness", area.id, value)}
											/>
										)}
									</For>
								</div>
							)}
						</For>
					</div>

					<div class="sticky bottom-4 mt-auto flex justify-center pt-6">
						<Dock items={dockItems()} dockMode="floating" aria-label="Home" />
					</div>
				</div>
			</div>
		</DemoHost>
	);
}
