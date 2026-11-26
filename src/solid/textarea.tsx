import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { FIELD_CONTROL } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

const Textarea: Component<ComponentProps<"textarea">> = (props) => {
  const rest = omit(props, "class");
  return (
    <textarea
      data-slot="textarea"
      class={cn(FIELD_CONTROL, "field-sizing-content min-h-16 py-2", props.class)}
      {...rest}
    />
  );
};

export { Textarea };
