import { englishFormat, type UiFormat } from "../lib/format.js";
import { englishUiText, type UiText } from "../lib/text.js";
import { formatBytes } from "./charts.js";
import { type MediaQuotaUsage, MediaStoreError, type MediaStoreErrorKind } from "./media-store.js";

type Copy = (text: UiText, format: UiFormat, usage?: MediaQuotaUsage) => string;

/** One table for every surface that shows a media failure: the picker, the settings
 *  section, the library. */
const STORE_ERROR_COPY: Record<MediaStoreErrorKind, Copy> = {
  file_too_large: (text) => text("ui.media.file-too-large"),
  image_too_large: (text) => text("ui.media.image-too-large"),
  not_an_image: (text) => text("ui.media.not-an-image"),
  quota_bytes_exceeded: (text, format, usage) =>
    usage
      ? text("ui.media.quota-bytes-used", {
          used: formatBytes(usage.bytes, format),
          limit: formatBytes(usage.limitBytes, format),
        })
      : text("ui.media.quota-bytes"),
  quota_files_exceeded: (text, _format, usage) =>
    usage
      ? text("ui.media.quota-files-used", { files: usage.files, limit: usage.limitFiles })
      : text("ui.media.quota-files"),
  upload_rate_exceeded: (text) => text("ui.media.upload-rate"),
  server_storage_full: (text) => text("ui.media.server-full"),
  no_active_household: (text) => text("ui.media.no-household"),
  upload_failed: (text) => text("ui.media.upload-failed"),
};

export function toMediaStoreError(cause: unknown): MediaStoreError {
  return cause instanceof MediaStoreError ? cause : new MediaStoreError("upload_failed");
}

export function mediaStoreErrorCopy(
  error: MediaStoreError,
  text: UiText = englishUiText,
  format: UiFormat = englishFormat,
): string {
  return STORE_ERROR_COPY[error.kind](text, format, error.usage);
}

export function mediaIndexErrorCopy(error: MediaStoreError, text: UiText = englishUiText): string {
  return text(
    error.kind === "no_active_household" ? "ui.media.index-no-household" : "ui.media.index-failed",
  );
}
