import { Show } from "solid-js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { SCRIM_CLASS } from "../lib/overlay-classes.js";
import { SECTION_INNER_RADIUS } from "../lib/section-tokens.js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { Button } from "./button.js";
import { Icon } from "./icon.js";
import type { StoredMedia } from "./media-store.js";

export interface MediaTileProps {
	item: StoredMedia;
	thumbUrl: string;
	/** Describes what the click does here: the picker chooses, a library opens a preview. */
	label: string;
	broken: boolean;
	onSelect: () => void;
	onBroken: () => void;
	onDelete?: () => void;
	markUnused?: boolean;
	selected?: boolean;
	class?: string;
}

export function MediaTile(props: MediaTileProps) {
	return (
		<div data-slot="media-tile" class={cn("relative min-w-0", props.class)}>
			<button
				type="button"
				data-slot="media-tile-select"
				data-testid="media-tile"
				aria-label={props.label}
				aria-pressed={props.selected}
				onClick={() => props.onSelect()}
				class={cn(
					FIELD_CHROME,
					SECTION_INNER_RADIUS,
					"relative block aspect-square w-full overflow-hidden",
					props.selected && "ring-2 ring-primary",
				)}
			>
				<Show
					when={!props.broken}
					fallback={
						<span
							data-slot="media-tile-broken"
							data-testid="media-tile-broken"
							class="absolute inset-0 flex items-center justify-center text-muted-foreground"
						>
							<Icon icon="lucide:image-off" width={20} height={20} />
						</span>
					}
				>
					<img
						data-slot="media-tile-image"
						src={props.thumbUrl}
						alt={`Stored ${props.item.id}`}
						width={props.item.width}
						height={props.item.height}
						loading="lazy"
						decoding="async"
						class="absolute inset-0 h-full w-full object-cover"
						onError={() => props.onBroken()}
					/>
				</Show>
			</button>
			{/* Bottom-left, diagonally clear of the delete control, on the same scrim
			 * so it stays legible over a bright photo. */}
			<Show when={props.markUnused === true && props.item.usedBy === 0}>
				<Badge
					data-slot="media-tile-unused"
					data-testid="media-tile-unused"
					tone="var(--warning)"
					class="pointer-events-none absolute bottom-1 left-1 backdrop-blur-md"
				>
					Unused
				</Badge>
			</Show>
			{/* Sibling, not nested: a button inside the tile button is invalid and eats the click. */}
			<Show when={props.onDelete !== undefined}>
				<Button
					type="button"
					variant="ghost"
					size="none"
					data-slot="media-tile-delete"
					// after:-inset-1.5 lifts the touch target to ~44px without growing the glyph or its scrim.
					class={cn(
						"absolute top-1 right-1 size-8 text-destructive hover:text-destructive",
						"after:absolute after:-inset-1.5 after:content-['']",
						SCRIM_CLASS,
					)}
					aria-label={`Delete ${props.item.id}`}
					onClick={() => props.onDelete?.()}
				>
					<Icon icon="lucide:trash-2" width={16} height={16} />
				</Button>
			</Show>
		</div>
	);
}
