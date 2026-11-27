# Tabs: behaviour contract

Each line is one browser test in `tests/contracts/tabs.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, focus and `data-*` markers, never classes. A "Gap" is behaviour that fails today: its test is an `expectGap` holding the recorded failure, and it fails the day the gap closes.

| id | when | then |
|---|---|---|
| T1 | mounted | one `tablist` holds a `tab` per trigger; the default tab has `aria-selected="true"` and `data-selected`, the others `aria-selected="false"` |
| T2 | mounted | only the selected tab is in the tab order (`tabindex="0"`), the others carry `tabindex="-1"` |
| T3 | mounted | the selected tab's `aria-controls` points at its `tabpanel`; other panels are not rendered; the panel's `aria-labelledby` names it by its tab |
| T4 | a disabled tab | carries `aria-disabled="true"` and `data-disabled`, and pressing it changes nothing |
| T5 | a tab is pressed | it becomes selected, gets focus, and its panel replaces the previous one |
| T6 | ArrowRight on a focused tab | focus and selection move to the next enabled tab, skipping disabled ones |
| T7 | ArrowRight on the last tab | focus and selection wrap to the first enabled tab |
| T8 | Home or End | focus and selection move to the first or last enabled tab |
| T9 | Tab from before the tablist | focus lands on the selected tab; a second Tab leaves the tablist for the panel or the next focusable |
| T10 | inside a dialog or a closed shadow root | T5 holds there too |
| T11 | no tab matches the value: none set, or the tab it names is gone | the first enabled tab shows as selected and its panel renders; `onChange` is not called until a press picks a tab |
