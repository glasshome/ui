import { Dialog as DialogPrimitive, useDialogContext } from "@kobalte/core/dialog";
import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  type JSX,
  type ParentComponent,
  Show,
  splitProps,
} from "solid-js";
import { buttonVariants } from "../lib/button-variants.js";
import { Z_CLASS } from "../lib/layers.js";
import { SCRIM_MOTION } from "../lib/motion-classes.js";
import { OVERLAY_SURFACE, SCRIM_CLASS } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import {
  createModalDismiss,
  createModalParts,
  MODAL_DESCRIPTION,
  MODAL_MAX_H,
  MODAL_TITLE,
  type ModalDismissProps,
  ModalScrollLock,
} from "./dialog-parts.js";

/* Kobalte's own scroll lock is off here too: ModalScrollLock is the one
 * refcounted page lock every modal family shares. */
const Sheet: ParentComponent<ComponentProps<typeof DialogPrimitive>> = (props) => (
  <DialogPrimitive {...props} preventScroll={false} />
);

const SheetTrigger: Component<ComponentProps<typeof DialogPrimitive.Trigger>> = (props) => (
  <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
);

type SheetCloseProps = ModalDismissProps &
  Partial<Pick<VariantProps<typeof buttonVariants>, "variant" | "size">>;

const SheetDismiss = createModalDismiss("sheet-close");

/** Already the outline button; see DialogClose on why `as={Button}` is wrong. */
const SheetClose: ParentComponent<SheetCloseProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size", "children"]);
  return (
    <SheetDismiss
      class={cn(
        buttonVariants({ variant: local.variant ?? "outline", size: local.size }),
        local.class,
      )}
      {...rest}
    >
      {local.children ?? "Close"}
    </SheetDismiss>
  );
};

const SheetOverlay: Component<ComponentProps<typeof DialogPrimitive.Overlay>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      class={cn(
        `${SCRIM_MOTION} pointer-events-auto fixed inset-0 select-none ${Z_CLASS.overlay} ${SCRIM_CLASS}`,
        local.class,
      )}
      {...rest}
    />
  );
};

/* A viewport-tall panel would stretch the percentage-sized sheen into a small
 * blob over a flat field; pinned lengths match the ellipse a dialog gets. */
const SHEET_SURFACE = `${OVERLAY_SURFACE} [--glass-sheen:600px_300px]`;

const SHEET_PANEL = `fixed ${Z_CLASS.overlay} flex flex-col overflow-hidden rounded-lg ${SHEET_SURFACE} transition ease-in-out focus:outline-none focus-visible:outline-none data-[closed]:animate-out data-[expanded]:animate-in data-[closed]:duration-300 data-[expanded]:duration-500`;

const SHEET_SIDE = {
  right:
    "data-[closed]:slide-out-to-right data-[expanded]:slide-in-from-right inset-y-3 right-3 w-3/4 sm:max-w-sm",
  left: "data-[closed]:slide-out-to-left data-[expanded]:slide-in-from-left inset-y-3 left-3 w-3/4 sm:max-w-sm",
  top: `data-[closed]:slide-out-to-top data-[expanded]:slide-in-from-top inset-x-3 top-3 ${MODAL_MAX_H}`,
  /** @deprecated a modal from the bottom is `BottomSheet` / `ResponsiveDialog`. */
  bottom: `data-[closed]:slide-out-to-bottom data-[expanded]:slide-in-from-bottom inset-x-3 bottom-3 ${MODAL_MAX_H}`,
} as const;

type SheetSide = keyof typeof SHEET_SIDE;

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  /** A modal belongs in `ResponsiveDialog`; this family slides from an edge. */
  side?: SheetSide;
  above?: JSX.Element;
  /** Names a panel that has no `SheetTitle`. A registered Title wins. */
  ariaLabel?: string;
};

const SheetAbove: Component<{ above?: JSX.Element }> = (props) => (
  <Show when={props.above}>
    <div data-slot="sheet-content-above" class="flex w-full shrink-0 items-end justify-center">
      {props.above}
    </div>
  </Show>
);

const SheetContent: ParentComponent<SheetContentProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "side", "above", "ariaLabel"]);
  const context = useDialogContext();

  return (
    <DialogPrimitive.Portal>
      <ModalScrollLock />
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        role="dialog"
        aria-label={context.titleId() ? undefined : local.ariaLabel}
        class={cn(SHEET_PANEL, SHEET_SIDE[local.side ?? "right"], local.class)}
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
        {...rest}
      >
        <SheetAbove above={local.above} />
        {local.children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

const { Header: SheetHeader, Body: SheetBody, Footer: SheetFooter } = createModalParts("sheet");

const SheetTitle: Component<ComponentProps<typeof DialogPrimitive.Title>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Title data-slot="sheet-title" class={cn(MODAL_TITLE, local.class)} {...rest} />
  );
};

const SheetDescription: Component<ComponentProps<typeof DialogPrimitive.Description>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      class={cn(MODAL_DESCRIPTION, local.class)}
      {...rest}
    />
  );
};

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
