import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

const Spinner: Component<Omit<ComponentProps<typeof Icon>, "icon">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <Icon
      icon="lucide:loader-circle"
      // Sizes the inner svg via the host's CSS box, so `class="size-*"` keeps working.
      height="none"
      role="status"
      aria-label="Loading"
      class={cn("size-4 animate-spin", local.class)}
      {...rest}
    />
  );
};

export { Spinner };
