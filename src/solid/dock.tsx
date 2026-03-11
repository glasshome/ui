import {
  type Component,
  type ComponentProps,
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils";

interface DockItem {
  id: string;
  icon: Component<{ class?: string }> | JSX.Element;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface DockProps extends ComponentProps<"div"> {
  items: DockItem[];
  dockMode?: "floating" | "docked";
}

interface DockIconButtonProps extends ComponentProps<"button"> {
  icon: Component<{ class?: string }> | JSX.Element;
  label: string;
  isActive?: boolean;
}

const DockIconButton: Component<DockIconButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ["icon", "label", "class", "isActive"]);
  const isElement = () => typeof local.icon !== "function";

  return (
    <button
      type="button"
      class={cn(
        "group relative rounded-lg p-2 transition-all duration-300 sm:p-3",
        "hover:-translate-y-0.5 hover:scale-110 hover:bg-accent/20 active:scale-95 active:bg-accent/30",
        "touch-manipulation",
        "min-h-[44px] min-w-[44px]",
        local.class,
      )}
      style={{
        "transform-origin": "center center",
        "transition-timing-function": "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
      aria-label={local.label}
      {...rest}
    >
      <div
        class={cn(
          "flex items-center justify-center text-foreground transition-colors duration-300",
          local.isActive ? "text-primary" : "hover:text-primary/80",
        )}
      >
        {isElement() ? (
          (local.icon as JSX.Element)
        ) : (
          <Dynamic
            component={local.icon as Component<{ class?: string }>}
            class="h-5 w-5 sm:h-6 sm:w-6"
          />
        )}
      </div>
      <span
        class={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2",
          "rounded px-2 py-1 text-xs",
          "border border-border bg-popover/90 text-popover-foreground backdrop-blur-sm",
          "opacity-0 group-hover:opacity-100",
          "pointer-events-none whitespace-nowrap transition-opacity",
          "z-10",
          "hidden sm:block",
        )}
      >
        {local.label}
      </span>
    </button>
  );
};

const Dock: Component<DockProps> = (props) => {
  const [local, rest] = splitProps(props, ["items", "class", "dockMode"]);
  const dockMode = () => local.dockMode ?? "floating";
  let containerRef!: HTMLDivElement;
  const [needsScroll, setNeedsScroll] = createSignal(false);

  const checkOverflow = () => {
    if (containerRef) {
      const naturalWidth = containerRef.scrollWidth;
      const availableWidth = containerRef.parentElement?.clientWidth || window.innerWidth;
      setNeedsScroll(naturalWidth > availableWidth);
    }
  };

  onMount(() => {
    const timeoutId = setTimeout(checkOverflow, 100);
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkOverflow, 50);
    });
    resizeObserver.observe(containerRef);
    onCleanup(() => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    });
  });

  createEffect(() => {
    local.items.length;
    setTimeout(checkOverflow, 150);
  });

  return (
    <div
      data-slot="dock"
      class={cn(
        "flex items-center justify-center",
        dockMode() === "floating" ? "p-1 sm:p-2" : "",
        local.class,
      )}
      {...rest}
    >
      <div class="relative flex items-center justify-center">
        <div
          ref={containerRef}
          class={cn(
            "flex items-center gap-0.5 p-1.5 sm:gap-1 sm:p-2",
            "border border-border bg-card/80 shadow-lg backdrop-blur-md",
            "transition-shadow duration-300 hover:shadow-xl",
            dockMode() === "floating"
              ? "rounded-xl sm:rounded-2xl"
              : "rounded-t-xl border-x border-t border-b-0 sm:rounded-t-2xl",
            needsScroll() ? "scrollbar-hide overflow-x-auto" : "overflow-visible",
            !needsScroll() && "justify-center",
          )}
          style={{
            "backdrop-filter": "blur(10px) saturate(180%)",
            "-webkit-backdrop-filter": "blur(10px) saturate(180%)",
            "min-width": needsScroll() ? "auto" : "fit-content",
          }}
        >
          <div
            class={cn(
              "flex items-center gap-0.5 sm:gap-1",
              dockMode() === "floating" && "animate-float",
            )}
          >
            <For each={local.items}>
              {(item) => (
                <DockIconButton
                  icon={item.icon}
                  label={item.label}
                  onClick={item.onClick}
                  isActive={item.isActive}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Dock };
export type { DockProps, DockItem, DockIconButtonProps };
