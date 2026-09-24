import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Z_CLASS } from "../lib/layers.js";
import { OVERLAY_SURFACE_OPAQUE } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { createModalParts } from "./dialog-parts.js";

/* Non-modal: no scrim, no scroll lock, no focus trap, so the page behind stays
 * live. Opaque: an editor stays readable over any material, blur 0 included. Below md it docks to the bottom and a handle folds it to its header;
 * z-sheet keeps menus opened from inside it (z-overlay) above it. */
const DOCKED_PANEL = `fixed ${Z_CLASS.sheet} flex flex-col overflow-hidden ${OVERLAY_SURFACE_OPAQUE} text-popover-foreground animate-in fade-in duration-300 max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[min(60dvh,38rem)] max-md:rounded-t-2xl max-md:slide-in-from-bottom-8 md:inset-y-3 md:right-3 md:w-[25rem] md:rounded-2xl md:slide-in-from-right-8 max-md:data-[collapsed]:[&_[data-slot=docked-panel-body]]:hidden max-md:data-[collapsed]:[&_[data-slot=docked-panel-footer]]:hidden [&_[data-slot=docked-panel-footer]]:flex-row`;

export function DockedPanel(props: {
	open: boolean;
	ariaLabel: string;
	collapsed?: boolean;
	onCollapsedChange?: (collapsed: boolean) => void;
	class?: string;
	children: JSX.Element;
}) {
	return (
		<Show when={props.open}>
			<Portal>
				<aside
					data-slot="docked-panel"
					aria-label={props.ariaLabel}
					data-collapsed={props.collapsed ? "" : undefined}
					class={cn(DOCKED_PANEL, props.class)}
				>
					<Show when={props.onCollapsedChange}>
						<button
							type="button"
							data-slot="docked-panel-handle"
							aria-label={props.collapsed ? "Show panel" : "Hide panel"}
							aria-expanded={!props.collapsed}
							class="mx-auto flex h-6 w-full shrink-0 items-center justify-center md:hidden"
							onClick={() => props.onCollapsedChange?.(!props.collapsed)}
						>
							<span class="h-1.5 w-10 rounded-full bg-foreground/25" />
						</button>
					</Show>
					{props.children}
				</aside>
			</Portal>
		</Show>
	);
}

const {
	Header: DockedPanelHeader,
	Body: DockedPanelBody,
	Footer: DockedPanelFooter,
} = createModalParts("docked-panel");

export { DockedPanelBody, DockedPanelFooter, DockedPanelHeader };
