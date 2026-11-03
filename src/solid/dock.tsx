import {
  type Component,
  type ComponentProps,
  createEffect,
  createMemo,
  createSignal,
  Index,
  type JSX,
  on,
  onCleanup,
  onMount,
  Show,
  splitProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { CARD_SURFACE } from "../lib/card-classes.js";
import {
  DOCK_ARRIVE_MOTION,
  DOCK_EDIT_MOTION,
  HOLD_MOTION,
  PRESS_DIP,
} from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { createDockReorder, DockMoveGrip } from "./dock-edit.js";
import { pageCount, pageOf, pageOffset, stripWidth } from "./dock-paging.js";
import { Icon } from "./icon.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";
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
  /** Shows the remove badge while editing; false for an item that cannot leave (default true). */
  removable?: boolean;
}

type DockPlacement = "bottom" | "left" | "right";

interface DockProps extends ComponentProps<"div"> {
  items: DockItem[];
  dockMode?: "floating" | "docked";
  /** The viewport edge the dock sits on; a side edge pages its strip vertically. */
  placement?: DockPlacement;
  /** Items that just landed: each glows once, and the dock turns to the first one's page. */
  arrivedIds?: string[];
  /** Where a hold started, relative to the surface; `fired` once it has triggered. */
  hold?: { x: number; y: number; fired: boolean } | null;
  /** A rim light that orbits for as long as a mode is on. */
  glow?: boolean;
  /** Where a drag from outside the dock is pointing, in client coordinates. */
  dragPoint?: { x: number; y: number } | null;
  /** Edit mode: items sway and carry a remove badge, a dashed add slot ends the strip, items drag to reorder. */
  editing?: boolean;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
  /** The full id order after a drag or an Alt+arrow move. */
  onReorder?: (ids: string[]) => void;
  /** While editing, a grip on the outer edge carries the whole dock to a screen edge; fires once on release over one. */
  onMovePlacement?: (placement: DockPlacement) => void;
}

interface DockIconButtonProps extends ComponentProps<"button"> {
  icon: Component<{ class?: string }> | JSX.Element;
  label: string;
  isActive?: boolean;
  /** Wears the selection highlight: the active item, or the one a drag would land on. */
  lit?: boolean;
  badge?: number;
  /** Plays the arrival glow once. */
  arrived?: boolean;
}

const DOCK_PAGE_MS = 300;

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
    "arrived",
  ]);
  const isElement = () => typeof local.icon !== "function";

  return (
    <Tooltip openDelay={150} placement="top">
      <TooltipTrigger
        type="button"
        data-slot="dock-item"
        class={cn(
          "group relative isolate flex size-11 touch-manipulation items-center justify-center rounded-lg transition-transform duration-(--duration-micro) sm:size-12",
          PRESS_DIP,
          local.class,
        )}
        aria-label={local.label}
        aria-current={local.isActive ? "page" : undefined}
        data-lit={local.lit ? "" : undefined}
        data-arrived={local.arrived ? "" : undefined}
        {...rest}
      >
        <SelectionHighlight />
        <Show when={local.arrived}>
          <span data-slot="dock-item-arrival" aria-hidden="true" class={DOCK_ARRIVE_MOTION} />
        </Show>
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
            class="absolute top-0 right-0 h-4 min-w-4 justify-center px-1 pt-0.5 pb-0 font-mono text-[9px] leading-none font-medium tabular-nums"
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
    "placement",
    "arrivedIds",
    "editing",
    "onRemove",
    "onAdd",
    "onReorder",
    "onMovePlacement",
  ]);
  const placement = () => local.placement ?? "bottom";
  const vertical = () => placement() !== "bottom";
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
  // The strip's length along the dock's axis: width at the bottom, height on a side edge.
  const [viewportSpan, setViewportSpan] = createSignal(0);

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
  const arrivedSet = createMemo(() => new Set(local.arrivedIds ?? []));
  const reorder = createDockReorder({
    bar: () => containerRef,
    vertical,
    ids: () => local.items.map((it) => it.id),
    enabled: () => Boolean(local.editing && local.onReorder),
    onReorder: (ids) => local.onReorder?.(ids),
  });
  const cellStyle = (id: string): JSX.CSSProperties => {
    const slots = reorder.preview();
    const style: JSX.CSSProperties = {};
    if (slots) style.order = Math.max(0, slots.indexOf(id));
    if (reorder.dragId() === id)
      style.translate = vertical() ? `0 ${reorder.lift()}px` : `${reorder.lift()}px 0`;
    return style;
  };
  const onItemKeyDown = (e: KeyboardEvent, id: string) => {
    if (!local.editing || !e.altKey) return;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (step !== -1 && step !== 1) return;
    e.preventDefault();
    reorder.nudge(id, step);
  };

  const scrollSize = (el: HTMLElement) => (vertical() ? el.scrollHeight : el.scrollWidth);
  const viewSize = (el: HTMLElement) => (vertical() ? el.clientHeight : el.clientWidth);
  const scrollPos = (el: HTMLElement) => (vertical() ? el.scrollTop : el.scrollLeft);
  const edgeStart = (rect: DOMRect) => (vertical() ? rect.top : rect.left);

  const gapSize = () => {
    if (!containerRef) return 0;
    const style = getComputedStyle(containerRef);
    return Number.parseFloat(vertical() ? style.rowGap : style.columnGap) || 0;
  };
  const itemSize = () => {
    const rect = containerRef?.querySelector('[data-slot="dock-item"]')?.getBoundingClientRect();
    return (vertical() ? rect?.height : rect?.width) ?? 0;
  };

  const padAlong = (el: Element) => {
    const style = getComputedStyle(el);
    const [a, b] = vertical()
      ? [style.paddingTop, style.paddingBottom]
      : [style.paddingLeft, style.paddingRight];
    return (Number.parseFloat(a) || 0) + (Number.parseFloat(b) || 0);
  };

  // The room the app gave the dock. Never the surface: it shrink-wraps this strip,
  // so measuring it asks the strip how big the strip is.
  const availableSpan = () => {
    const box = containerRef?.closest<HTMLElement>('[data-slot="dock"]');
    if (!box || !surfaceRef) return 0;
    return viewSize(box) - padAlong(box) - padAlong(surfaceRef);
  };

  const checkOverflow = () => {
    if (!containerRef) return;
    const side = vertical() ? "height" : "width";
    const other = vertical() ? "width" : "height";
    containerRef.style.removeProperty(other);
    const available = availableSpan();
    const overflowing = available > 0 && scrollSize(containerRef) > available + 1;
    if (overflowing) {
      const trimmed = stripWidth(available, itemSize(), gapSize());
      if (trimmed > 0) containerRef.style[side] = `${trimmed}px`;
    } else if (containerRef.style[side]) {
      containerRef.style[side] = "";
    }
    setNeedsScroll(overflowing);
    const viewport = viewSize(containerRef);
    setViewportSpan(viewport);
    setPages(pageCount(scrollSize(containerRef), viewport));
    setPage(pageOf(scrollPos(containerRef), viewport));
  };

  const goToPage = (next: number) => {
    if (!containerRef) return;
    const to = pageOffset(next, viewportSpan(), scrollSize(containerRef));
    containerRef.scrollTo(
      vertical() ? { top: to, behavior: "smooth" } : { left: to, behavior: "smooth" },
    );
  };

  const turnToItem = (index: number) => {
    if (!containerRef || !needsScroll() || viewportSpan() <= 0) return;
    const item = containerRef.querySelectorAll('[data-slot="dock-item"]')[index];
    if (!item) return;
    // The strip only: scrollIntoView would also scroll the page and any frame embedding it.
    const offset =
      edgeStart(item.getBoundingClientRect()) -
      edgeStart(containerRef.getBoundingClientRect()) +
      scrollPos(containerRef);
    goToPage(Math.floor(offset / viewportSpan()));
  };

  // A drag cannot click a page dot, so resting on the dot row turns to the page under it.
  createEffect(() => {
    const point = local.dragPoint ?? reorder.point();
    if (!point || pages() < 2 || !surfaceRef || !containerRef) return;
    const strip = containerRef.getBoundingClientRect();
    const surface = surfaceRef.getBoundingClientRect();
    const place = placement();
    const inSurfaceAlong = vertical()
      ? point.y >= surface.top && point.y <= surface.bottom
      : point.x >= surface.left && point.x <= surface.right;
    const pastStrip =
      place === "left"
        ? point.x > strip.right && point.x <= surface.right
        : place === "right"
          ? point.x < strip.left && point.x >= surface.left
          : point.y > strip.bottom && point.y <= surface.bottom;
    if (!pastStrip || !inSurfaceAlong) return;
    const ratio = vertical()
      ? (point.y - surface.top) / surface.height
      : (point.x - surface.left) / surface.width;
    const target = Math.min(pages() - 1, Math.floor(ratio * pages()));
    if (target === page()) return;
    const timer = setTimeout(() => goToPage(target), DOCK_PAGE_MS);
    onCleanup(() => clearTimeout(timer));
  });

  // The active dashboard may sit on another page after a switch elsewhere.
  createEffect(() => {
    const i = activeIndex();
    if (i !== null) turnToItem(i);
  });

  // A newcomer may land on a page nobody is looking at; turn there once.
  createEffect(
    on(
      () => local.arrivedIds?.join("\n") ?? "",
      () => {
        const first = local.items.findIndex((it) => arrivedSet().has(it.id));
        if (first >= 0) requestAnimationFrame(() => turnToItem(first));
      },
      { defer: true },
    ),
  );

  // Measured in the next frame's callbacks, which run before it paints: the first
  // dock anyone sees already has its pages, so the dot row never shifts it later.
  onMount(() => {
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(checkOverflow);
    };
    window.addEventListener("resize", onResize);
    onCleanup(() => {
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", onResize);
    });
  });

  // The box pads by mode and the strip runs along the edge, so either switching changes the room it has.
  createEffect(
    on([() => local.items.length, dockMode, vertical], () => {
      const frame = requestAnimationFrame(checkOverflow);
      onCleanup(() => cancelAnimationFrame(frame));
    }),
  );

  return (
    <div
      data-slot="dock"
      data-placement={placement()}
      class={cn(
        "flex max-w-full items-center justify-center",
        vertical() && "h-full max-h-full",
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
          vertical() && "max-h-full flex-col",
          // A flush side dock runs the whole edge.
          vertical() && dockMode() === "docked" && "h-full",
          // Room for the page dots inside the glass; outside it they sit on
          // the screen edge and get clipped.
          pages() > 1 &&
            {
              bottom: "pb-4 sm:pb-5",
              left: "pr-4 sm:pr-5",
              right: "pl-4 sm:pl-5",
            }[placement()],
          CARD_SURFACE,
          "[--glass-lift:0.55]",
          dockMode() === "floating"
            ? "rounded-xl"
            : { bottom: "rounded-t-xl", left: "rounded-r-xl", right: "rounded-l-xl" }[placement()],
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
              "bg-primary/45 absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
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
          data-reordering={reorder.dragId() ? "" : undefined}
          onScroll={() => {
            if (containerRef) setPage(pageOf(scrollPos(containerRef), viewportSpan()));
          }}
          class={cn(
            // A carried item moves its snap point, and the strip would chase it.
            "flex items-center gap-0.5 data-[reordering]:snap-none sm:gap-1",
            vertical() && "flex-col",
            needsScroll()
              ? vertical()
                ? "scrollbar-hide snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth"
                : "scrollbar-hide snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
              : "overflow-visible",
            !needsScroll() && "justify-center",
          )}
          style={{
            [vertical() ? "min-height" : "min-width"]: needsScroll() ? "auto" : "fit-content",
          }}
        >
          <SelectionScope
            marker="lit"
            class={cn("flex items-center gap-0.5 sm:gap-1", vertical() && "flex-col")}
          >
            <Index each={local.items}>
              {(item, i) => (
                <div
                  data-slot="dock-cell"
                  data-editing={local.editing ? "" : undefined}
                  data-dragging={reorder.dragId() === item().id ? "" : undefined}
                  class={cn(
                    "relative",
                    DOCK_EDIT_MOTION,
                    local.editing && "touch-none select-none",
                  )}
                  style={cellStyle(item().id)}
                  onPointerDown={(e) => reorder.begin(item().id, e)}
                  onMouseDown={reorder.onMouseDown}
                  on:click={{ handleEvent: reorder.onClickCapture, capture: true }}
                >
                  <DockIconButton
                    class={needsScroll() ? "snap-start" : undefined}
                    icon={item().icon}
                    label={item().label}
                    onClick={item().onClick}
                    onKeyDown={(e: KeyboardEvent) => onItemKeyDown(e, item().id)}
                    isActive={item().isActive}
                    lit={i === pillIndex()}
                    badge={item().badge}
                    arrived={arrivedSet().has(item().id)}
                    data-drop-target={item().isDropTarget ? "" : undefined}
                    data-dock-id={item().id}
                  />
                  <Show when={local.editing && local.onRemove && item().removable !== false}>
                    <button
                      type="button"
                      data-slot="dock-item-remove"
                      aria-label={`Remove ${item().label}`}
                      onClick={() => local.onRemove?.(item().id)}
                      class={cn(
                        "bg-destructive text-destructive-foreground absolute top-0 left-0 z-10 flex size-5 items-center justify-center rounded-full shadow-sm",
                        "before:absolute before:-inset-2",
                      )}
                    >
                      <Icon icon="lucide:minus" width={12} height={12} />
                    </button>
                  </Show>
                </div>
              )}
            </Index>
            <Show when={local.editing && local.onAdd}>
              <button
                type="button"
                data-slot="dock-add"
                aria-label="Add to dock"
                onClick={() => local.onAdd?.()}
                style={{ order: local.items.length }}
                class={cn(
                  "text-muted-foreground border-foreground/30 hover:text-foreground hover:border-foreground/60 flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border-2 border-dashed transition-colors duration-(--duration-state) sm:size-12",
                  PRESS_DIP,
                  needsScroll() && "snap-start",
                )}
              >
                <Icon icon="lucide:plus" width={20} height={20} />
              </button>
            </Show>
          </SelectionScope>
        </div>
        <Show when={local.editing && local.onMovePlacement}>
          <DockMoveGrip placement={placement()} onMove={(next) => local.onMovePlacement?.(next)} />
        </Show>
        <Show when={pages() > 1}>
          <div
            data-slot="dock-pages"
            class={cn(
              "pointer-events-auto absolute flex justify-center gap-1.5",
              {
                bottom: "inset-x-0 bottom-1.5",
                left: "inset-y-0 right-1.5 flex-col items-center",
                right: "inset-y-0 left-1.5 flex-col items-center",
              }[placement()],
            )}
          >
            <Index each={Array.from({ length: pages() })}>
              {(_, i) => (
                <button
                  type="button"
                  aria-label={`Page ${i + 1}`}
                  aria-current={page() === i ? "true" : undefined}
                  onClick={() => goToPage(i)}
                  class={cn(
                    "transition-glass rounded-full",
                    vertical() ? "w-1.5" : "h-1.5",
                    page() === i
                      ? cn("bg-foreground/70", vertical() ? "h-4" : "w-4")
                      : cn("bg-foreground/25", vertical() ? "h-1.5" : "w-1.5"),
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

export type { DockIconButtonProps, DockItem, DockPlacement, DockProps };
export { Dock };
