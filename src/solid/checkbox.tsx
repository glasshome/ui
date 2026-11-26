import {
  children,
  createSignal,
  createUniqueId,
  type ParentComponent,
  Show,
  omit,
  createEffect,
  onFlush,
  untrack,
} from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { VISUALLY_HIDDEN } from "../lib/visually-hidden.js";
import { Icon } from "./icon.js";
import { forwardRef } from "../lib/behavior/solid.js";

/* Two box sizes and the glyph that fits each: `sm` is the row-embedded control
 * (picker rows, dense lists), `default` the touch target of a standalone one. */
const CHECKBOX_SIZE = {
  sm: { box: "size-5", glyph: "size-3.5", px: 14 },
  default: { box: "size-7", glyph: "size-5", px: 20 },
} as const;

type CheckboxSize = keyof typeof CHECKBOX_SIZE;

const CheckboxText: ParentComponent = (props) => {
  const label = children(() => props.children);
  return (
    <Show when={label()}>
      <span data-slot="checkbox-text" class="text-sm leading-none">
        {label()}
      </span>
    </Show>
  );
};

type CheckboxProps = Omit<ComponentProps<"div">, "onChange" | "children"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  value?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  size?: CheckboxSize;
  children?: JSX.Element;
};

const Checkbox = (props: CheckboxProps) => {
  const others = omit(
    props,
    "class",
    "children",
    "size",
    "checked",
    "defaultChecked",
    "onChange",
    "indeterminate",
    "value",
    "name",
    "required",
    "disabled",
    "readOnly",
    "id",
    "ref",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
  );
  const fallbackId = `checkbox-${createUniqueId()}`;
  const id = () => props.id || fallbackId;
  const size = () => CHECKBOX_SIZE[props.size ?? "default"];
  const [checked, setChecked] = createControllableSignal({
    value: () => props.checked,
    defaultValue: () => props.defaultChecked ?? false,
    onChange: (next) => props.onChange?.(next),
  });
  const [input, setInput] = createSignal<HTMLInputElement>();
  const [root, setRoot] = createSignal<HTMLDivElement>();
  const [focused, setFocused] = createSignal(false);

  createEffect(
    () => [input(), props.indeterminate ?? false, checked()] as const,
    ([el, indeterminate]) => {
      if (el) el.indeterminate = indeterminate;
    },
  );
  // The browser's own reset restores this, so a reset lands where the state does.
  createEffect(
    () => [input(), props.defaultChecked ?? false] as const,
    ([el, defaultChecked]) => {
      if (el) el.defaultChecked = defaultChecked;
    },
  );
  createEffect(
    () => root()?.closest("form"),
    (form) => {
      if (!form) return;
      const reset = () => setChecked(props.defaultChecked ?? false);
      form.addEventListener("reset", reset);
      return () => form.removeEventListener("reset", reset);
    },
  );

  const state = () => ({
    "data-required": props.required ? "" : undefined,
    "data-disabled": props.disabled ? "" : undefined,
    "data-readonly": props.readOnly ? "" : undefined,
    "data-checked": checked() ? "" : undefined,
    "data-indeterminate": props.indeterminate ? "" : undefined,
  });
  const labelledBy = () =>
    [
      `${id()}-label`,
      props["aria-labelledby"],
      props["aria-labelledby"] || props["aria-label"] ? `${id()}-input` : undefined,
    ]
      .filter(Boolean)
      .join(" ");

  const change = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    if (!props.readOnly) setChecked(target.checked);
    onFlush(() => {
      target.checked = untrack(checked);
    });
  };

  return (
    <div
      ref={(el) => {
        setRoot(el);
        forwardRef(() => props.ref, el);
      }}
      role="group"
      id={id()}
      onPointerDown={(event) => {
        if (focused()) event.preventDefault();
      }}
      data-claim={focused() ? "prevent:pointerdown" : undefined}
      {...state()}
      data-slot="checkbox"
      {...others}
    >
      <label
        for={`${id()}-input`}
        id={`${id()}-label`}
        {...state()}
        data-slot="checkbox-label"
        class="group inline-flex cursor-pointer items-center gap-2.5 select-none data-[disabled]:cursor-not-allowed"
      >
        <input
          ref={setInput}
          type="checkbox"
          id={`${id()}-input`}
          name={props.name ?? id()}
          value={props.value ?? "on"}
          checked={checked()}
          required={props.required}
          disabled={props.disabled}
          readonly={props.readOnly}
          style={VISUALLY_HIDDEN}
          aria-label={props["aria-label"]}
          aria-labelledby={labelledBy()}
          aria-describedby={props["aria-describedby"]}
          aria-required={props.required ? "true" : undefined}
          aria-disabled={props.disabled ? "true" : undefined}
          aria-readonly={props.readOnly ? "true" : undefined}
          {...state()}
          class="peer"
          onChange={change}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <span
          aria-hidden="true"
          data-slot="checkbox-box"
          data-size={props.size ?? "default"}
          class={cn(
            "transition-glass box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xs duration-(--duration-expand) ease-out group-active:scale-90",
            size().box,
            "peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px] peer-focus-visible:[--glass-edge:var(--ring)]",
            checked()
              ? "glass glass-tint text-foreground [--glass-tone:var(--material-accent)]"
              : FIELD_CHROME,
            props.disabled && "cursor-not-allowed opacity-40",
            props.class,
          )}
        >
          {/* Always mounted so the box keeps constant height. */}
          <Icon
            icon="lucide:check"
            width={size().px}
            height={size().px}
            class={cn(
              size().glyph,
              "transition-glass duration-(--duration-expand) ease-out",
              checked() ? "scale-100 opacity-100" : "scale-0 opacity-0",
            )}
          />
        </span>
        <CheckboxText>{props.children}</CheckboxText>
      </label>
    </div>
  );
};

export { Checkbox };
