import {
	type Component,
	type ComponentProps,
	createEffect,
	createMemo,
	createSignal,
	Index,
	type JSX,
	onCleanup,
	onMount,
	Show,
	splitProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { CARD_SURFACE } from "../lib/card-classes.js";
import { HOLD_MOTION, PRESS_DIP } from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { pageCount, pageOf, pageOffset, stripWidth } from "./dock-paging.js";
import { SlidingIndicator } from "./sliding-indicator.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

interface DockItem {
	id: string;
	icon: Component<{ class?: string }> | JSX.Element;
	label: string;
	onClick?: () => void;
	isActive?: boolean;
	/** Optional count badge on the item (e.g. pending updates). */
	badge?: number;
	/** Something dragged is held over this item and will land here on release. */
	isDropTarget?: boolean;
}

interface DockProps extends ComponentProps<"div"> {
	items: DockItem[];
	dockMode?: "floating" | "docked";
	/** Where a hold started, relative to the surface; `fired` once it has triggered. */
	hold?: { x: number; y: number; fired: boolean } | null;
	/** A rim light that orbits for as long as a mode is on. */
	glow?: boolean;
	/** Where a drag from outside the dock is pointing, in client coordinates. */
	dragPoint?: { x: number; y: number } | null;
}

interface DockIconButtonProps extends ComponentProps<"button"> {
	icon: Component<{ class?: string }> | JSX.Element;
	label: string;
	isActive?: boolean;
	/** Sits on the sliding pill: the active item, or the one a drag would land on. */
	lit?: boolean;
	badge?: number;
}

const DockIconButton: Component<DockIconButtonProps> = (props) => {
	// Kobalte's button root narrows `type`; Solid's ComponentProps<"button"> also
	// admits "menu", so it is split off rather than spread.
	const [local, rest] = splitProps(props, [
		"icon",
		"label",
		"class",
		"isActive",
		"badge",
		"type",
		"lit",
	]);
	const isElement = () => typeof local.icon !== "function";

	return (
		<Tooltip openDelay={150} placement="top">
			<TooltipTrigger
				type="button"
				data-slot="dock-item"
				class={cn(
					"group relative flex size-11 touch-manipulation items-center justify-center rounded-lg transition-transform duration-(--duration-micro) sm:size-12",
					PRESS_DIP,
					local.class,
				)}
				aria-label={local.label}
				aria-current={local.isActive ? "page" : undefined}
				{...rest}
			>
				<div
					data-slot="dock-item-icon"
					class={cn(
						"flex items-center justify-center transition-colors duration-(--duration-state)",
						local.lit ? "text-primary" : "text-foreground group-hover:text-primary/80",
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
					{/* Inside the item box: an overhanging badge inflates the bar's
					 * scrollWidth and trips the overflow-to-scroll check below. */}
					<Badge
						role="status"
						tone="var(--primary)"
						class="absolute top-0 right-0 h-4 min-w-4 justify-center px-1 pt-0.5 pb-0 font-medium font-mono text-[9px] tabular-nums leading-none"
						aria-label={`${local.badge} pending`}
					>
						{local.badge != null && local.badge > 9 ? "9+" : local.badge}
					</Badge>
				</Show>
			</TooltipTrigger>
			<TooltipContent class="hidden sm:block">{local.label}</TooltipContent>
		</Tooltip>
	);
};

const Dock: Component<DockProps> = (props) => {
	const [local, rest] = splitProps(props, [
		"items",
		"class",
		"dockMode",
		"hold",
		"glow",
		"dragPoint",
	]);
	// The drain plays where the fill grew, so the point outlives the hold.
	const [holdPoint, setHoldPoint] = createSignal({ x: 0, y: 0, r: 0 });
	let surfaceRef: HTMLDivElement | undefined;
	createEffect(() => {
		const h = local.hold;
		if (!h) return;
		const w = surfaceRef?.clientWidth ?? 0;
		const ht = surfaceRef?.clientHeight ?? 0;
		// Reaches the farthest corner exactly at full scale, so the fill ends as the hold does.
		setHoldPoint({
			x: h.x,
			y: h.y,
			r: Math.hypot(Math.max(h.x, w - h.x), Math.max(h.y, ht - h.y)),
		});
	});
	const dockMode = () => local.dockMode ?? "floating";
	let containerRef!: HTMLDivElement;
	const [needsScroll, setNeedsScroll] = createSignal(false);
	const [pages, setPages] = createSignal(1);
	const [page, setPage] = createSignal(0);
	const [viewportWidth, setViewportWidth] = createSignal(0);

	// The moving background: the shared SlidingIndicator tracks the active item.
	// A memo: the items list is rebuilt on every hover change, and only a new active item may scroll the strip.
	const activeIndex = createMemo(() => {
		const i = local.items.findIndex((it) => it.isActive);
		return i < 0 ? null : i;
	});
	// A drag borrows the pill: it slides to where the drop would land and back when the drag leaves.
	const pillIndex = createMemo(() => {
		const i = local.items.findIndex((it) => it.isDropTarget);
		return i < 0 ? activeIndex() : i;
	});

	const gapWidth = () =>
		containerRef ? Number.parseFloat(getComputedStyle(containerRef).columnGap) || 0 : 0;
	const itemWidth = () =>
		containerRef?.querySelector('[data-slot="dock-item"]')?.getBoundingClientRect().width ?? 0;

	const padX = (el: Element) => {
		const style = getComputedStyle(el);
		return (
			(Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
		);
	};

	// The width the app gave the dock. Never the surface: it shrink-wraps this strip,
	// so measuring it asks the strip how wide the strip is.
	const availableWidth = () => {
		const box = containerRef?.closest<HTMLElement>('[data-slot="dock"]');
		if (!box || !surfaceRef) return 0;
		return box.clientWidth - padX(box) - padX(surfaceRef);
	};

	const checkOverflow = () => {
		if (!containerRef) return;
		const available = availableWidth();
		const overflowing = available > 0 && containerRef.scrollWidth > available + 1;
		if (overflowing) {
			const trimmed = stripWidth(available, itemWidth(), gapWidth());
			if (trimmed > 0) containerRef.style.width = `${trimmed}px`;
		} else if (containerRef.style.width) {
			containerRef.style.width = "";
		}
		setNeedsScroll(overflowing);
		const viewport = containerRef.clientWidth;
		setViewportWidth(viewport);
		setPages(pageCount(containerRef.scrollWidth, viewport));
		setPage(pageOf(containerRef.scrollLeft, viewport));
	};

	const goToPage = (next: number) => {
		if (!containerRef) return;
		containerRef.scrollTo({
			left: pageOffset(next, viewportWidth(), containerRef.scrollWidth),
			behavior: "smooth",
		});
	};

	// A drag cannot click a page dot, so resting on the dot row turns to the page under it.
	createEffect(() => {
		const point = local.dragPoint;
		if (!point || pages() < 2 || !surfaceRef || !containerRef) return;
		const strip = containerRef.getBoundingClientRect();
		const surface = surfaceRef.getBoundingClientRect();
		const onDotRow =
			point.y > strip.bottom &&
			point.y <= surface.bottom &&
			point.x >= surface.left &&
			point.x <= surface.right;
		if (!onDotRow) return;
		const target = Math.min(
			pages() - 1,
			Math.floor(((point.x - surface.left) / surface.width) * pages()),
		);
		if (target === page()) return;
		const timer = setTimeout(() => goToPage(target), 300);
		onCleanup(() => clearTimeout(timer));
	});

	// The active dashboard may sit on another page after a switch elsewhere.
	createEffect(() => {
		const i = activeIndex();
		if (i === null || !containerRef || !needsScroll()) return;
		const item = containerRef.querySelectorAll('[data-slot="dock-item"]')[i];
		if (!item || viewportWidth() <= 0) return;
		// The strip only: scrollIntoView would also scroll the page and any frame embedding it.
		const left =
			item.getBoundingClientRect().left -
			containerRef.getBoundingClientRect().left +
			containerRef.scrollLeft;
		goToPage(Math.floor(left / viewportWidth()));
	});

	onMount(() => {
		const timeoutId = setTimeout(checkOverflow, 100);
		let resizeTimeoutId: ReturnType<typeof setTimeout> | undefined;
		const onResize = () => {
			clearTimeout(resizeTimeoutId);
			resizeTimeoutId = setTimeout(checkOverflow, 50);
		};
		window.addEventListener("resize", onResize);
		onCleanup(() => {
			clearTimeout(timeoutId);
			clearTimeout(resizeTimeoutId);
			window.removeEventListener("resize", onResize);
		});
	});

	createEffect(() => {
		local.items.length;
		// The box pads by mode, so switching it changes the room the strip has.
		dockMode();
		const timeoutId = setTimeout(checkOverflow, 150);
		onCleanup(() => clearTimeout(timeoutId));
	});

	return (
		<div
			data-slot="dock"
			class={cn(
				"flex max-w-full items-center justify-center",
				dockMode() === "floating" ? "p-1 sm:p-2" : "",
				local.class,
			)}
			{...rest}
		>
			<div
				ref={surfaceRef}
				data-slot="dock-surface"
				class={cn(
					// isolate: the layers behind the icons stay inside the dock even with blur off.
					"pointer-events-auto relative isolate flex max-w-full items-center justify-center p-1.5 sm:p-2",
					// Room for the page dots inside the glass; outside it they sit on
					// the screen edge and get clipped.
					pages() > 1 && "pb-4 sm:pb-5",
					CARD_SURFACE,
					"[--glass-lift:0.55]",
					dockMode() === "floating" ? "rounded-xl" : "rounded-t-xl",
				)}
			>
				<div
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
				>
					<span
						data-slot="dock-flood"
						data-hold={local.hold && !local.hold.fired ? "" : undefined}
						data-fired={local.hold?.fired ? "" : undefined}
						class={cn(
							"absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/45",
							HOLD_MOTION,
						)}
						style={{
							left: `${holdPoint().x}px`,
							top: `${holdPoint().y}px`,
							width: `${holdPoint().r * 2}px`,
							height: `${holdPoint().r * 2}px`,
						}}
					/>
				</div>
				<Show when={local.glow}>
					<div
						data-slot="dock-glow"
						aria-hidden="true"
						class="glass-edge-orbit fade-in-0 animate-in duration-(--duration-state)"
					>
						<div />
					</div>
				</Show>
				<div
					ref={containerRef}
					data-slot="dock-bar"
					onScroll={() => {
						if (containerRef) setPage(pageOf(containerRef.scrollLeft, viewportWidth()));
					}}
					class={cn(
						"flex items-center gap-0.5 sm:gap-1",
						needsScroll()
							? "scrollbar-hide snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
							: "overflow-visible",
						!needsScroll() && "justify-center",
					)}
					style={{
						"min-width": needsScroll() ? "auto" : "fit-content",
					}}
				>
					<SlidingIndicator active={pillIndex()} class="flex items-center gap-0.5 sm:gap-1">
						<Index each={local.items}>
							{(item, i) => (
								<DockIconButton
									class={needsScroll() ? "snap-start" : undefined}
									icon={item().icon}
									label={item().label}
									onClick={item().onClick}
									isActive={item().isActive}
									lit={i === pillIndex()}
									badge={item().badge}
									data-drop-target={item().isDropTarget ? "" : undefined}
									data-dock-id={item().id}
								/>
							)}
						</Index>
					</SlidingIndicator>
				</div>
				<Show when={pages() > 1}>
					<div
						data-slot="dock-pages"
						class="pointer-events-auto absolute inset-x-0 bottom-1.5 flex justify-center gap-1.5"
					>
						<Index each={Array.from({ length: pages() })}>
							{(_, i) => (
								<button
									type="button"
									aria-label={`Page ${i + 1}`}
									aria-current={page() === i ? "true" : undefined}
									onClick={() => goToPage(i)}
									class={cn(
										"h-1.5 rounded-full transition-glass",
										page() === i ? "w-4 bg-foreground/70" : "w-1.5 bg-foreground/25",
									)}
								/>
							)}
						</Index>
					</div>
				</Show>
			</div>
		</div>
	);
};

export type { DockIconButtonProps, DockItem, DockProps };
export { Dock };
