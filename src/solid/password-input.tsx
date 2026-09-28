import {
  type Component,
  type ComponentProps,
  createSignal,
  type JSX,
  Show,
  splitProps,
} from "solid-js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { Input } from "./input.js";

/* Both affordances sit absolutely over the field, so their icons never reprint
 * layout; each is one w-10 column and the input reserves exactly that. */
const AFFORDANCE_COLUMN = "w-10";
const LEADING_RESERVE = "pl-10";
const TOGGLE_RESERVE = "pr-10";

const PasswordInput: Component<
  Omit<ComponentProps<typeof Input>, "type"> & {
    /** Rendered left-aligned inside the field (e.g. a lock glyph). */
    leading?: JSX.Element;
    showLabel?: string;
    hideLabel?: string;
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "leading", "showLabel", "hideLabel"]);
  const [visible, setVisible] = createSignal(false);

  return (
    <div data-slot="password-input" class="relative">
      <Show when={local.leading}>
        <span
          data-slot="password-input-leading"
          class={cn(
            "text-primary/70 pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center justify-center",
            AFFORDANCE_COLUMN,
          )}
          aria-hidden="true"
        >
          {local.leading}
        </span>
      </Show>
      <Input
        type={visible() ? "text" : "password"}
        // Caller class first, affordance padding last: a caller-supplied px-*
        // must never win the merge and reclaim a button's space.
        class={cn(local.class, local.leading && LEADING_RESERVE, TOGGLE_RESERVE)}
        {...rest}
      />
      <button
        type="button"
        data-slot="password-input-toggle"
        aria-label={
          visible() ? (local.hideLabel ?? "Hide password") : (local.showLabel ?? "Show password")
        }
        onClick={() => setVisible((v) => !v)}
        class={cn(
          "text-muted-foreground/70 hover:text-foreground absolute inset-y-0 right-0 z-10 flex items-center justify-center transition-colors",
          AFFORDANCE_COLUMN,
        )}
      >
        <Icon icon={visible() ? "lucide:eye-off" : "lucide:eye"} width={20} aria-hidden="true" />
      </button>
    </div>
  );
};

export { PasswordInput };
