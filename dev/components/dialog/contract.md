# Dialog: behaviour contract

Each line is one browser test in `tests/contracts/dialog.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states and focus, never classes. Baseline written before the foundations move Dialog, AlertDialog, Sheet and Popover onto `shadowLayer` and `ModalScrollLock`; their layer behaviour is this one.

| id | when | then |
|---|---|---|
| D1 | mounted | the trigger is a `button`; no `dialog` exists |
| D2 | the trigger is pressed | one `dialog` named by its title opens and focus moves inside it |
| D3 | its Done button is pressed | the dialog closes and focus returns to the trigger |
| D4 | Escape with the dialog open | the dialog closes and focus returns to the trigger |
| D5 | a select inside it is opened | a `listbox` opens and the dialog stays open |
| D6 | Escape with that list open | the list closes and the dialog stays open |
