# ColorDisc: behaviour contract

Each line is one browser test in `tests/contracts/color-disc.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus, `data-*` markers and boxes, never classes.

| id | when | then |
|---|---|---|
| CD1 | mounted | a `slider` with `data-slot="color-disc-thumb"`, named "Colour" unless `aria-label` says otherwise, `aria-valuemin="0"`, `aria-valuemax="360"`, `aria-valuenow` the hue and `aria-valuetext` "Hue H, saturation S%" |
| CD2 | ArrowLeft or ArrowRight on the focused thumb | the hue turns 2 degrees, 10 with Shift; each key reports through `onChange` and `onChangeEnd` |
| CD3 | ArrowUp or ArrowDown on the focused thumb | the saturation moves 2, held between 0 and 100 |
| CD4 | a press and drag on the disc | the hue follows the pointer's angle and the saturation its distance from the centre; `onChangeEnd` reports once, at release |
| CD5 | `disabled` | the thumb leaves the tab order, and a drag or a key changes nothing |
| CD6 | inside a closed shadow root | CD4 holds there too |
