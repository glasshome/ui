# Dock: behaviour contract

Each line is one browser test in `tests/contracts/dock.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states and boxes, never classes.

| id | when | then |
|---|---|---|
| DK1 | mounted with room for every item | each item is a `button` named by its label, and no "Page" button shows |
| DK2 | mounted with more items than room | "Page" buttons show, the first `aria-current`, and the strip ends on a whole item |
| DK3 | a "Page" button is pressed | that page turns `aria-current` |
