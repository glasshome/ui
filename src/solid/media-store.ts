import { createContext, createSignal, useContext } from "solid-js";

export type StoredMedia = {
	id: string;
	mimeType: string;
	width?: number;
	height?: number;
	size: number;
	/** Server-computed count of live widget configs referencing this id. */
	usedBy: number;
};

export type MediaQuotaUsage = {
	bytes: number;
	limitBytes: number;
	files: number;
	limitFiles: number;
};

export type MediaStoreErrorKind =
	| "file_too_large"
	| "image_too_large"
	| "not_an_image"
	| "quota_bytes_exceeded"
	| "quota_files_exceeded"
	| "upload_rate_exceeded"
	| "server_storage_full"
	| "no_active_household"
	| "upload_failed";

export class MediaStoreError extends Error {
	readonly kind: MediaStoreErrorKind;
	readonly usage?: MediaQuotaUsage;

	constructor(kind: MediaStoreErrorKind, usage?: MediaQuotaUsage) {
		super(kind);
		this.name = "MediaStoreError";
		this.kind = kind;
		this.usage = usage;
	}
}

/** One gallery open, one query: the server counts usage in the same scan. */
export type MediaIndex = {
	media: StoredMedia[];
	usage: MediaQuotaUsage;
};

/** "thumb" is a server-side derivative, longest edge ~400px, for grids. */
export type MediaVariant = "original" | "thumb";

export interface MediaStore {
	index(): Promise<MediaIndex>;
	upload(file: File): Promise<StoredMedia>;
	remove(id: string): Promise<void>;
	url(id: string, variant?: MediaVariant): string;
}

export const MediaStoreContext = createContext<MediaStore>();

let defaultStore: MediaStore | undefined;

/** Host apps call this once at startup; MediaStoreContext overrides it per-tree. */
export function provideMediaStore(store: MediaStore): void {
	defaultStore = store;
}

export function useMediaStore(): MediaStore | undefined {
	return useContext(MediaStoreContext) ?? defaultStore;
}

/** One grid page. The picker and the library both slice by this, so neither can
 *  mount a whole 500-file library at once. */
export const MEDIA_PAGE_SIZE = 24;

/** A row whose mime is missing or not a string is not an image; a throw here would
 *  take the surrounding gallery down with it. */
export function isMediaImage(item: StoredMedia): boolean {
	return typeof item.mimeType === "string" && item.mimeType.startsWith("image/");
}

/** Unused first: someone browsing stored media is looking for what is safe to delete. */
export function sortMediaForClearing(media: StoredMedia[]): StoredMedia[] {
	return media.filter(isMediaImage).sort((a, b) => {
		if ((a.usedBy === 0) !== (b.usedBy === 0)) return a.usedBy === 0 ? -1 : 1;
		return a.id.localeCompare(b.id);
	});
}

export interface BrokenMedia {
	isBroken: (item: StoredMedia) => boolean;
	markBroken: (item: StoredMedia) => void;
}

/** Keyed by the url that failed, so a re-uploaded id (new url) starts unbroken again. */
export function createBrokenMedia(thumbUrl: (id: string) => string): BrokenMedia {
	const [broken, setBroken] = createSignal<Readonly<Record<string, string>>>({});
	return {
		isBroken: (item) => broken()[item.id] === thumbUrl(item.id),
		markBroken: (item) => setBroken((previous) => ({ ...previous, [item.id]: thumbUrl(item.id) })),
	};
}

const PRESET_PREFIX = "preset:";

/** A built-in picture a widget offers beside the household's own uploads. */
export interface ImagePreset {
	label: string;
	/** Small image for the picker; the widget keeps the full picture. */
	thumb: string;
}

/** The stored value that picks a built-in picture. */
export function presetValue(key: string): string {
	return `${PRESET_PREFIX}${key}`;
}

/** The built-in picture a stored image value names, or undefined for an upload. */
export function imagePreset(value: string | null | undefined): string | undefined {
	return value?.startsWith(PRESET_PREFIX) ? value.slice(PRESET_PREFIX.length) : undefined;
}

export function mediaUrl(id: string | null | undefined): string | undefined {
	if (!id || imagePreset(id) !== undefined) return undefined;
	return useMediaStore()?.url(id);
}

/**
 * Reads better than mediaUrl in an image widget's source.
 * @alias
 */
export const imageUrl = mediaUrl;
