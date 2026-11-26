import {
  children,
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onSettled,
  Show,
  omit,
} from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import { CARD_SURFACE } from "../lib/card-classes.js";
import { DOCK_SLOT_RADIUS, DOCK_SLOT_SHAPE } from "../lib/dock-slot-classes.js";
import {
  DOCK_ARRIVE_MOTION,
  DOCK_EDIT_MOTION,
  HOLD_MOTION,
  PRESS_DIP,
} from "../lib/motion-classes.js";
import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { createDockReorder, DockMoveGrip } from "./dock-edit.js";
import { pageOf, pageOffset } from "./dock-paging.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";
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

interface DockProps extends Omit<ComponentProps<"div">, "style"> {
  style?: JSX.CSSProperties;
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
  /** While editing, a grip at the dock's start carries the whole dock to a screen edge; fires once on release over one. */
  onMovePlacement?: (placement: DockPlacement) => void;
  /** Sits inside the glass before the strip, never pages away; the strip's room shrinks by it. */
  lead?: JSX.Element;
  /** A second glass unit that grows out of the dock while `companionOpen`: above a bottom dock, under a side dock, which pages to make room. */
  companion?: JSX.Element;
  companionOpen?: boolean;
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
  const text = useUiText();
  // Kobalte's button root narrows `type`; Solid's ComponentProps<"button"> also
  // admits "menu", so it is split off rather than spread.
  const rest = omit(props, "icon", "label", "class", "isActive", "badge", "type", "lit", "arrived");
  const isElement = () => typeof props.icon !== "function";

  return (
    <Tooltip openDelay={150} placement="top">
      <TooltipTrigger
        type="button"
        data-slot="dock-item"
        class={cn(
          "group relative isolate transition-transform duration-(--duration-micro)",
          DOCK_SLOT_SHAPE,
          PRESS_DIP,
          props.class,
        )}
        aria-label={props.label}
        aria-current={props.isActive ? "page" : undefined}
        data-lit={props.lit ? "" : undefined}
        data-arrived={props.arrived ? "" : undefined}
        {...rest}
      >
        <SelectionHighlight active={props.lit ?? false} />
        <Show when={props.arrived}>
          <span data-slot="dock-item-arrival" aria-hidden="true" class={DOCK_ARRIVE_MOTION} />
        </Show>
        <div
          data-slot="dock-item-icon"
          class={cn(
            "flex items-center justify-center transition-colors duration-(--duration-state)",
            props.lit ? "text-primary" : "text-foreground group-hover:text-primary/80",
          )}
        >
          {isElement() ? (
            (props.icon as JSX.Element)
          ) : (
            <Polymorphic
              defaultAs={props.icon as Component<{ class?: string }>}
              class="h-5 w-5 sm:h-6 sm:w-6"
            />
          )}
        </div>
        <Show when={typeof props.badge === "number" && props.badge > 0}>
          {/* Inside the item box: an overhanging badge inflates the bar's
           * scrollWidth and trips the overflow-to-scroll check below. */}
          <Badge
            role="status"
            tone="var(--primary)"
            class="absolute top-0 right-0 h-4 min-w-4 justify-center px-1 pt-0.5 pb-0 font-mono text-[9px] leading-none font-medium tabular-nums"
            aria-label={text("ui.dock.pending", { count: props.badge ?? 0 })}
          >
            {props.badge != null && props.badge > 9 ? "9+" : props.badge}
          </Badge>
        </Show>
      </TooltipTrigger>
      <TooltipContent class="hidden sm:block">{props.label}</TooltipContent>
    </Tooltip>
  );
};

const Dock: Component<DockProps> = (props) => {
  const text = useUiText();
  const rest = omit(
    props,
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
    "lead",
    "companion",
    "companionOpen",
    "style",
  );
  const placement = () => props.placement ?? "bottom";
  const vertical = () => placement() !== "bottom";
  const gripShown = () => Boolean(props.editing && props.onMovePlacement);
  // The drain plays where the fill grew, so the point outlives the hold.
  let surfaceRef: HTMLDivElement | undefined;
  let surfaceSize: ResizeObserverSize | undefined;
  let dotsRef: HTMLDivElement | undefined;
  let companionRef: HTMLDivElement | undefined;
  const lead = children(() => props.lead);
  const companion = children(() => props.companion);
  const holdPoint = createMemo<{ x: number; y: number; r: number }>((drained) => {
    const h = props.hold;
    if (!h) return drained ?? { x: 0, y: 0, r: 0 };
    const w = surfaceSize?.inlineSize ?? 0;
    const ht = surfaceSize?.blockSize ?? 0;
    // Reaches the farthest corner exactly at full scale, so the fill ends as the hold does.
    return {
      x: h.x,
      y: h.y,
      r: Math.hypot(Math.max(h.x, w - h.x), Math.max(h.y, ht - h.y)),
    };
  });
  const dockMode = () => props.dockMode ?? "floating";
  let containerRef!: HTMLDivElement;
  const [pages, setPages] = createSignal(1);
  const needsScroll = () => pages() > 1;
  const [page, setPage] = createSignal(0);
  // The strip's length along the dock's axis: width at the bottom, height on a side edge.
  const [viewportSpan, setViewportSpan] = createSignal(0);
  const slots = () => props.items.length + (props.editing && props.onAdd ? 1 : 0);

  // A memo: the items list is rebuilt on every hover change, and only a new active item may scroll the strip.
  const activeIndex = createMemo(() => {
    const i = props.items.findIndex((it) => it.isActive);
    return i < 0 ? null : i;
  });
  // A drag borrows the pill: it slides to where the drop would land and back when the drag leaves.
  const pillIndex = createMemo(() => {
    const i = props.items.findIndex((it) => it.isDropTarget);
    return i < 0 ? activeIndex() : i;
  });
  const arrivedSet = createMemo(() => new Set(props.arrivedIds ?? []));
  const reorder = createDockReorder({
    bar: () => containerRef,
    vertical,
    ids: () => props.items.map((it) => it.id),
    enabled: () => Boolean(props.editing && props.onReorder),
    onReorder: (ids) => props.onReorder?.(ids),
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
    if (!props.editing || !e.altKey) return;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (step !== -1 && step !== 1) return;
    e.preventDefault();
    reorder.nudge(id, step);
  };

  const scrollSize = (el: HTMLElement) => (vertical() ? el.scrollHeight : el.scrollWidth);
  const scrollPos = (el: HTMLElement) => (vertical() ? el.scrollTop : el.scrollLeft);
  const edgeStart = (rect: DOMRect) => (vertical() ? rect.top : rect.left);

  const along = (size: ResizeObserverSize | undefined) =>
    (vertical() ? size?.blockSize : size?.inlineSize) ?? 0;

  const goToPage = (next: number) => {
    if (!containerRef) return;
    const to = pageOffset(next, viewportSpan(), scrollSize(containerRef));
    // The strip's scroll-smooth class carries the motion.
    if (vertical()) containerRef.scrollTop = to;
    else containerRef.scrollLeft = to;
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
  createEffect(
    () => ({
      point: props.dragPoint ?? reorder.point(),
      count: pages(),
      at: page(),
      place: placement(),
    }),
    ({ point, count, at, place }) => {
      if (!point || count < 2 || !surfaceRef || !containerRef) return;
      const strip = containerRef.getBoundingClientRect();
      const surface = surfaceRef.getBoundingClientRect();
      const inSurfaceAlong = vertical()
        ? point.y >= surface.top && point.y <= surface.bottom
        : point.x >= surface.left && point.x <= surface.right;
      const dots = dotsRef?.getBoundingClientRect();
      const pastStrip =
        place === "left"
          ? point.x >= surface.left && point.x <= (dots?.right ?? strip.left)
          : place === "right"
            ? point.x <= surface.right && point.x >= (dots?.left ?? strip.right)
            : point.y > strip.bottom && point.y <= surface.bottom;
      if (!pastStrip || !inSurfaceAlong) return;
      const ratio = vertical()
        ? (point.y - surface.top) / surface.height
        : (point.x - surface.left) / surface.width;
      const target = Math.min(count - 1, Math.floor(ratio * count));
      if (target === at) return;
      const timer = setTimeout(() => goToPage(target), DOCK_PAGE_MS);
      return () => clearTimeout(timer);
    },
  );

  // The active dashboard may sit on another page after a switch elsewhere.
  createEffect(
    () => ({ i: activeIndex(), paged: needsScroll(), span: viewportSpan(), axis: vertical() }),
    ({ i }) => {
      if (i !== null) turnToItem(i);
    },
  );

  // A newcomer may land on a page nobody is looking at; turn there once.
  createEffect(
    () => props.arrivedIds?.join("\n") ?? "",
    () => {
      const first = props.items.findIndex((it) => arrivedSet().has(it.id));
      if (first >= 0) requestAnimationFrame(() => turnToItem(first));
    },
    { defer: true },
  );

  // CSS draws the paging; the observer only tells the scripts what it drew.
  let observer: ResizeObserver | undefined;
  const watched = new Map<Element, ResizeObserverOptions | undefined>();
  const dotDrawn = new Map<Element, boolean>();
  let leadEl: Element | undefined;
  const [leadSize, setLeadSize] = createSignal<ResizeObserverSize>();
  const [companionSize, setCompanionSize] = createSignal<ResizeObserverSize>();
  const countPages = () => setPages(Math.max(1, [...dotDrawn.values()].filter(Boolean).length));
  const watch = (el: Element, options?: ResizeObserverOptions) => {
    watched.set(el, options);
    observer?.observe(el, options);
  };
  // A ref cannot register a cleanup; called as the element renders, its owner holds the cleanup.
  const watchedRef = (
    options: ResizeObserverOptions | undefined,
    hooks: { attach?: (el: Element) => void; drop?: (el: Element) => void } = {},
  ) => {
    let el: Element | undefined;
    onCleanup(() => {
      if (!el) return;
      watched.delete(el);
      observer?.unobserve(el);
      hooks.drop?.(el);
    });
    return (node: Element) => {
      el = node;
      hooks.attach?.(node);
      watch(node, options);
    };
  };
  const dotRef = () =>
    watchedRef(
      { box: "border-box" },
      {
        attach: (el) => dotDrawn.set(el, false),
        drop: (el) => {
          dotDrawn.delete(el);
          countPages();
        },
      },
    );
  const leadRef = () =>
    watchedRef(
      { box: "border-box" },
      {
        attach: (el) => (leadEl = el),
        drop: () => {
          leadEl = undefined;
          setLeadSize(undefined);
        },
      },
    );
  const companionWatchRef = () =>
    watchedRef(
      { box: "border-box" },
      {
        attach: (el) => (companionRef = el as HTMLDivElement),
        drop: (el) => {
          if (companionRef === el) companionRef = undefined;
        },
      },
    );

  onSettled(() => {
    let frame = 0;
    let lead: ResizeObserverSize | undefined;
    let companion: ResizeObserverSize | undefined;
    observer = new ResizeObserver((entries) => {
      let dots = false;
      let room = false;
      for (const entry of entries) {
        const [content] = entry.contentBoxSize;
        const [border] = entry.borderBoxSize;
        if (!content || !border) continue;
        if (entry.target === surfaceRef) surfaceSize = border;
        else if (entry.target === containerRef) setViewportSpan(along(content));
        else if (dotDrawn.has(entry.target)) {
          dotDrawn.set(entry.target, border.inlineSize > 0 && border.blockSize > 0);
          dots = true;
        } else if (entry.target === leadEl) {
          lead = border;
          room = true;
        } else if (entry.target === companionRef) {
          companion = border;
          room = true;
        }
      }
      if (dots) countPages();
      if (!room) return;
      // The lead and companion resize the strip, which other observers on the page watch: inside this callback that is a resize loop.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setLeadSize(leadEl ? lead : undefined);
        setCompanionSize(companion);
      });
    });
    for (const [el, options] of watched) observer.observe(el, options);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  });

  return (
    <div
      data-slot="dock"
      data-placement={placement()}
      data-grip={gripShown() ? "" : undefined}
      class={cn(
        "flex max-w-full items-center justify-center",
        // A side dock writes vertically (globals.css), so its row runs down the edge. Its room
        // is its length along the edge, so a bottom dock in a row takes the row's width.
        vertical() ? "h-full max-h-full" : "grow flex-col-reverse",
        dockMode() === "floating" ? "p-1 sm:p-2" : "",
        props.class,
      )}
      style={{
        "--dock-slots": slots(),
        "--dock-lead": `${along(leadSize())}px`,
        "--dock-companion": `${vertical() && props.companionOpen ? along(companionSize()) : 0}px`,
        ...props.style,
      }}
      {...rest}
    >
      <div
        ref={(el) => {
          surfaceRef = el;
          watch(el, { box: "border-box" });
        }}
        data-slot="dock-surface"
        class={cn(
          // isolate: the layers behind the icons stay inside the dock even with blur off.
          "pointer-events-auto relative isolate flex max-w-full items-center justify-center",
          vertical() && "max-h-full min-h-0 flex-col",
          // A flush side dock runs the whole edge, less what the companion takes.
          vertical() && dockMode() === "docked" && "flex-1",
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
            data-hold={props.hold && !props.hold.fired ? "" : undefined}
            data-fired={props.hold?.fired ? "" : undefined}
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
        <Show when={props.glow}>
          <div
            data-slot="dock-glow"
            aria-hidden="true"
            class="glass-edge-orbit fade-in-0 animate-in duration-(--duration-state)"
          >
            <div />
          </div>
        </Show>
        <Show when={lead()}>
          <div
            ref={leadRef()}
            data-slot="dock-lead"
            class={cn(
              "flex shrink-0 items-center gap-0.5 sm:gap-1",
              vertical() ? "flex-col pb-1 sm:pb-2" : "pr-1 sm:pr-2",
            )}
          >
            {lead()}
            <span
              aria-hidden="true"
              class={cn("bg-foreground/15 rounded-full", vertical() ? "h-px w-6" : "h-6 w-px")}
            />
          </div>
        </Show>
        <div
          ref={(el) => {
            containerRef = el;
            watch(el);
          }}
          data-slot="dock-bar"
          data-paged={needsScroll() ? "" : undefined}
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
          )}
        >
          <SelectionScope
            marker="lit"
            radius={DOCK_SLOT_RADIUS}
            class={cn("flex items-center gap-0.5 sm:gap-1", vertical() && "flex-col")}
          >
            <For keyed={false} each={props.items}>
              {(item, i) => (
                <div
                  data-slot="dock-cell"
                  data-editing={props.editing ? "" : undefined}
                  data-dragging={reorder.dragId() === item().id ? "" : undefined}
                  class={cn(
                    "relative",
                    DOCK_EDIT_MOTION,
                    props.editing && "touch-none select-none",
                  )}
                  style={cellStyle(item().id)}
                  onPointerDown={(e) => reorder.begin(item().id, e)}
                  onMouseDown={reorder.onMouseDown}
                  ref={(el) => el.addEventListener("click", reorder.onClickCapture, true)}
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
                  <Show when={props.editing && props.onRemove && item().removable !== false}>
                    <button
                      type="button"
                      data-slot="dock-item-remove"
                      aria-label={text("ui.dock.remove", { name: item().label })}
                      onClick={() => props.onRemove?.(item().id)}
                      class={cn(
                        "bg-card border-foreground/25 text-destructive absolute top-0 left-0 z-10 flex size-5 items-center justify-center rounded-full border shadow-sm",
                        "before:absolute before:-top-2 before:right-0 before:bottom-0 before:-left-2",
                      )}
                    >
                      <Icon icon="lucide:minus" width={12} height={12} />
                    </button>
                  </Show>
                </div>
              )}
            </For>
            <Show when={props.editing && props.onAdd}>
              <button
                type="button"
                data-slot="dock-add"
                aria-label={text("ui.dock.add")}
                onClick={() => props.onAdd?.()}
                style={{ order: props.items.length }}
                class={cn(
                  "text-muted-foreground border-foreground/30 hover:text-foreground hover:border-foreground/60 shrink-0 border-2 border-dashed transition-colors duration-(--duration-state)",
                  DOCK_SLOT_SHAPE,
                  PRESS_DIP,
                  needsScroll() && "snap-start",
                )}
              >
                <Icon icon="lucide:plus" width={20} height={20} />
              </button>
            </Show>
          </SelectionScope>
        </div>
        <Show when={gripShown()}>
          <DockMoveGrip placement={placement()} onMove={(next) => props.onMovePlacement?.(next)} />
        </Show>
        <div
          ref={dotsRef}
          data-slot="dock-pages"
          class={cn(
            "pointer-events-auto absolute flex justify-center",
            {
              bottom: "inset-x-0 bottom-1.5",
              // 10px from the glass rim, which draws a 1px border.
              left: "inset-y-0 left-[9px] -z-1 flex-col items-center",
              right: "inset-y-0 right-[9px] -z-1 flex-col items-center",
            }[placement()],
          )}
        >
          <For keyed={false} each={Array.from({ length: slots() })}>
            {(_, i) => (
              <button
                ref={dotRef()}
                type="button"
                data-slot="dock-page"
                aria-label={text("ui.dock.page", { page: i + 1 })}
                aria-current={page() === i ? "true" : undefined}
                inert={i >= pages() || pages() < 2}
                onClick={() => goToPage(i)}
                style={{ "--dock-page": i }}
                class={cn(
                  "transition-glass rounded-full",
                  page() === i ? "bg-foreground/70" : "bg-foreground/25",
                )}
              />
            )}
          </For>
        </div>
      </div>
      <Show when={companion()}>
        <div
          data-slot="dock-companion-reveal"
          data-open={props.companionOpen ? "" : undefined}
          aria-hidden={props.companionOpen ? undefined : "true"}
          inert={!props.companionOpen}
          class={cn(
            "grid shrink-0 grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-(--duration-micro) ease-(--ease-contract) data-[open]:grid-rows-[1fr] data-[open]:opacity-100 data-[open]:duration-(--duration-expand) data-[open]:ease-(--ease-expand)",
            // Takes the dock's width instead of widening it.
            vertical() && "self-stretch [contain:inline-size]",
          )}
        >
          <div class="min-h-0 min-w-0 overflow-hidden">
            <div ref={companionWatchRef()} class={vertical() ? "pt-2" : "px-2 pt-2 pb-1"}>
              <div
                data-slot="dock-companion"
                data-placement={placement()}
                class={cn(
                  "pointer-events-auto flex items-center gap-1 rounded-xl p-1.5",
                  vertical() ? "w-full flex-col" : "w-max",
                  CARD_SURFACE,
                  "[--glass-lift:0.55]",
                )}
              >
                {companion()}
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export type { DockIconButtonProps, DockItem, DockPlacement, DockProps };
export { Dock };
