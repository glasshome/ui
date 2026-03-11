import { NavigationMenu as NavMenuPrimitive } from "@kobalte/core/navigation-menu";
import { cva } from "cva";
import { ChevronDown } from "lucide-solid";
import { type Component, type ComponentProps, type ParentComponent, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const NavigationMenu: ParentComponent<
  ComponentProps<typeof NavMenuPrimitive> & { viewport?: boolean }
> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children", "viewport"] as const);
  const viewport = () => local.viewport ?? true;
  return (
    <NavMenuPrimitive
      data-slot="navigation-menu"
      data-viewport={viewport()}
      class={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        local.class,
      )}
      {...rest}
    >
      {local.children}
      {viewport() && <NavigationMenuViewport />}
    </NavMenuPrimitive>
  );
};

const NavigationMenuList: Component<ComponentProps<"ul">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ul
      data-slot="navigation-menu-list"
      class={cn("group flex flex-1 list-none items-center justify-center gap-1", local.class)}
      {...rest}
    />
  );
};

const NavigationMenuItem: Component<ComponentProps<"li">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return <li data-slot="navigation-menu-item" class={cn("relative", local.class)} {...rest} />;
};

const navigationMenuTriggerStyle = cva({
  base: "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 font-medium text-sm outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[expanded]:bg-accent/50 data-[expanded]:text-accent-foreground data-[expanded]:focus:bg-accent data-[expanded]:hover:bg-accent",
});

const NavigationMenuTrigger: ParentComponent<ComponentProps<typeof NavMenuPrimitive.Trigger>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <NavMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      class={cn(navigationMenuTriggerStyle(), "group", local.class)}
      {...rest}
    >
      {local.children}{" "}
      <ChevronDown
        class="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[expanded]:rotate-180"
        aria-hidden="true"
      />
    </NavMenuPrimitive.Trigger>
  );
};

const NavigationMenuContent: Component<ComponentProps<typeof NavMenuPrimitive.Content>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <NavMenuPrimitive.Content
      data-slot="navigation-menu-content"
      class={cn(
        "data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full p-2 pr-2.5 data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out md:absolute md:w-auto",
        "group-data-[viewport=false]/navigation-menu:data-[closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[expanded]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[expanded]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[closed]:fade-out-0 **:data-[slot=navigation-menu-link]:focus:outline-none **:data-[slot=navigation-menu-link]:focus:ring-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 group-data-[viewport=false]/navigation-menu:data-[closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[expanded]:animate-in",
        local.class,
      )}
      {...rest}
    />
  );
};

const NavigationMenuViewport: Component<ComponentProps<typeof NavMenuPrimitive.Viewport>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div class={cn("absolute top-full left-0 isolate z-50 flex justify-center")}>
      <NavMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        class={cn(
          "data-[closed]:zoom-out-95 data-[expanded]:zoom-in-90 relative mt-1.5 origin-top-center overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[closed]:animate-out data-[expanded]:animate-in",
          local.class,
        )}
        {...rest}
      />
    </div>
  );
};

const NavigationMenuLink: Component<ComponentProps<"a">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <a
      data-slot="navigation-menu-link"
      class={cn(
        "flex flex-col gap-1 rounded-sm p-2 text-sm outline-none transition-all hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        local.class,
      )}
      {...rest}
    />
  );
};

const NavigationMenuIndicator: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div
      data-slot="navigation-menu-indicator"
      class={cn("top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden", local.class)}
      {...rest}
    >
      {local.children ?? (
        <div class="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
      )}
    </div>
  );
};

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
