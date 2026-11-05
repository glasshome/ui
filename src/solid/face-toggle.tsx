import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import { createContext, createMemo, type JSX, Show, useContext } from "solid-js";
import { cn } from "../lib/utils.js";
import { Avatar, AvatarFallback } from "./avatar.js";
import { Icon } from "./icon.js";

const LockedContext = createContext<() => ReadonlySet<string>>(() => new Set<string>());

/** People and screens to turn on or off. Faces in `lockedIds` always count: shown on, never reported in `onChange`. */
export function FaceToggleGroup(props: {
  /** The faces turned on by choice; locked ones are on without being listed. */
  value: string[];
  onChange: (value: string[]) => void;
  lockedIds?: readonly string[];
  "aria-label": string;
  class?: string;
  children: JSX.Element;
}) {
  const locked = createMemo(() => new Set(props.lockedIds ?? []));
  const pressed = () => [...new Set([...props.value, ...locked()])];
  return (
    <LockedContext.Provider value={locked}>
      <ToggleGroupPrimitive
        multiple
        data-slot="face-toggle-group"
        aria-label={props["aria-label"]}
        value={pressed()}
        onChange={(next: string[]) => props.onChange(next.filter((id) => !locked().has(id)))}
        class={cn("flex flex-wrap gap-x-3 gap-y-2", props.class)}
      >
        {props.children}
      </ToggleGroupPrimitive>
    </LockedContext.Provider>
  );
}

export function FaceToggle(props: {
  id: string;
  name: string;
  kind: "person" | "screen";
  class?: string;
}) {
  const locked = useContext(LockedContext);
  const isLocked = () => locked().has(props.id);
  return (
    <ToggleGroupPrimitive.Item
      value={props.id}
      data-slot="face-toggle"
      aria-disabled={isLocked() ? "true" : undefined}
      class={cn(
        "group/face-toggle focus-visible:ring-ring/50 flex w-16 min-w-0 touch-manipulation flex-col items-center gap-1 rounded-lg py-0.5 text-xs font-medium outline-none focus-visible:ring-[3px] aria-disabled:cursor-default",
        props.class,
      )}
    >
      <span aria-hidden="true" class="relative">
        <Avatar class="group-data-[pressed]/face-toggle:ring-primary group-data-[pressed]/face-toggle:ring-offset-background size-11 opacity-50 transition-opacity duration-200 group-active/face-toggle:scale-[0.97] group-data-[pressed]/face-toggle:opacity-100 group-data-[pressed]/face-toggle:ring-2 group-data-[pressed]/face-toggle:ring-offset-2">
          <AvatarFallback>
            <Show when={props.kind === "screen"} fallback={props.name.slice(0, 1)}>
              <Icon icon="lucide:monitor-smartphone" width={18} height={18} />
            </Show>
          </AvatarFallback>
        </Avatar>
        <Show
          when={isLocked()}
          fallback={
            <span
              data-slot="face-toggle-check"
              class="bg-primary text-primary-foreground border-background absolute -right-1 -bottom-1 hidden size-4 items-center justify-center rounded-full border-2 group-data-[pressed]/face-toggle:flex"
            >
              <Icon icon="lucide:check" width={10} height={10} />
            </span>
          }
        >
          <span
            data-slot="face-toggle-lock"
            class="bg-muted text-foreground border-background absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2"
          >
            <Icon icon="lucide:lock" width={10} height={10} />
          </span>
        </Show>
      </span>
      <span
        data-slot="face-toggle-name"
        class="text-muted-foreground group-data-[pressed]/face-toggle:text-foreground max-w-full truncate transition-colors duration-200"
      >
        {props.name}
      </span>
      <Show when={isLocked()}>
        <span class="sr-only">always sees it</span>
      </Show>
    </ToggleGroupPrimitive.Item>
  );
}
