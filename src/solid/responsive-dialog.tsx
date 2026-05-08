import Drawer from "@corvu/drawer";
import {
  type Component,
  type ComponentProps,
  createContext,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/utils";
import { Button } from "./button";

const MOBILE_BREAKPOINT = 640;

function createIsMobileDialog(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = createSignal(
    typeof window !== "undefined" && window.innerWidth < breakpoint,
  );

  onMount(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", check);
    onCleanup(() => window.removeEventListener("resize", check));
  });

  return isMobile;
}

interface DialogContextType {
  open: () => boolean;
  setOpen: (open: boolean) => void;
  close: () => void;
  isMobile: () => boolean;
}

const DialogContext = createContext<DialogContextType>();

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within ResponsiveDialog");
  return ctx;
}

interface ResponsiveDialogProps {
  children: JSX.Element;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

const ResponsiveDialog: ParentComponent<ResponsiveDialogProps> = (props) => {
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(props.defaultOpen ?? false);
  const isMobile = createIsMobileDialog();

  const isControlled = () => props.open !== undefined;
  const open = () => (isControlled() ? props.open! : uncontrolledOpen());

  const setOpen = (newOpen: boolean) => {
    if (!isControlled()) setUncontrolledOpen(newOpen);
    props.onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen, close: () => setOpen(false), isMobile }}>
      {props.children}
    </DialogContext.Provider>
  );
};

const ResponsiveDialogTrigger: ParentComponent<ComponentProps<"button">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const { setOpen } = useDialogContext();

  return (
    <button type="button" onClick={() => setOpen(true)} class={local.class} {...rest}>
      {local.children}
    </button>
  );
};

const ResponsiveDialogContent: ParentComponent<ComponentProps<"div">> = (props) => {
  const ctx = useDialogContext();
  return (
    <Show when={ctx.isMobile()} fallback={<DesktopContent {...props} />}>
      <MobileContent {...props} />
    </Show>
  );
};

// Desktop: centered modal with manual overlay + close animation
const DesktopContent: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const ctx = useDialogContext();
  const { open, setOpen } = ctx;
  const [isClosing, setIsClosing] = createSignal(false);
  const [isOpening, setIsOpening] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;
  let previousActiveElement: HTMLElement | null = null;

  const handleClose = () => {
    if (isClosing()) return;
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
      previousActiveElement?.focus();
    }, 300);
  };

  ctx.close = handleClose;

  createEffect(() => {
    if (open()) {
      setIsOpening(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsOpening(false));
      });
    }
  });

  createEffect(() => {
    if (open()) {
      previousActiveElement = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      setTimeout(() => contentRef?.focus(), 0);
    }
    onCleanup(() => {
      document.body.style.overflow = "";
    });
  });

  createEffect(() => {
    if (!open()) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => document.removeEventListener("keydown", onKeyDown));
  });

  createEffect(() => {
    if (!open() || !contentRef) return;
    const onTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !contentRef) return;
      const focusable = contentRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onTabKey);
    onCleanup(() => document.removeEventListener("keydown", onTabKey));
  });

  const visible = () => open() || isClosing();

  return (
    <Show when={visible()}>
      <Portal>
        <div class="fixed inset-0 z-50">
          <div
            class={cn(
              "fixed inset-0 bg-black/80 transition-opacity duration-100 ease-out",
              isClosing() || isOpening() ? "opacity-0" : "opacity-100",
            )}
            onClick={handleClose}
            aria-hidden="true"
          />
          <div
            class="fixed inset-0 flex items-start justify-center p-4 pt-[15vh]"
            onClick={handleClose}
          >
            <div
              ref={contentRef}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              class={cn(
                "relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg outline-none transition-all duration-50 ease-out",
                isClosing() || isOpening() ? "scale-95 opacity-0" : "scale-100 opacity-100",
                local.class,
              )}
              onClick={(e: MouseEvent) => e.stopPropagation()}
              {...rest}
            >
              {local.children}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

// Mobile: corvu Drawer (handles drag-to-dismiss, velocity, scroll coordination)
const MobileContent: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const ctx = useDialogContext();
  ctx.close = () => ctx.setOpen(false);

  return (
    <Drawer open={ctx.open()} onOpenChange={ctx.setOpen} side="bottom">
      <Drawer.Portal>
        <Drawer.Overlay class="fixed inset-0 z-50 bg-black/80 data-[opening]:animate-in data-[opening]:fade-in-0 data-[closing]:animate-out data-[closing]:fade-out-0 data-[transitioning]:duration-300" />
        <Drawer.Content
          class={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-xl border-border border-x border-t bg-background shadow-lg outline-none after:absolute after:inset-x-0 after:top-full after:h-1/2 after:bg-inherit",
            "data-[transitioning]:transition-transform data-[transitioning]:duration-300 data-[transitioning]:ease-[cubic-bezier(0.32,0.72,0,1)]",
            local.class,
          )}
          {...rest}
        >
          <div
            class="flex h-8 w-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            aria-hidden="true"
          >
            <div class="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>
          <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6">
            {local.children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer>
  );
};

const ResponsiveDialogHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="responsive-dialog-header"
      class={cn("flex flex-col space-y-1.5 pb-4 text-left", local.class)}
      {...rest}
    />
  );
};

const ResponsiveDialogTitle: Component<ComponentProps<"h2">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <h2
      data-slot="responsive-dialog-title"
      class={cn("font-semibold text-foreground text-lg leading-none tracking-tight", local.class)}
      {...rest}
    />
  );
};

const ResponsiveDialogDescription: Component<ComponentProps<"p">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <p
      data-slot="responsive-dialog-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...rest}
    />
  );
};

const ResponsiveDialogFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="responsive-dialog-footer"
      class={cn("flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end", local.class)}
      {...rest}
    />
  );
};

const ResponsiveDialogClose: ParentComponent<ComponentProps<"button">> = (props) => {
  const [local, rest] = splitProps(props, ["children", "class"]);
  const { close } = useDialogContext();

  return (
    <Button variant="outline" onClick={() => close()} class={local.class} {...rest}>
      {local.children ?? "Close"}
    </Button>
  );
};

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
