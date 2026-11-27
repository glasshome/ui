import type { UiText } from "../lib/text.js";
import type { EntityViewLike } from "./entity-data.js";
import { PICKER_ROW_HEIGHT } from "./picker-row.js";

// Many real-world power/energy sensors carry a unit but no device_class.
const DEVICE_CLASS_UNIT_FALLBACK: Record<string, readonly string[]> = {
  power: ["W", "kW"],
  energy: ["Wh", "kWh"],
};

export const HEADER_HEIGHT = 30;
export const ROW_HEIGHT = PICKER_ROW_HEIGHT;
const OVERSCAN_PX = 200;
const NO_AREA_KEY = "__no_area__";
export const FALLBACK_ICON = "mdi:shape-outline";

// Rows carry identity only; each row reads live state through getEntityView, so a state tick leaves the list alone.
export type ListRow =
  | { kind: "header"; key: string; label: string }
  | { kind: "entity"; key: string; id: string; entityIndex: number };

export type EntityListRow = Extract<ListRow, { kind: "entity" }>;

function sameRow(a: ListRow, b: ListRow): boolean {
  if (a.key !== b.key) return false;
  if (a.kind === "header" && b.kind === "header") return a.label === b.label;
  if (a.kind === "entity" && b.kind === "entity")
    return a.id === b.id && a.entityIndex === b.entityIndex;
  return false;
}

export function sameRows(a: ListRow[], b: ListRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) => {
      const other = b[i];
      return other !== undefined && sameRow(row, other);
    })
  );
}

export const entityOf = (row: ListRow) => (row.kind === "entity" ? row : undefined);
export const headerLabel = (row: ListRow) => (row.kind === "header" ? row.label : "");

export function isUnavailable(view: EntityViewLike) {
  return view.state === "unavailable" || view.state === "unknown";
}

export function stateLabel(view: EntityViewLike, text: UiText) {
  if (isUnavailable(view)) return text("ui.entity-selector.unavailable");
  const unit = view.unitOfMeasurement;
  return unit ? `${view.state} ${unit}` : view.state;
}

export function matchesDeviceClass(view: EntityViewLike, wanted: string): boolean {
  if (view.deviceClass === wanted) return true;
  const units = DEVICE_CLASS_UNIT_FALLBACK[wanted];
  return units != null && view.unitOfMeasurement != null && units.includes(view.unitOfMeasurement);
}

/** `query` is already trimmed and lower-cased. */
export function matchesQuery(
  view: EntityViewLike,
  query: string,
  areaNames: ReadonlyMap<string, string>,
): boolean {
  if (view.id.toLowerCase().includes(query)) return true;
  if (view.friendlyName.toLowerCase().includes(query)) return true;
  if (view.name.toLowerCase().includes(query)) return true;
  if (view.aliases.some((a) => a.toLowerCase().includes(query))) return true;
  const areaName = view.areaId ? areaNames.get(view.areaId) : undefined;
  return areaName?.toLowerCase().includes(query) ?? false;
}

export function groupRows(
  views: readonly EntityViewLike[],
  areaNames: ReadonlyMap<string, string>,
  otherLabel: string,
  compare: (a: string, b: string) => number,
): ListRow[] {
  const byAreaKey = new Map<string, EntityViewLike[]>();
  for (const v of views) {
    const key = v.areaId ?? NO_AREA_KEY;
    const bucket = byAreaKey.get(key);
    if (bucket) bucket.push(v);
    else byAreaKey.set(key, [v]);
  }
  const groups = Array.from(byAreaKey.entries())
    .map(([key, group]) => ({
      areaKey: key,
      label: key === NO_AREA_KEY ? otherLabel : (areaNames.get(key) ?? key),
      noArea: key === NO_AREA_KEY,
      views: group.sort((a, b) => compare(a.friendlyName, b.friendlyName)),
    }))
    .sort((a, b) => {
      if (a.noArea !== b.noArea) return a.noArea ? 1 : -1;
      return compare(a.label, b.label);
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
}

// Prefix-summed pixel offsets; [i] is the top of row i.
export function rowOffsets(rows: readonly ListRow[]): number[] {
  const out = new Array<number>(rows.length + 1);
  out[0] = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const h = row && row.kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT;
    out[i + 1] = (out[i] ?? 0) + h;
  }
  return out;
}

export function visibleWindow(
  offsets: readonly number[],
  count: number,
  scrollTop: number,
  viewportHeight: number,
): { start: number; end: number } {
  if (count === 0) return { start: 0, end: 0 };
  const topEdge = scrollTop - OVERSCAN_PX;
  const bottomEdge = scrollTop + viewportHeight + OVERSCAN_PX;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((offsets[mid + 1] ?? 0) > topEdge) hi = mid;
    else lo = mid + 1;
  }
  const start = lo;
  let end = start;
  while (end < count && (offsets[end] ?? 0) < bottomEdge) end++;
  return { start, end };
}
