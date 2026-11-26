import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { INPUT_CLASS } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

type InputProps = ComponentProps<"input"> & { busy?: boolean; readOnly?: boolean };

const Input: Component<InputProps> = (props) => {
  const others = omit(props, "class", "type", "busy", "readOnly", "readonly");
  return (
    <input
      type={props.type}
      data-slot="input"
      readonly={props.busy || props.readOnly || (props.readonly ?? false) !== false}
      aria-busy={props.busy ? "true" : undefined}
      class={cn(INPUT_CLASS, "aria-busy:cursor-progress aria-busy:opacity-50", props.class)}
      {...others}
    />
  );
};

export { Input };
