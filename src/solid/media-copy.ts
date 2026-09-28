import { formatBytes } from "./charts.js";
import { type MediaQuotaUsage, MediaStoreError, type MediaStoreErrorKind } from "./media-store.js";

/** One table for every surface that shows a media failure: the picker, the settings
 *  section, the library. Two tables drifted apart once already. */
const STORE_ERROR_COPY: Record<MediaStoreErrorKind, (usage?: MediaQuotaUsage) => string> = {
  file_too_large: () => "That file is too large to upload.",
  image_too_large: () => "That image's dimensions are too large.",
  not_an_image: () => "That file isn't an image.",
  quota_bytes_exceeded: (usage) =>
    usage
      ? `You've used ${formatBytes(usage.bytes)} of ${formatBytes(usage.limitBytes)} of photo storage. Delete a photo to free up space.`
      : "You're out of photo storage. Delete a photo to free up space.",
  quota_files_exceeded: (usage) =>
    usage
      ? `You've stored ${usage.files} of ${usage.limitFiles} photos. Delete one to add another.`
      : "You've reached the photo limit. Delete one to add another.",
  upload_rate_exceeded: () => "Too many uploads at once. Wait a moment and try again.",
  server_storage_full: () =>
    "The dashboard's photo storage is full. Whoever runs this dashboard needs to free up space on the server.",
  no_active_household: () => "No household is active, so photos can't be stored right now.",
  upload_failed: () => "That didn't work. Try again, and sign in again if it keeps failing.",
};

export function toMediaStoreError(cause: unknown): MediaStoreError {
  return cause instanceof MediaStoreError ? cause : new MediaStoreError("upload_failed");
}

export function mediaStoreErrorCopy(error: MediaStoreError): string {
  return STORE_ERROR_COPY[error.kind](error.usage);
}

export function mediaIndexErrorCopy(error: MediaStoreError): string {
  return error.kind === "no_active_household"
    ? "No household is active, so your photos can't be listed right now."
    : "Your photos couldn't be listed. The dashboard may have lost the server.";
}
