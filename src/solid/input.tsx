import { type Component, type ComponentProps, splitProps } from "solid-js";
import { INPUT_CLASS } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";

type InputProps = ComponentProps<"input"> & { busy?: boolean };

const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "type", "busy", "readOnly"]);
  return (
    <input
      type={local.type}
      data-slot="input"
      readOnly={local.busy || local.readOnly}
      aria-busy={local.busy || undefined}
      class={cn(INPUT_CLASS, "aria-busy:cursor-progress aria-busy:opacity-50", local.class)}
      {...others}
    />
  );
};

export { Input };
