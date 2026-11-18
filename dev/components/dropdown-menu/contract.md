# DropdownMenu: behaviour contract

Each line is one browser test in `tests/contracts/dropdown-menu.contract.test.tsx`, named by its id. Tests read roles, names, ARIA relations, focus and geometry, never classes. DropdownMenu is the menu block (`dev/blocks/menu/contract.md`) behind a menu button; this contract pins what a consumer sees. The rows were written when DropdownMenu left Kobalte; the browser pass records the Kobalte parity with `bun gov ops ui drive dropdown-menu <id> --against origin/main --check`.

| id | when | then |
|---|---|---|
| DM1 | mounted | the trigger is a `button` with `aria-haspopup="true"` and `aria-expanded="false"`; no `menu` exists |
| DM2 | the trigger is pressed | one `menu` opens, named by the trigger through `aria-labelledby`; the trigger has `aria-expanded="true"` and `aria-controls` naming the menu |
| DM3 | open | the menu's top edge is within 1px of the trigger's top, so the panel covers its trigger, and it stays inside the viewport |
| DM4 | Enter on the focused trigger, then Enter | the menu opens on Copy, Copy's `onSelect` runs, the menu closes and focus returns to the trigger |
| DM5 | an item is pressed | its `onSelect` runs once and the menu closes |
| DM6 | the checkbox item and a radio item are chosen | the checkbox's `onChange` gets `true` and its `aria-checked` follows; the radio group's `onChange` gets the radio's value; the menu stays open |
| DM7 | More is pressed, then Rename | a second `menu` named "More" opens and More has `aria-expanded="true"`; choosing Rename closes both menus |
| DM8 | `DropdownMenuTrigger as={Button}` | the trigger is the Button component's element with the Button's look, keeps `data-slot="dropdown-menu-trigger"` and the menu-button ARIA, and a press opens the menu |
| DM9 | open inside a dialog; Escape; a press on the dialog's body | Escape closes the menu alone and the dialog stays open; a press on the dialog's body closes the menu and keeps the dialog open |
| DM10 | trigger inside a closed shadow root | the menu opens in the same root and an item chooses |
| DM11 | the menu closes | it unmounts after its exit motion; nothing named "Actions" with role `menu` remains |
