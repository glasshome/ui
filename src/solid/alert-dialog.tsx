import { usePortalMount } from "./portal-mount.js";
import type { VariantProps } from "cva";
import { type Component, type ParentComponent, omit } from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
import { ModalFrame, useDialogContext } from "../lib/behavior/modal-root.js";
import { MOTION_EXIT_MS } from "../lib/motion-classes.js";
import { buttonVariants } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import {
  createModalDismiss,
  createModalHead,
  createModalParts,
  createModalRootSkin,
  createModalTextParts,
  type ModalHeadProps,
  MODAL_ANCHOR,
  MODAL_PANEL,
  MODAL_SCRIM,
  MODAL_WIDTH,
  type ModalContentProps,
  type ModalDismissProps,
  ModalCover,
  type ModalSize,
} from "./dialog-parts.js";
import { forwardRef } from "../lib/behavior/solid.js";

const AlertDialog = createModalRootSkin("alertdialog");

const {
  Trigger: AlertDialogTrigger,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
} = createModalTextParts("alert-dialog");

type AlertDialogContentProps = ModalContentProps & {
  size?: ModalSize;
  /** Names a panel that has no `AlertDialogTitle`. A registered Title wins. */
  ariaLabel?: string;
};

const AlertDialogContent: ParentComponent<AlertDialogContentProps> = (props) => {
  const portalMount = usePortalMount();
  const rest = omit(props, "class", "children", "size", "ariaLabel", "style", "ref", "slot");
  const ctx = useDialogContext();
  return (
    <>
      <ModalCover panel={ctx.panel} open={ctx.isOpen} dormant={ctx.dormant} />
      <ModalFrame
        slot="alert-dialog"
        mount={portalMount}
        exitMs={MOTION_EXIT_MS.modal}
        scrimClass={MODAL_SCRIM}
        panelClass={cn(
          MODAL_PANEL,
          MODAL_WIDTH[props.size ?? "md"],
          MODAL_ANCHOR[props.size ?? "md"],
          props.class,
        )}
        panelStyle={typeof props.style === "object" ? props.style : undefined}
        ariaLabel={props.ariaLabel}
        ref={(el: HTMLElement) => {
          forwardRef(() => props.ref, el);
        }}
        {...rest}
      >
        {props.children}
      </ModalFrame>
    </>
  );
};

const {
  Header: AlertDialogHeader,
  Body: AlertDialogBody,
  Footer: AlertDialogFooter,
} = createModalParts("alert-dialog");

/** An alert dialog is read aloud as a description, and the line carries the consequence. */
type AlertDialogHeadProps = ModalHeadProps & { line: JSX.Element };

const AlertDialogHead = createModalHead<AlertDialogHeadProps>(
  AlertDialogHeader,
  AlertDialogTitle as Component<ComponentProps<"h2">>,
  AlertDialogDescription as Component<ComponentProps<"p">>,
);

type AlertDialogButtonProps = ModalDismissProps &
  Partial<Pick<VariantProps<typeof buttonVariants>, "variant" | "size">>;

const ActionDismiss = createModalDismiss("alert-dialog-action", useDialogContext);
const CancelDismiss = createModalDismiss("alert-dialog-cancel", useDialogContext);

/** Confirming action. Pass `variant` (e.g. "destructive"); layering a second
 *  buttonVariants() call through `class` cannot work, because the variants
 *  carry tone as arbitrary custom properties that tailwind-merge keeps side by
 *  side, leaving the later stylesheet rule to win. */
const AlertDialogAction: ParentComponent<AlertDialogButtonProps> = (props) => {
  const rest = omit(props, "class", "variant", "size");
  return (
    <ActionDismiss
      class={cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)}
      {...rest}
    />
  );
};

/** This family's Close: the outline button that dismisses without acting. */
const AlertDialogCancel: ParentComponent<AlertDialogButtonProps> = (props) => {
  const rest = omit(props, "class", "variant", "size");
  return (
    <CancelDismiss
      class={cn(
        buttonVariants({ variant: props.variant ?? "outline", size: props.size }),
        props.class,
      )}
      {...rest}
    />
  );
};

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHead,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
};
