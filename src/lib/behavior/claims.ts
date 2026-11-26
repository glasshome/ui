import { createEffect } from "solid-js";

/**
 * What a node takes from an event, read by a sealed widget's host at the event itself: a widget
 * whose code runs in a Worker answers after the browser has acted. `key:<Key>` is a key whose
 * default the node cancels, `keep:<Key>` one it also keeps from the page, both pressed with no
 * Ctrl, Alt or Meta, and `self:<Key>` one it cancels only when it is the target; `prevent:<type>`
 * is an event's default it cancels, `stop:<type>` an event it keeps from the page.
 */
const CLAIM_ATTR = "data-claim";

const KEY_NAMES: Record<string, string> = { " ": "Space" };

const claimAs = (kind: string, keys: Iterable<string>): string =>
  [...keys].map((key) => `${kind}:${KEY_NAMES[key] ?? key}`).join(" ");

/** The claim for the keys a node handles, as `KeyboardEvent.key` names them. */
export const claimKeys = (keys: Iterable<string>): string => claimAs("key", keys);

/** The claim for the keys a node handles and stops. */
export const keepKeys = (keys: Iterable<string>): string => claimAs("keep", keys);

/** The claim for the keys a node handles only when it is the key's target itself. */
export const selfKeys = (keys: Iterable<string>): string => claimAs("self", keys);

const held = new WeakMap<Element, Map<symbol, string>>();

function write(el: Element, own: Map<symbol, string>) {
  const tokens = [...own.values()].join(" ");
  if (tokens) el.setAttribute(CLAIM_ATTR, tokens);
  else el.removeAttribute(CLAIM_ATTR);
}

/** Claims on an element another part renders, held beside every other part's claims on it. */
export function createClaim(
  target: () => Element | undefined,
  tokens: () => string | undefined,
): void {
  const id = Symbol();
  createEffect(
    () => [target(), tokens()] as const,
    ([el, claimed]) => {
      if (!el || !claimed) return;
      const own = held.get(el) ?? new Map<symbol, string>();
      held.set(el, own);
      own.set(id, claimed);
      write(el, own);
      return () => {
        own.delete(id);
        write(el, own);
      };
    },
  );
}
