import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType,
} from "embla-carousel";
import { ArrowLeft, ArrowRight } from "lucide-solid";
import {
  type Accessor,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  type ParentComponent,
  splitProps,
  useContext,
} from "solid-js";
import { cn } from "../lib/utils";
import { Button } from "./button";

type CarouselApi = EmblaCarouselType;

interface CarouselContextProps {
  viewportRef: (el: HTMLDivElement) => void;
  api: Accessor<CarouselApi | undefined>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: Accessor<boolean>;
  canScrollNext: Accessor<boolean>;
  orientation: Accessor<"horizontal" | "vertical">;
}

const CarouselContext = createContext<CarouselContextProps>();

function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

const Carousel: ParentComponent<
  ComponentProps<"div"> & {
    opts?: EmblaOptionsType;
    plugins?: EmblaPluginType[];
    orientation?: "horizontal" | "vertical";
    setApi?: (api: CarouselApi) => void;
  }
> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "opts",
    "plugins",
    "orientation",
    "setApi",
  ]);
  const orientation = () => local.orientation ?? "horizontal";
  let viewportEl: HTMLDivElement | undefined;
  const [api, setApi] = createSignal<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = createSignal(false);
  const [canScrollNext, setCanScrollNext] = createSignal(false);

  const viewportRef = (el: HTMLDivElement) => {
    viewportEl = el;
  };

  onMount(() => {
    if (!viewportEl) return;
    const embla = EmblaCarousel(
      viewportEl,
      { ...local.opts, axis: orientation() === "horizontal" ? "x" : "y" },
      local.plugins ?? [],
    );
    setApi(embla);
    local.setApi?.(embla);

    const onSelect = () => {
      setCanScrollPrev(embla.canScrollPrev());
      setCanScrollNext(embla.canScrollNext());
    };
    onSelect();
    embla.on("reInit", onSelect);
    embla.on("select", onSelect);

    onCleanup(() => embla.destroy());
  });

  const scrollPrev = () => api()?.scrollPrev();
  const scrollNext = () => api()?.scrollNext();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    }
  };

  return (
    <CarouselContext.Provider
      value={{
        viewportRef,
        api,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        orientation,
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        class={cn("relative", local.class)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...rest}
      >
        {local.children}
      </div>
    </CarouselContext.Provider>
  );
};

const CarouselContent: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { viewportRef, orientation } = useCarousel();

  return (
    <div ref={viewportRef} class="h-full overflow-hidden" data-slot="carousel-content">
      <div
        class={cn("flex", orientation() === "horizontal" ? "-ml-4" : "-mt-4 flex-col", local.class)}
        {...rest}
      />
    </div>
  );
};

const CarouselItem: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      class={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation() === "horizontal" ? "pl-4" : "pt-4",
        local.class,
      )}
      {...rest}
    />
  );
};

const CarouselPrevious: Component<ComponentProps<typeof Button>> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size"]);
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={local.variant ?? "outline"}
      size={local.size ?? "icon"}
      class={cn(
        "absolute size-8 rounded-full",
        orientation() === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        local.class,
      )}
      disabled={!canScrollPrev()}
      onClick={scrollPrev}
      {...rest}
    >
      <ArrowLeft />
      <span class="sr-only">Previous slide</span>
    </Button>
  );
};

const CarouselNext: Component<ComponentProps<typeof Button>> = (props) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size"]);
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={local.variant ?? "outline"}
      size={local.size ?? "icon"}
      class={cn(
        "absolute size-8 rounded-full",
        orientation() === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        local.class,
      )}
      disabled={!canScrollNext()}
      onClick={scrollNext}
      {...rest}
    >
      <ArrowRight />
      <span class="sr-only">Next slide</span>
    </Button>
  );
};

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
