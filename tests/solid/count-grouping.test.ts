import { describe, expect, it } from "vitest";
import { englishUiText } from "../../src/lib/text.js";
import { formatBytes } from "../../src/solid/charts.js";
import { mediaStoreErrorCopy } from "../../src/solid/media-copy.js";
import { MediaStoreError } from "../../src/solid/media-store.js";

const usage = { bytes: 1024, limitBytes: 2048, files: 1200, limitFiles: 2000 };

describe("counts group, technical values do not", () => {
  it("groups photo counts in the quota error and the usage line alike", () => {
    expect(mediaStoreErrorCopy(new MediaStoreError("quota_files_exceeded", usage))).toContain(
      "1,200 of 2,000 photos",
    );
    expect(
      englishUiText("ui.image-picker.usage", {
        used: "1 KB",
        limit: "2 KB",
        files: usage.files,
        limitFiles: usage.limitFiles,
      }),
    ).toBe("1 KB of 2 KB · 1,200 of 2,000 images");
  });

  it("groups plural counts", () =>
    expect(englishUiText("ui.image-picker.delete-line", { used: 1200 })).toBe(
      "1,200 widgets will lose the image.",
    ));

  it("leaves byte sizes ungrouped", () => expect(formatBytes(1500 * 1024 ** 3)).toBe("1500 GB"));
});
