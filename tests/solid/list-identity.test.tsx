import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { press } from "../press.js";

import {
  type AreaViewLike,
  type EntityDataAdapter,
  EntityDataContext,
  type EntityViewLike,
} from "../../src/solid/entity-data.js";
import { EntitySelector } from "../../src/solid/entity-selector.js";
import { ImagePicker } from "../../src/solid/image-picker.jsx";
import {
  type MediaStore,
  MediaStoreContext,
  type StoredMedia,
} from "../../src/solid/media-store.js";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../src/solid/select.js";

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const AREAS: AreaViewLike[] = [
  { id: "living", name: "Living room", icon: "mdi:sofa", entityIds: [] },
];

const light = (id: string, friendlyName: string): EntityViewLike => ({
  id,
  name: friendlyName,
  friendlyName,
  state: "on",
  areaId: "living",
  icon: "mdi:lightbulb",
  aliases: [],
  entityCategory: null,
  isHidden: false,
  isDisabled: false,
});

const LIGHTS = [light("light.reading", "Reading lamp"), light("light.sofa", "Sofa lamp")];

const image = (id: string, usedBy: number): StoredMedia => ({
  id,
  mimeType: "image/png",
  width: 100,
  height: 80,
  size: 1234,
  usedBy,
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("a list handed fresh objects keeps the rows it already shows", () => {
  it("Select: a new options array keeps the highlighted option's node", async () => {
    const [options, setOptions] = createSignal(["Kitchen", "Hall", "Garden"]);
    render(() => (
      <Select
        options={options()}
        open
        itemComponent={(p) => <SelectItem item={p.item}>{String(p.item.rawValue)}</SelectItem>}
      >
        <SelectTrigger aria-label="Room">Room</SelectTrigger>
        <SelectContent />
      </Select>
    ));
    const hall = await screen.findByRole("option", { name: "Hall" });
    await userEvent.hover(hall);
    expect(hall.hasAttribute("data-highlighted")).toBe(true);

    setOptions(["Kitchen", "Hall", "Garden"]);
    flush();

    expect(screen.getByRole("option", { name: "Hall" })).toBe(hall);
    expect(hall.hasAttribute("data-highlighted")).toBe(true);
  });

  it("EntitySelector: a refetch that shifts the rows keeps the active row and its node", async () => {
    const [lights, setLights] = createSignal(LIGHTS);
    const adapter: EntityDataAdapter = {
      entityIdsByDomain: () => ({ light: lights().map((l) => l.id) }),
      useEntities: () => lights,
      getEntityView: (id) => lights().find((l) => l.id === id),
      useAreas: () => () => AREAS,
    };
    render(() => (
      <EntityDataContext value={adapter}>
        <EntitySelector domain="light" entityIds={[]} onEntityIdsChange={() => {}} />
      </EntityDataContext>
    ));
    await press(document.querySelector('[data-slot="entity-selector-trigger"]') as HTMLElement);
    const sofa = await screen.findByRole("option", { name: /Sofa lamp/ });
    await userEvent.hover(sofa);
    expect(sofa.hasAttribute("data-highlighted")).toBe(true);

    setLights([light("light.armchair", "Armchair lamp"), ...LIGHTS.map((l) => ({ ...l }))]);
    flush();

    expect(screen.getByRole("option", { name: /Sofa lamp/ })).toBe(sofa);
    expect(sofa.hasAttribute("data-highlighted")).toBe(true);
    const search = document.querySelector('input[role="combobox"]');
    expect(search?.getAttribute("aria-activedescendant")).toBe(sofa.id);
  });

  it("ImagePicker: a reload that changes a picture's usage keeps its tile", async () => {
    let reloads = 0;
    const store: MediaStore = {
      index: async () => ({
        media: reloads++ === 0 ? [image("a", 2), image("b", 0)] : [image("a", 2), image("b", 1)],
        usage: { bytes: 2468, limitBytes: 524_288_000, files: 2, limitFiles: 50 },
      }),
      upload: async () => image("b", 1),
      remove: async () => {},
      url: () => PIXEL,
    };
    const [value, setValue] = createSignal("");
    render(() => (
      <MediaStoreContext value={store}>
        <ImagePicker value={value()} onChange={setValue} />
      </MediaStoreContext>
    ));
    await press(document.querySelector('[data-slot="image-picker-trigger"]') as HTMLElement);
    const tile = await screen.findByRole("button", { name: "Use b" });

    await userEvent.upload(
      screen.getByTestId("image-upload-input"),
      new File(["x"], "x.png", { type: "image/png" }),
    );
    await expect.poll(value).toBe("b");
    flush();

    expect(screen.getByRole("button", { name: "Use b" })).toBe(tile);
  });
});
