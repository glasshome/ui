import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";

const Spinner: Component<Omit<ComponentProps<typeof Icon>, "icon">> = (props) => {
  const rest = omit(props, "class");
  const text = useUiText();
  return (
    <Icon
      icon="lucide:loader-circle"
      // Sizes the inner svg via the host's CSS box, so `class="size-*"` keeps working.
      height="none"
      role="status"
      aria-label={text("ui.spinner.label")}
      class={cn("size-4 animate-spin", props.class)}
      {...rest}
    />
  );
};

export { Spinner };
