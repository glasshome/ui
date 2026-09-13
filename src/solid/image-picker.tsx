import {
	createEffect,
	createMemo,
	createResource,
	createSignal,
	For,
	Match,
	Show,
	Switch,
} from "solid-js";
import { PICKER_LIST } from "../lib/picker-classes.js";
import { cn } from "../lib/utils.js";
import { Alert } from "./alert.js";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./alert-dialog.js";
import { Button } from "./button.js";
import { formatBytes } from "./charts.js";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "./empty.js";
import { Icon } from "./icon.js";
import { mediaIndexErrorCopy, mediaStoreErrorCopy, toMediaStoreError } from "./media-copy.js";
import {
	createBrokenMedia,
	MEDIA_PAGE_SIZE,
	type MediaStoreError,
	type StoredMedia,
	sortMediaForClearing,
	useMediaStore,
} from "./media-store.js";
import { MediaTile } from "./media-tile.js";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "./pagination.js";
import { PickerTrigger } from "./picker-trigger.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";
import { SectionMeta } from "./section-card.js";
import { Skeleton } from "./skeleton.js";

export interface ImagePickerProps {
	/** Sits on the trigger so a LabeledField's <Label for> points at a real control. */
	id?: string;
	value: string;
	onChange: (id: string) => void;
	class?: string;
}

export function ImagePicker(props: ImagePickerProps) {
	const store = useMediaStore();

	if (!store) {
		return (
			<div data-slot="image-picker" class={cn(props.class)}>
				<Alert tone="info">This dashboard cannot store images.</Alert>
			</div>
		);
	}

	const [open, setOpen] = createSignal(false);
	const [everOpened, setEverOpened] = createSignal(false);
	const [error, setError] = createSignal<MediaStoreError>();
	const [pendingDelete, setPendingDelete] = createSignal<StoredMedia>();
	const [thumbBroken, setThumbBroken] = createSignal(false);
	const [uploading, setUploading] = createSignal(false);
	const [page, setPage] = createSignal(0);
	const thumbUrl = (id: string) => store.url(id, "thumb");
	const brokenTiles = createBrokenMedia(thumbUrl);
	let fileInput: HTMLInputElement | undefined;

	const [index, { refetch }] = createResource(everOpened, () => store.index());
	// Reading index() on a rejected resource rethrows, which crashes the popover's
	// portal and leaves its overlay swallowing clicks. Every read goes through this.
	const indexError = createMemo(() =>
		index.error === undefined ? undefined : toMediaStoreError(index.error),
	);
	const loaded = () => (index.error === undefined ? index() : undefined);
	const sorted = createMemo(() => sortMediaForClearing(loaded()?.media ?? []));
	const pageCount = createMemo(() => Math.max(1, Math.ceil(sorted().length / MEDIA_PAGE_SIZE)));
	const current = createMemo(() => Math.min(page(), pageCount() - 1));
	const pageImages = createMemo(() =>
		sorted().slice(current() * MEDIA_PAGE_SIZE, current() * MEDIA_PAGE_SIZE + MEDIA_PAGE_SIZE),
	);
	const deleteDescription = createMemo(() => {
		const used = pendingDelete()?.usedBy ?? 0;
		return used === 0
			? "This image isn't used by any widget."
			: `This image is used in ${used} widget${used === 1 ? "" : "s"}. Deleting it will leave those widgets without an image.`;
	});

	const clearImage = () => {
		props.onChange("");
		setThumbBroken(false);
	};

	const openGallery = (next: boolean) => {
		if (next) setEverOpened(true);
		setOpen(next);
	};

	// A gallery reopened after a failed upload starts clean; a stale banner reads as a fresh failure.
	createEffect(() => {
		if (open()) {
			setError(undefined);
			setPage(0);
		}
	});

	const step = (delta: number) =>
		setPage(Math.min(Math.max(current() + delta, 0), pageCount() - 1));

	// A store rejection is picker state, never an unhandled rejection escaping the tree.
	const fail = (cause: unknown) => setError(toMediaStoreError(cause));

	const handleUpload = async (file: File) => {
		setError(undefined);
		setUploading(true);
		try {
			const uploaded = await store.upload(file);
			await refetch();
			props.onChange(uploaded.id);
		} catch (cause) {
			fail(cause);
		} finally {
			setUploading(false);
		}
	};

	const confirmDelete = async () => {
		const target = pendingDelete();
		if (!target) return;
		setError(undefined);
		try {
			await store.remove(target.id);
			await refetch();
		} catch (cause) {
			fail(cause);
		} finally {
			setPendingDelete(undefined);
		}
	};

	return (
		<div data-slot="image-picker" class={cn(props.class)}>
			<Popover surface="field" open={open()} onOpenChange={openGallery} modal>
				<PopoverAnchor as="div">
					<PickerTrigger
						id={props.id}
						slot="image-picker-trigger"
						open={open()}
						onToggle={() => openGallery(!open())}
						onClear={props.value ? clearImage : undefined}
						clearLabel="Clear image"
					>
						<Show
							when={!thumbBroken() && props.value}
							fallback={
								<>
									<Icon
										icon={thumbBroken() ? "lucide:image-off" : "lucide:image"}
										width={18}
										height={18}
										class="shrink-0 text-muted-foreground"
									/>
									<span class="flex-1 truncate text-left text-muted-foreground">
										{thumbBroken() ? "Image unavailable" : "Choose image"}
									</span>
								</>
							}
						>
							<img
								src={store.url(props.value)}
								alt=""
								width={24}
								height={24}
								decoding="async"
								class="size-6 shrink-0 rounded-sm object-cover"
								onError={() => setThumbBroken(true)}
							/>
							<span class="flex-1 truncate text-left">Image selected</span>
						</Show>
					</PickerTrigger>
				</PopoverAnchor>
				<PopoverContent class="min-w-72" onInteractOutside={() => setOpen(false)}>
					{/* The panel owns no padding: the gallery body owns its own inset. */}
					<div data-slot="image-picker-body" class="flex flex-col gap-3 p-3">
						<Show when={error()}>
							{(err) => (
								<Alert tone="destructive" role="alert">
									{mediaStoreErrorCopy(err())}
								</Alert>
							)}
						</Show>
						<Switch
							fallback={
								<div data-slot="image-picker-loading" class="grid grid-cols-3 gap-2">
									<For each={[0, 1, 2, 3, 4, 5]}>{() => <Skeleton class="aspect-square" />}</For>
								</div>
							}
						>
							<Match when={indexError()}>
								{(failure) => (
									// role="status": the gallery is explaining itself, not raising an alarm.
									<Empty role="status">
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<Icon icon="lucide:image-off" width={24} height={24} />
											</EmptyMedia>
											<EmptyTitle>Images unavailable</EmptyTitle>
											<EmptyDescription>{mediaIndexErrorCopy(failure())}</EmptyDescription>
										</EmptyHeader>
										<EmptyContent>
											<Button
												type="button"
												variant="outline"
												size="sm"
												data-slot="image-picker-retry"
												onClick={() => void refetch()}
											>
												Try again
											</Button>
										</EmptyContent>
									</Empty>
								)}
							</Match>
							<Match when={loaded()}>
								<Show
									when={sorted().length > 0}
									fallback={
										<Empty>
											<EmptyHeader>
												<EmptyMedia variant="icon">
													<Icon icon="lucide:image" width={24} height={24} />
												</EmptyMedia>
												<EmptyTitle>No images yet</EmptyTitle>
												<EmptyDescription>Upload one to use it here.</EmptyDescription>
											</EmptyHeader>
										</Empty>
									}
								>
									<div
										data-slot="image-picker-gallery"
										class={cn("grid grid-cols-3 gap-2", PICKER_LIST)}
									>
										<For each={pageImages()}>
											{(image) => (
												<MediaTile
													item={image}
													thumbUrl={thumbUrl(image.id)}
													label={`Use ${image.id}`}
													broken={brokenTiles.isBroken(image)}
													markUnused
													selected={props.value === image.id}
													onSelect={() => {
														props.onChange(props.value === image.id ? "" : image.id);
														setThumbBroken(false);
														setOpen(false);
													}}
													onBroken={() => brokenTiles.markBroken(image)}
													onDelete={() => setPendingDelete(image)}
												/>
											)}
										</For>
									</div>
									<Show when={pageCount() > 1}>
										<Pagination>
											<PaginationContent class="w-full justify-between">
												<PaginationItem>
													<PaginationPrevious
														href="#"
														aria-disabled={current() === 0}
														class={current() === 0 ? "pointer-events-none opacity-50" : undefined}
														onClick={(event) => {
															event.preventDefault();
															step(-1);
														}}
													/>
												</PaginationItem>
												<PaginationItem data-testid="image-picker-page-label">
													<SectionMeta>
														Page {current() + 1} of {pageCount()}
													</SectionMeta>
												</PaginationItem>
												<PaginationItem>
													<PaginationNext
														href="#"
														aria-disabled={current() === pageCount() - 1}
														class={
															current() === pageCount() - 1
																? "pointer-events-none opacity-50"
																: undefined
														}
														onClick={(event) => {
															event.preventDefault();
															step(1);
														}}
													/>
												</PaginationItem>
											</PaginationContent>
										</Pagination>
									</Show>
								</Show>
								<Show when={loaded()?.usage}>
									{(u) => (
										<SectionMeta>
											{formatBytes(u().bytes)} of {formatBytes(u().limitBytes)} · {u().files} of{" "}
											{u().limitFiles} images
										</SectionMeta>
									)}
								</Show>
							</Match>
						</Switch>
						<input
							ref={fileInput}
							type="file"
							accept="image/*"
							data-testid="image-upload-input"
							class="hidden"
							onChange={(e) => {
								const file = e.currentTarget.files?.[0];
								e.currentTarget.value = "";
								if (file) void handleUpload(file);
							}}
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							data-slot="image-picker-upload"
							disabled={uploading()}
							onClick={() => fileInput?.click()}
						>
							<Icon icon="lucide:upload" width={14} height={14} />
							{uploading() ? "Uploading..." : "Upload"}
						</Button>
					</div>
				</PopoverContent>
			</Popover>
			<AlertDialog
				open={pendingDelete() !== undefined}
				onOpenChange={(next) => {
					if (!next) setPendingDelete(undefined);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete image?</AlertDialogTitle>
						<AlertDialogDescription>{deleteDescription()}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel aria-label="Cancel">Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							aria-label="Delete"
							onClick={() => void confirmDelete()}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
