import { type ParentComponent, omit } from "solid-js";
import { cn } from "../lib/utils.js";

const AspectRatio: ParentComponent<{
  class?: string;
  ratio?: number;
}> = (props) => {
  const rest = omit(props, "class", "ratio", "children");
  return (
    <div
      data-slot="aspect-ratio"
      class={cn("relative w-full", props.class)}
      style={{ "aspect-ratio": String(props.ratio ?? 1) }}
      {...rest}
    >
      {props.children}
    </div>
  );
};

export { AspectRatio };
