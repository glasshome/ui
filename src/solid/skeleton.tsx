import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";

const Skeleton: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="skeleton"
      class={cn("bg-muted animate-pulse rounded-md", local.class)}
      {...others}
    />
  );
};

export { Skeleton };
