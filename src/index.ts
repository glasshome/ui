// Framework-agnostic utilities

// Button class recipe (pure cva, no Solid) — Astro/SSR-safe, used to build
// marketing pill class strings without hydrating the Solid <Button>.
export { buttonVariants } from "./lib/button-variants";
// Hooks
export { createIsMobile } from "./lib/use-is-mobile";
export { cn } from "./lib/utils";
