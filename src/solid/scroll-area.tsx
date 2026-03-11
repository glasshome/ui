import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const ScrollArea: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div data-slot="scroll-area" class={cn("relative overflow-auto", local.class)} {...rest}>
      <div
        data-slot="scroll-area-viewport"
        class="size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {local.children}
      </div>
    </div>
  );
};

const ScrollBar: Component<ComponentProps<"div"> & { orientation?: "vertical" | "horizontal" }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "orientation"]);
  const orientation = () => local.orientation ?? "vertical";
  return (
    <div
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation()}
      class={cn(
        "flex touch-none select-none p-px transition-colors",
        orientation() === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation() === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        local.class,
      )}
      {...rest}
    >
      <div data-slot="scroll-area-thumb" class="relative flex-1 rounded-full bg-border" />
    </div>
  );
};

export { ScrollArea, ScrollBar };
