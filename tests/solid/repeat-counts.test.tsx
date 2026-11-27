import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, flush, For } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from "../../src/solid/carousel.js";
import { TableSkeleton } from "../../src/solid/data-table.js";
import { SectionRowSkeletons } from "../../src/solid/section-card.js";

afterEach(cleanup);

const count = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`).length;

describe("lists drawn from a count follow it", () => {
  it("SectionRowSkeletons shows as many rows as its count says, after the count changes", () => {
    const [rows, setRows] = createSignal(2);
    const { container } = render(() => <SectionRowSkeletons count={rows()} />);
    expect(count(container, "section-row-skeleton")).toBe(2);
    setRows(4);
    flush();
    expect(count(container, "section-row-skeleton")).toBe(4);
    setRows(1);
    flush();
    expect(count(container, "section-row-skeleton")).toBe(1);
  });

  it("TableSkeleton shows as many rows as its count says, after the count changes", () => {
    const [rows, setRows] = createSignal(2);
    const { container } = render(() => <TableSkeleton count={rows()} />);
    expect(count(container, "table-skeleton-row")).toBe(2);
    setRows(5);
    flush();
    expect(count(container, "table-skeleton-row")).toBe(5);
  });

  it("CarouselDots keeps the dots it had when a slide arrives", async () => {
    const [slides, setSlides] = createSignal(["one", "two"]);
    const { container } = render(() => (
      <Carousel>
        <CarouselContent>
          <For each={slides()}>{(slide) => <CarouselItem>{slide}</CarouselItem>}</For>
        </CarouselContent>
        <CarouselDots />
      </Carousel>
    ));
    const dots = () => [...container.querySelectorAll('[data-slot="carousel-dot"]')];
    await expect.poll(() => dots().length).toBe(2);
    const before = dots();
    setSlides(["one", "two", "three"]);
    flush();
    await expect.poll(() => dots().length).toBe(3);
    expect(dots().slice(0, 2)).toEqual(before);
  });
});
