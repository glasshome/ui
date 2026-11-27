# presence: behaviour contract

Each line is one browser test in `tests/contracts/presence.contract.test.tsx`, named by its id. `src/lib/behavior/presence.ts` holds `createPresence` and `watchMotion` (the cancelable wait it and BottomSheet share): a layer stays mounted through its exit and unmounts on the element's own motion end, or `min(exitMs, PRESENCE_TIMEOUT_MS)` after the close. It never calls `getAnimations()`. `keep` holds a closed layer mounted and dormant; hiding it is the consumer's.

| id | when | then |
|---|---|---|
| PR1 | `present` turns true | mounted at once in `opening`, then `open` when its enter motion ends |
| PR2 | `present` turns false | stays mounted with `data-closed` until its exit motion ends, then unmounts |
| PR3 | no motion runs (reduced motion) | unmounts `exitMs` after the close, never later than `PRESENCE_TIMEOUT_MS` (fake time) |
| PR4 | a child's animation ends first | the element stays until its own motion ends |
| PR5 | an exit motion starts and never sends an end event | unmounts `min(exitMs, PRESENCE_TIMEOUT_MS)` after the close (fake time) |
| PR6 | `present` turns true again while closing | back to `open` without unmounting |
| PR7 | the owner unmounts mid-exit | no listener or timer remains |
| PR8 | the exit carries a delay (`transition-delay`, `animation-delay`) within `exitMs` | the element stays until the delayed motion ends |
| PR9 | an infinite animation started before the close, and an `::after` animation on the element during exit | neither ends the exit early; it follows the exit motion alone |
| PR10 | `present` turns true | the layer is in the DOM in the flush that writes it: an effect on `present` already finds it |
| PK1 | `keep` true, `present` never true | mounted, dormant, phase `closed` |
| PK2 | `keep` true, `present` true then false | after the exit motion ends: mounted, dormant |
| PK3 | `keep` turns false while dormant | unmounts at once |
| PK4 | `keep` turns false while open | nothing until the close; then unmounts after the exit, as without `keep` |
| PK5 | `present` true again while dormant | the same nodes (identity kept), phase `opening` then `open` |
