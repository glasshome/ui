import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils.js";

const Skeleton: Component<ComponentProps<"div">> = (props) => {
  const others = omit(props, "class");
  return (
    <div
      data-slot="skeleton"
      class={cn("bg-muted animate-pulse rounded-md", props.class)}
      {...others}
    />
  );
};

export { Skeleton };
