import { For, type JSX, Show } from "solid-js";
import { SECTION_ROW_SURFACE } from "../lib/card-classes.js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

/** Dash's lattice: the grid a widget render is shot on. */
const CELL = { w: 90, h: 70, gap: 16 } as const;

export interface DashboardPreviewTile {
	key: string;
	x: number;
	y: number;
	w: number;
	h: number;
	/** A render shot at exactly this w x h; never a render of another size. */
	src?: string;
	icon: string;
	label: string;
	description?: string;
}

const span = (n: number, cell: number) => n * cell + (n - 1) * CELL.gap;

/** A dashboard drawn from widget renders at their true grid positions, scaled to its box. */
export function DashboardPreview(props: {
	columns: number;
	tiles: DashboardPreviewTile[];
	/** Rows shown at most; the rest is cut at the bottom edge. */
	maxRows?: number;
	/** Sit the dashboard in a recessed well, the ground it would stand on. */
	stage?: boolean;
	class?: string;
	style?: JSX.CSSProperties;
}) {
	const rows = () => {
		const used = Math.max(1, ...props.tiles.map((t) => t.y + t.h));
		return props.maxRows ? Math.min(used, props.maxRows) : used;
	};
	const width = () => span(props.columns, CELL.w);
	const height = () => span(rows(), CELL.h);
	const pct = (value: number, of: number) => `${(value / of) * 100}%`;

	const board = () => (
		<div
			data-slot="dashboard-preview"
			class={cn("@container relative w-full overflow-hidden", props.class)}
			style={{ "aspect-ratio": `${width()} / ${height()}`, ...props.style }}
		>
			<div
				class="absolute inset-0"
				style={{ "--dp-unit": `calc(100cqw / ${width()})` } as JSX.CSSProperties}
			>
				<For each={props.tiles}>
					{(tile) => (
						<div
							data-slot="dashboard-preview-tile"
							class="absolute"
							style={{
								left: pct(tile.x * (CELL.w + CELL.gap), width()),
								top: pct(tile.y * (CELL.h + CELL.gap), height()),
								width: pct(span(tile.w, CELL.w), width()),
								height: pct(span(tile.h, CELL.h), height()),
							}}
						>
							<Show when={tile.src} fallback={<IconTile tile={tile} />}>
								{(src) => (
									<img
										src={src()}
										alt={tile.label}
										loading="lazy"
										decoding="async"
										class="block h-full w-full"
									/>
								)}
							</Show>
						</div>
					)}
				</For>
			</div>
		</div>
	);
	return (
		<Show when={props.stage} fallback={board()}>
			<div
				data-slot="dashboard-preview-stage"
				class={cn(FIELD_CHROME, "flex justify-center rounded-xl p-3")}
			>
				{board()}
			</div>
		</Show>
	);
}

const u = (n: number) => `calc(var(--dp-unit) * ${n})`;

function IconTile(props: { tile: DashboardPreviewTile }) {
	const roomy = () => props.tile.w >= 2 && props.tile.h >= 2;
	return (
		<div
			data-slot="dashboard-preview-icon-tile"
			class={cn(
				SECTION_ROW_SURFACE,
				"flex h-full w-full items-center overflow-hidden text-muted-foreground",
				roomy() ? "flex-col justify-center text-center" : "justify-center",
			)}
			style={{ "border-radius": u(20), gap: u(roomy() ? 8 : 10), padding: u(12) }}
		>
			<Icon
				icon={props.tile.icon}
				width="1em"
				height="1em"
				style={{ "font-size": u(roomy() ? 32 : 22) }}
				class="shrink-0 text-foreground/80"
			/>
			<div class="flex min-w-0 flex-col" style={{ gap: u(4) }}>
				<span class="truncate font-medium text-foreground/90" style={{ "font-size": u(13) }}>
					{props.tile.label}
				</span>
				<Show when={roomy() && props.tile.description}>
					<span class="line-clamp-2" style={{ "font-size": u(11), "line-height": 1.3 }}>
						{props.tile.description}
					</span>
				</Show>
			</div>
		</div>
	);
}
