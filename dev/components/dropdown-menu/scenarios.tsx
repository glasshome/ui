import { createSignal } from "solid-js";
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

export const Actions = () => {
  const [chosen, setChosen] = createSignal("nothing");
  const [grid, setGrid] = createSignal(false);
  const [size, setSize] = createSignal("small");
  return (
    <div class="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} variant="outline">
          Actions
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Edit</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setChosen("Copy")}>Copy</DropdownMenuItem>
            <DropdownMenuItem disabled>Paste</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={grid()} onChange={setGrid}>
            Show grid
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value={size()} onChange={setSize}>
            <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => setChosen("Rename")}>Rename</DropdownMenuItem>
              <DropdownMenuItem tone="destructive" onSelect={() => setChosen("Delete")}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <output aria-label="Chosen" class="text-muted-foreground text-sm">
        {chosen()}
      </output>
    </div>
  );
};

export const ACTIONS_TRIGGER = { role: "button", name: "Actions" };
const OPEN = { press: ACTIONS_TRIGGER };

export default defineScenarios({
  component: "DropdownMenu",
  scenarios: [
    { id: "closed", title: "Closed", render: Actions },
    { id: "open", title: "Open", render: Actions, steps: [OPEN] },
    {
      id: "keyboard",
      title: "Choose an item by keys",
      render: Actions,
      steps: [OPEN, { press: { role: "menuitem", name: "Copy" } }],
      keyboard: [{ key: "Tab" }, { key: "Enter" }, { key: "Enter" }],
    },
    {
      id: "submenu",
      title: "Open the submenu and choose in it",
      render: Actions,
      steps: [
        OPEN,
        { press: { role: "menuitem", name: "More" } },
        { press: { role: "menuitem", name: "Rename" } },
      ],
      keyboard: [{ key: "Tab" }, { key: "ArrowUp" }, { key: "ArrowRight" }, { key: "Enter" }],
    },
    {
      id: "in-dialog",
      title: "Inside a dialog",
      render: Actions,
      within: "dialog",
      steps: [OPEN],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Actions,
      within: "shadow-root",
      steps: [OPEN, { press: { role: "menuitem", name: "Copy" } }],
    },
  ],
});
