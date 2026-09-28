/* Carousel contract, as far as a DOM without layout can see it:
 * - fade lays out as embla's standard flex track (the fade plugin stacks the
 *   slides itself); only wipe stacks in CSS,
 * - the engine is rebuilt when `autoplay` changes.
 * happy-dom measures nothing, so embla derives no scroll snaps here and no test
 * in this file can prove fade advances or drags. That needs a browser:
 * `bun run dev:gallery` → Layout → "Carousel fade". */
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";

import { carouselItem, carouselTrack } from "../../src/lib/carousel-classes.js";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "../../src/solid/carousel.js";

describe("carousel class recipes", () => {
  it("fade rides embla's flex track, not the grid stack", () => {
    expect(carouselTrack("fade")).toContain("flex");
    expect(carouselTrack("fade")).not.toContain("carousel-stack");
    // Stacked-looking slides carry no gutter.
    expect(carouselTrack("fade")).not.toContain("-ml-4");
    expect(carouselTrack("fade", "vertical")).toContain("flex-col");
  });

  it("fade slides fill the viewport, which is what embla snaps to", () => {
    expect(carouselItem("fade")).toContain("basis-full");
    expect(carouselItem("fade")).toContain("shrink-0");
    expect(carouselItem("fade")).toContain("grow-0");
    expect(carouselItem("fade")).not.toContain("pl-4");
  });

  it("slide keeps its gutter and wipe keeps its stack", () => {
    expect(carouselTrack("slide")).toContain("-ml-4");
    expect(carouselItem("slide")).toContain("pl-4");
    expect(carouselTrack("wipe")).toBe("carousel-stack");
    expect(carouselItem("wipe")).toContain("carousel-wipe");
  });
});

describe("fade renders the flex track", () => {
  it("puts the track and slide classes on the rendered parts", () => {
    const { container } = render(() => (
      <Carousel transition="fade">
        <CarouselContent>
          <CarouselItem>one</CarouselItem>
          <CarouselItem>two</CarouselItem>
        </CarouselContent>
      </Carousel>
    ));
    const track = container.querySelector('[data-transition="fade"]');
    expect(track?.classList.contains("flex")).toBe(true);
    expect(track?.classList.contains("carousel-stack")).toBe(false);
    const slide = container.querySelector('[data-slot="carousel-item"]');
    expect(slide?.classList.contains("basis-full")).toBe(true);
  });
});

describe("autoplay is reactive", () => {
  const renderWith = (autoplay: () => number | undefined, onApi: (api: CarouselApi) => void) =>
    render(() => (
      <Carousel transition="fade" autoplay={autoplay()} setApi={onApi}>
        <CarouselContent>
          <CarouselItem>one</CarouselItem>
          <CarouselItem>two</CarouselItem>
        </CarouselContent>
      </Carousel>
    ));

  it("rebuilds the engine when the interval changes", () => {
    const [delay, setDelay] = createSignal<number | undefined>(3000);
    const seen: CarouselApi[] = [];
    renderWith(delay, (api) => seen.push(api));
    expect(seen).toHaveLength(1);
    setDelay(10_000);
    expect(seen).toHaveLength(2);
    expect(seen[0]).not.toBe(seen[1]);
  });

  it("starts autoplaying when an interval arrives after the first mount", () => {
    const [delay, setDelay] = createSignal<number | undefined>(undefined);
    const seen: CarouselApi[] = [];
    renderWith(delay, (api) => seen.push(api));
    expect(seen).toHaveLength(1);
    setDelay(5000);
    expect(seen).toHaveLength(2);
    expect(seen[1]?.plugins().autoplay).toBeTruthy();
    expect(seen[0]?.plugins().autoplay).toBeUndefined();
  });
});
