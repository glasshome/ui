/* Exported from the root entry so a server-rendered carousel (hub's content
 * pages) shares the Solid <Carousel> markup. */
import { POSITION_BAR, POSITION_BAR_LIT } from "./position-bar-classes.js";

export type CarouselTransition = "slide" | "fade" | "wipe";

export const CAROUSEL_VIEWPORT = "h-full overflow-hidden";

/**
 * Only wipe stacks in CSS. Fade keeps embla's standard flex track, which is the
 * structure its plugin is built for: embla reads each snap from the slide's
 * offset along the axis, and the plugin then translates every slide back onto
 * the viewport to cross-fade them. Slides sharing one grid cell share offset 0,
 * so every snap collapses onto the same point and a pointer drag has no
 * distance to resolve: it never changes slide. Index-driven navigation
 * (autoplay, arrows, dots) survives the collapse, which is why wipe still
 * advances.
 */
export function carouselTrack(
  transition: CarouselTransition,
  orientation: "horizontal" | "vertical" = "horizontal",
) {
  if (transition === "wipe") return "carousel-stack";
  const vertical = orientation === "vertical";
  // Fade slides sit on top of each other, so the track carries no gutter.
  if (transition === "fade") return vertical ? "flex flex-col" : "flex";
  return `flex ${vertical ? "-mt-4 flex-col" : "-ml-4"}`;
}

export function carouselItem(
  transition: CarouselTransition,
  orientation: "horizontal" | "vertical" = "horizontal",
) {
  if (transition === "wipe") return "min-w-0 carousel-wipe";
  const track = "min-w-0 shrink-0 grow-0 basis-full";
  if (transition === "fade") return track;
  return `${track} ${orientation === "horizontal" ? "pl-4" : "pt-4"}`;
}

export const CAROUSEL_DOTS = "flex items-center justify-center gap-2";

export function carouselDot(active: boolean) {
  return `${POSITION_BAR} ${active ? `w-6 ${POSITION_BAR_LIT}` : "w-2.5 hover:[--glass-light:0.12]"}`;
}
