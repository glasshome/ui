import { type Component, type ComponentProps, splitProps } from "solid-js";
import { FIELD_CONTROL } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const Textarea: Component<ComponentProps<"textarea">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <textarea
      data-slot="textarea"
      class={cn(FIELD_CONTROL, "field-sizing-content min-h-16 py-2", local.class)}
      {...rest}
    />
  );
};

export { Textarea };
