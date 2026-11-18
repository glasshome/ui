# anchored: behaviour contract

Each line is one browser test in `tests/contracts/anchored.contract.test.tsx`, named by its id. `src/lib/behavior/anchored.ts` holds `createAnchored`: while `open` is true it places the floating part beside its anchor with `placeBeside` (`src/lib/anchor-placement.ts`). It reads the anchor's `getBoundingClientRect`, the part's `offsetWidth` and `offsetHeight` and the window size, and writes `position: fixed`, `top`, `left`, `max-width`, `max-height`, `margin`, `data-side`, `data-anchored` and, with `matchAnchorWidth`, `min-width` on the part alone. It re-places on window `resize` and, once per frame, on any `scroll` captured at the document or at the anchor's shadow root, and stops on close. It writes no anchor property and never calls `getComputedStyle`, so the same code places a part in the page and in a widget's guest. PO1 to PO5 also run in WebKit.

| id | when | then |
|---|---|---|
| PO1 | open below a trigger with room | the part's top edge is within 1px of the trigger's bottom plus the offset; it stays 16px inside the viewport |
| PO2 | no room below | it opens above |
| PO3 | the page or a scroll container scrolls the trigger | the part follows it |
| PO4 | `matchAnchorWidth` | the part is at least the trigger's width |
| PO5 | trigger and part in one closed shadow root | PO1 holds |
| PO6 | any placement | no `getComputedStyle` call; the part carries no anchor property |
| PO7 | open, then closed | while open the part carries `data-anchored`, the marker the widget realm's tap guard reads as a placed panel; the anchor never does; on close the part loses it |
