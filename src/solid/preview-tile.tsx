import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { RadioGroup, RadioGroupItem } from "./radio-group.js";

const COLUMNS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as const;

const SHAPE = { wide: "aspect-[16/10]", tile: "aspect-[5/4]" } as const;

/* The face is the affordance: the radio control is suppressed and a ring on
 * the face carries the picked state, the focus ring rides the same edge. */
const TILE_FACE =
	"relative w-full overflow-hidden rounded-lg border border-border/60 transition-glass duration-200 group-active/preview-tile:scale-[0.97] group-data-[checked]/preview-tile:border-transparent group-data-[checked]/preview-tile:ring-2 group-data-[checked]/preview-tile:ring-primary group-data-[checked]/preview-tile:ring-offset-2 group-data-[checked]/preview-tile:ring-offset-transparent group-has-[:focus-visible]/preview-tile:ring-[3px] group-has-[:focus-visible]/preview-tile:ring-ring/50";

export function PreviewTileGroup(props: {
	value: string | null;
	onChange: (value: string) => void;
	"aria-label": string;
	columns?: keyof typeof COLUMNS;
	class?: string;
	children: JSX.Element;
}) {
	return (
		<RadioGroup
			data-slot="preview-tile-group"
			class={cn("grid gap-2.5", COLUMNS[props.columns ?? 2], props.class)}
			value={props.value ?? ""}
			onChange={props.onChange}
			aria-label={props["aria-label"]}
		>
			{props.children}
		</RadioGroup>
	);
}

/** A choice shown as what it produces: a picture, a preview card, a shape. */
export function PreviewTile(props: {
	value: string;
	label: string;
	/** A quieter second line under the caption. */
	meta?: string;
	/** Off for pictures that name themselves; the label still reaches assistive tech. */
	caption?: boolean;
	icon?: string;
	shape?: keyof typeof SHAPE;
	disabled?: boolean;
	class?: string;
	/** Fires on every click, including a re-pick of the checked tile. */
	onPick?: () => void;
	children: JSX.Element;
}) {
	return (
		<RadioGroupItem
			data-slot="preview-tile"
			value={props.value}
			disabled={props.disabled}
			showControl={false}
			onClick={() => !props.disabled && props.onPick?.()}
			class={cn(
				"group/preview-tile min-w-0 [&_[data-slot=radio-group-item-content]]:flex [&_[data-slot=radio-group-item-content]]:flex-col [&_[data-slot=radio-group-item-content]]:gap-1.5",
				props.class,
			)}
		>
			<div data-slot="preview-tile-face" class={cn(TILE_FACE, SHAPE[props.shape ?? "wide"])}>
				{props.children}
			</div>
			<Show when={props.caption ?? true} fallback={<span class="sr-only">{props.label}</span>}>
				<span
					data-slot="preview-tile-caption"
					class="flex items-center justify-center gap-1 text-muted-foreground text-xs group-data-[checked]/preview-tile:text-foreground"
				>
					<Show when={props.icon}>
						{(icon) => <Icon icon={icon()} width={12} height={12} aria-hidden="true" />}
					</Show>
					{props.label}
				</span>
				<Show when={props.meta}>
					<span
						data-slot="preview-tile-meta"
						class="-mt-1 text-center text-[11px] text-muted-foreground/80 leading-tight"
					>
						{props.meta}
					</span>
				</Show>
			</Show>
		</RadioGroupItem>
	);
}
