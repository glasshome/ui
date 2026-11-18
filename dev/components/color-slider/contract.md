# ColorSlider: behaviour contract

Each line is one browser test in `tests/contracts/color-slider.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus, `data-*` markers and boxes, never classes. Written against Kobalte before ColorSlider left it.

| id | when | then |
|---|---|---|
| CSL1 | mounted | a `group` with `data-slot="color-slider"` holds one `slider` with `data-slot="color-slider-thumb"`, named by `aria-label` or else the channel, its `aria-valuemin`, `aria-valuemax` and `aria-valuenow` from the channel's range and value |
| CSL2 | mounted | `aria-valuetext` is the formatted channel value, then the hue's name for hue, the colour's name for other channels, and the value alone for alpha |
| CSL3 | arrow keys, PageUp, PageDown, Home or End on the focused thumb | the channel moves one step, a page (a tenth of its range), or to the ends of its range |
| CSL4 | the thumb dragged | the channel follows the pointer's travel along the track; `onChange` reports the colour with that channel, and `onChangeEnd` reports once, at release |
| CSL5 | `disabled` | the group and thumb carry `data-disabled`, the thumb leaves the tab order, and a press or a key changes nothing |
| CSL6 | inside a closed shadow root | CSL4 and CSL3 hold there too |
