import { type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const GlassEffect: ParentComponent<{ class?: string }> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <div
      class={cn("border border-border bg-card/80 shadow-lg backdrop-blur-md", local.class)}
      style={{
        "backdrop-filter": "blur(10px) saturate(180%)",
        "-webkit-backdrop-filter": "blur(10px) saturate(180%)",
      }}
      {...rest}
    >
      {local.children}
    </div>
  );
};

const GlassFilter = () => {
  return (
    <svg class="hidden" aria-hidden="true">
      <defs>
        <filter id="glass-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
          <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        </filter>
      </defs>
    </svg>
  );
};

export { GlassEffect, GlassFilter };
