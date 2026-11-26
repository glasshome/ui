import { createContext, createMemo, createSignal, Show, useContext } from "solid-js";
import { type JSX } from "@solidjs/web";
import { createToggleItem, createToggleSet, type ToggleSet } from "../lib/toggle-set.js";
import { cn } from "../lib/utils.js";
import { Avatar, AvatarFallback } from "./avatar.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";

const FaceContext = createContext<{ locked: () => ReadonlySet<string>; set: ToggleSet }>();

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

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
  const [root, setRoot] = createSignal<HTMLElement>();
  const set = createToggleSet({
    root,
    itemSelector: '[data-slot="face-toggle"][data-key]',
    values: pressed,
    setValues: (next) => {
      const chosen = next.filter((id) => !locked().has(id));
      if (!sameList(chosen, props.value)) props.onChange(chosen);
    },
    multiple: () => true,
    disabledFocusable: true,
  });
  return (
    <FaceContext value={{ locked, set }}>
      <div
        ref={setRoot}
        role="group"
        id={set.id()}
        data-orientation={set.orientation()}
        data-slot="face-toggle-group"
        aria-label={props["aria-label"]}
        class={cn("flex flex-wrap gap-x-3 gap-y-2", props.class)}
        onKeyDown={(event) => set.collection.onKeyDown(event)}
      >
        {props.children}
      </div>
    </FaceContext>
  );
}

export function FaceToggle(props: {
  id: string;
  name: string;
  kind: "person" | "screen";
  class?: string;
}) {
  const group = useContext(FaceContext);
  if (!group) throw new Error("FaceToggle renders inside a FaceToggleGroup");
  const isLocked = () => group.locked().has(props.id);
  const text = useUiText();
  const item = createToggleItem(group.set, {
    value: () => props.id,
    disabled: () => false,
    locked: isLocked,
  });
  return (
    <button
      ref={item.ref}
      type="button"
      {...item.props}
      data-slot="face-toggle"
      aria-disabled={isLocked() ? "true" : undefined}
      class={cn(
        "group/face-toggle focus-visible:ring-ring/50 flex w-16 min-w-0 touch-manipulation flex-col items-center gap-1 rounded-lg py-0.5 text-xs font-medium outline-none focus-visible:ring-[3px] aria-disabled:cursor-default",
        props.class,
      )}
    >
      <span aria-hidden="true" class="relative">
        <Avatar class="group-data-[pressed]/face-toggle:ring-primary group-data-[pressed]/face-toggle:ring-offset-background size-11 opacity-50 transition-opacity duration-(--duration-expand) group-active/face-toggle:scale-[0.97] group-data-[pressed]/face-toggle:opacity-100 group-data-[pressed]/face-toggle:ring-2 group-data-[pressed]/face-toggle:ring-offset-2">
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
        class="text-muted-foreground group-data-[pressed]/face-toggle:text-foreground max-w-full truncate transition-colors duration-(--duration-expand)"
      >
        {props.name}
      </span>
      <Show when={isLocked()}>
        <span class="sr-only"> {text("ui.face-toggle.always-sees")}</span>
      </Show>
    </button>
  );
}
