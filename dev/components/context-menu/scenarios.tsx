import { createSignal } from "solid-js";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

export const Canvas = () => {
  const [chosen, setChosen] = createSignal("nothing");
  const [grid, setGrid] = createSignal(false);
  return (
    <div class="flex flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger
          as="section"
          aria-label="Canvas"
          class="text-muted-foreground flex h-40 w-72 items-center justify-center rounded-lg border border-dashed text-sm"
        >
          Right-click or hold here
        </ContextMenuTrigger>
        <ContextMenuContent class="w-52">
          <ContextMenuItem onSelect={() => setChosen("Copy")}>Copy</ContextMenuItem>
          <ContextMenuItem disabled>Paste</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked={grid()} onChange={setGrid}>
            Show grid
          </ContextMenuCheckboxItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onSelect={() => setChosen("Rename")}>Rename</ContextMenuItem>
              <ContextMenuItem onSelect={() => setChosen("Delete")}>Delete</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
      <output aria-label="Chosen" class="text-muted-foreground text-sm">
        {chosen()}
      </output>
    </div>
  );
};

export const CANVAS = { role: "region", name: "Canvas" };
const OPEN = { contextMenu: CANVAS };

export default defineScenarios({
  component: "ContextMenu",
  scenarios: [
    { id: "closed", title: "Closed", render: Canvas },
    { id: "open", title: "Open at the pointer", render: Canvas, steps: [OPEN] },
    {
      id: "keyboard",
      title: "Choose an item by keys",
      render: Canvas,
      steps: [OPEN, { key: "ArrowDown" }, { key: "Enter" }],
    },
    {
      id: "submenu",
      title: "Open the submenu and choose in it",
      render: Canvas,
      steps: [
        OPEN,
        { press: { role: "menuitem", name: "More" } },
        { press: { role: "menuitem", name: "Rename" } },
      ],
    },
    {
      id: "long-press",
      title: "A touch held on the area opens the menu under the finger",
      render: Canvas,
      steps: [{ hold: CANVAS }],
    },
    {
      id: "in-dialog",
      title: "Inside a dialog",
      render: Canvas,
      within: "dialog",
      steps: [OPEN],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Canvas,
      within: "shadow-root",
      steps: [OPEN, { press: { role: "menuitem", name: "Copy" } }],
    },
  ],
});
