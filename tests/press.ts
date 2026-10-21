import { userEvent } from "vitest/browser";

type ClickOptions = Parameters<typeof userEvent.click>[1];

/** Clicks what a person clicks: a visually hidden input through its label. */
export function press(el: Element, options?: ClickOptions): Promise<void> {
  const label = el instanceof HTMLInputElement ? el.labels?.[0] : undefined;
  return userEvent.click(label ?? el, options);
}
