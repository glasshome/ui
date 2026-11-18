# Term: behaviour contract

Each line is one browser test in `tests/contracts/term.contract.test.tsx`, named by its id. Tests read roles, names, ARIA relations, focus, geometry and `data-*` markers, never classes. Baseline written on Kobalte before Term left it. A Term is a word that opens a Popover, so the Popover contract holds for it; these rows pin what a Term adds.

| id | when | then |
|---|---|---|
| TM1 | mounted | the word is a `button` with `data-slot="term"`, `aria-haspopup="dialog"` and `aria-expanded="false"`, named by the term's title; no `dialog` exists |
| TM2 | children are given | they replace the title as the word |
| TM3 | the word is pressed | one `dialog` opens with the title, the line and a `Learn more` link to the term's page in a new tab; the word's `aria-controls` names it |
| TM4 | it opens | focus moves to `Learn more` |
| TM5 | no `href` | the panel has no link and takes focus itself |
| TM6 | Escape with the panel open | the panel closes and focus returns to the word |
| TM7 | a press outside | the panel closes |
| TM8 | inside a dialog | Escape closes only the panel and focus returns to the word |
| TM9 | open | the panel's top edge sits on the word's top edge, inside the viewport |
| TM10 | the page scrolls with the panel open | the panel follows its word |
