import type { VariantProps } from "cva";
import {
  type Component,
  type ComponentProps,
  createContext,
  type JSX,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
  type ValidComponent,
} from "solid-js";
import type { buttonVariants } from "../lib/button-variants.js";
import { createControllableSignal } from "../lib/behavior/controllable.js";
import { createIsMobile } from "../lib/use-is-mobile.js";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHandle,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "./bottom-sheet/index.js";
import { Button } from "./button.js";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog.js";
import { createModalHead, createModalParts, type ModalSize } from "./dialog-parts.js";

interface ResponsiveDialogContextValue {
  open: () => boolean;
  setOpen: (open: boolean) => void;
  isMobile: () => boolean;
}

const ResponsiveDialogContext = createContext<ResponsiveDialogContextValue>();

function useResponsiveDialogContext(): ResponsiveDialogContextValue {
  const ctx = useContext(ResponsiveDialogContext);
  if (!ctx) throw new Error("ResponsiveDialog parts must be used within <ResponsiveDialog>");
  return ctx;
}

interface ResponsiveDialogProps {
  children: JSX.Element;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  /** The centred dialog stays mounted and dormant between opens; the bottom sheet ignores it. */
  keep?: boolean;
}

/** Centred kobalte dialog from `sm` up, drag-to-dismiss bottom sheet below it.
 *  Both branches render the same parts, so a call site never branches. */
const ResponsiveDialog: ParentComponent<ResponsiveDialogProps> = (props) => {
  const [open, setOpen] = createControllableSignal<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const mobile = createIsMobile();
  const isMobile = () => mobile() === true;

  return (
    <ResponsiveDialogContext.Provider value={{ open, setOpen, isMobile }}>
      <Show
        when={isMobile()}
        fallback={
          <Dialog open={open()} onOpenChange={setOpen} keep={props.keep}>
            {props.children}
          </Dialog>
        }
      >
        <BottomSheet open={open()} onOpenChange={setOpen}>
          {props.children}
        </BottomSheet>
      </Show>
    </ResponsiveDialogContext.Provider>
  );
};

const ResponsiveDialogTrigger: ParentComponent<
  ComponentProps<"button"> & { as?: ValidComponent }
> = (props) => {
  const ctx = useResponsiveDialogContext();
  return (
    <Show when={ctx.isMobile()} fallback={<DialogTrigger {...props} />}>
      <BottomSheetTrigger {...props} />
    </Show>
  );
};

type ResponsiveDialogContentProps = ComponentProps<"div"> & {
  /** Desktop panel width. The mobile sheet is always full width. */
  size?: ModalSize;
  /** Names a panel that has no `ResponsiveDialogTitle`. */
  ariaLabel?: string;
  /** Desktop only: opens the panel beside this element instead of centred. The mobile sheet ignores it. */
  anchor?: HTMLElement;
};

const ResponsiveDialogContent: ParentComponent<ResponsiveDialogContentProps> = (props) => {
  const ctx = useResponsiveDialogContext();
  const [local, rest] = splitProps(props, ["class", "children", "size", "ariaLabel", "anchor"]);

  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <DialogContent
          class={local.class}
          size={local.size}
          ariaLabel={local.ariaLabel}
          anchor={local.anchor}
          {...rest}
        >
          {local.children}
        </DialogContent>
      }
    >
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <BottomSheetContent class={local.class} ariaLabel={local.ariaLabel} {...rest}>
          <BottomSheetHandle />
          {local.children}
        </BottomSheetContent>
      </BottomSheetPortal>
    </Show>
  );
};

const {
  Header: ResponsiveDialogHeader,
  Body: ResponsiveDialogBody,
  Footer: ResponsiveDialogFooter,
} = createModalParts("responsive-dialog");

const ResponsiveDialogTitle: Component<ComponentProps<"h2">> = (props) => {
  const ctx = useResponsiveDialogContext();
  return (
    <Show when={ctx.isMobile()} fallback={<DialogTitle {...props} />}>
      <BottomSheetTitle {...props} />
    </Show>
  );
};

const ResponsiveDialogDescription: Component<ComponentProps<"p">> = (props) => {
  const ctx = useResponsiveDialogContext();
  return (
    <Show when={ctx.isMobile()} fallback={<DialogDescription {...props} />}>
      <BottomSheetDescription {...props} />
    </Show>
  );
};

const ResponsiveDialogHead = createModalHead(
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
);

/** Defaults to the footer's outline button; an icon-only close passes `ghost`
 *  so the glyph is not boxed. */
const ResponsiveDialogClose: ParentComponent<
  ComponentProps<"button"> & VariantProps<typeof buttonVariants>
> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class", "variant", "size"]);
  const ctx = useResponsiveDialogContext();

  return (
    <Button
      data-slot="responsive-dialog-close"
      variant={local.variant ?? "outline"}
      size={local.size}
      onClick={() => ctx.setOpen(false)}
      class={local.class}
      {...rest}
    >
      {local.children ?? "Close"}
    </Button>
  );
};

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHead,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
