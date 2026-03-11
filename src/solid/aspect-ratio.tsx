import { type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const AspectRatio: ParentComponent<{
  class?: string;
  ratio?: number;
}> = (props) => {
  const [local, rest] = splitProps(props, ["class", "ratio", "children"]);
  return (
    <div
      data-slot="aspect-ratio"
      class={cn("relative w-full", local.class)}
      style={{ "aspect-ratio": String(local.ratio ?? 1) }}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export { AspectRatio };
