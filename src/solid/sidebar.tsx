import { cva, type VariantProps } from "cva";
import { PanelLeft } from "lucide-solid";
import {
  type Accessor,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { createIsMobile } from "../lib/use-is-mobile";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

interface SidebarContextProps {
  state: Accessor<"expanded" | "collapsed">;
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
  openMobile: Accessor<boolean>;
  setOpenMobile: (open: boolean) => void;
  isMobile: Accessor<boolean>;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextProps>();

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const SidebarProvider: ParentComponent<
  ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "style",
    "children",
    "defaultOpen",
    "open",
    "onOpenChange",
  ]);

  const isMobileSignal = createIsMobile();
  const isMobile = () => isMobileSignal() ?? false;
  const [openMobile, setOpenMobile] = createSignal(false);
  const [internalOpen, setInternalOpen] = createSignal(local.defaultOpen ?? true);

  const open = () => (local.open !== undefined ? local.open : internalOpen());

  const setOpen = (value: boolean) => {
    if (local.onOpenChange) {
      local.onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  };

  const toggleSidebar = () => {
    if (isMobile()) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen(!open());
    }
  };

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  const state = () => (open() ? "expanded" : "collapsed");

  return (
    <SidebarContext.Provider
      value={{
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }}
    >
      <div
        data-slot="sidebar-wrapper"
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          ...(typeof local.style === "object" ? local.style : {}),
        }}
        class={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          local.class,
        )}
        {...rest}
      >
        {local.children}
      </div>
    </SidebarContext.Provider>
  );
};

const Sidebar: ParentComponent<
  ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "side", "variant", "collapsible"]);
  const side = () => local.side ?? "left";
  const variant = () => local.variant ?? "sidebar";
  const collapsible = () => local.collapsible ?? "offcanvas";
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  return (
    <Show
      when={collapsible() !== "none"}
      fallback={
        <div
          data-slot="sidebar"
          class={cn(
            "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
            local.class,
          )}
          {...rest}
        >
          {local.children}
        </div>
      }
    >
      <Show
        when={!isMobile()}
        fallback={
          <Sheet open={openMobile()} onOpenChange={setOpenMobile} {...rest}>
            <SheetContent
              data-sidebar="sidebar"
              data-slot="sidebar"
              data-mobile="true"
              class="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
              style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}
              side={side()}
            >
              <SheetHeader class="sr-only">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>Displays the mobile sidebar.</SheetDescription>
              </SheetHeader>
              <div class="flex h-full w-full flex-col">{local.children}</div>
            </SheetContent>
          </Sheet>
        }
      >
        <div
          class="group peer hidden text-sidebar-foreground md:block"
          data-state={state()}
          data-collapsible={state() === "collapsed" ? collapsible() : ""}
          data-variant={variant()}
          data-side={side()}
          data-slot="sidebar"
        >
          <div
            data-slot="sidebar-gap"
            class={cn(
              "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant() === "floating" || variant() === "inset"
                ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
            )}
          />
          <div
            data-slot="sidebar-container"
            class={cn(
              "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
              side() === "left"
                ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
                : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              variant() === "floating" || variant() === "inset"
                ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
                : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
              local.class,
            )}
            {...rest}
          >
            <div
              data-sidebar="sidebar"
              data-slot="sidebar-inner"
              class="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
            >
              {local.children}
            </div>
          </div>
        </div>
      </Show>
    </Show>
  );
};

const SidebarTrigger: Component<ComponentProps<typeof Button>> = (props) => {
  const [local, rest] = splitProps(props, ["class", "onClick"]);
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      class={cn("size-7", local.class)}
      onClick={(event: MouseEvent) => {
        (local.onClick as ((e: MouseEvent) => void) | undefined)?.(event);
        toggleSidebar();
      }}
      {...rest}
    >
      <PanelLeft />
      <span class="sr-only">Toggle Sidebar</span>
    </Button>
  );
};

const SidebarRail: Component<ComponentProps<"button">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      class={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarInset: Component<ComponentProps<"main">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <main
      data-slot="sidebar-inset"
      class={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarInput: Component<ComponentProps<typeof Input>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      class={cn("h-8 w-full bg-background shadow-none", local.class)}
      {...rest}
    />
  );
};

const SidebarHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      class={cn("flex flex-col gap-2 p-2", local.class)}
      {...rest}
    />
  );
};

const SidebarFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      class={cn("flex flex-col gap-2 p-2", local.class)}
      {...rest}
    />
  );
};

const SidebarSeparator: Component<ComponentProps<typeof Separator>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      class={cn("mx-2 w-auto bg-sidebar-border", local.class)}
      {...rest}
    />
  );
};

const SidebarContent: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      class={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarGroup: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      class={cn("relative flex w-full min-w-0 flex-col p-2", local.class)}
      {...rest}
    />
  );
};

const SidebarGroupLabel: Component<ComponentProps<"div"> & { as?: Component | string }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "as"]);
  return (
    <Dynamic
      component={local.as ?? "div"}
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      class={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 font-medium text-sidebar-foreground/70 text-xs outline-hidden ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarGroupAction: Component<ComponentProps<"button"> & { as?: Component | string }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "as"]);
  return (
    <Dynamic
      component={local.as ?? "button"}
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      class={cn(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarGroupContent: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      class={cn("w-full text-sm", local.class)}
      {...rest}
    />
  );
};

const SidebarMenu: Component<ComponentProps<"ul">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      class={cn("flex w-full min-w-0 flex-col gap-1", local.class)}
      {...rest}
    />
  );
};

const SidebarMenuItem: Component<ComponentProps<"li">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      class={cn("group/menu-item relative", local.class)}
      {...rest}
    />
  );
};

const sidebarMenuButtonVariants = cva({
  base: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  variants: {
    variant: {
      default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      outline:
        "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
    },
    size: {
      default: "h-8 text-sm",
      sm: "h-7 text-xs",
      lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const SidebarMenuButton: ParentComponent<
  ComponentProps<"button"> & {
    as?: Component | string;
    isActive?: boolean;
    tooltip?: string | JSX.Element;
  } & VariantProps<typeof sidebarMenuButtonVariants>
> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "as",
    "isActive",
    "variant",
    "size",
    "tooltip",
  ] as const);
  const { isMobile, state } = useSidebar();

  const button = (
    <Dynamic
      component={local.as ?? "button"}
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={local.size ?? "default"}
      data-active={local.isActive}
      class={cn(
        sidebarMenuButtonVariants({
          variant: local.variant,
          size: local.size,
        }),
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );

  return (
    <Show when={local.tooltip} fallback={button}>
      <Tooltip openDelay={0}>
        <TooltipTrigger as="div">{button}</TooltipTrigger>
        <Show when={state() === "collapsed" && !isMobile()}>
          <TooltipContent side="right">
            {typeof local.tooltip === "string" ? local.tooltip : local.tooltip}
          </TooltipContent>
        </Show>
      </Tooltip>
    </Show>
  );
};

const SidebarMenuAction: Component<
  ComponentProps<"button"> & {
    as?: Component | string;
    showOnHover?: boolean;
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "as", "showOnHover"]);
  return (
    <Dynamic
      component={local.as ?? "button"}
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      class={cn(
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        local.showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarMenuBadge: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      class={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-medium text-sidebar-foreground text-xs tabular-nums",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarMenuSkeleton: Component<ComponentProps<"div"> & { showIcon?: boolean }> = (props) => {
  const [local, rest] = splitProps(props, ["class", "showIcon"]);
  const width = `${Math.floor(Math.random() * 40) + 50}%`;

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      class={cn("flex h-8 items-center gap-2 rounded-md px-2", local.class)}
      {...rest}
    >
      <Show when={local.showIcon}>
        <Skeleton class="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
      </Show>
      <Skeleton
        class="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={{ "--skeleton-width": width }}
      />
    </div>
  );
};

const SidebarMenuSub: Component<ComponentProps<"ul">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      class={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-sidebar-border border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        local.class,
      )}
      {...rest}
    />
  );
};

const SidebarMenuSubItem: Component<ComponentProps<"li">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      class={cn("group/menu-sub-item relative", local.class)}
      {...rest}
    />
  );
};

const SidebarMenuSubButton: Component<
  ComponentProps<"a"> & {
    as?: Component | string;
    size?: "sm" | "md";
    isActive?: boolean;
  }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "as", "size", "isActive"]);
  const size = () => local.size ?? "md";

  return (
    <Dynamic
      component={local.as ?? "a"}
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size()}
      data-active={local.isActive}
      class={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size() === "sm" && "text-xs",
        size() === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        local.class,
      )}
      {...rest}
    />
  );
};

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
