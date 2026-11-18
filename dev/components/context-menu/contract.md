# ContextMenu: behaviour contract

Each line is one browser test in `tests/contracts/context-menu.contract.test.tsx`, named by its id. Tests read roles, names, ARIA relations, focus and geometry, never classes. ContextMenu is the menu block (`dev/blocks/menu/contract.md`) opened over an area instead of a button: a secondary press opens it at the pointer, and a touch held for `HOLD_MS` opens it under the finger through `createHold`. The rows were written when ContextMenu left Kobalte; the browser pass records the Kobalte parity with `bun gov ops ui drive context-menu <id> --against origin/main --check`.

| id | when | then |
|---|---|---|
| CM1 | mounted | no `menu` exists; the area carries `data-closed` |
| CM2 | a secondary press on the area | one `menu` opens with its top-left corner at the pointer, offset by the gutter; the browser's own `contextmenu` is prevented; focus is on the panel |
| CM3 | a touch held on the area for `HOLD_MS` | the menu opens under the finger; the release chooses nothing |
| CM4 | a short touch tap on the area | no `menu` opens |
| CM5 | ArrowDown then Enter in the open menu | Copy's `onSelect` runs and the menu closes |
| CM6 | a second secondary press elsewhere on the area while open | the menu moves to the new point; one `menu` remains |
| CM7 | a press outside the area and the menu | the menu closes |
| CM8 | the trigger is `disabled`; a consumer's `onContextMenu` calls `preventDefault` | no `menu` opens, and in the disabled case the browser's own `contextmenu` is left alone |
| CM9 | More is pressed, then Rename | a second `menu` named "More" opens; choosing Rename closes both |
| CM10 | open inside a dialog; Escape | Escape closes the menu alone and the dialog stays open |
| CM11 | area inside a closed shadow root | the menu opens at the pointer in the same root and an item chooses |
