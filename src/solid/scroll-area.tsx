import { type ParentComponent, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils.js";

const ScrollArea: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      data-slot="scroll-area"
      class={cn("gh-scroll relative overflow-auto", props.class)}
      {...rest}
    >
      <div
        data-slot="scroll-area-viewport"
        class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {props.children}
      </div>
    </div>
  );
};

export { ScrollArea };
