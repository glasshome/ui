import {
  children,
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  type JSX,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { callEventHandler, effect } from "../lib/behavior/solid.js";
import { FIELD_CHROME } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { VISUALLY_HIDDEN } from "../lib/visually-hidden.js";

type RadioGroupContextValue = {
  id: () => string;
  name: () => string;
  isSelectedValue: (value: string) => boolean;
  select: (value: string) => void;
  disabled: () => boolean;
  required: () => boolean;
  readOnly: () => boolean;
  defaultValue: () => string;
};

const RadioGroupContext = createContext<RadioGroupContextValue>();

function useRadioGroup(): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);
  if (!context) throw new Error("RadioGroupItem renders inside a RadioGroup");
  return context;
}

const formState = (group: RadioGroupContextValue) => ({
  "data-required": group.required() ? "" : undefined,
  "data-disabled": group.disabled() ? "" : undefined,
  "data-readonly": group.readOnly() ? "" : undefined,
});

type RadioGroupProps = Omit<ComponentProps<"div">, "onChange"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
};

const RadioGroup = (props: RadioGroupProps) => {
  const [local, rest] = splitProps(props, [
    "class",
    "value",
    "defaultValue",
    "onChange",
    "name",
    "orientation",
    "disabled",
    "required",
    "readOnly",
    "id",
    "ref",
    "aria-labelledby",
    "children",
  ]);
  const fallbackId = `radiogroup-${createUniqueId()}`;
  const id = () => local.id ?? fallbackId;
  const [root, setRoot] = createSignal<HTMLDivElement>();
  const [selected, setSelected] = createControllableSignal({
    value: () => local.value,
    defaultValue: () => local.defaultValue ?? "",
    onChange: (next) => local.onChange?.(next),
  });
  // A controlled group that keeps its value must put the browser's own checked state back.
  const syncInputs = () => {
    for (const input of root()?.querySelectorAll<HTMLInputElement>("[type='radio']") ?? []) {
      input.checked = input.value === selected();
    }
  };
  const context: RadioGroupContextValue = {
    id,
    name: () => local.name ?? id(),
    isSelectedValue: (value) => value === selected(),
    select: (value) => {
      if (!local.readOnly && !local.disabled) setSelected(value);
      syncInputs();
    },
    disabled: () => local.disabled ?? false,
    required: () => local.required ?? false,
    readOnly: () => local.readOnly ?? false,
    defaultValue: () => local.defaultValue ?? "",
  };
  effect(root, (el) => {
    if (!el) return;
    // Space on the checked radio sends no click of its own, so a keyboard pick would never reach onPick.
    const down = (event: KeyboardEvent) => {
      arrowKeyHeld = event.key.startsWith("Arrow");
      const target = event.target;
      if (event.key === " " && target instanceof HTMLInputElement && target.checked) target.click();
    };
    const up = () => {
      arrowKeyHeld = false;
    };
    el.addEventListener("keydown", down, true);
    el.addEventListener("keyup", up, true);
    return () => {
      el.removeEventListener("keydown", down, true);
      el.removeEventListener("keyup", up, true);
    };
  });
  effect(
    () => root()?.closest("form"),
    (form) => {
      if (!form) return;
      const reset = () => setSelected(local.defaultValue ?? "");
      form.addEventListener("reset", reset);
      return () => form.removeEventListener("reset", reset);
    },
  );
  const labelledBy = () =>
    [local["aria-labelledby"], local["aria-labelledby"] && rest["aria-label"] ? id() : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <RadioGroupContext.Provider value={context}>
      <div
        ref={(el) => {
          setRoot(el);
          if (typeof local.ref === "function") local.ref(el);
        }}
        role="radiogroup"
        id={id()}
        aria-labelledby={labelledBy()}
        aria-orientation={local.orientation ?? "vertical"}
        aria-required={local.required || undefined}
        aria-disabled={local.disabled || undefined}
        aria-readonly={local.readOnly || undefined}
        {...formState(context)}
        data-slot="radio-group"
        class={cn("flex flex-col gap-3", local.class)}
        {...rest}
      >
        {local.children}
      </div>
    </RadioGroupContext.Provider>
  );
};

const RadioGroupItemContent: ParentComponent = (props) => {
  const content = children(() => props.children);
  return (
    <Show when={content()}>
      <div data-slot="radio-group-item-content" class="min-w-0 flex-1 text-sm">
        {content()}
      </div>
    </Show>
  );
};

type RadioGroupItemProps = Omit<ComponentProps<"div">, "onClick"> & {
  value: string;
  disabled?: boolean;
  showControl?: boolean;
  /** Presses do nothing; unlike `disabled` it keeps focus. */
  busy?: boolean;
  onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>;
};

const RadioGroupItem = (props: RadioGroupItemProps) => {
  const group = useRadioGroup();
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "showControl",
    "busy",
    "value",
    "disabled",
    "id",
    "ref",
    "onClick",
  ]);
  const fallbackId = `${group.id()}-item-${createUniqueId()}`;
  const id = () => local.id ?? fallbackId;
  const disabled = () => group.disabled() || (local.disabled ?? false);
  const checked = () => group.isSelectedValue(local.value);
  const [item, setItem] = createSignal<HTMLDivElement>();
  const [input, setInput] = createSignal<HTMLInputElement>();
  const state = () => ({
    ...formState(group),
    "data-disabled": disabled() ? "" : undefined,
    "data-checked": checked() ? "" : undefined,
  });

  effect(
    () => [input(), local.value === group.defaultValue()] as const,
    ([el, isDefault]) => {
      if (el) el.defaultChecked = isDefault;
    },
  );
  const [focused, setFocused] = createSignal(false);
  // Bound on the elements, since Solid's delegated handlers never reach inside a closed shadow root.
  effect(item, (node) => {
    if (!node) return;
    const pointerdown = (event: PointerEvent) => {
      if (focused()) event.preventDefault();
    };
    const click = (event: MouseEvent) =>
      callEventHandler(
        event as MouseEvent & { currentTarget: HTMLDivElement; target: Element },
        local.onClick,
      );
    node.addEventListener("pointerdown", pointerdown);
    node.addEventListener("click", click);
    return () => {
      node.removeEventListener("pointerdown", pointerdown);
      node.removeEventListener("click", click);
    };
  });

  const change = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    if (target.checked) group.select(local.value);
    target.checked = checked();
  };

  return (
    <div
      ref={(el) => {
        setItem(el);
        if (typeof local.ref === "function") local.ref(el);
      }}
      role="group"
      id={id()}
      data-claim={focused() ? "prevent:pointerdown" : undefined}
      {...state()}
      data-slot="radio-group-item"
      class={cn("flex", local.class)}
      {...rest}
    >
      <input
        ref={setInput}
        type="radio"
        id={`${id()}-input`}
        name={group.name()}
        value={local.value}
        checked={checked()}
        required={group.required()}
        disabled={disabled()}
        readOnly={group.readOnly()}
        style={VISUALLY_HIDDEN}
        aria-labelledby={`${id()}-label`}
        {...state()}
        class="peer"
        aria-busy={local.busy || undefined}
        aria-disabled={local.busy || undefined}
        data-claim={local.busy ? "prevent:click" : undefined}
        on:click={(event) => {
          if (local.busy) event.preventDefault();
        }}
        on:focus={() => setFocused(true)}
        on:blur={() => setFocused(false)}
        on:change={change}
      />
      <label
        for={`${id()}-input`}
        id={`${id()}-label`}
        {...state()}
        data-slot="radio-group-item-label"
        class="flex flex-1 cursor-pointer items-center gap-2.5 select-none data-[disabled]:cursor-not-allowed"
      >
        <Show when={local.showControl ?? true}>
          <div
            id={`${id()}-control`}
            {...state()}
            data-slot="radio-group-item-control"
            class={cn(
              "transition-glass relative flex aspect-square size-7 shrink-0 items-center justify-center overflow-hidden rounded-full duration-(--duration-expand) ease-out active:scale-90",
              FIELD_CHROME,
              "peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px] peer-focus-visible:[--glass-edge:var(--ring)]",
              "data-[invalid]:ring-destructive/20 data-[disabled]:opacity-40 data-[invalid]:[--glass-edge:var(--destructive)]",
            )}
          >
            {/* Gradient backgrounds can't transition; the glass rides an inner element
						    that animates in. */}
            <Show when={checked()}>
              <div
                id={`${id()}-indicator`}
                {...state()}
                data-slot="radio-group-item-indicator"
                class="glass glass-tint zoom-in-50 fade-in animate-in absolute inset-0 grid place-items-center rounded-full duration-(--duration-expand) [--glass-tone:var(--primary)] [--glass-wash:90%]"
              >
                <span
                  data-slot="radio-group-item-dot"
                  class="color-calc:[background:oklch(from_var(--primary)_calc((0.42_-_l)*100)_0_0)] dark:color-calc:[background:oklch(from_var(--primary)_calc((0.6_-_l)*100)_0_0)] bg-primary-foreground size-[36%] rounded-full"
                />
              </div>
            </Show>
          </div>
        </Show>
        <RadioGroupItemContent>{local.children}</RadioGroupItemContent>
      </label>
    </div>
  );
};

let arrowKeyHeld = false;

// A press on the label reaches the item twice: once itself, once as the input click it forwards.
// An arrow key checks the next radio with a click of its own, which picks nothing.
function isItemActivation(event: MouseEvent): boolean {
  return event.target instanceof HTMLInputElement && !(event.detail === 0 && arrowKeyHeld);
}

export { isItemActivation, RadioGroup, RadioGroupItem, useRadioGroup };
