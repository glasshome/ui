# BottomSheet: behaviour contract

Each line is one browser test in `tests/contracts/bottom-sheet.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states and focus, never classes. Baseline written before the foundations move the sheet's focus trap, scroll lock and dismissal onto shared blocks. A "Gap" is behaviour that fails today: its test is an `expectGap` holding the recorded failure.

| id | when | then |
|---|---|---|
| B1 | mounted | the trigger is a `button`; no `dialog` exists |
| B2 | the trigger is pressed | one `dialog` named by its title opens and focus moves inside it |
| B3 | its Done button is pressed | the sheet closes |
| B4 | Escape with the sheet open | the sheet closes and focus returns to the trigger |
| B5 | a select inside it is opened | a `listbox` opens and the sheet stays open |
| B6 | Escape with that list open | the list closes and the sheet stays open |
| B7 | a press on the page beside the open sheet | the sheet closes |
| B8 | the sheet is open and settled, then a press on its body, then a click into a field in it | the trigger behind it receives no focus event, and the field keeps focus after the pointer is released |
| B9 | a committed drag is released where it began (no transform change to animate) | the sheet is `open` at once, with no wait for a transition that never runs; a new grab and an outside press both work immediately |
| B10 | the sheet opens, then closes | `[data-page]` carries `data-covered` in the frame it opens, not after the open animation, and loses it once the sheet is gone |
