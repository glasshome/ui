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
import { cn } from "../lib/utils.js";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetOverlay,
  BottomSheetPortal,
} from "./bottom-sheet/index.js";
import { EntityChips } from "./entity-chips.js";
import { useEntityData } from "./entity-data.js";
import {
  type EntityListRow,
  entityOf,
  FALLBACK_ICON,
  groupRows,
  HEADER_HEIGHT,
  headerLabel,
  isUnavailable,
  type ListRow,
  matchesDeviceClass,
  matchesQuery,
  ROW_HEIGHT,
  rowOffsets,
  sameRows,
  stateLabel,
  visibleWindow,
} from "./entity-rows.js";
import { Icon } from "./icon.js";
import { useUiFormat, useUiText } from "./locale.js";
import { PickerRow } from "./picker-row.js";
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
    return wanted ? usableViews().filter((v) => matchesDeviceClass(v, wanted)) : usableViews();
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
    return pool().filter((v) => matchesQuery(v, q, names));
  });

  const rows = createMemo<ListRow[]>(
    () =>
      groupRows(searched(), areaNameById(), text("ui.entity-selector.other"), (x, y) =>
        format.compare(x, y),
      ),
    { equals: sameRows },
  );

  const entityRows = createMemo(() => rows().filter((r) => r.kind === "entity") as EntityListRow[]);
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

  const offsets = createMemo(() => rowOffsets(rows()));

  const totalHeight = () => offsets()[rows().length] ?? 0;

  const visibleSlice = createMemo(() =>
    visibleWindow(offsets(), rows().length, scrollTop(), viewportHeight()),
  );

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
      <Show when={!isSingle() && props.entityIds.length > 0}>
        <EntityChips ids={props.entityIds} onRemove={removeEntity} />
      </Show>
    </div>
  );
}
