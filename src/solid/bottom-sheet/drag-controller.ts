import { hasNoDragAncestor, scrollerAhead, shouldDrag } from "./arbitration.js";
import {
  CLOSE_DISTANCE_RATIO,
  CLOSE_VELOCITY_PX_PER_MS,
  DEAD_ZONE_PX,
  EASE,
  TRANSITION_MS,
  VELOCITY_PROJECTION_MS,
} from "./constants.js";
import type { SheetState } from "./state-machine.js";
import { VelocityTracker } from "./velocity.js";

const TRANSITION_CSS = `transform ${TRANSITION_MS}ms ${EASE}`;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const FLING_DECAY_PER_MS = 0.998;
const FLING_STOP_PX_PER_MS = 0.02;
// theme.css gives an unscrolled body touch-action none where pan-down is unsupported; unscrolled means scrollTop 0.
const BODY_HELD_BY_SHEET = '[data-slot$="-body"]:not([data-scrolled])';
const panDownDropped = () => !CSS.supports("touch-action", "pan-down");

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
  let movedPastDeadZone = false;
  let dragAborted = false;
  let height = 0;
  let lastTotalDy = 0;
  let shownDy = 0;
  let scroller: Element | null = null;
  let fling = 0;

  const isDraggableState = (): boolean => {
    const s = getState();
    return s === "open" || s === "pressing";
  };

  // Written in the move itself: pointermove is already frame-aligned, and a guest's rAF costs a second trip through the realm.
  const follow = (value: number) => {
    const applied = value < 0 ? dampen(-value) * -1 : value;
    shownDy = applied;
    el.style.transform = `translate3d(0, ${applied}px, 0)`;
  };

  const stopFling = () => {
    if (fling) cancelAnimationFrame(fling);
    fling = 0;
  };

  const flingScroll = (box: Element, from: number, velocity: number) => {
    if (reducedMotion() || Math.abs(velocity) < FLING_STOP_PX_PER_MS) return;
    let v = velocity;
    let at = from;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      at += v * dt;
      v *= FLING_DECAY_PER_MS ** dt;
      box.scrollTop = at;
      fling = Math.abs(v) < FLING_STOP_PX_PER_MS ? 0 : requestAnimationFrame(step);
    };
    fling = requestAnimationFrame(step);
  };

  // WebKit drops pan-down, so the sheet scrolls its body under the finger there.
  const takeScroll = (target: Element | null, totalDy: number): Element | null => {
    const box = scrollerAhead(target, el, totalDy);
    if (!box || !panDownDropped() || !box.matches(BODY_HELD_BY_SHEET)) return null;
    scroller = box;
    if (pointerId !== null) {
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* pointer already released */
      }
    }
    return box;
  };

  const onPointerDown = (e: PointerEvent) => {
    stopFling();
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
    shownDy = 0;
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
    if (scroller) {
      tracker.add(totalDy, e.timeStamp);
      scroller.scrollTop = -totalDy;
      return;
    }

    if (!movedPastDeadZone) {
      if (Math.abs(totalDy) + Math.abs(totalDx) < DEAD_ZONE_PX) return;
      if (!shouldDrag(pointerTarget, el, totalDy, totalDx)) {
        if (getState() === "pressing") setState("open");
        const box = Math.abs(totalDy) >= Math.abs(totalDx) && takeScroll(pointerTarget, totalDy);
        if (box) {
          tracker.add(totalDy, e.timeStamp);
          box.scrollTop = -totalDy;
        } else dragAborted = true;
        return;
      }
      commitDrag();
    }
    tracker.add(totalDy, e.timeStamp);
    dy = totalDy;
    follow(dy);
  };

  const cleanupDrag = () => {
    pointerId = null;
    pointerTarget = null;
    dragAborted = false;
    scroller = null;
  };

  const settleClose = () => {
    el.style.transition = reducedMotion() ? "none" : TRANSITION_CSS;
    el.style.animation = "none";
    el.style.transform = "translate3d(0, 100%, 0)";
    requestClose();
  };

  const settleSnap = () => {
    setState("snapping");
    if (shownDy === 0 || reducedMotion()) {
      shownDy = 0;
      el.style.transition = "";
      el.style.animation = "";
      el.style.transform = "";
      setState("open");
      return;
    }
    shownDy = 0;
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

    if (scroller) {
      const box = scroller;
      const velocity = tracker.compute(e.timeStamp);
      if (Math.abs(lastTotalDy) > DEAD_ZONE_PX) suppressNextClick();
      const at = Math.max(0, -lastTotalDy);
      cleanupDrag();
      flingScroll(box, at, -velocity);
      return;
    }

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

  const onTouchMove = (e: TouchEvent) => {
    if (movedPastDeadZone || scroller) e.preventDefault();
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
      stopFling();
      cleanupDrag();
    },
  };
}
