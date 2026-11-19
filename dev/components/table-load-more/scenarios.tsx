import { For } from "solid-js";
import { createTableWindow, TableLoadMore } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const ROWS = Array.from({ length: 12 }, (_, i) => `Device ${i + 1}`);

const LONG = Array.from({ length: 120 }, (_, i) => `Event ${i + 1}`);

const Paged = (props: { rows: string[]; pageSize: number }) => {
  const table = createTableWindow(() => props.rows, { pageSize: props.pageSize });
  return (
    <div>
      <ul aria-label="Rows">
        <For each={table.shown()}>{(row) => <li>{row}</li>}</For>
      </ul>
      <TableLoadMore hasMore={table.hasMore()} onLoadMore={table.showMore} />
    </div>
  );
};

const MORE = { press: { role: "button", name: "Show more" } };

export default defineScenarios({
  component: "TableLoadMore",
  scenarios: [
    {
      id: "load-more",
      title: "Show more adds a page until every row is drawn",
      render: () => <Paged rows={ROWS} pageSize={5} />,
      steps: [MORE, MORE],
    },
    {
      id: "long",
      title: "A long table draws its first page and pages on as its end nears",
      render: () => <Paged rows={LONG} pageSize={50} />,
    },
  ],
});
