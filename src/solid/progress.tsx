import { type Component, type ComponentProps, createUniqueId, splitProps } from "solid-js";
import { merge } from "../lib/behavior/solid.js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { useUiFormat } from "./locale.js";

type ProgressProps = Omit<ComponentProps<"div">, "children"> & {
  value?: number;
  minValue?: number;
  maxValue?: number;
  indeterminate?: boolean;
  getValueLabel?: (params: { value: number; min: number; max: number }) => string;
  tone?: string;
};

const Progress: Component<ProgressProps> = (props) => {
  const fallbackId = `progress-${createUniqueId()}`;
  const [local, rest] = splitProps(props, [
    "class",
    "value",
    "minValue",
    "maxValue",
    "indeterminate",
    "getValueLabel",
    "tone",
  ]);
  const min = () => local.minValue ?? 0;
  const max = () => local.maxValue ?? 100;
  const value = () => Math.min(Math.max(local.value ?? 0, min()), max());
  const share = () => (value() - min()) / (max() - min());
  const format = useUiFormat();
  const valueText = () => {
    if (local.indeterminate) return undefined;
    if (local.getValueLabel) return local.getValueLabel({ value: value(), min: min(), max: max() });
    return format.number(share(), { style: "percent" });
  };
  const markers = {
    get "data-progress"() {
      if (local.indeterminate) return undefined;
      return share() === 1 ? "complete" : "loading";
    },
    get "data-indeterminate"() {
      return local.indeterminate ? "" : undefined;
    },
  };

  return (
    <div
      {...merge(
        {
          id: fallbackId,
          role: "progressbar" as const,
          get "aria-valuenow"() {
            return local.indeterminate ? undefined : value();
          },
          get "aria-valuemin"() {
            return min();
          },
          get "aria-valuemax"() {
            return max();
          },
          get "aria-valuetext"() {
            return valueText();
          },
        },
        markers,
        { "data-slot": "progress" },
        rest,
        {
          get class() {
            return cn(
              FIELD_CHROME,
              "relative h-2 w-full overflow-hidden rounded-full",
              local.class,
            );
          },
        },
      )}
    >
      <div {...markers} class="h-full w-full">
        <div
          {...markers}
          data-slot="progress-indicator"
          class="glass glass-tint transition-glass h-full w-full flex-1"
          style={{
            "--glass-tone": local.tone ?? "var(--primary)",
            transform: `translateX(-${100 - (local.value || 0)}%)`,
          }}
        />
      </div>
    </div>
  );
};

export { Progress };
