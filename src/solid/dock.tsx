import {
	type Component,
	type ComponentProps,
	createEffect,
	createSignal,
	Index,
	type JSX,
	onCleanup,
	onMount,
	Show,
	splitProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { OVERLAY_SURFACE } from "../lib/overlay-classes";
import { cn } from "../lib/utils";
import { SlidingIndicator } from "./sliding-indicator";

interface DockItem {
	id: string;
	icon: Component<{ class?: string }> | JSX.Element;
	label: string;
	onClick?: () => void;
	isActive?: boolean;
	/** Optional count badge on the item (e.g. pending updates). */
	badge?: number;
}

interface DockProps extends ComponentProps<"div"> {
	items: DockItem[];
	dockMode?: "floating" | "docked";
}

interface DockIconButtonProps extends ComponentProps<"button"> {
	icon: Component<{ class?: string }> | JSX.Element;
	label: string;
	isActive?: boolean;
	badge?: number;
}

const DockIconButton: Component<DockIconButtonProps> = (props) => {
	const [local, rest] = splitProps(props, ["icon", "label", "class", "isActive", "badge"]);
	const isElement = () => typeof local.icon !== "function";

	return (
		<button
			type="button"
			class={cn(
				"group relative flex size-11 touch-manipulation items-center justify-center rounded-lg sm:size-12",
				local.class,
			)}
			aria-label={local.label}
			aria-current={local.isActive ? "page" : undefined}
			{...rest}
		>
			<div
				class={cn(
					"flex items-center justify-center transition-colors duration-300",
					local.isActive ? "text-primary" : "text-foreground group-hover:text-primary/80",
				)}
			>
				{isElement() ? (
					(local.icon as JSX.Element)
				) : (
					<Dynamic
						component={local.icon as Component<{ class?: string }>}
						class="h-5 w-5 sm:h-6 sm:w-6"
					/>
				)}
			</div>
			<Show when={typeof local.badge === "number" && local.badge > 0}>
				<span
					role="status"
					class="absolute top-0 right-0 inline-flex h-5 min-w-[20px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/15 px-1 font-semibold text-[10px] text-primary"
					aria-label={`${local.badge} pending`}
				>
					{local.badge != null && local.badge > 9 ? "9+" : local.badge}
				</span>
			</Show>
			<span
				class={cn(
					"absolute -top-8 left-1/2 -translate-x-1/2",
					"rounded px-2 py-1 text-xs",
					OVERLAY_SURFACE,
					"text-popover-foreground",
					"opacity-0 group-hover:opacity-100",
					"pointer-events-none whitespace-nowrap transition-opacity",
					"z-10",
					"hidden sm:block",
				)}
			>
				{local.label}
			</span>
		</button>
	);
};

const Dock: Component<DockProps> = (props) => {
	const [local, rest] = splitProps(props, ["items", "class", "dockMode"]);
	const dockMode = () => local.dockMode ?? "floating";
	let containerRef!: HTMLDivElement;
	const [needsScroll, setNeedsScroll] = createSignal(false);

	// The moving background: the shared SlidingIndicator tracks the active item.
	const activeIndex = () => {
		const i = local.items.findIndex((it) => it.isActive);
		return i < 0 ? null : i;
	};

	const checkOverflow = () => {
		if (containerRef) {
			const naturalWidth = containerRef.scrollWidth;
			const availableWidth = containerRef.parentElement?.clientWidth || window.innerWidth;
			setNeedsScroll(naturalWidth > availableWidth);
		}
	};

	onMount(() => {
		const timeoutId = setTimeout(checkOverflow, 100);
		const resizeObserver = new ResizeObserver(() => {
			setTimeout(checkOverflow, 50);
		});
		resizeObserver.observe(containerRef);
		onCleanup(() => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		});
	});

	createEffect(() => {
		local.items.length;
		setTimeout(checkOverflow, 150);
	});

	return (
		<div
			data-slot="dock"
			class={cn(
				"flex items-center justify-center",
				dockMode() === "floating" ? "p-1 sm:p-2" : "",
				local.class,
			)}
			{...rest}
		>
			<div class="relative flex items-center justify-center">
				<div
					ref={containerRef}
					class={cn(
						"flex items-center gap-0.5 p-1.5 sm:gap-1 sm:p-2",
						"glass [--glass-base:color-mix(in_srgb,var(--card)_80%,transparent)] [--glass-rim:0.3] [--glass-lift:0.55] backdrop-blur-md backdrop-saturate-[1.8]",
						dockMode() === "floating" ? "rounded-xl" : "rounded-t-xl",
						needsScroll() ? "scrollbar-hide overflow-x-auto" : "overflow-visible",
						!needsScroll() && "justify-center",
					)}
					style={{
						"min-width": needsScroll() ? "auto" : "fit-content",
					}}
				>
					<SlidingIndicator
						active={activeIndex()}
						class="flex items-center gap-0.5 sm:gap-1"
								>
						<Index each={local.items}>
							{(item) => (
								<DockIconButton
									icon={item().icon}
									label={item().label}
									onClick={item().onClick}
									isActive={item().isActive}
									badge={item().badge}
								/>
							)}
						</Index>
					</SlidingIndicator>
				</div>
			</div>
		</div>
	);
};

export type { DockIconButtonProps, DockItem, DockProps };
export { Dock };
