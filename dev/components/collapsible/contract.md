# Collapsible: behaviour contract

Each line is one browser test in `tests/contracts/collapsible.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before Collapsible left it.

| id | when | then |
|---|---|---|
| CL1 | mounted closed | the trigger is a native `button` (`data-slot="collapsible-trigger"`) with `aria-expanded="false"` and no `aria-controls`; root (`data-slot="collapsible"`) and trigger carry `data-closed`; the content is not rendered |
| CL2 | the trigger is pressed | `aria-expanded="true"`, `aria-controls` names the content (`data-slot="collapsible-content"`), and root, trigger and content carry `data-expanded` |
| CL3 | pressed again | `aria-expanded="false"` and no `aria-controls`; the content stays with `data-closed` until its exit motion ends, then is gone |
| CL4 | Enter or Space on the focused trigger | each key flips it |
| CL5 | `disabled` | the trigger is disabled, root and trigger carry `data-disabled`, and a press changes nothing |
| CL6 | controlled by `open` and `onOpenChange` | a press reports the next state, and the content follows only `open` |
| CL7 | `defaultOpen` | the content is rendered at mount and runs no open motion |
| CL8 | open | the content's `--collapsible-content-height` and `--kb-collapsible-content-height` are its own height, which the open and close motion read |
| CL9 | `forceMount` | closed, the content stays rendered with `data-closed` |
| CL10 | inside a closed shadow root | CL2 holds there too. |
