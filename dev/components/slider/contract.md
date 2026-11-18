# Slider: behaviour contract

Each line is one browser test in `tests/contracts/slider.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus, `data-*` markers and boxes, never classes. Written against Kobalte before Slider left it.

| id | when | then |
|---|---|---|
| SD1 | mounted | a `group` with `data-slot="slider"` and `data-orientation="horizontal"` holds one `slider` per value, each with `data-slot="slider-thumb"`, `tabindex="0"`, the label, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation="horizontal"` and `aria-valuetext` the number as the locale writes it |
| SD2 | ArrowRight or ArrowUp, ArrowLeft or ArrowDown on a focused thumb | the value moves one step up or down; with Shift it moves a page, a tenth of the range snapped to the step |
| SD3 | PageUp, PageDown, Home or End on a focused thumb | PageUp and PageDown move a page; Home and End go to the lowest and highest value the thumb may take |
| SD4 | a thumb dragged | the value follows the pointer's travel along the track, snapped to the step; the thumb keeps focus, and `onChangeEnd` reports once, at release |
| SD5 | a press on the track | the closest thumb jumps to the pressed value and has focus after release |
| SD6 | two thumbs | neither passes the other, they stay `minStepsBetweenThumbs` steps apart, and the fill spans between them |
| SD7 | keys change the value, then focus leaves | `onChange` reports each change, and `onChangeEnd` reports once, on blur |
| SD8 | `disabled` | the group and its thumbs carry `data-disabled`, the thumbs leave the tab order, and a press or a key changes nothing |
| SD9 | controlled by `value` and `onChange` | a change reports the next values through `onChange`, and the thumb shows only what `value` says |
| SD10 | `markers` | one `data-slot="slider-marker"` per marker, centred at its value along the track |
| SD11 | inside a closed shadow root | SD4 and SD2 hold there too |
