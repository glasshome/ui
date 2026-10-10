import { createSignal, onCleanup } from "solid-js";
import { copyText } from "../lib/clipboard.js";

export type CopyState = "idle" | "copied" | "failed";

/** Copy plus the state a control needs to say what happened. */
export function useCopyText(resetAfterMs = 2000) {
  const [state, setState] = createSignal<CopyState>("idle");
  let timer: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => clearTimeout(timer));

  const copy = async (text: string): Promise<boolean> => {
    const copied = await copyText(text);
    setState(copied ? "copied" : "failed");
    clearTimeout(timer);
    timer = setTimeout(() => setState("idle"), resetAfterMs);
    return copied;
  };

  return { state, copy };
}
