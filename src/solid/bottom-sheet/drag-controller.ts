import { hasNoDragAncestor, shouldDrag } from "./arbitration";
import {
  CLOSE_DISTANCE_RATIO,
  CLOSE_VELOCITY_PX_PER_MS,
  DEAD_ZONE_PX,
  EASE,
  TRANSITION_MS,
  VELOCITY_PROJECTION_MS,
} from "./constants";
import type { SheetState } from "./state-machine";
import { VelocityTracker } from "./velocity";

const TRANSITION_CSS = `transform ${TRANSITION_MS}ms ${EASE}`;

interface DragHandle {
  destroy: () => void;
}

interface DragOptions {
  el: HTMLDivElement;
  getState: () => SheetState;
  setState: (s: SheetState) => void;
  requestClose: () => void;
}

// Rubber-band dampening past the top snap. Vaul recipe.
function dampen(v: number): number {
  return 8 * (Math.log(v + 1) - 2);
}

export function attachDrag(opts: DragOptions): DragHandle {
  const { el, getState, setState, requestClose } = opts;
  const tracker = new VelocityTracker();

  let pointerId: number | null = null;
  let startY = 0;
  let startX = 0;
  let pointerTarget: Element | null = null;
  let dy = 0;
  let raf = 0;
  let pendingDy: number | null = null;
  let movedPastDeadZone = false;
  let dragAborted = false;
  let height = 0;
  let lastTotalDy = 0;

  const isDraggableState = (): boolean => {
    const s = getState();
    return s === "open" || s === "pressing";
  };

  const flushFrame = () => {
    raf = 0;
    if (pendingDy === null) return;
    const value = pendingDy;
    pendingDy = null;
    const applied = value < 0 ? dampen(-value) * -1 : value;
    el.style.transform = `translate3d(0, ${applied}px, 0)`;
  };

  const schedule = (newDy: number) => {
    pendingDy = newDy;
    if (raf === 0) raf = requestAnimationFrame(flushFrame);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType !== "touch") return;
    if (!isDraggableState()) return;
    if (pointerId !== null) return; // ignore secondary pointers

    const target = e.target instanceof Element ? e.target : null;
    if (hasNoDragAncestor(target, el)) return;
    if (target && target.closest("[data-sheet-content]") !== el) return;

    pointerId = e.pointerId;
    startY = e.clientY;
    startX = e.clientX;
    pointerTarget = target;
    dy = 0;
    lastTotalDy = 0;
    movedPastDeadZone = false;
    dragAborted = false;
    tracker.reset();
    tracker.add(0, e.timeStamp);
    height = el.offsetHeight || el.getBoundingClientRect().height;
    setState("pressing");
  };

  const commitDrag = () => {
    movedPastDeadZone = true;
    if (pointerId !== null) {
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* pointer already released */
      }
    }
    el.style.transition = "none";
    el.style.animation = "none";
    setState("dragging");
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    if (dragAborted) return;
    const totalDy = e.clientY - startY;
    const totalDx = e.clientX - startX;
    lastTotalDy = totalDy;

    if (!movedPastDeadZone) {
      if (Math.abs(totalDy) + Math.abs(totalDx) < DEAD_ZONE_PX) return;
      if (!shouldDrag(pointerTarget, el, totalDy, totalDx)) {
        dragAborted = true;
        if (getState() === "pressing") setState("open");
        return;
      }
      commitDrag();
    }
    tracker.add(totalDy, e.timeStamp);
    dy = totalDy;
    schedule(dy);
  };

  const cleanupDrag = () => {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    pendingDy = null;
    pointerId = null;
    pointerTarget = null;
    dragAborted = false;
  };

  const settleClose = () => {
    el.style.transition = TRANSITION_CSS;
    el.style.animation = "none";
    el.style.transform = "translate3d(0, 100%, 0)";
    requestClose();
  };

  const settleSnap = () => {
    setState("snapping");
    el.style.transition = TRANSITION_CSS;
    el.style.animation = "";
    el.style.transform = "translate3d(0, 0, 0)";
  };

  const suppressNextClick = () => {
    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      document.removeEventListener("click", onClick, true);
    };
    document.addEventListener("click", onClick, true);
    setTimeout(() => document.removeEventListener("click", onClick, true), 100);
  };

  const safeReleaseCapture = () => {
    if (pointerId === null) return;
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      /* pointer already gone */
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const wasDragging = movedPastDeadZone;
    safeReleaseCapture();

    if (!wasDragging) {
      cleanupDrag();
      setState("open");
      return;
    }

    const velocity = tracker.compute(e.timeStamp);
    const projectedDy = dy + velocity * VELOCITY_PROJECTION_MS;
    const shouldClose =
      projectedDy > height * CLOSE_DISTANCE_RATIO || velocity > CLOSE_VELOCITY_PX_PER_MS;

    if (Math.abs(lastTotalDy) > DEAD_ZONE_PX) suppressNextClick();

    cleanupDrag();
    if (shouldClose) settleClose();
    else settleSnap();
  };

  const onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    safeReleaseCapture();
    const wasDragging = movedPastDeadZone;
    cleanupDrag();
    if (wasDragging) settleSnap();
    else setState("open");
  };

  // preventDefault while drag committed — stops browser converting to scroll.
  const onTouchMove = (e: TouchEvent) => {
    if (movedPastDeadZone) e.preventDefault();
  };

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerCancel);
  el.addEventListener("touchmove", onTouchMove, { passive: false });

  return {
    destroy() {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("touchmove", onTouchMove);
      cleanupDrag();
    },
  };
}
