# GlyphTile: behaviour contract

Each line is one browser test in `tests/contracts/glyph-tile.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before GlyphTile left it.

| id | when | then |
|---|---|---|
| GT1 | mounted | one `group` named by its label holds a `button` per tile named by its label; the picked tile (`data-slot="glyph-tile"`) is `aria-pressed="true"` with `data-pressed`, the others `aria-pressed="false"` |
| GT2 | an unpicked tile is pressed | `onChange` reports its value and it alone is pressed |
| GT3 | the picked tile is pressed | `onChange` reports `null` and no tile is pressed |
| GT4 | ArrowRight or ArrowLeft on a focused tile | focus moves to the next or previous tile, wrapping at the ends; the pick stays |
| GT5 | Home or End | focus moves to the first or last tile |
| GT6 | Tab from before the group | focus lands on the picked tile; a second Tab leaves the group |
| GT7 | Enter or Space on a focused tile | the tile is picked, or cleared when it was picked |
| GT8 | inside a closed shadow root | GT2 holds there too |
