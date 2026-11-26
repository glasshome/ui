import { usePortalMount } from "./portal-mount.js";
import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  type JSX,
  type ParentComponent,
  splitProps,
} from "solid-js";
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
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "size",
    "ariaLabel",
    "style",
    "ref",
  ]);
  const ctx = useDialogContext();
  return (
    <>
      <ModalCover panel={ctx.panel} open={ctx.isOpen} dormant={ctx.dormant} />
      <ModalFrame
        slot="alert-dialog"
        mount={usePortalMount()}
        exitMs={MOTION_EXIT_MS.modal}
        scrimClass={MODAL_SCRIM}
        panelClass={cn(
          MODAL_PANEL,
          MODAL_WIDTH[local.size ?? "md"],
          MODAL_ANCHOR[local.size ?? "md"],
          local.class,
        )}
        panelStyle={typeof local.style === "object" ? local.style : undefined}
        ariaLabel={local.ariaLabel}
        ref={(el: HTMLElement) => {
          if (typeof local.ref === "function") local.ref(el as HTMLDivElement);
        }}
        {...rest}
      >
        {local.children}
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
  const [local, rest] = splitProps(props, ["class", "variant", "size"] as const);
  return (
    <ActionDismiss
      class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
      {...rest}
    />
  );
};

/** This family's Close: the outline button that dismisses without acting. */
const AlertDialogCancel: ParentComponent<AlertDialogButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size"] as const);
  return (
    <CancelDismiss
      class={cn(
        buttonVariants({ variant: local.variant ?? "outline", size: local.size }),
        local.class,
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
