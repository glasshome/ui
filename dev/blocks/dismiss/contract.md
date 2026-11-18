# dismiss: behaviour contract

Each line is one browser test in `tests/contracts/dismiss.contract.test.tsx`, named by its id. `src/lib/behavior/dismiss.ts` holds `createDismiss`: outside press judged by the composed path, and Escape consumed in the layer's own keydown, or with `escapeFrom: "document"` (the owned modals, the spotlight) on the root element, before Kobalte's document listeners, unless the topmost layer reads its own Escape. Whichever listener claims the key hands it to the claiming layer's own handler, once. A tooltip reads Escape from the document in the capture phase instead, closes only when no non-tooltip layer sits above it, and consumes nothing. A `topLayer: "auto"` layer does not use it; the browser dismisses that one.

| id | when | then |
|---|---|---|
| DI1 | a mouse press outside the top layer | it closes with `outside-press`; focus stays where the press put it |
| DI2 | a press inside, on its trigger, or inside a layer opened above it | it stays open |
| DI3 | Escape with focus inside the top layer | it closes with `escape`; the keydown has `defaultPrevented` and a `window` keydown listener never runs |
| DI4 | Escape inside a lower layer while a newer layer that takes no focus and has `escape()` true is open | only the newer layer closes |
| DI5 | a touch that scrolls / a touch tap outside | nothing closes / it closes on the tap's click |
| DI6 | the press that opened the layer | the layer stays open |
| DI7 | inside a closed shadow root | DI1 to DI3 hold; a press on the page outside the host closes it once |
| DI8 | Escape while `isComposing` | nothing closes, nothing is prevented |
| DI9 | a mouse press that starts inside and is released outside | it stays open |
| DI10 | the focused control inside the top layer is removed (focus falls to `body`), then Escape | the layer closes with `escape`; a `window` keydown listener never runs |
| DI11 | a Kobalte dialog whose consumer vetoes Escape (`onEscapeKeyDown` calls `preventDefault`) is open above a BottomSheet, Escape | both stay open |
| DI12 | a tooltip opens over an open popover, a press outside both | the popover closes with `outside-press`; a press on the tooltip leaves it open |
| DI13 | Escape while a tooltip is the topmost layer, focus anywhere | it closes with `escape`; the key is not prevented, a `window` listener hears it |
| DI14 | Escape with a tooltip over a modal | the tooltip closes, and the modal closes on the same key: a tooltip never consumes an Escape a layer below needs |
| DI15 | Escape with a layer opened above a tooltip | only that layer closes; the tooltip stays |
| DI16 | Escape while `isComposing`, a tooltip open | it stays open |
| DI17 | Escape in a modal whose `escape()` is false | it stays open and the key is consumed (prevented, stopped): a modal never lets Escape through to the page. A layer whose library reads its own Escape (`readsOwnEscape`, the Kobalte dialogs) is left alone |
| DI18 | two popovers, focus inside the lower, Escape | the newer one closes through its own `onDismiss` (reason `escape`), so a veto there holds; the lower stays open |
