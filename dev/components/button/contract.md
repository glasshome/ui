# Button: behaviour contract

Each line is one browser test in `tests/contracts/button.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before Button left it.

| id | when | then |
|---|---|---|
| B1 | mounted | a native `button` named by its text, with `type="button"` and `data-slot="button"` |
| B2 | pressed | its `onClick` runs once per press |
| B3 | Enter or Space on the focused button | its `onClick` runs once per key |
| B4 | `as="a"` with an `href` | a `link` named by its text, with no `type` and no `role` |
| B5 | `as` another element | it is a `button` reached by Tab (`tabindex="0"`), a press runs `onClick`, and so do Enter and Space |
| B6 | a native button is `disabled` | it carries `disabled` and `data-disabled`, and a press runs nothing |
| B7 | `as` another element is `disabled` | it carries `aria-disabled="true"` and `data-disabled`, Tab passes it, and a press runs nothing |
| B8 | `busy` | it carries `aria-busy="true"` and `aria-disabled="true"`, keeps focus, and a press runs nothing |
| B9 | inside a closed shadow root | B2 holds there too |
