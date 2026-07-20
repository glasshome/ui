import { createMemo, createSignal, createUniqueId, For, Show } from "solid-js";
import { INPUT_SURFACE } from "../lib/input-classes.js";
import { Tabs, TabsList, TabsTrigger } from "./tabs.js";

const numberFmt = new Intl.NumberFormat("en-US");

/* Bars and chart backings wear the field chrome so a ranked bar reads as a
 * static slider; fills are the slider's own tinted glass. */
const SLIDER_WELL = INPUT_SURFACE;
const SLIDER_FILL = "glass glass-tint [--glass-tone:var(--primary)]";

function formatDayLabel(day: string): string {
	// `day` is a "YYYY-MM-DD" UTC key; render as e.g. "Jul 1".
	const d = new Date(`${day}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return day;
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatCompact(n: number): string {
	if (!Number.isFinite(n)) return "0";
	if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
	return numberFmt.format(n);
}

const BYTE_UNITS: [string, number][] = [
	["GB", 1024 ** 3],
	["MB", 1024 ** 2],
	["KB", 1024],
];

export function formatBytes(bytes: number): string {
	if (!(bytes > 0)) return "0 KB";
	const [unit, size] = BYTE_UNITS.find(([, s]) => bytes >= s) ?? ["KB", 1024];
	const val = bytes / size;
	return `${val.toFixed(Number(val < 10))} ${unit}`;
}

/**
 * Filled area + line chart for a daily series. `data` is oldest-first
 * [{day,count}]. Renders a scaling SVG; the caller sizes the container.
 */
const CHART_H = 32;

type ChartGeom = { line: string; area: string; max: number; yFrac: number[] };

function chartGeom(data: { count: number }[]): ChartGeom | null {
	if (data.length < 2) return null;
	const max = Math.max(1, ...data.map((p) => p.count));
	const step = 100 / (data.length - 1);
	// yFrac: vertical position as a 0..1 fraction of the box (0 = top), reused by
	// the HTML hover marker so it lines up with the SVG.
	const yFrac = data.map((p) => (CHART_H - 1 - (p.count / max) * (CHART_H - 2)) / CHART_H);
	const coords = data.map(
		(_, i) => `${(i * step).toFixed(2)},${((yFrac[i] ?? 0) * CHART_H).toFixed(2)}`,
	);
	return {
		line: coords.join(" "),
		area: `0,${CHART_H} ${coords.join(" ")} 100,${CHART_H}`,
		max,
		yFrac,
	};
}

/** Guide line + marker dot + tooltip for the hovered point, in HTML space. */
function ChartHover(props: {
	point: { day: string; count: number };
	leftPct: number;
	topPct: number;
	format?: (n: number) => string;
}) {
	const label = () =>
		props.format ? props.format(props.point.count) : numberFmt.format(props.point.count);
	return (
		<>
			<div
				class="pointer-events-none absolute inset-y-0 w-px bg-primary/30"
				style={{ left: `${props.leftPct}%` }}
			/>
			<div
				class="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-primary"
				style={{ left: `${props.leftPct}%`, top: `${props.topPct}%` }}
			/>
			<div
				class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border/60 bg-popover px-2 py-1 text-[11px] shadow-md"
				style={{
					left: `${Math.min(92, Math.max(8, props.leftPct))}%`,
					top: `${Math.max(0, props.topPct - 6)}%`,
				}}
			>
				<span class="font-mono font-semibold tabular-nums">{label()}</span>
				<span class="ml-1 text-muted-foreground">{formatDayLabel(props.point.day)}</span>
			</div>
		</>
	);
}

/**
 * Filled area + line chart for a daily series. `data` is oldest-first
 * [{day,count}]. Renders a scaling SVG; the caller sizes the container.
 */
export function AreaChart(props: {
	data: { day: string; count: number }[];
	class?: string;
	height?: number;
	/** Tooltip value formatter (e.g. formatBytes for a size series). */
	format?: (n: number) => string;
}) {
	const geom = createMemo(() => chartGeom(props.data));
	const height = () => props.height ?? 48;
	const gid = createUniqueId();
	const [hover, setHover] = createSignal<number | null>(null);

	const onMove = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
		if (props.data.length < 2) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
		setHover(Math.round(ratio * (props.data.length - 1)));
	};

	const leftPct = () => {
		const h = hover();
		return h == null ? 0 : (h / (props.data.length - 1)) * 100;
	};

	return (
		<Show
			when={geom()}
			fallback={
				<div
					class={`flex items-center justify-center text-muted-foreground text-xs ${props.class ?? ""}`}
					style={{ height: `${height()}px` }}
				>
					Not enough data yet
				</div>
			}
		>
			{(g) => (
				<div
					class={`relative overflow-hidden rounded-xl px-px ${SLIDER_WELL}`}
					style={{ height: `${height()}px` }}
					onPointerMove={onMove}
					onPointerLeave={() => setHover(null)}
				>
					<svg
						viewBox="0 0 100 32"
						preserveAspectRatio="none"
						class={`h-full w-full text-primary ${props.class ?? ""}`}
						role="img"
						aria-label={`Peak ${g().max} per day`}
					>
						<defs>
							<linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="currentColor" stop-opacity="0.28" />
								<stop offset="100%" stop-color="currentColor" stop-opacity="0" />
							</linearGradient>
						</defs>
						<polygon points={g().area} fill={`url(#${gid})`} />
						<polyline
							points={g().line}
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linejoin="round"
							vector-effect="non-scaling-stroke"
						/>
					</svg>
					<Show when={hover() != null && props.data[hover() as number]}>
						{(point) => (
							<ChartHover
								point={point()}
								leftPct={leftPct()}
								topPct={(g().yFrac[hover() as number] ?? 0) * 100}
								format={props.format}
							/>
						)}
					</Show>
				</div>
			)}
		</Show>
	);
}

/**
 * Horizontal bar list: one row per item, bar width proportional to `value`.
 * `format` renders the trailing value label (defaults to compact number).
 */
export function BarList(props: {
	items: { label: string; value: number; sublabel?: string; href?: string }[];
	format?: (value: number) => string;
	empty?: string;
}) {
	const max = createMemo(() => Math.max(1, ...props.items.map((i) => i.value)));
	const fmt = (v: number) => (props.format ? props.format(v) : formatCompact(v));
	return (
		<Show
			when={props.items.length > 0}
			fallback={<div class="py-2 text-muted-foreground text-xs">{props.empty ?? "No data"}</div>}
		>
			<div class="space-y-1.5">
				<For each={props.items}>
					{(item) => {
						const pct = () => `${Math.max(2, (item.value / max()) * 100).toFixed(1)}%`;
						const Row = (
							<div class="group flex items-center gap-2 text-xs">
								<div class={`relative min-w-0 flex-1 overflow-hidden rounded-full ${SLIDER_WELL}`}>
									<div
										class={`absolute inset-y-0 left-0 rounded-full transition-[width] ${SLIDER_FILL}`}
										style={{ width: pct() }}
									/>
									<div class="relative flex items-center justify-between gap-2 px-2 py-1">
										<span class="truncate">{item.label}</span>
										<Show when={item.sublabel}>
											<span class="shrink-0 text-[10px] text-muted-foreground">
												{item.sublabel}
											</span>
										</Show>
									</div>
								</div>
								<span class="w-12 shrink-0 text-right font-mono tabular-nums">
									{fmt(item.value)}
								</span>
							</div>
						);
						return item.href ? (
							<a href={item.href} class="block hover:opacity-80">
								{Row}
							</a>
						) : (
							Row
						);
					}}
				</For>
			</div>
		</Show>
	);
}

const RANGE_OPTIONS = [
	{ label: "7d", value: 7 },
	{ label: "30d", value: 30 },
	{ label: "90d", value: 90 },
	{ label: "1y", value: 365 },
];

/** Segmented control for the chart time window — the shipped Tabs (sliding
 * `.glass` primary indicator). Values are numeric days; Tabs speaks strings, so
 * map at the edge. */
export function RangeToggle(props: { value: number; onChange: (days: number) => void }) {
	return (
		<Tabs value={String(props.value)} onChange={(v) => props.onChange(Number(v))}>
			<TabsList class="h-8 w-auto">
				<For each={RANGE_OPTIONS}>
					{(opt) => (
						<TabsTrigger value={String(opt.value)} class="px-2.5 py-0.5 text-xs">
							{opt.label}
						</TabsTrigger>
					)}
				</For>
			</TabsList>
		</Tabs>
	);
}

/** Segmented proportion bar (e.g. staleness fresh/aging/stale). */
export function StackedBar(props: { segments: { label: string; value: number; class: string }[] }) {
	const total = createMemo(() => props.segments.reduce((a, s) => a + s.value, 0) || 1);
	return (
		<div class="space-y-2">
			<div class={`relative flex h-2.5 overflow-hidden rounded-full ${SLIDER_WELL}`}>
				<For each={props.segments}>
					{(s) => (
						<Show when={s.value > 0}>
							<div
								class={s.class}
								style={{ width: `${(s.value / total()) * 100}%` }}
								title={`${s.label}: ${s.value}`}
							/>
						</Show>
					)}
				</For>
				{/* the material's own top rim, re-laid over the opaque segments so the
            filled bar catches light like every other glass surface */}
				<div class="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_oklch(1_0_0/var(--glass-rim))]" />
			</div>
			<div class="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
				<For each={props.segments}>
					{(s) => (
						<span class="inline-flex items-center gap-1.5 text-muted-foreground">
							<span class={`inline-block size-2 rounded-full ${s.class}`} />
							{s.label}
							<span class="font-mono text-foreground tabular-nums">{s.value}</span>
						</span>
					)}
				</For>
			</div>
		</div>
	);
}
