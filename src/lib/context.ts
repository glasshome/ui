import { type Context, useContext } from "solid-js";

/** Reads a context that has no default; outside its provider the error names the part and the root it needs. */
export function useRequired<T>(
  context: Context<T>,
  part: string,
  root: string | readonly string[],
): NonNullable<T> {
  let value: T | undefined;
  try {
    value = useContext(context);
  } catch {
    value = undefined;
  }
  if (value == null) {
    const roots = typeof root === "string" ? [root] : root;
    throw new Error(`${part} must be inside ${roots.map((name) => `<${name}>`).join(" or ")}`);
  }
  return value;
}
