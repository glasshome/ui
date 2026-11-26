import { type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";

const ScrollArea: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div
      data-slot="scroll-area"
      class={cn("gh-scroll relative overflow-auto", local.class)}
      {...rest}
    >
      <div
        data-slot="scroll-area-viewport"
        class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {local.children}
      </div>
    </div>
  );
};

export { ScrollArea };
