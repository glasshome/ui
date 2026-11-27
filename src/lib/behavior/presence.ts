import { type Accessor, createMemo, createSignal, createEffect } from "solid-js";

export type PresencePhase = "opening" | "open" | "closing" | "closed";
export type MotionEvent = AnimationEvent | TransitionEvent;

export interface PresenceOptions {
  present: Accessor<boolean>;
  element: Accessor<Element | undefined>;
  exitMs: number;
  accept?: (e: MotionEvent) => boolean;
  keep?: Accessor<boolean>;
}

export interface Presence {
  mounted: Accessor<boolean>;
  phase: Accessor<PresencePhase>;
  dormant: Accessor<boolean>;
}

export const PRESENCE_TIMEOUT_MS = 1000;

const END_EVENTS = [
  "animationend",
  "animationcancel",
  "transitionend",
  "transitioncancel",
] as const;

export function watchMotion(
  el: Element,
  exitMs: number,
  done: () => void,
  accept?: (e: MotionEvent) => boolean,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearTimeout(timer);
    for (const type of END_EVENTS) el.removeEventListener(type, onEnd as EventListener);
  };
  const finish = () => {
    stop();
    done();
  };
  const onEnd = (e: MotionEvent) => {
    if (e.target !== el || e.pseudoElement) return;
    if (accept && !accept(e)) return;
    finish();
  };
  for (const type of END_EVENTS) el.addEventListener(type, onEnd as EventListener);
  timer = setTimeout(finish, Math.min(exitMs, PRESENCE_TIMEOUT_MS));
  return stop;
}

export function createPresence(options: PresenceOptions): Presence {
  const [phase, setPhase] = createSignal<PresencePhase>((prev?: PresencePhase) => {
    const current = prev ?? "closed";
    if (options.present())
      return current === "closing" ? "open" : current === "closed" ? "opening" : current;
    return current === "closed" || !options.element() ? "closed" : "closing";
  });

  createEffect(
    () => [phase(), options.element(), options.exitMs] as const,
    ([current, el, exitMs]) => {
      if ((current !== "opening" && current !== "closing") || !el) return;
      return watchMotion(
        el,
        exitMs,
        () => setPhase(current === "opening" ? "open" : "closed"),
        options.accept,
      );
    },
  );

  const mounted = createMemo(() => phase() !== "closed" || (options.keep?.() ?? false));
  const dormant = createMemo(() => phase() === "closed" && mounted());
  return { mounted, phase, dormant };
}
