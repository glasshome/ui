import { type Component, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const TRACK_HEIGHT = 28;
const THUMB_SIZE = 28;
const TRACK_WIDTH = THUMB_SIZE * 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE;

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  class?: string;
  name?: string;
}

const Switch: Component<SwitchProps> = (props) => {
  const [local] = splitProps(props, [
    "class",
    "checked",
    "defaultChecked",
    "onChange",
    "disabled",
    "name",
  ]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={local.checked ?? false}
      data-slot="switch"
      disabled={local.disabled}
      class={cn(
        "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-[var(--radius-xl)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        local.class,
      )}
      style={{
        width: `${TRACK_WIDTH}px`,
        height: `${TRACK_HEIGHT}px`,
        background: local.checked ? "var(--primary)" : "color-mix(in oklch, var(--primary) 30%, transparent)",
      }}
      onClick={() => local.onChange?.(!local.checked)}
    >
      <span
        data-slot="switch-thumb"
        class="pointer-events-none block rounded-[var(--radius-xl)] shadow-lg transition-transform"
        style={{
          width: `${THUMB_SIZE}px`,
          height: `${THUMB_SIZE}px`,
          background: "var(--background)",
          border: "2px solid var(--primary)",
          "box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          transform: `translateX(${local.checked ? THUMB_TRAVEL : 0}px)`,
        }}
      />
      {local.name && <input type="hidden" name={local.name} value={local.checked ? "on" : "off"} />}
    </button>
  );
};

export { Switch };
