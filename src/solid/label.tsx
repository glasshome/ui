import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils.js";

const Label: Component<ComponentProps<"label">> = (props) => {
  const others = omit(props, "class");
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: generic library label; callers associate it via `for` or by nesting the control.
    <label
      data-slot="label"
      class={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        props.class,
      )}
      {...others}
    />
  );
};

export { Label };
