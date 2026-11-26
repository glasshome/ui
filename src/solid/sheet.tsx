import { useUiText } from "./locale.js";
import { usePortalMount } from "./portal-mount.js";
import type { VariantProps } from "cva";
import { children, type Component, type ParentComponent, Show, omit } from "solid-js";
import { type JSX } from "@solidjs/web";
import { ModalFrame, useDialogContext } from "../lib/behavior/modal-root.js";
import { buttonVariants } from "../lib/button-variants.js";
import { Z_CLASS } from "../lib/layers.js";
import { SCRIM_MOTION } from "../lib/motion-classes.js";
import {
  OVERLAY_SURFACE,
  SCRIM_CLASS,
  SCRIM_CONTAIN,
  SCROLL_CONTAIN,
} from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import {
  createModalDismiss,
  createModalParts,
  createModalRootSkin,
  createModalTextParts,
  MODAL_MAX_H,
  type ModalContentProps,
  type ModalDismissProps,
  ModalCover,
} from "./dialog-parts.js";
import { forwardRef } from "../lib/behavior/solid.js";

const Sheet = createModalRootSkin("dialog");

const {
  Trigger: SheetTrigger,
  Title: SheetTitle,
  Description: SheetDescription,
} = createModalTextParts("sheet");

type SheetCloseProps = ModalDismissProps &
  Partial<Pick<VariantProps<typeof buttonVariants>, "variant" | "size">>;

const SheetDismiss = createModalDismiss("sheet-close", useDialogContext);

/** Already the outline button; see DialogClose on why `as={Button}` is wrong. */
const SheetClose: ParentComponent<SheetCloseProps> = (props) => {
  const rest = omit(props, "class", "variant", "size", "children");
  const text = useUiText();
  return (
    <SheetDismiss
      class={cn(
        buttonVariants({ variant: props.variant ?? "outline", size: props.size }),
        props.class,
      )}
      {...rest}
    >
      {props.children ?? text("ui.dialog.close")}
    </SheetDismiss>
  );
};

const SHEET_SCRIM = `${SCRIM_MOTION} pointer-events-auto fixed inset-0 select-none ${Z_CLASS.overlay} ${SCRIM_CLASS} ${SCRIM_CONTAIN}`;

/* A viewport-tall panel would stretch the percentage-sized sheen into a small
 * blob over a flat field; pinned lengths match the ellipse a dialog gets. */
const SHEET_SURFACE = `${OVERLAY_SURFACE} [--glass-sheen:600px_300px]`;

const SHEET_PANEL = `fixed ${Z_CLASS.overlay} flex flex-col overflow-hidden ${SCROLL_CONTAIN} rounded-lg ${SHEET_SURFACE} transition ease-in-out focus:outline-none focus-visible:outline-none data-[closed]:animate-out data-[expanded]:animate-in data-[closed]:duration-300 data-[expanded]:duration-500`;

/* The data-[closed] duration in SHEET_PANEL. */
const SHEET_EXIT_MS = 300;

const SHEET_SIDE = {
  right:
    "data-[closed]:slide-out-to-right data-[expanded]:slide-in-from-right inset-y-3 right-3 w-3/4 sm:max-w-sm",
  left: "data-[closed]:slide-out-to-left data-[expanded]:slide-in-from-left inset-y-3 left-3 w-3/4 sm:max-w-sm",
  top: `data-[closed]:slide-out-to-top data-[expanded]:slide-in-from-top inset-x-3 top-3 ${MODAL_MAX_H}`,
} as const;

type SheetSide = keyof typeof SHEET_SIDE;

type SheetContentProps = ModalContentProps & {
  /** A modal belongs in `ResponsiveDialog`; this family slides from an edge. */
  side?: SheetSide;
  above?: JSX.Element;
  /** Names a panel that has no `SheetTitle`. A registered Title wins. */
  ariaLabel?: string;
};

const SheetAbove: Component<{ above?: JSX.Element }> = (props) => {
  const above = children(() => props.above);
  return (
    <Show when={above()}>
      <div data-slot="sheet-content-above" class="flex w-full shrink-0 items-end justify-center">
        {above()}
      </div>
    </Show>
  );
};

const SheetContent: ParentComponent<SheetContentProps> = (props) => {
  const portalMount = usePortalMount();
  const rest = omit(
    props,
    "class",
    "children",
    "side",
    "above",
    "ariaLabel",
    "style",
    "ref",
    "onOpenAutoFocus",
    "slot",
  );
  const ctx = useDialogContext();
  return (
    <>
      <ModalCover panel={ctx.panel} open={ctx.isOpen} dormant={ctx.dormant} />
      <ModalFrame
        slot="sheet"
        mount={portalMount}
        exitMs={SHEET_EXIT_MS}
        scrimClass={SHEET_SCRIM}
        panelClass={cn(SHEET_PANEL, SHEET_SIDE[props.side ?? "right"], props.class)}
        panelStyle={typeof props.style === "object" ? props.style : undefined}
        ariaLabel={props.ariaLabel}
        ref={(el: HTMLElement) => {
          forwardRef(() => props.ref, el);
        }}
        onOpenAutoFocus={(event: Event) => {
          // The panel takes focus itself, not its first control.
          if (props.onOpenAutoFocus) props.onOpenAutoFocus(event);
          else event.preventDefault();
        }}
        {...rest}
      >
        <SheetAbove above={props.above} />
        {props.children}
      </ModalFrame>
    </>
  );
};

const { Header: SheetHeader, Body: SheetBody, Footer: SheetFooter } = createModalParts("sheet");

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
