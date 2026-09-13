/* Every field-shaped picker drops its value two ways: a clear button on the
 * trigger, and a re-tap on the row or tile already picked. One test file so a
 * picker that grows a third door, or loses one, shows up beside its siblings. */
import { cleanup, fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { AreaPicker } from "../../src/solid/area-picker.js";
import {
	type AreaViewLike,
	type EntityDataAdapter,
	EntityDataContext,
	type EntityViewLike,
} from "../../src/solid/entity-data.js";
import { EntitySelector } from "../../src/solid/entity-selector.js";
import { IconPicker } from "../../src/solid/icon-picker.js";
import { ImagePicker } from "../../src/solid/image-picker.jsx";
import {
	type MediaIndex,
	type MediaStore,
	MediaStoreContext,
	type StoredMedia,
} from "../../src/solid/media-store.js";

const AREAS: AreaViewLike[] = [
	{ id: "kitchen", name: "Kitchen", icon: "mdi:silverware", entityIds: ["light.counter"] },
	{ id: "bedroom", name: "Bedroom", icon: "mdi:bed", entityIds: [] },
];

const ENTITY: EntityViewLike = {
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
	entityIdsByDomain: () => ({ light: [ENTITY.id] }),
	useEntities: () => () => [ENTITY],
	getEntityView: (id) => (id === ENTITY.id ? ENTITY : undefined),
	useAreas: () => () => AREAS,
};

const media: StoredMedia = {
	id: "a",
	mimeType: "image/png",
	width: 100,
	height: 80,
	size: 1234,
	usedBy: 0,
};

const mediaIndex: MediaIndex = {
	media: [media],
	usage: { bytes: 1234, limitBytes: 524_288_000, files: 1, limitFiles: 50 },
};

const store: MediaStore = {
	index: async () => mediaIndex,
	upload: async () => media,
	remove: async () => {},
	url: (id, variant) => (variant === "thumb" ? `/api/images/${id}/thumb` : `/api/images/${id}`),
};

const clearButton = () =>
	document.querySelector('[data-slot="picker-trigger-clear"]') as HTMLButtonElement | null;

const triggerOf = (slot: string) =>
	document.querySelector(`[data-slot="${slot}"]`) as HTMLButtonElement;

function row(slot: string, text: string) {
	const found = Array.from(document.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)).find(
		(el) => el.textContent?.includes(text),
	);
	if (!found) throw new Error(`no ${slot} for ${text}`);
	return found;
}

afterEach(() => {
	cleanup();
	document.body.innerHTML = "";
});

describe("picker deselect", () => {
	describe("AreaPicker", () => {
		const mount = (initial: string) => {
			const [value, setValue] = createSignal(initial);
			render(() => (
				<EntityDataContext.Provider value={adapter}>
					<AreaPicker value={value()} onChange={setValue} />
				</EntityDataContext.Provider>
			));
			return value;
		};

		it("clears from the trigger", () => {
			const value = mount("kitchen");
			fireEvent.click(clearButton() as HTMLButtonElement);
			expect(value()).toBe("");
		});

		it("clears on a re-tap of the picked row", () => {
			const value = mount("kitchen");
			fireEvent.click(triggerOf("area-picker-trigger"));
			fireEvent.click(row("area-picker-row", "Kitchen"));
			expect(value()).toBe("");
		});

		it("wears no clear button with nothing picked", () => {
			mount("");
			expect(clearButton()).toBeNull();
		});

		it("wears no clear button when the caller refused clearing", () => {
			const [value, setValue] = createSignal("kitchen");
			render(() => (
				<EntityDataContext.Provider value={adapter}>
					<AreaPicker value={value()} onChange={setValue} allowClear={false} />
				</EntityDataContext.Provider>
			));
			expect(clearButton()).toBeNull();
		});
	});

	describe("EntitySelector", () => {
		const mount = (initial: string[]) => {
			const [ids, setIds] = createSignal(initial);
			render(() => (
				<EntityDataContext.Provider value={adapter}>
					<EntitySelector
						domain="light"
						multiple={false}
						entityIds={ids()}
						onEntityIdsChange={setIds}
					/>
				</EntityDataContext.Provider>
			));
			return ids;
		};

		it("clears from the trigger", () => {
			const ids = mount([ENTITY.id]);
			fireEvent.click(clearButton() as HTMLButtonElement);
			expect(ids()).toEqual([]);
		});

		it("clears on a re-tap of the picked row", () => {
			const ids = mount([ENTITY.id]);
			fireEvent.click(triggerOf("entity-selector-trigger"));
			fireEvent.click(row("entity-selector-row", "Counter"));
			expect(ids()).toEqual([]);
		});

		it("wears a clear button in multi mode too", () => {
			const [ids, setIds] = createSignal([ENTITY.id]);
			render(() => (
				<EntityDataContext.Provider value={adapter}>
					<EntitySelector domain="light" entityIds={ids()} onEntityIdsChange={setIds} />
				</EntityDataContext.Provider>
			));
			fireEvent.click(clearButton() as HTMLButtonElement);
			expect(ids()).toEqual([]);
		});
	});

	describe("IconPicker", () => {
		const mount = (initial: string) => {
			const [value, setValue] = createSignal(initial);
			render(() => <IconPicker value={value()} onChange={setValue} />);
			return value;
		};

		it("clears from the trigger", () => {
			const value = mount("mdi:home");
			fireEvent.click(clearButton() as HTMLButtonElement);
			expect(value()).toBe("");
		});

		it("clears on a re-tap of the picked icon", () => {
			const value = mount("mdi:home");
			fireEvent.click(triggerOf("icon-picker-trigger"));
			// aria-pressed alone also matches the library tabs; the grid keys its buttons by title.
			const picked = document.querySelector('button[title="mdi:home"]');
			fireEvent.click(picked as HTMLButtonElement);
			expect(value()).toBe("");
		});

		it("wears no clear button with nothing picked", () => {
			mount("");
			expect(clearButton()).toBeNull();
		});
	});

	describe("ImagePicker", () => {
		const mount = (initial: string) => {
			const [value, setValue] = createSignal(initial);
			render(() => (
				<MediaStoreContext.Provider value={store}>
					<ImagePicker value={value()} onChange={setValue} />
				</MediaStoreContext.Provider>
			));
			return value;
		};

		it("clears from the trigger", () => {
			const value = mount("a");
			fireEvent.click(clearButton() as HTMLButtonElement);
			expect(value()).toBe("");
		});

		it("clears on a re-tap of the picked tile", async () => {
			const value = mount("a");
			fireEvent.click(triggerOf("image-picker-trigger"));
			await waitFor(() => screen.getAllByTestId("media-tile"));
			fireEvent.click(screen.getByRole("button", { name: /^use a$/i }));
			expect(value()).toBe("");
		});

		it("wears no clear button with nothing picked", () => {
			mount("");
			expect(clearButton()).toBeNull();
		});
	});
});
