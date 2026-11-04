import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  createContext,
  type ParentComponent,
  onCleanup,
  onMount,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { BALANCED_ROWS, balanceRows } from "../lib/balance-rows.js";
import { TRACK_SURFACE } from "../lib/card-classes.js";
import { SCROLL_TRACK_FADE, trackScroll } from "../lib/scroll-track.js";
import { cn } from "../lib/utils.js";
import { SelectionHighlight, SelectionScope } from "./selection.js";
import { toggleVariants } from "./toggle.js";

// Single-select paints the pressed segment with the selection highlight; multi-select has none.
type ToggleGroupContextValue = VariantProps<typeof toggleVariants> & { sliding: boolean };

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
  sliding: true,
});

const ToggleGroup: ParentComponent<
  ComponentProps<typeof ToggleGroupPrimitive> &
    VariantProps<typeof toggleVariants> & {
      /** CSS colour for the selected segment's glass. Default `var(--material-accent)`. */
      tone?: string;
      /** One row that scrolls sideways when it outgrows its container, instead of wrapping. */
      scroll?: boolean;
    }
> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "variant",
    "size",
    "tone",
    "scroll",
    "children",
  ] as const);
  // Read `multiple` without splitting it out: Kobalte's root is a single/multiple
  // discriminated union, so pulling `multiple` into a separate prop collapses the
  // union and mistypes `value`. Leave it in `rest` and just peek at it here.
  const sliding = () => !(props as { multiple?: boolean }).multiple;
  let root: HTMLDivElement | undefined;
  let scope: HTMLDivElement | undefined;
  onMount(() => {
    if (!root) return;
    if (local.scroll) onCleanup(trackScroll(root, "[data-pressed]", "data-pressed"));
    else onCleanup(balanceRows(root, scope ?? root, '[data-slot="toggle-group-item"]'));
  });
  return (
    <ToggleGroupPrimitive
      ref={root}
      data-slot="toggle-group"
      data-variant={local.variant}
      data-size={local.size}
      data-scroll={local.scroll ? "" : undefined}
      class={cn(
        `group/toggle-group w-fit max-w-full items-center gap-y-1 rounded-lg data-[wrapped]:w-full ${TRACK_SURFACE} p-1 data-[variant=outline]:shadow-xs`,
        local.scroll
          ? `flex [scrollbar-width:none] flex-nowrap overflow-x-auto ${SCROLL_TRACK_FADE}`
          : sliding()
            ? "flex"
            : BALANCED_ROWS,
        local.class,
      )}
      {...rest}
    >
      <ToggleGroupContext.Provider
        value={{ variant: local.variant, size: local.size, sliding: sliding() }}
      >
        <Show when={sliding()} fallback={local.children}>
          {/* w-full, not w-fit: a shrink-to-fit root still sizes to content, and a
					    `class="w-full"` root can finally let its items share the width. */}
          <SelectionScope
            ref={scope}
            marker="pressed"
            tone={local.tone}
            class={
              local.scroll
                ? "flex w-max flex-nowrap items-center"
                : `w-full items-center gap-y-1 ${BALANCED_ROWS}`
            }
          >
            {local.children}
          </SelectionScope>
        </Show>
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
};

const ToggleGroupItem: Component<
  ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size", "children"] as const);
  const context = useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || local.variant}
      data-size={context.size || local.size}
      class={cn(
        toggleVariants({
          variant: context.variant || local.variant,
          size: context.size || local.size,
        }),
        "relative isolate min-w-max flex-1 shrink-0 rounded-md px-4 shadow-none focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first-of-type:border-l",
        // A hover fill would read as a second, squarer selection, so hover only tints the text.
        context.sliding
          ? "hover:text-(--material-accent)"
          : "data-[pressed]:bg-muted data-[pressed]:text-foreground not-data-[pressed]:hover:text-(--material-accent)",
        local.class,
      )}
      {...rest}
    >
      {(state) => {
        // Each read of a JSX child getter builds it again.
        const content = local.children;
        return (
          <>
            <SelectionHighlight />
            {typeof content === "function" ? content(state) : content}
          </>
        );
      }}
    </ToggleGroupPrimitive.Item>
  );
};

export { ToggleGroup, ToggleGroupItem };
