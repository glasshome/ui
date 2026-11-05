import { createSignal, For, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Z_CLASS } from "../lib/layers.js";
import { cn } from "../lib/utils.js";
import { type EdgeZone, edgeZone, moveId, slotAt } from "./dock-paging.js";
import { usePortalMount } from "./portal-mount.js";

const DRAG_SLOP = 6;

interface ReorderOptions {
  bar: () => HTMLElement | undefined;
  vertical: () => boolean;
  ids: () => string[];
  enabled: () => boolean;
  onReorder: (ids: string[]) => void;
}

/** Pointer reorder for the dock strip: the dragged cell follows the pointer along the axis, the others take their preview slots through flex order, and the new order is reported once on release. */
export function createDockReorder(options: ReorderOptions) {
  const [dragId, setDragId] = createSignal<string | null>(null);
  const [preview, setPreview] = createSignal<string[] | null>(null);
  const [lift, setLift] = createSignal(0);
  const [point, setPoint] = createSignal<{ x: number; y: number } | null>(null);
  let swallowClick = false;
  let stopDrag: (() => void) | undefined;
  onCleanup(() => stopDrag?.());

  const along = (x: number, y: number) => (options.vertical() ? y : x);
  const startOf = (rect: DOMRect) => (options.vertical() ? rect.top : rect.left);
  const sizeOf = (rect: DOMRect) => (options.vertical() ? rect.height : rect.width);

  function begin(id: string, down: PointerEvent) {
    if (!options.enabled() || down.button !== 0) return;
    if ((down.target as Element).closest('[data-slot="dock-item-remove"]')) return;
    const bar = options.bar();
    if (!bar) return;
    swallowClick = false;
    stopDrag?.();

    const ids = options.ids();
    let dragging = false;
    let contentMids: number[] = [];
    let grab = 0;
    let half = 0;
    let last = { x: down.clientX, y: down.clientY };

    const slotMids = () => {
      const barRect = bar.getBoundingClientRect();
      const scrolled = options.vertical() ? bar.scrollTop : bar.scrollLeft;
      return contentMids.map((mid) => mid + startOf(barRect) - scrolled);
    };

    const measure = () => {
      const barRect = bar.getBoundingClientRect();
      const scrolled = options.vertical() ? bar.scrollTop : bar.scrollLeft;
      const rects = [...bar.querySelectorAll('[data-slot="dock-cell"]')].map((cell) =>
        cell.getBoundingClientRect(),
      );
      contentMids = rects.map(
        (rect) => startOf(rect) + sizeOf(rect) / 2 - startOf(barRect) + scrolled,
      );
      const origin = rects[ids.indexOf(id)];
      half = origin ? sizeOf(origin) / 2 : 0;
      grab = along(down.clientX, down.clientY) - (slotMids()[ids.indexOf(id)] ?? 0);
    };

    const track = () => {
      const mids = slotMids();
      const center = along(last.x, last.y) - grab;
      const to = slotAt(mids, center);
      const barRect = bar.getBoundingClientRect();
      const lo = startOf(barRect) + half;
      const hi = startOf(barRect) + sizeOf(barRect) - half;
      setPreview(moveId(ids, id, to));
      setLift(Math.min(hi, Math.max(lo, center)) - (mids[to] ?? center));
    };

    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== down.pointerId) return;
      last = { x: move.clientX, y: move.clientY };
      if (!dragging) {
        if (Math.hypot(last.x - down.clientX, last.y - down.clientY) < DRAG_SLOP) return;
        dragging = true;
        measure();
        setDragId(id);
      }
      track();
      setPoint({ ...last });
    };

    const finish = (commit: boolean) => {
      const next = preview();
      const moved = dragging;
      stopDrag?.();
      if (moved) {
        swallowClick = true;
        // The release click lands on the dock bar when the item moved under the pointer, so no item ever sees it; the next press ends the claim.
        window.addEventListener("pointerdown", () => (swallowClick = false), {
          once: true,
          capture: true,
        });
      }
      if (commit && moved && next && next.join("\n") !== ids.join("\n")) options.onReorder(next);
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId === down.pointerId) finish(true);
    };
    const onCancel = (cancel: PointerEvent) => {
      if (cancel.pointerId === down.pointerId) finish(false);
    };
    const onScroll = () => {
      if (dragging) track();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    bar.addEventListener("scroll", onScroll);
    stopDrag = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      bar.removeEventListener("scroll", onScroll);
      stopDrag = undefined;
      setDragId(null);
      setPreview(null);
      setLift(0);
      setPoint(null);
    };
  }

  function nudge(id: string, step: -1 | 1) {
    const ids = options.ids();
    const to = ids.indexOf(id) + step;
    if (ids.indexOf(id) < 0 || to < 0 || to >= ids.length) return;
    options.onReorder(moveId(ids, id, to));
    requestAnimationFrame(() =>
      options
        .bar()
        ?.querySelector<HTMLElement>(`[data-dock-id="${CSS.escape(id)}"]`)
        ?.focus(),
    );
  }

  /** A held press on a strip that scrolls starts the browser's own autoscroll once the pointer leaves it; cancelling the default press keeps the strip still. */
  function onMouseDown(e: MouseEvent) {
    if (options.enabled() && !(e.target as Element).closest('[data-slot="dock-item-remove"]')) {
      e.preventDefault();
    }
  }

  /** A drag ends in a click on the item under the pointer; that click belongs to no one. */
  function onClickCapture(e: MouseEvent) {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  }

  return { dragId, preview, lift, point, begin, nudge, onMouseDown, onClickCapture };
}

const ZONES: EdgeZone[] = ["left", "bottom", "right"];

const ZONE_BOX: Record<EdgeZone, string> = {
  left: "inset-y-0 left-0 w-1/4 border-r-2",
  right: "inset-y-0 right-0 w-1/4 border-l-2",
  bottom: "inset-x-1/4 bottom-0 h-2/5 border-t-2",
};

const GRIP_BOX: Record<EdgeZone, string> = {
  bottom: "top-0 left-1/2 h-3 w-12 -translate-x-1/2",
  left: "top-1/2 left-0 h-12 w-3 -translate-y-1/2",
  right: "top-1/2 right-0 h-12 w-3 -translate-y-1/2",
};

const GRIP_PILL: Record<EdgeZone, string> = {
  bottom: "h-1 w-8",
  left: "h-8 w-1",
  right: "h-8 w-1",
};

/** The grip on a dock's outer edge: carry it toward a screen edge and the three landing zones light up. */
export function DockMoveGrip(props: {
  placement: EdgeZone;
  onMove: (placement: EdgeZone) => void;
}) {
  const [carrying, setCarrying] = createSignal(false);
  const [zone, setZone] = createSignal<EdgeZone | null>(null);
  let stop: (() => void) | undefined;
  onCleanup(() => stop?.());

  const zoneAt = (e: PointerEvent) =>
    edgeZone(
      { x: e.clientX, y: e.clientY },
      { width: window.innerWidth, height: window.innerHeight },
    );

  function onPointerDown(down: PointerEvent) {
    if (down.button !== 0) return;
    stop?.();
    setCarrying(true);
    setZone(zoneAt(down));
    const onMove = (move: PointerEvent) => {
      if (move.pointerId === down.pointerId) setZone(zoneAt(move));
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId !== down.pointerId) return;
      const landed = zoneAt(up);
      stop?.();
      if (landed && landed !== props.placement) props.onMove(landed);
    };
    const onCancel = (cancel: PointerEvent) => {
      if (cancel.pointerId === down.pointerId) stop?.();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      stop = undefined;
      setCarrying(false);
      setZone(null);
    };
  }

  return (
    <>
      <div
        data-slot="dock-grip"
        aria-hidden="true"
        onPointerDown={onPointerDown}
        class={cn(
          "absolute z-10 flex cursor-grab touch-none items-center justify-center",
          GRIP_BOX[props.placement],
        )}
      >
        <span class={cn("bg-foreground/35 rounded-full", GRIP_PILL[props.placement])} />
      </div>
      <Show when={carrying()}>
        <Portal mount={usePortalMount()}>
          <div
            data-slot="dock-edge-zones"
            aria-hidden="true"
            class={cn("pointer-events-none fixed inset-0", Z_CLASS.overlay)}
          >
            <For each={ZONES}>
              {(name) => (
                <div
                  data-zone={name}
                  data-active={zone() === name ? "" : undefined}
                  class={cn(
                    "bg-primary/10 border-primary/30 absolute transition-colors duration-(--duration-state)",
                    "data-[active]:bg-primary/25 data-[active]:border-primary",
                    ZONE_BOX[name],
                  )}
                />
              )}
            </For>
          </div>
        </Portal>
      </Show>
    </>
  );
}
