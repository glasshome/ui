import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType,
} from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import {
  type Accessor,
  type Component,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type ParentComponent,
  omit,
} from "solid-js";
import { useRequired } from "../lib/context.js";
import { type ComponentProps } from "@solidjs/web";
import {
  CAROUSEL_DOTS,
  CAROUSEL_VIEWPORT,
  type CarouselTransition,
  carouselDot,
  carouselItem,
  carouselTrack,
} from "../lib/carousel-classes.js";
import { claimKeys } from "../lib/behavior/claims.js";
import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";

const CAROUSEL_CLAIM = claimKeys(["ArrowLeft", "ArrowRight"]);

type CarouselApi = EmblaCarouselType;

interface CarouselContextProps {
  viewportRef: (el: HTMLDivElement) => void;
  api: Accessor<CarouselApi | undefined>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: Accessor<boolean>;
  canScrollNext: Accessor<boolean>;
  orientation: Accessor<"horizontal" | "vertical">;
  transition: Accessor<CarouselTransition>;
  selected: Accessor<number>;
  slideCount: Accessor<number>;
  scrollTo: (index: number) => void;
}

const CarouselContext = createContext<CarouselContextProps>();

const sameFields = <T extends object>(a: T, b: T) =>
  (Object.keys(a) as (keyof T)[]).every((key) => a[key] === b[key]);

function useCarousel() {
  const context = useRequired(CarouselContext, "Carousel parts", "Carousel");
  return context;
}

const Carousel: ParentComponent<
  ComponentProps<"div"> & {
    opts?: EmblaOptionsType;
    plugins?: EmblaPluginType[];
    orientation?: "horizontal" | "vertical";
    transition?: CarouselTransition;
    /** Advance every N ms. Ignored under prefers-reduced-motion. */
    autoplay?: number;
    setApi?: (api: CarouselApi) => void;
  }
> = (props) => {
  const rest = omit(
    props,
    "class",
    "children",
    "opts",
    "plugins",
    "orientation",
    "transition",
    "autoplay",
    "setApi",
  );
  const orientation = () => props.orientation ?? "horizontal";
  const transition = () => props.transition ?? "slide";
  const text = useUiText();
  const [viewportEl, setViewportEl] = createSignal<HTMLDivElement>();
  const [api, setApi] = createSignal<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = createSignal(false);
  const [canScrollNext, setCanScrollNext] = createSignal(false);
  const [selected, setSelected] = createSignal(0);
  const [slideCount, setSlideCount] = createSignal(0);

  const viewportRef = (el: HTMLDivElement) => {
    setViewportEl(el);
  };

  // Tracks autoplay: a widget whose config changes the interval (or supplies one
  // after the first mount) gets a re-initialised engine, old timers destroyed.
  const engine = createMemo(
    () => ({
      viewport: viewportEl(),
      delay: props.autoplay,
      extra: props.plugins,
      fade: transition() !== "slide",
      axis: orientation() === "horizontal" ? ("x" as const) : ("y" as const),
      opts: props.opts,
      onApi: props.setApi,
    }),
    { equals: sameFields },
  );
  createEffect(engine, ({ viewport, delay, extra, fade, axis, opts, onApi }) => {
    if (!viewport) return;
    // Reduced motion keeps the carousel usable but stops it moving on its own.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plugins = [...(extra ?? [])];
    if (fade) plugins.push(Fade());
    if (delay && !reduced) {
      // Manual nav should not kill autoplay for good; hover/focus pauses it.
      plugins.push(
        Autoplay({
          delay,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
          stopOnFocusIn: true,
        }),
      );
    }
    const embla = EmblaCarousel(viewport, { axis, ...opts }, plugins);
    setApi(embla);
    onApi?.(embla);

    let previous = -1;
    const onSelect = () => {
      setCanScrollPrev(embla.canScrollPrev());
      setCanScrollNext(embla.canScrollNext());
      setSelected(embla.selectedScrollSnap());
      setSlideCount(embla.scrollSnapList().length);
      // Slides carry their own selected state so CSS (wipe) can key off it;
      // embla itself only drives transform and opacity. data-prev keeps the
      // outgoing slide one layer down until the sweep lands.
      const active = embla.selectedScrollSnap();
      embla.slideNodes().forEach((node, i) => {
        node.toggleAttribute("data-selected", i === active);
        node.toggleAttribute("data-prev", i === previous && i !== active);
      });
      previous = active;
    };
    onSelect();
    embla.on("reInit", onSelect);
    embla.on("select", onSelect);

    return () => embla.destroy();
  });

  const scrollPrev = () => api()?.scrollPrev();
  const scrollNext = () => api()?.scrollNext();
  const scrollTo = (index: number) => api()?.scrollTo(index);

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
    <CarouselContext
      value={{
        viewportRef,
        api,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        orientation,
        transition,
        selected,
        slideCount,
        scrollTo,
      }}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: role=region + aria-roledescription is the canonical ARIA carousel pattern; section would change document outline semantics. */}
      <div
        onKeyDown={handleKeyDown}
        data-claim={CAROUSEL_CLAIM}
        class={cn("relative", props.class)}
        role="region"
        aria-roledescription={text("ui.carousel.role")}
        data-slot="carousel"
        {...rest}
      >
        {props.children}
      </div>
    </CarouselContext>
  );
};

const CarouselContent: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  const { viewportRef, orientation, transition } = useCarousel();

  return (
    <div ref={viewportRef} class={CAROUSEL_VIEWPORT} data-slot="carousel-content">
      <div
        class={cn(carouselTrack(transition(), orientation()), props.class)}
        data-transition={transition()}
        {...rest}
      />
    </div>
  );
};

const CarouselItem: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  const { orientation, transition } = useCarousel();
  const text = useUiText();

  return (
    // biome-ignore lint/a11y/useSemanticElements: role=group + aria-roledescription=slide is the canonical ARIA carousel slide; no HTML element maps to group.
    <div
      role="group"
      aria-roledescription={text("ui.carousel.slide-role")}
      data-slot="carousel-item"
      class={cn(carouselItem(transition(), orientation()), props.class)}
      {...rest}
    />
  );
};

/** Slide indicators. Stays in sync with drag, autoplay, and prev/next alike. */
const CarouselDots: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  const { selected, slideCount, scrollTo } = useCarousel();
  const text = useUiText();

  return (
    <div class={cn(CAROUSEL_DOTS, props.class)} data-slot="carousel-dots" {...rest}>
      {Array.from({ length: slideCount() }, (_, i) => (
        <button
          type="button"
          data-slot="carousel-dot"
          data-active={selected() === i ? "" : undefined}
          aria-label={text("ui.carousel.go-to-slide", { index: i + 1 })}
          aria-current={selected() === i ? "true" : "false"}
          class={carouselDot(selected() === i)}
          onClick={() => scrollTo(i)}
        />
      ))}
    </div>
  );
};

const CarouselPrevious: Component<ComponentProps<typeof Button>> = (props) => {
  const rest = omit(props, "class", "variant", "size");
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  const text = useUiText();

  return (
    <Button
      data-slot="carousel-previous"
      variant={props.variant ?? "outline"}
      size={props.size ?? "icon"}
      class={cn(
        "absolute size-8",
        orientation() === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        props.class,
      )}
      disabled={!canScrollPrev()}
      onClick={scrollPrev}
      {...rest}
    >
      <Icon icon="lucide:arrow-left" width={16} height={16} />
      <span class="sr-only">{text("ui.carousel.previous")}</span>
    </Button>
  );
};

const CarouselNext: Component<ComponentProps<typeof Button>> = (props) => {
  const rest = omit(props, "class", "variant", "size");
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  const text = useUiText();

  return (
    <Button
      data-slot="carousel-next"
      variant={props.variant ?? "outline"}
      size={props.size ?? "icon"}
      class={cn(
        "absolute size-8",
        orientation() === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        props.class,
      )}
      disabled={!canScrollNext()}
      onClick={scrollNext}
      {...rest}
    >
      <Icon icon="lucide:arrow-right" width={16} height={16} />
      <span class="sr-only">{text("ui.carousel.next")}</span>
    </Button>
  );
};

export {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselTransition,
};
