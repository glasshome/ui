/** One row of the list: an option, or the heading of a group of options. */
export interface SelectNode<T> {
  type: "item" | "section";
  key: string;
  rawValue: T;
  textValue: string;
  disabled: boolean;
  level: number;
  index: number;
  prevKey?: string;
  nextKey?: string;
}

export type Field<T, V> = keyof Exclude<T, null> | ((option: Exclude<T, null>) => V);

export function read<T, V>(option: T, by: Field<T, V> | undefined): unknown {
  if (by === undefined || option === null || option === undefined) return undefined;
  if (typeof by === "function") return by(option as Exclude<T, null>);
  return (option as Record<PropertyKey, unknown>)[by as PropertyKey];
}

export const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, i) => key === b[i]);
