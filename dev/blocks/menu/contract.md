# menu: behaviour contract

Each line is one browser test in `tests/contracts/menu.contract.test.tsx`, named by its id. `src/lib/behavior/menu.ts` holds `createMenu` and `createMenuButton`. A menu is a `createCollection` (roving, vertical, looping) over the `menuitem`, `menuitemcheckbox` and `menuitemradio` elements in its panel, a `menu` layer in `registerLayer` with `createDismiss`, and a panel placed by `createAnchored`. A submenu is a `createMenu` with a `parent`: it closes with its parent, joins its parent's focus, and sits beside its trigger item. Items register by `data-key`; the block reads text for typeahead and binds every listener natively, so the same code runs in a closed shadow root. DropdownMenu and ContextMenu are built on it. The stage is `dev/blocks/menu/scenarios.tsx`: an "Actions" button over Copy, a disabled Paste, a "Show grid" checkbox, Small and Large radios, a "More" submenu (Rename, Delete) and Close.

| id | when | then |
|---|---|---|
| ME1 | a mouse press on the button | one `menu` opens below it and takes focus on its panel; a second press closes it |
| ME2 | Enter, Space or ArrowDown on the button; ArrowUp | the menu opens with its first enabled item focused; with its last |
| ME3 | arrows in the open menu; Home, End | focus roves over the enabled items, skipping Paste, and loops at the ends; Home and End reach the first and last; exactly one item has `tabindex="0"` |
| ME4 | a letter typed in the menu | focus moves to the next enabled item whose text starts with it; the same letter again cycles |
| ME5 | the mouse moves over an item; over the disabled one | the item takes focus and the highlight; over Paste no item holds focus and the panel does |
| ME6 | Enter on the checkbox; on a radio | `aria-checked` flips on the checkbox; the radio is checked and its sibling is not; the menu stays open |
| ME7 | ArrowRight or Enter on More; ArrowLeft in the submenu | the submenu opens with Rename focused and More has `aria-expanded="true"`; ArrowLeft closes it and focus returns to More |
| ME8 | Escape in the submenu; Escape in the menu | Escape closes one level at a time; the last one returns focus to the button |
| ME9 | the mouse rests on More | after `SUBMENU_OPEN_DELAY_MS` the submenu opens; focus stays on More (fake time) |
| ME10 | the mouse leaves More toward the open submenu across Close | the submenu stays open and Close takes no highlight inside `POINTER_GRACE_MS`; after it, a move over Close closes the submenu (fake time) |
| ME11 | the submenu opens | its panel sits beside More, its left edge within 1px of More's right edge, its top within 1px of More's top, and carries `data-anchored` |
| ME12 | an item chosen by press or by Enter, in the menu or the submenu | its `onSelect` runs once, every menu in the tree closes, and focus returns to the button |
| ME13 | the press that opened the menu is released over an item; a press begun on an item is released outside the panel | nothing is chosen and the menu stays open |
| ME14 | a press outside the open tree | every menu closes; nothing is chosen |
| ME15 | Tab in an open menu | focus stays in the menu |
| ME16 | button and menu inside a closed shadow root | ME1, ME3 and ME12 hold, and the panel renders in the same root |
