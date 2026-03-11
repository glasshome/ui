import { Loader2 as Loader2Icon } from "lucide-solid";
import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Spinner: Component<ComponentProps<"svg">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      class={cn("size-4 animate-spin", local.class)}
      {...rest}
    />
  );
};

export { Spinner };
