import { cleanup, render, screen, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { ImagePicker } from "../../src/solid/image-picker.jsx";
import {
  type MediaStore,
  MediaStoreContext,
  mediaUrl,
  provideMediaStore,
  provideMediaUrls,
} from "../../src/solid/media-store.js";

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const presets = { a: { label: "A", thumb: PIXEL } };
const store: MediaStore = {
  index: async () => ({ media: [], usage: { bytes: 0, limitBytes: 9, files: 0, limitFiles: 9 } }),
  upload: async () => ({ id: "n", mimeType: "image/png", size: 1, usedBy: 0 }),
  remove: async () => {},
  url: (id) => `${PIXEL}#${id}`,
};
const trigger = () => document.querySelector('[data-slot="image-picker-trigger"]') as HTMLElement;
afterEach(cleanup);

it("resolves an uploaded id through the url source when no store is provided", () => {
  provideMediaUrls({ url: (id) => (id === "abc" ? `${PIXEL}#abc` : undefined) });
  expect(mediaUrl("abc")).toBe(`${PIXEL}#abc`);
  expect(mediaUrl("zzz")).toBeUndefined();
});

it("shows the current upload and says uploading is unavailable, beside the built-ins", async () => {
  provideMediaUrls({ url: (id) => `${PIXEL}#${id}` });
  render(() => <ImagePicker value="abc" onChange={() => {}} presets={presets} />);
  expect(trigger().querySelector("img")?.getAttribute("src")).toBe(`${PIXEL}#abc`);
  await userEvent.click(trigger());
  await waitFor(() =>
    expect(screen.getByText("Uploading images isn't available here.")).toBeTruthy(),
  );
  expect(document.querySelector('[data-slot="image-picker-upload"]')).toBeNull();
});

it("still resolves urls in a tree whose store is withheld", () => {
  provideMediaUrls({ url: (id) => `${PIXEL}#${id}` });
  let resolved: string | undefined;
  render(() => (
    <MediaStoreContext.Provider value={null}>
      {(() => {
        resolved = mediaUrl("abc");
        return null;
      })()}
    </MediaStoreContext.Provider>
  ));
  expect(resolved).toBe(`${PIXEL}#abc`);
});

it("reads a store accessor each time a picker mounts", async () => {
  const [lent, setLent] = createSignal<MediaStore | null>(null);
  provideMediaStore(lent);
  render(() => <ImagePicker value="" onChange={() => {}} />);
  expect(screen.getByText("Uploading images isn't available here.")).toBeTruthy();
  cleanup();
  setLent(store);
  render(() => <ImagePicker value="" onChange={() => {}} presets={presets} />);
  await userEvent.click(trigger());
  await waitFor(() =>
    expect(document.querySelector('[data-slot="image-picker-upload"]')).not.toBeNull(),
  );
  expect(screen.queryByText("Uploading images isn't available here.")).toBeNull();
});
