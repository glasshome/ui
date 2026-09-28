import { DropdownMenu as MenuPrimitive } from "@kobalte/core/dropdown-menu";
import {
  type Component,
  type ComponentProps,
  createSignal,
  onCleanup,
  onMount,
  type ParentComponent,
  splitProps,
} from "solid-js";
import { glassToneText } from "../lib/glass-tone.js";
import { MENU_ITEM, MENU_ITEM_BASE, MENU_LABEL, MENU_SEPARATOR } from "../lib/menu-classes.js";
import { STAGGER } from "../lib/motion-classes.js";
import { FLOATING_PANEL } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { SlidingIndicator } from "./sliding-indicator.js";

/*
 * DropdownMenu and ContextMenu are two Root flavors over one Kobalte Menu
 * engine: Item, CheckboxItem, RadioItem, SubTrigger, SubContent, GroupLabel,
 * Separator and ItemIndicator are the identical components either family
 * re-exports (see @kobalte/core's dropdown-menu and context-menu index,
 * which both alias the same ../menu implementation), so they are styled once
 * here under whichever Root happens to be an ancestor.
 */

/* The panel without its motion: DropdownMenu morphs out of its trigger,
 * ContextMenu unfolds from the pointer. */
export const MENU_CONTENT_CLASS = cn(FLOATING_PANEL, "min-w-[8rem] overflow-hidden p-1");

/** Every menu content and sub content wraps its rows in one sliding highlight,
 *  keyed off Kobalte's roving-focus attribute. The highlighted row's own
 *  --glass-tone (set inline by MenuItemPart) is mirrored onto the indicator,
 *  since --glass-tone does not inherit and the indicator is a sibling, not
 *  an ancestor, of the rows it highlights. */
export const MenuContentIndicator: ParentComponent = (props) => {
  let containerRef: HTMLDivElement | undefined;
  const [tone, setTone] = createSignal<string | undefined>(undefined);

  const syncTone = () => {
    const highlighted = containerRef?.querySelector<HTMLElement>("[data-highlighted]");
    setTone(highlighted?.style.getPropertyValue("--glass-tone") || undefined);
  };

  onMount(() => {
    if (!containerRef) return;
    const mo = new MutationObserver(syncTone);
    mo.observe(containerRef, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-highlighted"],
    });
    containerRef.addEventListener("focusin", syncTone);
    syncTone();
    onCleanup(() => {
      mo.disconnect();
      containerRef?.removeEventListener("focusin", syncTone);
    });
  });

  return (
    <SlidingIndicator
      ref={containerRef}
      // The one element between role="menu" and its role="menuitem" rows:
      // an unnamed div there breaks the menu's ownership in the a11y tree.
      role="none"
      class={STAGGER}
      activeSelector="[data-highlighted]"
      orientation="vertical"
      indicatorClass="rounded-sm"
      indicatorTone={tone()}
    >
      {props.children}
    </SlidingIndicator>
  );
};

type ToneProps = {
  tone?: string;
  /** @deprecated pass `tone="var(--destructive)"` instead */
  variant?: "default" | "destructive";
};

function resolveTone(local: ToneProps): string | undefined {
  return local.tone ?? (local.variant === "destructive" ? "var(--destructive)" : undefined);
}

function toneStyle(tone: string | undefined) {
  return tone ? { "--glass-tone": tone, color: glassToneText(tone) } : undefined;
}

type MenuItemProps = ComponentProps<typeof MenuPrimitive.Item> &
  ToneProps & { inset?: boolean; slotName: string; style?: Record<string, string> };

/* True order among the menu's rows, labels and separators, for the stagger:
 * nth-child restarts inside a group, the DOM order does not. Refs fire before
 * insertion, hence the microtask. */
function writeRowIndex(el: HTMLElement) {
  queueMicrotask(() => {
    const menu = el.closest('[role="menu"], [role="listbox"]');
    if (!menu) return;
    const i = Array.from(menu.querySelectorAll("[data-stagger-row]")).indexOf(el);
    if (i >= 0) el.style.setProperty("--i", String(i));
  });
}

export const MenuItemPart: Component<MenuItemProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "inset",
    "tone",
    "variant",
    "slotName",
    "style",
  ]);
  const tone = () => resolveTone(local);
  return (
    <MenuPrimitive.Item
      ref={writeRowIndex}
      data-stagger-row=""
      data-slot={local.slotName}
      data-inset={local.inset}
      data-tone={tone() ? "" : undefined}
      class={cn(MENU_ITEM, local.inset && "pl-8", local.class)}
      style={{ ...toneStyle(tone()), ...local.style }}
      {...rest}
    />
  );
};

type MenuLabelProps = ComponentProps<typeof MenuPrimitive.GroupLabel> & {
  inset?: boolean;
  slotName: string;
};

export const MenuLabelPart: Component<MenuLabelProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "inset", "slotName"]);
  return (
    <MenuPrimitive.GroupLabel
      ref={writeRowIndex}
      data-stagger-row=""
      data-slot={local.slotName}
      data-inset={local.inset}
      class={cn(MENU_LABEL, local.inset && "pl-8", local.class)}
      {...rest}
    />
  );
};

type MenuSeparatorProps = ComponentProps<typeof MenuPrimitive.Separator> & { slotName: string };

export const MenuSeparatorPart: Component<MenuSeparatorProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "slotName"]);
  return (
    <MenuPrimitive.Separator
      ref={writeRowIndex}
      data-stagger-row=""
      data-slot={local.slotName}
      class={cn(MENU_SEPARATOR, local.class)}
      {...rest}
    />
  );
};

type MenuSubTriggerProps = ComponentProps<typeof MenuPrimitive.SubTrigger> & {
  inset?: boolean;
  slotName: string;
};

export const MenuSubTriggerPart: ParentComponent<MenuSubTriggerProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "inset", "slotName"]);
  return (
    <MenuPrimitive.SubTrigger
      ref={writeRowIndex}
      data-stagger-row=""
      data-slot={local.slotName}
      data-inset={local.inset}
      class={cn(MENU_ITEM, local.inset && "pl-8", local.class)}
      {...rest}
    >
      {local.children}
      <Icon icon="lucide:chevron-right" width={16} height={16} class="ml-auto" />
    </MenuPrimitive.SubTrigger>
  );
};

type MenuSubContentProps = ComponentProps<typeof MenuPrimitive.SubContent> & { slotName: string };

export const MenuSubContentPart: ParentComponent<MenuSubContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "slotName"]);
  return (
    <MenuPrimitive.SubContent
      data-slot={local.slotName}
      class={cn(MENU_CONTENT_CLASS, local.class)}
      {...rest}
    >
      <MenuContentIndicator>{local.children}</MenuContentIndicator>
    </MenuPrimitive.SubContent>
  );
};

type MenuCheckboxItemProps = ComponentProps<typeof MenuPrimitive.CheckboxItem> & {
  slotName: string;
};

export const MenuCheckboxItemPart: ParentComponent<MenuCheckboxItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "slotName"]);
  return (
    <MenuPrimitive.CheckboxItem
      ref={writeRowIndex}
      data-stagger-row=""
      data-slot={local.slotName}
      class={cn(MENU_ITEM_BASE, "py-1.5 pr-2 pl-8", local.class)}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Icon icon="lucide:check" width={16} height={16} class="size-4" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </MenuPrimitive.CheckboxItem>
  );
};

type MenuRadioItemProps = ComponentProps<typeof MenuPrimitive.RadioItem> & { slotName: string };

export const MenuRadioItemPart: ParentComponent<MenuRadioItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "slotName"]);
  return (
    <MenuPrimitive.RadioItem
      ref={writeRowIndex}
      data-stagger-row=""
      data-slot={local.slotName}
      class={cn(MENU_ITEM_BASE, "py-1.5 pr-2 pl-8", local.class)}
      {...rest}
    >
      <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          {/* mdi:circle is filled; lucide:circle is stroke-only and invisible at 8px. */}
          <Icon icon="mdi:circle" width={8} height={8} class="size-2" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </MenuPrimitive.RadioItem>
  );
};
