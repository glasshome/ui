import { type Component, omit } from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { CONTROL_ON, FIELD_CHROME, FOCUS_RING } from "../lib/input-classes.js";
import { THUMB_CLASS } from "../lib/thumb-classes.js";
import { cn } from "../lib/utils.js";

type SwitchProps = Omit<ComponentProps<"button">, "onChange" | "children"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  busy?: boolean;
};

const Switch: Component<SwitchProps> = (props) => {
  const rest = omit(
    props,
    "class",
    "checked",
    "defaultChecked",
    "onChange",
    "disabled",
    "name",
    "busy",
  );
  const [checked, setChecked] = createControllableSignal<boolean>({
    value: () => props.checked,
    defaultValue: () => props.defaultChecked ?? false,
    onChange: (next) => props.onChange?.(next),
  });

  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={checked() ? "true" : "false"}
      data-slot="switch"
      data-checked={checked() ? "" : undefined}
      disabled={props.disabled}
      aria-busy={props.busy ? "true" : undefined}
      aria-disabled={props.busy ? "true" : undefined}
      class={cn(
        // Unchecked wears the recessed input surface, the same dug-out glass as
        // the slider rail; checked matches the slider fill. A `border-input`
        // utility here would beat `:where(.glass)` and flatten the rim.
        `group/switch peer transition-glass relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-xl duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress aria-busy:opacity-50 ${FOCUS_RING}`,
        checked() ? CONTROL_ON : FIELD_CHROME,
        props.class,
      )}
      onClick={() => {
        if (props.busy) return;
        setChecked(!checked());
      }}
    >
      <span
        data-slot="switch-thumb"
        class={cn(
          THUMB_CLASS,
          "pointer-events-none transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-data-[checked]/switch:translate-x-full",
        )}
        // Off must read quieter than on: the knob dims with the track.
        style={{
          background: checked() ? "var(--material-control-knob)" : "var(--thumb-face-off)",
        }}
      />
      {props.name && <input type="hidden" name={props.name} value={checked() ? "on" : "off"} />}
    </button>
  );
};

export { Switch };
