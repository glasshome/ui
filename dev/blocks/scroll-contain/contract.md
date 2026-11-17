# scroll-contain: behaviour contract

Each line is one browser test in `tests/contracts/scroll-contain.contract.test.tsx` (SC2 in `scroll-contain-touch.contract.test.tsx`), named by its id. There is no behaviour file: `SCROLL_CONTAIN` and `SCRIM_CONTAIN` in `src/lib/overlay-classes.ts` are the block, and the modal families wear them. A modal writes nothing on `html` or `body`. The scenarios render plain elements wearing those classes; SC1 and SC3 also run the real Dialog and BottomSheet. WebKit runs the main file in the `webkit` project (`bun run test:webkit`, `bun run test:webkit:image` on a host without WebKit's libraries); the touch file is Chromium only, since it drives a finger through CDP.

| id | when | then |
|---|---|---|
| SC1 | a modal with a scrolling body is open, a wheel at the body's end and over its scrim | the page does not scroll (Chromium and WebKit) |
| SC2 | a touch drag on the scrim | the page does not scroll (Chromium) |
| SC3 | open and close | the attribute lists and inline styles of `html` and `body` are the same before, during and after. Gap: the Kobalte Dialog still sets `pointer-events: none` on `body` while open, recorded with `expectGap`; it leaves with Kobalte in Phase 3 of `2026-11-15-ui-owns-its-primitives` |
| SC4 | a wheel over a non-scrolling part of the modal (its header) | the page does not scroll in Chromium and in Playwright's WebKit. Safari may scroll it, the accepted cost of the decision |
| SC5 | a modal inside a closed shadow root | SC1 and SC3 hold |
