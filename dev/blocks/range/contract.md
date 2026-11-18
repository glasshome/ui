# range: behaviour contract

Each line is one browser test in `tests/contracts/range.contract.test.tsx`, named by its id. `src/lib/behavior/range.ts` holds the linear range state and the pointer drag that Slider and ColorSlider share; ColorWheel takes its keys and its drag.

| id | when | then |
|---|---|---|
| RA1 | a range key on a thumb | an arrow moves one step, Shift with an arrow or PageUp and PageDown move a tenth of the range snapped to the step, Home and End go to the thumb's bounds |
| RA2 | a thumb pushed toward its neighbour | it stops `minStepsBetween` steps short and never crosses |
| RA3 | keys change a value, then focus leaves | `onChange` runs per change, and `onChangeEnd` runs once, on blur |
| RA4 | a primary press, moves and a release on the track | the closest thumb follows the pointer, and the drag ends once, at release |
| RA5 | a press with any button but the primary | nothing moves and no drag ends |
