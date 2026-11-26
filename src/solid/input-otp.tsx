import {
  type Component,
  createContext,
  createSignal,
  type ParentComponent,
  Show,
  omit,
  useContext,
} from "solid-js";
import { type ComponentProps } from "@solidjs/web";
import { focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { CONTROL_H, FOCUS_RING, INPUT_SURFACE } from "../lib/input-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";

interface InputOTPContextValue {
  value: () => string;
  activeIndex: () => number;
  isActive: () => boolean;
}

const InputOTPContext = createContext<InputOTPContextValue | null>(null);

const InputOTP: ParentComponent<
  ComponentProps<"div"> & {
    maxLength: number;
    value?: string;
    onValueChange?: (value: string) => void;
    onComplete?: (value: string) => void;
    containerClass?: string;
    pattern?: string;
  }
> = (props) => {
  const rest = omit(
    props,
    "class",
    "children",
    "maxLength",
    "value",
    "onValueChange",
    "onComplete",
    "containerClass",
    "pattern",
  );
  const [internalValue, setInternalValue] = createSignal(() => props.value ?? "");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [isActive, setIsActive] = createSignal(false);
  let inputRef!: HTMLInputElement;

  const value = () => (props.value !== undefined ? props.value : internalValue());

  const handleInput = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    let newValue = target.value.slice(0, props.maxLength);
    if (props.pattern) {
      const regex = new RegExp(props.pattern);
      newValue = newValue
        .split("")
        .filter((c) => regex.test(c))
        .join("");
    }
    setInternalValue(newValue);
    props.onValueChange?.(newValue);
    setActiveIndex(newValue.length);
    if (newValue.length === props.maxLength) {
      props.onComplete?.(newValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Backspace") {
      const val = value();
      if (val.length > 0) {
        const newValue = val.slice(0, -1);
        setInternalValue(newValue);
        props.onValueChange?.(newValue);
        setActiveIndex(newValue.length);
      }
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    setIsActive(true);
    setActiveIndex(value().length);
  };

  const handleBlur = () => {
    setIsActive(false);
    setActiveIndex(-1);
  };

  return (
    <InputOTPContext value={{ value, activeIndex, isActive }}>
      {/* Container click forwards focus to the visually hidden input, which owns all keyboard interaction. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: see above */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
      <div
        data-slot="input-otp"
        class={cn("flex items-center gap-2 has-[:disabled]:opacity-50", props.containerClass)}
        onClick={() => focusWithoutTracking(inputRef, { preventScroll: false })}
        {...rest}
      >
        <input
          ref={inputRef}
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength={props.maxLength}
          value={value()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          class={cn(
            "pointer-events-none absolute opacity-0",
            "disabled:cursor-not-allowed",
            props.class,
          )}
        />
        {props.children}
      </div>
    </InputOTPContext>
  );
};

const InputOTPGroup: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div
      data-slot="input-otp-group"
      class={cn("flex items-center gap-1.5", props.class)}
      {...rest}
    />
  );
};

const InputOTPSlot: Component<ComponentProps<"div"> & { index: number }> = (props) => {
  const rest = omit(props, "class", "index");
  const context = useContext(InputOTPContext);
  const char = () => context?.value()[props.index] ?? "";
  const isSlotActive = () => context?.isActive() && context?.activeIndex() === props.index;
  const hasFakeCaret = () => isSlotActive() && !char();

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isSlotActive()}
      class={cn(
        // Same constraint as the checkbox box: the theme's smallest radius token
        // fully rounds a cell this size, and a digit cell is not a dot.
        `relative flex ${CONTROL_H.default} w-9 items-center justify-center rounded-xs ${INPUT_SURFACE} transition-glass text-sm ${FOCUS_RING}`,
        "data-[active=true]:ring-ring/50 data-[active=true]:z-10 data-[active=true]:ring-[3px] data-[active=true]:[--glass-edge:var(--ring)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:[--glass-edge:var(--destructive)]",
        props.class,
      )}
      {...rest}
    >
      {char()}
      <Show when={hasFakeCaret()}>
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div class="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      </Show>
    </div>
  );
};

const InputOTPSeparator: Component<ComponentProps<"div">> = (props) => {
  return (
    <div data-slot="input-otp-separator" aria-hidden="true" {...props}>
      <Icon icon="lucide:minus" width={16} height={16} />
    </div>
  );
};

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
