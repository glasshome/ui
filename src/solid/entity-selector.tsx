import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  onFlush,
  type ParentComponent,
  Show,
} from "solid-js";
import { focusWithoutTracking } from "../lib/behavior/focus-scope.js";
import { MENU_ITEM_RADIUS, MENU_LABEL } from "../lib/menu-classes.js";
import { PICKER_LIST } from "../lib/picker-classes.js";
import { createIsMobile } from "../lib/use-is-mobile.js";
import type { UiText } from "../lib/text.js";
import { cn } from "../lib/utils.js";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetOverlay,
  BottomSheetPortal,
} from "./bottom-sheet/index.js";
import { type EntityViewLike, useEntityData } from "./entity-data.js";
import { Icon } from "./icon.js";
import { useUiFormat, useUiText } from "./locale.js";
import { PICKER_ROW_HEIGHT, PickerRow } from "./picker-row.js";
import { PickerSearch } from "./picker-search.js";
import { PickerTrigger } from "./picker-trigger.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";
import { SelectionScope } from "./selection.js";

interface EntitySelectorProps {
  entityIds: string[];
  onEntityIdsChange: (ids: string[]) => void;
  domain: string;
  /** Restrict the list to entities of this device_class (with a
   *  unit-of-measurement fallback for power/energy sensors that lack one). */
  deviceClass?: string;
  multiple?: boolean;
  /** Id of the element naming the trigger, for forms that label it outside. */
  "aria-labelledby"?: string;
}

// Many real-world power/energy sensors carry a unit but no device_class.
const DEVICE_CLASS_UNIT_FALLBACK: Record<string, readonly string[]> = {
  power: ["W", "kW"],
  energy: ["Wh", "kWh"],
};

const HEADER_HEIGHT = 30;
const ROW_HEIGHT = PICKER_ROW_HEIGHT;
const OVERSCAN_PX = 200;
const NO_AREA_KEY = "__no_area__";
const FALLBACK_ICON = "mdi:shape-outline";

// Rows carry identity only; each row reads live state through getEntityView, so a state tick leaves the list alone.
type ListRow =
  | { kind: "header"; key: string; label: string }
  | { kind: "entity"; key: string; id: string; entityIndex: number };

function sameRow(a: ListRow, b: ListRow): boolean {
  if (a.key !== b.key) return false;
  if (a.kind === "header" && b.kind === "header") return a.label === b.label;
  if (a.kind === "entity" && b.kind === "entity")
    return a.id === b.id && a.entityIndex === b.entityIndex;
  return false;
}

function sameRows(a: ListRow[], b: ListRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) => {
      const other = b[i];
      return other !== undefined && sameRow(row, other);
    })
  );
}

const entityOf = (row: ListRow) => (row.kind === "entity" ? row : undefined);
const headerLabel = (row: ListRow) => (row.kind === "header" ? row.label : "");

function isUnavailable(view: EntityViewLike) {
  return view.state === "unavailable" || view.state === "unknown";
}

function stateLabel(view: EntityViewLike, text: UiText) {
  if (isUnavailable(view)) return text("ui.entity-selector.unavailable");
  const unit = view.unitOfMeasurement;
  return unit ? `${view.state} ${unit}` : view.state;
}

export function EntitySelector(props: EntitySelectorProps) {
  const data = useEntityData();
  const text = useUiText();
  const format = useUiFormat();
  const isMobile = createIsMobile();
  const listboxId = createUniqueId();
  const [open, setOpen] = createSignal(false);
  // Apart from open: it narrows the subscription to the selection, which a held save may still be writing.
  const [listing, setListing] = createSignal(false);
  const [search, setSearch] = createSignal("");
  const [showDiagnostics, setShowDiagnostics] = createSignal(false);

  let inputRef: HTMLInputElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(320);

  const domainEntityIds = createMemo(() => data.entityIdsByDomain()[props.domain] ?? []);
  const subscribedIds = createMemo(() => (listing() ? domainEntityIds() : props.entityIds));
  const allViews = data.useEntities(subscribedIds);
  const areas = data.useAreas();
  const areaNameById = createMemo(() => new Map(areas().map((a) => [a.id, a.name])));
  const selectedSet = createMemo(() => new Set(props.entityIds));

  const usableViews = createMemo(() => allViews().filter((v) => !v.isHidden && !v.isDisabled));

  const classFiltered = createMemo(() => {
    const wanted = props.deviceClass;
    if (!wanted) return usableViews();
    const units = DEVICE_CLASS_UNIT_FALLBACK[wanted];
    return usableViews().filter((v) => {
      if (v.deviceClass === wanted) return true;
      return units != null && v.unitOfMeasurement != null && units.includes(v.unitOfMeasurement);
    });
  });

  const classExcludedCount = createMemo(() =>
    props.deviceClass ? usableViews().length - classFiltered().length : 0,
  );

  const classExcludedMessage = () =>
    text("ui.entity-selector.class-excluded", {
      count: classExcludedCount(),
      domain: props.domain,
      deviceClass: props.deviceClass ?? "",
    });

  const diagnosticCount = createMemo(
    () => classFiltered().filter((v) => v.entityCategory != null).length,
  );

  const pool = createMemo(() =>
    showDiagnostics() ? classFiltered() : classFiltered().filter((v) => v.entityCategory == null),
  );

  const searched = createMemo(() => {
    const q = search().trim().toLowerCase();
    if (!q) return pool();
    const names = areaNameById();
    return pool().filter((v) => {
      if (v.id.toLowerCase().includes(q)) return true;
      if (v.friendlyName.toLowerCase().includes(q)) return true;
      if (v.name.toLowerCase().includes(q)) return true;
      if (v.aliases.some((a) => a.toLowerCase().includes(q))) return true;
      const areaName = v.areaId ? names.get(v.areaId) : undefined;
      return areaName?.toLowerCase().includes(q) ?? false;
    });
  });

  const rows = createMemo<ListRow[]>(
    () => {
      const byAreaKey = new Map<string, EntityViewLike[]>();
      for (const v of searched()) {
        const key = v.areaId ?? NO_AREA_KEY;
        const bucket = byAreaKey.get(key);
        if (bucket) bucket.push(v);
        else byAreaKey.set(key, [v]);
      }
      const names = areaNameById();
      const groups = Array.from(byAreaKey.entries())
        .map(([key, views]) => ({
          areaKey: key,
          label: key === NO_AREA_KEY ? text("ui.entity-selector.other") : (names.get(key) ?? key),
          noArea: key === NO_AREA_KEY,
          views: views.sort((a, b) => format.compare(a.friendlyName, b.friendlyName)),
        }))
        .sort((a, b) => {
          if (a.noArea !== b.noArea) return a.noArea ? 1 : -1;
          return format.compare(a.label, b.label);
        });

      const flat: ListRow[] = [];
      let entityIndex = 0;
      for (const group of groups) {
        flat.push({ kind: "header", key: `h:${group.areaKey}`, label: group.label });
        for (const view of group.views) {
          flat.push({ kind: "entity", key: `e:${view.id}`, id: view.id, entityIndex });
          entityIndex++;
        }
      }
      return flat;
    },
    { equals: sameRows },
  );

  const entityRows = createMemo(
    () => rows().filter((r) => r.kind === "entity") as Extract<ListRow, { kind: "entity" }>[],
  );
  // Held by entity id too, so a refetch that shifts the rows keeps the same entity active.
  const [active, setActive] = createSignal<{ id?: string; index: number }>({ index: 0 });
  const activeIndex = createMemo(() => {
    const { id, index } = active();
    const list = entityRows();
    const at = id === undefined ? -1 : list.findIndex((row) => row.id === id);
    return at >= 0 ? at : Math.min(index, Math.max(0, list.length - 1));
  });
  const setActiveIndex = (index: number) => setActive({ id: entityRows()[index]?.id, index });
  const resetActive = () => setActive({ index: 0 });

  // Prefix-summed pixel offsets; offsets()[i] is the top of row i.
  const offsets = createMemo(() => {
    const r = rows();
    const out = new Array<number>(r.length + 1);
    out[0] = 0;
    for (let i = 0; i < r.length; i++) {
      const row = r[i];
      const h = row && row.kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT;
      out[i + 1] = (out[i] ?? 0) + h;
    }
    return out;
  });

  const totalHeight = () => offsets()[rows().length] ?? 0;

  const visibleSlice = createMemo(() => {
    const off = offsets();
    const count = rows().length;
    if (count === 0) return { start: 0, end: 0 };
    const topEdge = scrollTop() - OVERSCAN_PX;
    const bottomEdge = scrollTop() + viewportHeight() + OVERSCAN_PX;
    let lo = 0;
    let hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((off[mid + 1] ?? 0) > topEdge) hi = mid;
      else lo = mid + 1;
    }
    const start = lo;
    let end = start;
    while (end < count && (off[end] ?? 0) < bottomEdge) end++;
    return { start, end };
  });

  const visibleRows = createMemo(() => {
    const { start, end } = visibleSlice();
    return rows().slice(start, end);
  });

  const rowIndexByKey = createMemo(() => {
    const map = new Map<string, number>();
    rows().forEach((row, i) => {
      map.set(row.key, i);
    });
    return map;
  });

  const rowTop = (key: string) => {
    const idx = rowIndexByKey().get(key);
    return idx == null ? 0 : (offsets()[idx] ?? 0);
  };

  // The scroll container mounts lazily (popover/sheet open); called as it renders, so its owner holds the observer.
  const scrollListRef = () => {
    let observer: ResizeObserver | undefined;
    let attached: HTMLDivElement | undefined;
    onCleanup(() => {
      observer?.disconnect();
      if (scrollRef === attached) scrollRef = undefined;
    });
    return (el: HTMLDivElement) => {
      attached = el;
      scrollRef = el;
      setScrollTop(el.scrollTop);
      setViewportHeight(el.clientHeight);
      observer = new ResizeObserver(() => setViewportHeight(el.clientHeight));
      observer.observe(el);
    };
  };

  createEffect(
    search,
    () => {
      resetActive();
      scrollRef?.scrollTo({ top: 0 });
      setScrollTop(0);
    },
    { defer: true },
  );

  const ensureActiveVisible = (entityIndex: number) => {
    if (!scrollRef) return;
    const rowIdx = rows().findIndex((r) => r.kind === "entity" && r.entityIndex === entityIndex);
    if (rowIdx < 0) return;
    const top = offsets()[rowIdx] ?? 0;
    const bottom = top + ROW_HEIGHT;
    if (top < scrollRef.scrollTop) scrollRef.scrollTo({ top });
    else if (bottom > scrollRef.scrollTop + scrollRef.clientHeight)
      scrollRef.scrollTo({ top: bottom - scrollRef.clientHeight });
  };

  const optionId = (entityIndex: number) => `${listboxId}-option-${entityIndex}`;
  // Only names a row the list is actually rendering: the virtualiser unmounts
  // the rest, and aria-activedescendant must point at a live element.
  const activeOptionId = () =>
    !isMobile() && visibleRows().some((r) => r.kind === "entity" && r.entityIndex === activeIndex())
      ? optionId(activeIndex())
      : undefined;

  const openPicker = () => {
    setListing(true);
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
    setSearch("");
    resetActive();
    onFlush(() => setListing(false));
  };

  // A re-tap on the picked entity clears it, the way every picker toggles.
  const toggleEntity = (entityId: string) => {
    if (props.multiple === false) {
      // Its own flush: async work the change starts would hold a close written beside it.
      onFlush(closePicker);
      props.onEntityIdsChange(props.entityIds.includes(entityId) ? [] : [entityId]);
      return;
    }
    const current = props.entityIds;
    if (current.includes(entityId)) {
      props.onEntityIdsChange(current.filter((id) => id !== entityId));
    } else {
      props.onEntityIdsChange([...current, entityId]);
    }
  };

  const removeEntity = (entityId: string) => {
    props.onEntityIdsChange(props.entityIds.filter((id) => id !== entityId));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const total = entityRows().length;
    if (e.key === "ArrowDown" && total > 0) {
      e.preventDefault();
      const next = (activeIndex() + 1) % total;
      setActiveIndex(next);
      ensureActiveVisible(next);
    } else if (e.key === "ArrowUp" && total > 0) {
      e.preventDefault();
      const next = (activeIndex() - 1 + total) % total;
      setActiveIndex(next);
      ensureActiveVisible(next);
    } else if (e.key === "Home" && total > 0) {
      e.preventDefault();
      setActiveIndex(0);
      ensureActiveVisible(0);
    } else if (e.key === "End" && total > 0) {
      e.preventDefault();
      setActiveIndex(total - 1);
      ensureActiveVisible(total - 1);
    } else if (e.key === "Enter" && total > 0) {
      e.preventDefault();
      const row = entityRows()[activeIndex()];
      if (row) toggleEntity(row.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePicker();
    }
  };

  const triggerLabel = () => {
    const count = props.entityIds.length;
    if (count === 0) return null;
    if (count === 1) {
      const id = props.entityIds[0] ?? "";
      const view = data.getEntityView(id);
      return view?.friendlyName ?? id;
    }
    return `${count} entities selected`;
  };

  const triggerIcon = () => {
    if (props.entityIds.length !== 1) return null;
    const id = props.entityIds[0] ?? "";
    return data.getEntityView(id)?.icon ?? null;
  };

  const isSingle = () => props.multiple === false;
  const showTriggerClear = () => props.entityIds.length > 0;

  const clearSelection = () => {
    props.onEntityIdsChange([]);
  };

  const TriggerButton = (p: { onClick: () => void }) => (
    <PickerTrigger
      slot="entity-selector-trigger"
      role="combobox"
      open={open()}
      onToggle={p.onClick}
      aria-labelledby={props["aria-labelledby"]}
      aria-expanded={open() ? "true" : "false"}
      aria-controls={listboxId}
      aria-haspopup="listbox"
      onClear={showTriggerClear() ? clearSelection : undefined}
    >
      <Show when={triggerIcon()}>
        {(icon) => (
          <Icon icon={icon()} width={16} height={16} class="text-muted-foreground shrink-0" />
        )}
      </Show>
      <Show
        when={triggerLabel()}
        fallback={
          <span class="text-muted-foreground flex-1 truncate text-left">
            {text(isSingle() ? "ui.entity-selector.select-one" : "ui.entity-selector.select-many", {
              domain: props.domain,
            })}
          </span>
        }
      >
        {(label) => <span class="flex-1 truncate text-left">{label()}</span>}
      </Show>
    </PickerTrigger>
  );

  const EntityRow = (p: { id: string; entityIndex: number; top: number }) => {
    const view = createMemo(() => data.getEntityView(p.id));
    const selected = () => selectedSet().has(p.id);
    const unavailable = () => {
      const v = view();
      return v == null || isUnavailable(v);
    };
    const state = () => {
      const v = view();
      return v ? stateLabel(v, text) : "";
    };
    return (
      <PickerRow
        role="option"
        id={optionId(p.entityIndex)}
        data-slot="entity-selector-row"
        aria-selected={selected() ? "true" : "false"}
        highlighted={!isMobile() && activeIndex() === p.entityIndex}
        class="absolute inset-x-0"
        style={{ top: `${p.top}px`, height: `${ROW_HEIGHT}px` }}
        icon={view()?.icon ?? FALLBACK_ICON}
        title={view()?.friendlyName ?? p.id}
        subtitle={p.id}
        meta={state()}
        selected={selected()}
        multi={!isSingle()}
        dimmed={unavailable()}
        onMouseMove={() => setActiveIndex(p.entityIndex)}
        onClick={() => toggleEntity(p.id)}
      />
    );
  };

  const PickerContent = () => (
    <div class="flex min-h-0 flex-1 flex-col">
      <PickerSearch
        inputRef={(el) => {
          inputRef = el;
        }}
        type="search"
        role="combobox"
        aria-label={text("ui.entity-selector.search", { domain: props.domain })}
        aria-controls={listboxId}
        aria-expanded="true"
        aria-activedescendant={activeOptionId()}
        placeholder={text("ui.entity-selector.search-placeholder")}
        value={search()}
        onValueChange={setSearch}
        onKeyDown={handleKeyDown}
        clearLabel={text("ui.entity-selector.clear-search")}
        size={isMobile() ? "touch" : "default"}
        class="[&_input::-webkit-search-cancel-button]:hidden"
      />
      <div
        ref={scrollListRef()}
        id={listboxId}
        role="listbox"
        aria-multiselectable={isSingle() ? "false" : "true"}
        aria-label={text("ui.entity-selector.list", { domain: props.domain })}
        class={cn(
          "min-h-0 flex-1 touch-pan-y overscroll-contain px-1 py-1",
          PICKER_LIST,
          isMobile() && "max-h-none",
        )}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <Show
          when={rows().length > 0}
          fallback={
            <div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Show
                when={search().trim()}
                fallback={
                  <Show
                    when={diagnosticCount() > 0}
                    fallback={
                      <Show
                        when={classExcludedCount() > 0}
                        fallback={
                          <span class="text-muted-foreground text-sm">
                            {text("ui.entity-selector.none", { domain: props.domain })}
                          </span>
                        }
                      >
                        <span class="text-muted-foreground text-sm">{classExcludedMessage()}</span>
                      </Show>
                    }
                  >
                    <span class="text-muted-foreground text-sm">
                      {text("ui.entity-selector.only-diagnostic", { domain: props.domain })}
                    </span>
                    <button
                      type="button"
                      class="text-primary-tint-foreground text-sm hover:underline"
                      onClick={() => setShowDiagnostics(true)}
                    >
                      {text("ui.entity-selector.show-diagnostic-entities")}
                    </button>
                  </Show>
                }
              >
                <span class="text-muted-foreground text-sm">
                  {text("ui.entity-selector.no-matches", { query: search().trim() })}
                </span>
                <button
                  type="button"
                  class="text-primary-tint-foreground text-sm hover:underline"
                  onClick={() => setSearch("")}
                >
                  {text("ui.entity-selector.clear-search")}
                </button>
              </Show>
            </div>
          }
        >
          <SelectionScope
            marker="highlighted"
            radius={MENU_ITEM_RADIUS}
            role="presentation"
            style={{ height: `${totalHeight()}px` }}
          >
            <For each={visibleRows()} keyed={(row) => row.key}>
              {(row) => (
                <Show
                  when={entityOf(row())}
                  fallback={
                    <div
                      class={cn(MENU_LABEL, "absolute inset-x-0 flex items-end px-2 pb-1")}
                      style={{
                        top: `${rowTop(row().key)}px`,
                        height: `${HEADER_HEIGHT}px`,
                      }}
                      aria-hidden="true"
                    >
                      {headerLabel(row())}
                    </div>
                  }
                >
                  {(entity) => (
                    <EntityRow
                      id={entity().id}
                      entityIndex={entity().entityIndex}
                      top={rowTop(entity().key)}
                    />
                  )}
                </Show>
              )}
            </For>
          </SelectionScope>
        </Show>
      </div>
      <Show when={diagnosticCount() > 0 || props.deviceClass}>
        <div class="border-border/50 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2">
          <span class="text-muted-foreground truncate text-xs">
            {props.deviceClass
              ? text("ui.entity-selector.class-only", { deviceClass: props.deviceClass })
              : ""}
          </span>
          <Show when={diagnosticCount() > 0}>
            <button
              type="button"
              class="text-muted-foreground hover:text-foreground shrink-0 text-xs transition-colors"
              onClick={() => setShowDiagnostics(!showDiagnostics())}
            >
              {showDiagnostics()
                ? text("ui.entity-selector.hide-diagnostic")
                : text("ui.entity-selector.show-diagnostic", { count: diagnosticCount() })}
            </button>
          </Show>
        </div>
      </Show>
    </div>
  );

  const SelectedChips = () => (
    <Show when={!isSingle() && props.entityIds.length > 0}>
      <div class="flex flex-wrap gap-1.5">
        <For each={props.entityIds}>
          {(id) => {
            const view = createMemo(() => data.getEntityView(id));
            const unavailable = () => {
              const v = view();
              return v != null && isUnavailable(v);
            };
            return (
              <span
                class={`border-border bg-secondary/50 text-secondary-foreground inline-flex max-w-full items-stretch overflow-hidden rounded-md border text-xs ${
                  unavailable() ? "opacity-60" : ""
                }`}
              >
                <span class="flex min-w-0 items-center gap-1.5 py-1.5 pl-2">
                  <Icon
                    icon={view()?.icon ?? FALLBACK_ICON}
                    width={14}
                    height={14}
                    class="text-muted-foreground shrink-0"
                  />
                  <span class="truncate">{view()?.friendlyName ?? id}</span>
                </span>
                <button
                  type="button"
                  aria-label={text("ui.entity-selector.remove", {
                    name: view()?.friendlyName ?? id,
                  })}
                  class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-8 shrink-0 cursor-pointer items-center justify-center transition-colors"
                  onClick={() => removeEntity(id)}
                >
                  <Icon icon="lucide:x" width={14} height={14} class="size-3.5" />
                </button>
              </span>
            );
          }}
        </For>
      </div>
    </Show>
  );

  // One shell per viewport, one list: the sheet and the panel host the same
  // PickerContent, so a fix to the list can never land in only one of them.
  const ContentHost: ParentComponent = (p) => (
    <Show
      when={isMobile()}
      fallback={
        <PopoverContent
          class="flex min-w-72 flex-col"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // preventScroll: the panel is portalled at (0,0) until the popper places it,
            // so a plain focus() scrolls the page to the top.
            focusWithoutTracking(inputRef);
          }}
          onInteractOutside={() => closePicker()}
        >
          {p.children}
        </PopoverContent>
      }
    >
      <BottomSheet
        open={open()}
        onOpenChange={(isOpen) => {
          if (!isOpen) closePicker();
        }}
      >
        <BottomSheetPortal>
          <BottomSheetOverlay />
          <BottomSheetContent
            class="h-[85dvh] pb-[env(safe-area-inset-bottom)]"
            ariaLabel={text("ui.entity-selector.sheet", { domain: props.domain })}
          >
            <BottomSheetHandle />
            {p.children}
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    </Show>
  );

  return (
    <div class="flex flex-col gap-2">
      <Popover
        surface="field"
        open={open() && !isMobile()}
        onOpenChange={(isOpen) => {
          if (!isOpen) closePicker();
        }}
        modal
      >
        <PopoverAnchor as="div">
          <TriggerButton onClick={() => (open() ? closePicker() : openPicker())} />
        </PopoverAnchor>
        <ContentHost>
          <PickerContent />
        </ContentHost>
      </Popover>
      <SelectedChips />
    </div>
  );
}
