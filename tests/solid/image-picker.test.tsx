import { cleanup, fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImagePicker } from "../../src/solid/image-picker.jsx";
import {
	MEDIA_PAGE_SIZE,
	type MediaIndex,
	type MediaStore,
	MediaStoreContext,
	MediaStoreError,
	type StoredMedia,
} from "../../src/solid/media-store.js";

const image = (id: string, usedBy = 0): StoredMedia => ({
	id,
	mimeType: "image/png",
	width: 100,
	height: 80,
	size: 1234,
	usedBy,
});

const indexOf = (media: StoredMedia[]): MediaIndex => ({
	media,
	usage: { bytes: 104_857_600, limitBytes: 524_288_000, files: 3, limitFiles: 50 },
});

function storeWith(overrides: Partial<MediaStore> = {}): MediaStore {
	return {
		index: async () => indexOf([image("a", 2), image("b")]),
		upload: async () => image("c"),
		remove: async () => {},
		url: (id, variant) => (variant === "thumb" ? `/api/images/${id}/thumb` : `/api/images/${id}`),
		...overrides,
	};
}

const withStore = (store: MediaStore, ui: () => unknown) =>
	render(() => (
		<MediaStoreContext.Provider value={store}>{ui() as never}</MediaStoreContext.Provider>
	));

const trigger = () =>
	document.querySelector('[data-slot="image-picker-trigger"]') as HTMLButtonElement;

const gallery = () => document.querySelector('[data-slot="popover-content"][data-expanded]');

const openGallery = () => fireEvent.click(trigger());

/** Kobalte dismisses on a capture-phase pointerdown, so a press is not just a click. */
const press = (el: Element) => {
	fireEvent.pointerDown(el);
	fireEvent.pointerUp(el);
	fireEvent.click(el);
};

function first<T>(items: T[], label: string): T {
	const item = items[0];
	if (item === undefined) throw new Error(`expected at least one ${label}`);
	return item;
}

const firstMediaTile = () => first(screen.getAllByTestId("media-tile"), "media tile");

const uploadButton = () =>
	document.querySelector('[data-slot="image-picker-upload"]') as HTMLButtonElement;

const uploadFile = () => {
	const input = screen.getByTestId("image-upload-input") as HTMLInputElement;
	Object.defineProperty(input, "files", {
		value: [new File(["x"], "x.png", { type: "image/png" })],
	});
	fireEvent.change(input);
};

afterEach(cleanup);

describe("ImagePicker", () => {
	it("renders a notice when no store is available", () => {
		render(() => <ImagePicker value="" onChange={() => {}} />);
		expect(screen.getByText(/dashboard cannot store images/i)).toBeTruthy();
	});

	it("wears a full-width recessed field, not a raised auto-width button", () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);
		expect(trigger().className).toContain("w-full");
		expect(trigger().className).toContain("glass-sink");
	});

	it("opens, closes, and opens again", async () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);

		press(trigger());
		await waitFor(() => expect(gallery()).not.toBeNull());
		// Modal is what keeps the press that dismisses from also re-firing the trigger's toggle.
		expect(document.body.style.pointerEvents).toBe("none");

		press(trigger());
		await waitFor(() => expect(gallery()).toBeNull());

		press(trigger());
		await waitFor(() => expect(gallery()).not.toBeNull());
	});

	it("reads as an empty field when nothing is chosen", () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);
		expect(trigger().querySelector("img")).toBeNull();
		expect(trigger().textContent).toMatch(/choose image/i);
		expect(trigger().querySelector(".text-muted-foreground")).not.toBeNull();
	});

	it("marks a broken tile with a glyph, not a grey fill a loading tile shares", async () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		expect(screen.queryByTestId("media-tile-broken")).toBeNull();

		fireEvent.error(firstMediaTile().querySelector("img") as HTMLImageElement);
		await waitFor(() => expect(screen.getAllByTestId("media-tile-broken").length).toBe(1));
	});

	it("queries the index once, and only after the gallery is opened", async () => {
		const index = vi.fn(async () => indexOf([image("a", 2), image("b")]));
		withStore(storeWith({ index }), () => <ImagePicker value="" onChange={() => {}} />);
		expect(index).not.toHaveBeenCalled();

		openGallery();
		await waitFor(() => expect(screen.getAllByTestId("media-tile").length).toBe(2));
		expect(index).toHaveBeenCalledTimes(1);
	});

	it("lists images once opened, unused first and badged", async () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => expect(screen.getAllByTestId("media-tile").length).toBe(2));
		expect(screen.getAllByTestId("media-tile-unused").length).toBe(1);
		expect(screen.getByTestId("media-tile-unused").textContent).toBe("Unused");
		expect(screen.getByRole("button", { name: "Use b" })).toBeTruthy();
	});

	it("skips a row with no usable mime instead of crashing the gallery", async () => {
		// A server short a field is what the type says cannot happen, and what shipped.
		const mimeless = { id: "z", width: 100, height: 80, size: 1234, usedBy: 0 } as Omit<
			StoredMedia,
			"mimeType"
		> as StoredMedia;
		withStore(storeWith({ index: async () => indexOf([image("a", 2), mimeless]) }), () => (
			<ImagePicker value="" onChange={() => {}} />
		));
		openGallery();
		await waitFor(() => expect(screen.getAllByTestId("media-tile").length).toBe(1));
		expect(gallery()).not.toBeNull();
	});

	it("resolves tile sources through the store, not a server-sent url", async () => {
		withStore(
			storeWith({
				url: (id, variant) =>
					`http://host:3123/api/images/${id}${variant === "thumb" ? "/thumb" : ""}`,
			}),
			() => <ImagePicker value="" onChange={() => {}} />,
		);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		const tile = firstMediaTile().querySelector("img");
		expect(tile?.getAttribute("src")).toBe("http://host:3123/api/images/b/thumb");
	});

	it("draws gallery tiles from the thumbnail and the trigger from the original", async () => {
		withStore(storeWith(), () => <ImagePicker value="a" onChange={() => {}} />);
		expect(trigger().querySelector("img")?.getAttribute("src")).toBe("/api/images/a");
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		for (const tile of screen.getAllByTestId("media-tile")) {
			const img = tile.querySelector("img") as HTMLImageElement;
			expect(img.getAttribute("src")?.endsWith("/thumb")).toBe(true);
			expect(img.getAttribute("loading")).toBe("lazy");
			expect(img.getAttribute("decoding")).toBe("async");
		}
	});

	it("falls back when a tile's file is gone", async () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		const tile = firstMediaTile();
		const img = tile.querySelector("img") as HTMLImageElement;
		fireEvent.error(img);
		await waitFor(() => expect(tile.querySelector("img")).toBeNull());
	});

	it("recovers a tile once its resolved src changes", async () => {
		const [src, setSrc] = createSignal("data:image/gif;base64,placeholder");
		withStore(storeWith({ url: () => src() }), () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		const tile = firstMediaTile();
		fireEvent.error(tile.querySelector("img") as HTMLImageElement);
		await waitFor(() => expect(tile.querySelector("img")).toBeNull());

		setSrc("blob:resolved");
		await waitFor(() => expect(tile.querySelector("img")).not.toBeNull());
	});

	it("reports the chosen id", async () => {
		const onChange = vi.fn();
		withStore(storeWith(), () => <ImagePicker value="" onChange={onChange} />);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		fireEvent.click(firstMediaTile());
		expect(onChange).toHaveBeenCalledWith("b");
	});

	it("templates a quota refusal from the error kind, not its message", async () => {
		const store = storeWith({
			upload: async () => {
				throw new MediaStoreError("quota_bytes_exceeded", {
					bytes: 250_000_000,
					limitBytes: 262_144_000,
					files: 12,
					limitFiles: 500,
				});
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getByTestId("image-upload-input"));
		uploadFile();
		await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/238 MB of 250 MB/i));
		// The upload surface stays an Alert; only the gallery-load failure is an empty state.
		expect(screen.getByRole("alert").dataset.slot).toBe("alert");
		expect(screen.queryByRole("status")).toBeNull();
	});

	it("templates an upload_failed refusal, distinct from the file-too-large copy", async () => {
		const store = storeWith({
			upload: async () => {
				throw new MediaStoreError("upload_failed");
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getByTestId("image-upload-input"));
		uploadFile();
		await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/sign in again/i));
		expect(screen.getByRole("alert").textContent).not.toMatch(/too large to upload/i);
	});

	it("renders the server-provided quota limits and refetches them after an upload", async () => {
		const index = vi.fn(async () => indexOf([image("a")]));
		const store = storeWith({
			index,
			upload: async () => {
				index.mockResolvedValueOnce({
					media: [image("a"), image("c")],
					usage: { bytes: 209_715_200, limitBytes: 524_288_000, files: 4, limitFiles: 50 },
				});
				return image("c");
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => expect(screen.getByText(/100 MB of 500 MB/i)).toBeTruthy());
		uploadFile();
		await waitFor(() => expect(screen.getByText(/200 MB of 500 MB/i)).toBeTruthy());
	});

	it("refetches the gallery after a delete", async () => {
		const index = vi.fn(async () => indexOf([image("a")]));
		const store = storeWith({ index, remove: async () => {} });
		withStore(store, () => <ImagePicker value="a" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		fireEvent.click(first(screen.getAllByRole("button", { name: /^delete a$/i }), "delete button"));
		fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
		await waitFor(() => expect(index.mock.calls.length).toBeGreaterThan(1));
	});

	it("opens as the field expanding, not a raised floating panel", async () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);
		press(trigger());
		await waitFor(() => expect(gallery()).not.toBeNull());
		const content = gallery() as HTMLElement;
		expect(content.dataset.surface).toBe("field");
		expect(content.className).toContain("glass-sink");
	});

	it("disables Upload and says so while an upload is in flight", async () => {
		let settle: ((uploaded: StoredMedia) => void) | undefined;
		const store = storeWith({
			upload: () =>
				new Promise<StoredMedia>((resolve) => {
					settle = resolve;
				}),
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getByTestId("image-upload-input"));
		expect(uploadButton().disabled).toBe(false);

		uploadFile();
		await waitFor(() => expect(uploadButton().disabled).toBe(true));
		expect(uploadButton().textContent).toMatch(/uploading/i);

		settle?.(image("c"));
		await waitFor(() => expect(uploadButton().disabled).toBe(false));
		expect(uploadButton().textContent).toMatch(/^\s*Upload\s*$/);
	});

	it("clears a failed upload's banner when the gallery is reopened", async () => {
		const store = storeWith({
			upload: async () => {
				throw new MediaStoreError("upload_failed");
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		press(trigger());
		await waitFor(() => expect(gallery()).not.toBeNull());
		uploadFile();
		await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());

		press(trigger());
		await waitFor(() => expect(gallery()).toBeNull());
		press(trigger());
		await waitFor(() => expect(gallery()).not.toBeNull());
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("carries the field id on the trigger so a Label points at a real control", async () => {
		withStore(storeWith(), () => <ImagePicker id="widget.art" value="" onChange={() => {}} />);
		expect(trigger().id).toBe("widget.art");
	});

	it("mounts one page of tiles, not the whole library, and pages through the rest", async () => {
		const many = Array.from({ length: MEDIA_PAGE_SIZE + 6 }, (_, i) =>
			image(`i${String(i).padStart(2, "0")}`),
		);
		withStore(storeWith({ index: async () => indexOf(many) }), () => (
			<ImagePicker value="" onChange={() => {}} />
		));
		openGallery();
		await waitFor(() => expect(screen.getAllByTestId("media-tile").length).toBe(MEDIA_PAGE_SIZE));
		expect(screen.getByTestId("image-picker-page-label").textContent).toMatch(/page 1 of 2/i);

		fireEvent.click(screen.getByRole("link", { name: /next/i }));
		await waitFor(() => expect(screen.getAllByTestId("media-tile").length).toBe(6));
	});

	it("keeps the gallery scrollable inside a bounded height", async () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		const grid = document.querySelector('[data-slot="image-picker-gallery"]') as HTMLElement;
		expect(grid.className).toContain("overflow-y-auto");
		expect(grid.className).toMatch(/max-h-/);
	});

	it("shows a retryable failure, not skeletons or the empty state, when the index rejects", async () => {
		const store = storeWith({
			index: async () => {
				throw new MediaStoreError("upload_failed");
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();

		await waitFor(() => expect(screen.getByText(/your photos couldn't be listed/i)).toBeTruthy());
		expect(document.querySelector('[data-slot="image-picker-loading"]')).toBeNull();
		expect(screen.queryByText(/no images yet/i)).toBeNull();
		expect(screen.queryAllByTestId("media-tile").length).toBe(0);
	});

	it("renders the index failure as an empty state, not an alert", async () => {
		const store = storeWith({
			index: async () => {
				throw new MediaStoreError("upload_failed");
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();

		const failure = await waitFor(() => screen.getByRole("status"));
		expect(failure.dataset.slot).toBe("empty");
		expect(failure.querySelector('[data-slot="empty-title"]')?.textContent).toMatch(
			/images unavailable/i,
		);
		expect(failure.querySelector('[data-slot="empty-description"]')?.textContent).toMatch(
			/your photos couldn't be listed/i,
		);
		expect(failure.querySelector('[data-slot="empty-media"]')).toBeTruthy();
		expect(
			failure.querySelector('[data-slot="empty-content"] [data-slot="image-picker-retry"]'),
		).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
		expect(document.querySelector('[data-slot="alert"]')).toBeNull();
	});

	it("renders the no-household index failure as the same empty state", async () => {
		const store = storeWith({
			index: async () => {
				throw new MediaStoreError("no_active_household");
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();

		await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
		expect(
			screen.getByText(/no household is active, so your photos can't be listed/i),
		).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("retries a failed index and recovers to tiles", async () => {
		let failing = true;
		const index = vi.fn(async () => {
			if (failing) throw new MediaStoreError("upload_failed");
			return indexOf([image("a")]);
		});
		withStore(storeWith({ index }), () => <ImagePicker value="" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getByRole("button", { name: /try again/i }));

		failing = false;
		fireEvent.click(screen.getByRole("button", { name: /try again/i }));
		await waitFor(() => expect(screen.getAllByTestId("media-tile").length).toBe(1));
		expect(index.mock.calls.length).toBeGreaterThan(1);
	});

	it("still reopens after the index rejected", async () => {
		const store = storeWith({
			index: async () => {
				throw new MediaStoreError("upload_failed");
			},
		});
		withStore(store, () => <ImagePicker value="" onChange={() => {}} />);
		press(trigger());
		await waitFor(() => expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy());

		press(trigger());
		await waitFor(() => expect(gallery()).toBeNull());
		press(trigger());
		await waitFor(() => expect(gallery()).not.toBeNull());
	});

	it("surfaces a rejecting remove and closes the confirmation", async () => {
		const store = storeWith({
			remove: async () => {
				throw new MediaStoreError("upload_failed");
			},
		});
		withStore(store, () => <ImagePicker value="a" onChange={() => {}} />);
		openGallery();
		await waitFor(() => screen.getAllByTestId("media-tile"));
		fireEvent.click(first(screen.getAllByRole("button", { name: /^delete a$/i }), "delete button"));
		fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

		await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/didn't work/i));
		// Kobalte keeps the closed dialog mounted for its exit animation, so presence isn't the signal.
		await waitFor(() =>
			expect(
				document.querySelector('[data-slot="alert-dialog-content"][data-expanded]'),
			).toBeNull(),
		);
	});
});

describe("ImagePicker built-in pictures", () => {
	const presets = {
		living: { label: "Living room", thumb: "data:image/webp;base64,living" },
		kitchen: { label: "Kitchen", thumb: "data:image/webp;base64,kitchen" },
	};
	const presetTiles = () =>
		Array.from(
			document.querySelectorAll<HTMLButtonElement>('[data-slot="image-picker-preset"] button'),
		);
	const galleryTiles = () =>
		Array.from(document.querySelectorAll('[data-slot="image-picker-gallery"] > *')).map((el) =>
			el.getAttribute("data-slot"),
		);

	it("puts the built-in pictures first in the one grid, each tagged, before the uploads", async () => {
		withStore(storeWith(), () => <ImagePicker value="" onChange={() => {}} presets={presets} />);
		openGallery();
		await waitFor(() => expect(galleryTiles()).toHaveLength(4));
		expect(galleryTiles()).toEqual([
			"image-picker-preset",
			"image-picker-preset",
			"media-tile",
			"media-tile",
		]);
		expect(screen.getAllByText("Built in")).toHaveLength(2);
	});

	it("picking a built-in picture stores its preset value", async () => {
		const onChange = vi.fn();
		withStore(storeWith(), () => <ImagePicker value="" onChange={onChange} presets={presets} />);
		openGallery();
		await waitFor(() => expect(presetTiles()).toHaveLength(2));
		press(first(presetTiles(), "preset tile"));
		expect(onChange).toHaveBeenLastCalledWith("preset:living");
	});

	it("names the picked built-in picture on the trigger", () => {
		withStore(storeWith(), () => (
			<ImagePicker value="preset:kitchen" onChange={() => {}} presets={presets} />
		));
		expect(trigger().textContent).toContain("Kitchen");
		expect(trigger().querySelector("img")?.getAttribute("src")).toBe(presets.kitchen.thumb);
	});

	it("still offers them where the dashboard cannot store images", async () => {
		render(() => <ImagePicker value="" onChange={() => {}} presets={presets} />);
		expect(screen.queryByText(/dashboard cannot store images/i)).toBeNull();
		openGallery();
		await waitFor(() => expect(presetTiles()).toHaveLength(2));
		expect(document.querySelector('[data-slot="image-picker-upload"]')).toBeNull();
	});
});
