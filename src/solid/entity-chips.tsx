import { createMemo, For } from "solid-js";
import { useEntityData } from "./entity-data.js";
import { FALLBACK_ICON, isUnavailable } from "./entity-rows.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";

export function EntityChips(props: { ids: readonly string[]; onRemove: (id: string) => void }) {
  const data = useEntityData();
  const text = useUiText();
  return (
    <div class="flex flex-wrap gap-1.5">
      <For each={props.ids}>
        {(id) => {
          const view = createMemo(() => data.getEntityView(id));
          const unavailable = () => {
            const v = view();
            return v != null && isUnavailable(v);
          };
          return (
            <span
              class={`border-border bg-secondary/50 text-secondary-foreground inline-flex max-w-full items-stretch overflow-hidden rounded-md border text-xs ${
                unavailable() ? "opacity-60" : ""
              }`}
            >
              <span class="flex min-w-0 items-center gap-1.5 py-1.5 pl-2">
                <Icon
                  icon={view()?.icon ?? FALLBACK_ICON}
                  width={14}
                  height={14}
                  class="text-muted-foreground shrink-0"
                />
                <span class="truncate">{view()?.friendlyName ?? id}</span>
              </span>
              <button
                type="button"
                aria-label={text("ui.entity-selector.remove", {
                  name: view()?.friendlyName ?? id,
                })}
                class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-8 shrink-0 cursor-pointer items-center justify-center transition-colors"
                onClick={() => props.onRemove(id)}
              >
                <Icon icon="lucide:x" width={14} height={14} class="size-3.5" />
              </button>
            </span>
          );
        }}
      </For>
    </div>
  );
}
