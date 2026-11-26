import { type Component, createContext, type ParentComponent, Show, omit } from "solid-js";
import { useRequired } from "../lib/context.js";
import { type ComponentProps, type JSX, type ValidComponent } from "@solidjs/web";
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
import { useUiText } from "./locale.js";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog.js";
import { createModalHead, createModalParts, type ModalSize } from "./dialog-parts.js";

interface ResponsiveDialogContextValue {
  open: () => boolean;
  setOpen: (open: boolean) => void;
  isMobile: () => boolean;
}

const ResponsiveDialogContext = createContext<ResponsiveDialogContextValue>();

function useResponsiveDialogContext(): ResponsiveDialogContextValue {
  const ctx = useRequired(ResponsiveDialogContext, "ResponsiveDialog parts", "ResponsiveDialog");
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

/** Centred dialog from `sm` up, drag-to-dismiss bottom sheet below it.
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
    <ResponsiveDialogContext value={{ open, setOpen, isMobile }}>
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
    </ResponsiveDialogContext>
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

type ResponsiveDialogContentProps = Omit<ComponentProps<"div">, "style"> & {
  style?: JSX.CSSProperties | string;
  /** Desktop panel width. The mobile sheet is always full width. */
  size?: ModalSize;
  /** Names a panel that has no `ResponsiveDialogTitle`. */
  ariaLabel?: string;
  /** Desktop only: opens the panel beside this element instead of centred. The mobile sheet ignores it. */
  anchor?: HTMLElement;
};

const ResponsiveDialogContent: ParentComponent<ResponsiveDialogContentProps> = (props) => {
  const ctx = useResponsiveDialogContext();
  const rest = omit(props, "class", "children", "size", "ariaLabel", "anchor");

  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <DialogContent
          class={props.class}
          size={props.size}
          ariaLabel={props.ariaLabel}
          anchor={props.anchor}
          {...rest}
        >
          {props.children}
        </DialogContent>
      }
    >
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <BottomSheetContent class={props.class} ariaLabel={props.ariaLabel} {...rest}>
          <BottomSheetHandle />
          {props.children}
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
const ResponsiveDialogClose: ParentComponent<ComponentProps<typeof Button>> = (props) => {
  const rest = omit(props, "children", "class", "variant", "size");
  const ctx = useResponsiveDialogContext();
  const text = useUiText();

  return (
    <Button
      data-slot="responsive-dialog-close"
      variant={props.variant ?? "outline"}
      size={props.size}
      onClick={() => ctx.setOpen(false)}
      class={props.class}
      {...rest}
    >
      {props.children ?? text("ui.dialog.close")}
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
