import { cleanup, render, screen } from "@solidjs/testing-library";
import { action, createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
} from "../../src/solid/alert-dialog.js";
import { AreaPicker } from "../../src/solid/area-picker.js";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
} from "../../src/solid/bottom-sheet/index.js";
import { Button } from "../../src/solid/button.js";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../src/solid/context-menu.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../src/solid/dropdown-menu.js";
import {
  type AreaViewLike,
  type EntityDataAdapter,
  EntityDataContext,
  type EntityViewLike,
} from "../../src/solid/entity-data.js";
import { EntitySelector } from "../../src/solid/entity-selector.js";
import { IconPicker } from "../../src/solid/icon-picker.js";
import { ImagePicker } from "../../src/solid/image-picker.jsx";
import { type MediaStore, MediaStoreContext } from "../../src/solid/media-store.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../src/solid/popover.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/solid/select.js";

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const AREAS: AreaViewLike[] = [
  { id: "kitchen", name: "Kitchen", icon: "mdi:silverware", entityIds: ["light.counter"] },
  { id: "hall", name: "Hall", icon: "mdi:door", entityIds: [] },
];

const LIGHT: EntityViewLike = {
  id: "light.counter",
  name: "Counter",
  friendlyName: "Counter light",
  state: "on",
  areaId: "kitchen",
  icon: "mdi:lightbulb",
  aliases: [],
  entityCategory: null,
  isHidden: false,
  isDisabled: false,
};

const adapter: EntityDataAdapter = {
  entityIdsByDomain: () => ({ light: [LIGHT.id] }),
  useEntities: () => () => [LIGHT],
  getEntityView: (id) => (id === LIGHT.id ? LIGHT : undefined),
  useAreas: () => () => AREAS,
};

const store: MediaStore = {
  index: async () => ({
    media: [],
    usage: { bytes: 0, limitBytes: 524_288_000, files: 0, limitFiles: 50 },
  }),
  upload: async () => {
    throw new Error("no uploads here");
  },
  remove: async () => {},
  url: () => PIXEL,
};

const releases: (() => void)[] = [];

/** A consumer that keeps the choice and starts a save that stays in flight until the test ends. */
function heldSave<T>(initial: T) {
  const saved: T[] = [];
  const [kept, setKept] = createSignal({ value: initial });
  const { promise, resolve } = Promise.withResolvers<void>();
  releases.push(resolve);
  const run = action(function* (next: T) {
    saved.push(next);
    yield promise;
  });
  const start = (next: T) => {
    setKept({ value: next });
    void run(next);
  };
  return { saved, value: () => kept().value, start };
}

const triggerOf = (slot: string) =>
  document.querySelector(`[data-slot="${slot}"]`) as HTMLButtonElement;

function rowOf(slot: string, text: string) {
  const found = Array.from(document.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)).find(
    (el) => el.textContent?.includes(text),
  );
  if (!found) throw new Error(`no ${slot} for ${text}`);
  return found;
}

afterEach(() => {
  cleanup();
  for (const release of releases.splice(0)) release();
  document.body.innerHTML = "";
});

describe("a choice that starts async work closes its overlay on the next flush", () => {
  it("DropdownMenu", async () => {
    const save = heldSave<unknown>(undefined);
    render(() => (
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>Living room</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => save.start("scene")}>Save scene</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    const trigger = screen.getByRole("button", { name: "Living room" });
    await press(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await press(screen.getByRole("menuitem", { name: "Save scene" }));
    expect(save.saved).toEqual(["scene"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("ContextMenu", async () => {
    const save = heldSave<unknown>(undefined);
    render(() => (
      <ContextMenu>
        <ContextMenuTrigger>
          <div style={{ width: "120px", height: "60px" }}>Porch</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => save.start("rename")}>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));
    await userEvent.click(screen.getByText("Porch"), { button: "right" });
    expect(triggerOf("context-menu-trigger").hasAttribute("data-expanded")).toBe(true);
    await press(screen.getByRole("menuitem", { name: "Rename" }));
    expect(save.saved).toEqual(["rename"]);
    expect(triggerOf("context-menu-trigger").hasAttribute("data-expanded")).toBe(false);
  });

  it("Select", async () => {
    const save = heldSave<string | null>(null);
    render(() => (
      <Select
        options={["Kitchen", "Hall"]}
        placeholder="Pick a room"
        value={save.value()}
        onChange={save.start}
        itemComponent={(p) => <SelectItem item={p.item}>{String(p.item.rawValue)}</SelectItem>}
      >
        <SelectTrigger aria-label="Room">
          <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    ));
    const trigger = screen.getByRole("button", { name: /Room/ });
    await press(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await press(screen.getByRole("option", { name: "Hall" }));
    expect(save.saved).toEqual(["Hall"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("AreaPicker", async () => {
    const save = heldSave("");
    render(() => (
      <EntityDataContext value={adapter}>
        <AreaPicker value={save.value()} onChange={save.start} />
      </EntityDataContext>
    ));
    await press(triggerOf("area-picker-trigger"));
    expect(triggerOf("area-picker-trigger").hasAttribute("data-expanded")).toBe(true);
    await press(rowOf("area-picker-row", "Hall"));
    expect(save.saved).toEqual(["hall"]);
    expect(triggerOf("area-picker-trigger").hasAttribute("data-expanded")).toBe(false);
  });

  it("IconPicker", async () => {
    const save = heldSave("");
    render(() => <IconPicker value={save.value()} onChange={save.start} />);
    await press(triggerOf("icon-picker-trigger"));
    expect(triggerOf("icon-picker-trigger").hasAttribute("data-expanded")).toBe(true);
    await press(document.querySelector('button[title="mdi:lightbulb"]') as HTMLButtonElement);
    expect(save.saved).toEqual(["mdi:lightbulb"]);
    expect(triggerOf("icon-picker-trigger").hasAttribute("data-expanded")).toBe(false);
  });

  it("EntitySelector, one entity", async () => {
    const save = heldSave<string[]>([]);
    render(() => (
      <EntityDataContext value={adapter}>
        <EntitySelector
          domain="light"
          multiple={false}
          entityIds={save.value()}
          onEntityIdsChange={save.start}
        />
      </EntityDataContext>
    ));
    await press(triggerOf("entity-selector-trigger"));
    expect(triggerOf("entity-selector-trigger").getAttribute("aria-expanded")).toBe("true");
    await press(rowOf("entity-selector-row", "Counter"));
    expect(save.saved).toEqual([[LIGHT.id]]);
    expect(triggerOf("entity-selector-trigger").getAttribute("aria-expanded")).toBe("false");
  });

  it("ImagePicker", async () => {
    const save = heldSave("");
    render(() => (
      <MediaStoreContext value={store}>
        <ImagePicker
          value={save.value()}
          presets={{ dusk: { label: "Dusk", thumb: PIXEL } }}
          onChange={save.start}
        />
      </MediaStoreContext>
    ));
    await press(triggerOf("image-picker-trigger"));
    expect(triggerOf("image-picker-trigger").hasAttribute("data-expanded")).toBe(true);
    await press(await screen.findByRole("button", { name: "Use Dusk" }));
    expect(save.saved).toEqual(["preset:dusk"]);
    expect(triggerOf("image-picker-trigger").hasAttribute("data-expanded")).toBe(false);
  });

  it("AlertDialogAction", async () => {
    const save = heldSave<unknown>(undefined);
    const [open, setOpen] = createSignal(true);
    render(() => (
      <AlertDialog open={open()} onOpenChange={setOpen}>
        <AlertDialogContent aria-label="Remove the porch photo">
          <AlertDialogAction onClick={() => save.start("remove")}>Remove</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    ));
    await press(await screen.findByRole("button", { name: "Remove" }));
    expect(save.saved).toEqual(["remove"]);
    expect(document.querySelector('[role="alertdialog"][data-expanded]')).toBeNull();
  });

  it("Popover.CloseButton", async () => {
    const save = heldSave<unknown>(undefined);
    render(() => (
      <Popover>
        <PopoverTrigger as={Button}>Filters</PopoverTrigger>
        <PopoverContent>
          <Popover.CloseButton onClick={() => save.start("filters")}>Done</Popover.CloseButton>
        </PopoverContent>
      </Popover>
    ));
    const trigger = screen.getByRole("button", { name: "Filters" });
    await press(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await press(await screen.findByRole("button", { name: "Dismiss" }));
    expect(save.saved).toEqual(["filters"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("BottomSheetClose", async () => {
    const save = heldSave<unknown>(undefined);
    const [open, setOpen] = createSignal(true);
    render(() => (
      <BottomSheet open={open()} onOpenChange={setOpen}>
        <BottomSheetContent>
          <BottomSheetClose onClick={() => save.start("sheet")}>Done</BottomSheetClose>
        </BottomSheetContent>
      </BottomSheet>
    ));
    await press(await screen.findByRole("button", { name: "Done" }));
    expect(save.saved).toEqual(["sheet"]);
    const state = document
      .querySelector('[data-slot="bottom-sheet-content"]')
      ?.getAttribute("data-state");
    expect(state ?? "gone").not.toMatch(/^open/);
  });
});
