# layer-stack: behaviour contract

Each line is one browser test in `tests/contracts/layer-stack.contract.test.tsx`, named by its id. `src/lib/behavior/layer-stack.ts` holds `registerLayer` and `layerStack`, the one stack of open layers per JavaScript realm. A layer with `topLayer` takes the browser's top layer through the `popover` attribute. Escape and press-outside walks are Task 6's `dismiss`; the stack only says which layer is on top and what a press path holds.

| id | when | then |
|---|---|---|
| LS1 | three layers open in turn | `layers()` lists them in open order; the newest is `top()` |
| LS2 | the middle one closes | it leaves; the others keep their order |
| LS3 | a press path holds the layer, its trigger, or a layer opened above it (also inside a closed shadow root) | `containsPath` is true; for any other path it is false |
| LS4 | the owner unmounts without closing | the layer leaves the stack |
| LS5 | a scenario renders | nothing registers before mount (registration runs in an effect) |
| LS6 | a tooltip opens over an open popover | `top()` is still the popover; a press outside both is outside the popover's path |
| LS7 | a sheet is open and a press lands on an element marked `[data-kb-top-layer]` (the sleep surface) | `containsPath` is true; the sheet stays open |
| LS8 | a `topLayer: "auto"` layer that the browser closes (a press outside, Escape) | `dismiss` runs once; the next render keeps it closed; in the guest the mirrored node and the guest's state agree |
| LS9 | a `topLayer` layer closes, or its owner unmounts while it is shown | it leaves the top layer (`:popover-open` no longer matches) |
| LS10 | a layer with `blockPointer` is open, with a layer above it | `body` takes no pointer events, the layer and the one above it do; when it closes, `body` and both layers are back to their prior values |
