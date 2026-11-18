# Accordion: behaviour contract

Each line is one browser test in `tests/contracts/accordion.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. Baseline written on Kobalte before Accordion left it.

| id | when | then |
|---|---|---|
| AC1 | mounted | each item (`data-slot="accordion-item"`) holds a native `button` trigger (`data-slot="accordion-trigger"`) inside an `h3`; the open trigger has `aria-expanded="true"` and `aria-controls` naming its `region` (`data-slot="accordion-content"`), which its trigger names (`aria-labelledby`); a closed item's content is not rendered |
| AC2 | single, a closed trigger is pressed | its item opens and the open one closes |
| AC3 | the open trigger is pressed | with `collapsible` it closes; without, it stays open |
| AC4 | `multiple` | a press opens an item beside the open ones, and a press on an open one closes only it |
| AC5 | ArrowDown or ArrowUp on a focused trigger | focus moves to the next or previous enabled trigger and wraps at the ends; nothing opens or closes. |
| AC6 | Home or End on a focused trigger | focus moves to the first or last enabled trigger. |
| AC7 | Tab | every enabled trigger is a Tab stop, in item order |
| AC8 | Enter or Space on a focused trigger | each key toggles its item |
| AC9 | a disabled item | its trigger is disabled; item, heading and trigger carry `data-disabled`; a press changes nothing |
| AC10 | controlled by `value` and `onChange` | a press reports the next value, and the items follow only `value` |
| AC11 | open and closed items | item, heading, trigger and content of an open item carry `data-expanded`; item, heading and trigger of a closed one carry `data-closed` |
| AC12 | Escape on a trigger | with `collapsible` or `multiple`, every item closes; otherwise nothing changes |
| AC13 | inside a closed shadow root | AC2 holds there too. |
| AC14 | `multiple`, a closed item opens | the items already open run no motion |
