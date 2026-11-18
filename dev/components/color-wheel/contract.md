# ColorWheel: behaviour contract

Each line is one browser test in `tests/contracts/color-wheel.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus, `data-*` markers and boxes, never classes. Written against Kobalte before ColorWheel left it.

| id | when | then |
|---|---|---|
| CW1 | mounted | a `group` with `data-slot="color-wheel"` holds one `slider` with `data-slot="color-wheel-thumb"`, named "Hue" unless `aria-label` says otherwise, `aria-valuemin="0"`, `aria-valuemax="360"`, `aria-valuenow` the hue and `aria-valuetext` the hue in degrees and its name |
| CW2 | mounted | the thumb sits on the ring at the hue's angle: hue 0 at three o'clock, turning clockwise |
| CW3 | ArrowRight or ArrowUp, ArrowLeft or ArrowDown, PageUp or PageDown on the focused thumb | the hue turns one degree or a page of 15, wrapping between 359 and 0 |
| CW4 | Home or End on the focused thumb | both go to hue 0, since 360 is 0 |
| CW5 | the thumb dragged | the hue follows the pointer's angle around the centre; the thumb keeps focus, and `onChangeEnd` reports once, at release |
| CW6 | a press on the ring | the hue jumps to the pressed angle |
| CW7 | `disabled` | the group and thumb carry `data-disabled`, the thumb leaves the tab order, and a drag or a key changes nothing |
| CW8 | inside a closed shadow root | CW5 and CW3 hold there too |
