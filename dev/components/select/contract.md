# Select: behaviour contract

Each line is one browser test in `tests/contracts/select.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. A "Gap" is behaviour that fails today: its test is an `expectGap` holding the recorded failure, and it fails the day the gap closes. The list portals to `document.body` (or the nearest portal mount in a shadow root).

| id | when | then |
|---|---|---|
| S1 | mounted | the trigger is a `button` named by its label and its shown text ("Fruit Pick one"), `aria-haspopup="listbox"`, `aria-expanded="false"`; no `listbox` exists; the placeholder shows |
| S2 | the trigger is pressed | a `listbox` opens with one `option` per value; the trigger has `aria-expanded="true"` and `data-expanded` |
| S3 | the list opens | focus moves into the list |
| S4 | an option is pressed | the list closes, the trigger shows the option's text, focus returns to the trigger |
| S5 | Enter on the focused trigger | the list opens |
| S6 | ArrowDown in the open list | the next option becomes highlighted (`data-highlighted`) |
| S7 | Enter on a highlighted option | that option is picked, as in S4 |
| S8 | Escape in the open list | the list closes without a change, focus returns to the trigger |
| S9 | typing in the open list | the first option whose text starts with the typed letters becomes highlighted |
| S10 | a picked option, list reopened | that option has `aria-selected="true"` and `data-selected` |
| S11 | a press outside the open list | the list closes without a change |
| S12 | inside a bottom sheet | the list opens above the sheet, and picking leaves the sheet open. Gap: Escape closes the sheet with the list (`2026-10-11-one-layer-stack`) |
| S13 | inside a closed shadow root | S2 and S4 hold there too, with the list inside the same shadow root. Gap: the press lands and the list never opens (`2026-11-15-kobalte-collections-dead-in-closed-shadow-roots`) |
| S14 | Home, End or arrows move the highlight in a long list | the highlighted option scrolls into the list's view |
