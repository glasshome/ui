import { For } from "solid-js";
import { type JSX } from "@solidjs/web";
import { CARD_SURFACE_BASE } from "../../src/lib/card-classes";

const ROWS_PER_CARD = 20;

export function BusyPage(props: { count?: number; children: JSX.Element }): JSX.Element {
  const cards = () => Math.ceil((props.count ?? 1000) / (ROWS_PER_CARD + 1));
  return (
    <>
      <div aria-hidden="true" data-busy-page class="grid grid-cols-4 gap-3 p-6">
        <For each={Array.from({ length: cards() })}>
          {() => (
            <div class={`${CARD_SURFACE_BASE} rounded-2xl p-3`}>
              <For each={Array.from({ length: ROWS_PER_CARD })}>
                {() => <div class="bg-foreground/10 mb-1 h-2 rounded-full" />}
              </For>
            </div>
          )}
        </For>
      </div>
      {props.children}
    </>
  );
}
