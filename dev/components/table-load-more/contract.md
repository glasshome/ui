# TableLoadMore: behaviour contract

Each line is one browser test in `tests/contracts/table-load-more.contract.test.tsx`, named by its id. Tests read roles, names and text, never classes. Covers the paging end of a long table: `createTableWindow` and `TableLoadMore`.

| id | when | then |
|---|---|---|
| TL1 | mounted | one page of rows and one `button` "Show more" |
| TL2 | "Show more" is pressed until every row is drawn | each press adds one page; with every row drawn the button is gone |
| TL3 | a long table is scrolled until its end nears | the next page is drawn without a press, and again after a second scroll |
| TL4 | a long table is mounted and never scrolled | it stays at one page |
