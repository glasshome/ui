import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";

const Kbd: Component<ComponentProps<"kbd">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <kbd
      data-slot="kbd"
      class={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        local.class,
      )}
      {...rest}
    />
  );
};

const KbdGroup: Component<ComponentProps<"kbd">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <kbd
      data-slot="kbd-group"
      class={cn("inline-flex items-center gap-1", local.class)}
      {...rest}
    />
  );
};

export { Kbd, KbdGroup };
