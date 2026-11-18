# collection: behaviour contract

Each line is one browser test in `tests/contracts/collection.contract.test.tsx`, named by its id. `src/lib/behavior/collection.ts` keeps no order of its own: on each navigation key it reads the items matching its selector inside the root, in DOM order, with one `querySelectorAll`. Tabs and ToggleGroup use it; Select and the menus follow.

| id | when | then |
|---|---|---|
| CO1 | arrows along the orientation | the highlight moves, skipping disabled items; it stops at the ends unless `loop` |
| CO2 | Home / End | first / last enabled item |
| CO3 | typing letters | the first item whose text starts with them; one repeated letter cycles; after `TYPEAHEAD_MS` without a key the buffer resets (fake time) |
| CO4 | `roving` | exactly one item has `tabindex="0"`; Tab leaves the collection |
| CO5 | an item inserted in the middle | the next arrow move reaches it in its DOM place |
| CO6 | `dir="rtl"`, horizontal | Left and Right swap |
| CO7 | a keyboard move in a long list | the highlighted item scrolls into the list's view |
| CO8 | inside a closed shadow root | CO1 and CO4 hold |
| CO9 | items rendered by a `<For>` whose array is re-sorted | arrow moves follow the new order; Home lands on the new first item |
| CO10 | the item holding the tab stop unmounts while focus is outside | the first enabled item (or a `preferred` one) takes the tab stop; each item calls `release(key)` on cleanup |
