# hide-outside: behaviour contract

Each line is one browser test in `tests/contracts/hide-outside.contract.test.tsx`, named by its id. `src/lib/behavior/hide-outside.ts` holds `createHideOutside`: while a modal layer is active it sets `aria-hidden="true"` on the children of the layer's mount that are neither the layer's branch, nor a branch holding a layer above it, nor a live region, and restores each one's prior value when the layer deactivates. A child that holds a live region is entered, and its other children are hidden instead, so the app root that holds the toaster is still hidden around it. Holds are counted per element, so layers that close out of order leave the right value. It writes nothing on `html` or `body` and never uses `inert`. The AX tree is read through the `axTree` browser command, outside any perf step.

| id | when | then |
|---|---|---|
| HO1 | a modal is open | page content outside it is absent from Chromium's AX tree |
| HO2 | a list opens above the modal | the list and its options are in the AX tree |
| HO3 | the modal closes | every child's `aria-hidden` is back to its prior value, an already hidden child included |
| HO4 | an inner modal opens over an outer one, then closes | the outer is hidden while the inner is open and visible again after |
| HO5 | open and close | no write on `html` or `body`, no `inert` anywhere |
| HO6 | a toast or `aria-live` region outside the modal | it stays in the AX tree while the modal is open, and an announcement made then is in the tree |
| HO7 | a layer marked `data-kb-top-layer` outside the modal (the sleep surface) | it keeps no `aria-hidden` while the modal is open, as focus scope and the layer stack already treat it as above |
| HO8 | two modals open in the same tick, then a third opens later | the upper of the two keeps no `aria-hidden` and hides the lower; the later one hides the rest and writes nothing on a child already hidden |
