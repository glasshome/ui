# FaceToggle: behaviour contract

Each line is one browser test in `tests/contracts/face-toggle.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before FaceToggle left it.

| id | when | then |
|---|---|---|
| FT1 | mounted | one `group` named by its label holds a `button` per face named by its name; a locked face is named "<name> always sees it", pressed, and `aria-disabled="true"` |
| FT2 | a face is pressed | it is pressed, the others stay as they were, and `onChange` reports the chosen faces without the locked ones |
| FT3 | the locked face is pressed | it stays pressed and no `onChange` report names it |
| FT4 | ArrowRight or ArrowLeft on a focused face | focus moves to the next or previous face, wrapping at the ends; nothing is pressed or released |
| FT5 | Enter or Space on a focused face | the face flips |
| FT6 | Tab from before the group | focus lands on one face; a second Tab leaves the group |
| FT7 | inside a closed shadow root | FT2 holds there too |
