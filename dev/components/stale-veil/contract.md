# StaleVeil: behaviour contract

Each line is one browser test in `tests/contracts/stale-veil.contract.test.tsx`, named by its id. Tests read roles, names, ARIA states, animations and what a real press reaches, never classes.

| id | when | then |
|---|---|---|
| SV1 | shown | one cover filling the parent's padding box, hidden from assistive technology, in no tab order |
| SV2 | shown | one finite animation fades it in on the state duration; once it ends nothing animates |
| SV3 | shown, with reduced motion | no animation runs and the cover is fully shown at once |
| SV4 | shown | a press at its centre reaches the content beneath, and focus stays on that content |
| SV5 | no longer shown | the cover is gone and the content is the top element again |
