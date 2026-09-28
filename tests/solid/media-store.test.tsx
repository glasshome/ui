import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  imageUrl,
  type MediaStore,
  MediaStoreContext,
  mediaUrl,
  provideMediaStore,
  useMediaStore,
} from "../../src/solid/media-store.js";

function stubStore(prefix: string): MediaStore {
  return {
    index: async () => ({
      media: [],
      usage: { bytes: 0, limitBytes: 0, files: 0, limitFiles: 0 },
    }),
    upload: async () => {
      throw new Error("not used");
    },
    remove: async () => {},
    url: (id) => `${prefix}/${id}`,
  };
}

describe("media store singleton", () => {
  it("returns undefined for an absent id", () => {
    provideMediaStore(stubStore("/api/images"));
    expect(mediaUrl(undefined)).toBeUndefined();
    expect(mediaUrl(null)).toBeUndefined();
    expect(mediaUrl("")).toBeUndefined();
  });

  it("resolves through the registered store outside any component", () => {
    provideMediaStore(stubStore("/api/images"));
    expect(mediaUrl("abc")).toBe("/api/images/abc");
  });

  it("prefers a context store over the singleton", () => {
    provideMediaStore(stubStore("/singleton"));
    let seen: string | undefined;
    render(() => (
      <MediaStoreContext.Provider value={stubStore("/context")}>
        {(() => {
          seen = mediaUrl("abc");
          return null;
        })()}
      </MediaStoreContext.Provider>
    ));
    expect(seen).toBe("/context/abc");
  });

  it("exposes imageUrl as an alias of mediaUrl", () => {
    expect(imageUrl).toBe(mediaUrl);
  });

  it("returns undefined when no store is registered", () => {
    provideMediaStore(undefined as unknown as MediaStore);
    expect(useMediaStore()).toBeUndefined();
    expect(mediaUrl("abc")).toBeUndefined();
  });
});
