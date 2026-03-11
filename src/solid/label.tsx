import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Label: Component<ComponentProps<"label">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <label
      data-slot="label"
      class={cn(
        "flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        local.class,
      )}
      {...others}
    />
  );
};

export { Label };
