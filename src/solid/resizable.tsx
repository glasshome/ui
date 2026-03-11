import { GripVertical } from "lucide-solid";
import {
  type Component,
  type ComponentProps,
  createContext,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { cn } from "../lib/utils";

type Direction = "horizontal" | "vertical";

const ResizableContext = createContext<{ direction: () => Direction }>();

const ResizablePanelGroup: ParentComponent<ComponentProps<"div"> & { direction?: Direction }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class", "children", "direction"]);
  const direction = () => local.direction ?? "horizontal";

  return (
    <ResizableContext.Provider value={{ direction }}>
      <div
        data-slot="resizable-panel-group"
        data-panel-group-direction={direction()}
        class={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", local.class)}
        {...rest}
      >
        {local.children}
      </div>
    </ResizableContext.Provider>
  );
};

const ResizablePanel: ParentComponent<
  ComponentProps<"div"> & {
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
  }
> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "defaultSize",
    "minSize",
    "maxSize",
    "style",
  ]);

  return (
    <div
      data-slot="resizable-panel"
      class={cn("flex-1 overflow-auto", local.class)}
      style={{
        ...(typeof local.style === "object" ? local.style : {}),
        "flex-grow": local.defaultSize ? String(local.defaultSize) : undefined,
        "min-width": local.minSize ? `${local.minSize}%` : undefined,
        "max-width": local.maxSize ? `${local.maxSize}%` : undefined,
      }}
      {...rest}
    >
      {local.children}
    </div>
  );
};

const ResizableHandle: Component<ComponentProps<"div"> & { withHandle?: boolean }> = (props) => {
  const [local, rest] = splitProps(props, ["class", "withHandle"]);
  const ctx = useContext(ResizableContext);

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const group = target.parentElement;
    if (!group) return;

    const dir = ctx?.direction() ?? "horizontal";
    const panels = Array.from(group.querySelectorAll<HTMLElement>("[data-slot='resizable-panel']"));
    const children = Array.from(group.children);
    const handleIndex = children.indexOf(target);

    // Find panels adjacent to this handle
    let leftPanelIdx = -1;
    let rightPanelIdx = -1;
    let panelCount = 0;
    for (let i = 0; i < children.length; i++) {
      if ((children[i] as HTMLElement).dataset.slot === "resizable-panel") {
        if (i < handleIndex) leftPanelIdx = panelCount;
        if (i > handleIndex && rightPanelIdx === -1) rightPanelIdx = panelCount;
        panelCount++;
      }
    }

    const leftPanel = panels[leftPanelIdx];
    const rightPanel = panels[rightPanelIdx];
    if (!leftPanel || !rightPanel) return;

    const startPos = dir === "horizontal" ? e.clientX : e.clientY;
    const totalSize =
      dir === "horizontal"
        ? group.getBoundingClientRect().width
        : group.getBoundingClientRect().height;
    const leftStart = dir === "horizontal" ? leftPanel.offsetWidth : leftPanel.offsetHeight;
    const rightStart = dir === "horizontal" ? rightPanel.offsetWidth : rightPanel.offsetHeight;

    const handleMove = (ev: PointerEvent) => {
      const currentPos = dir === "horizontal" ? ev.clientX : ev.clientY;
      const delta = currentPos - startPos;
      const newLeft = Math.max(0, leftStart + delta);
      const newRight = Math.max(0, rightStart - delta);
      leftPanel.style.flexGrow = String((newLeft / totalSize) * 100);
      rightPanel.style.flexGrow = String((newRight / totalSize) * 100);
    };

    const handleUp = () => {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      data-slot="resizable-handle"
      data-panel-group-direction={ctx?.direction()}
      class={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        local.class,
      )}
      onPointerDown={handlePointerDown}
      {...rest}
    >
      <Show when={local.withHandle}>
        <div class="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
          <GripVertical class="size-2.5" />
        </div>
      </Show>
    </div>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
