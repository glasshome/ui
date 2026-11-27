import { onCleanup } from "solid-js";
import { insert, type JSX, registerDelegatedRoot, unregisterDelegatedRoot } from "@solidjs/web";
import { PortalMountContext } from "../../src/solid/portal-mount.js";
import { CLOSED_ROOTS } from "./closed-roots";

function pageStyles(): CSSStyleSheet {
  const sheet = new CSSStyleSheet();
  const rules = [...document.styleSheets].flatMap((s) => {
    try {
      return [...s.cssRules].filter((r) => !(r instanceof CSSImportRule)).map((r) => r.cssText);
    } catch {
      return [];
    }
  });
  sheet.replaceSync(rules.join("\n"));
  return sheet;
}

function mirrorTheme(mount: HTMLElement) {
  const sync = () =>
    mount.classList.toggle("dark", document.documentElement.classList.contains("dark"));
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function ClosedShadowRoot(props: { children: JSX.Element }) {
  // A JSX node starts in its template's document, and a page sheet cannot be adopted there.
  const host = document.createElement("div");
  host.dataset.within = "shadow-root";
  host.className = "min-h-24";
  const root = host.attachShadow({ mode: "closed" });
  CLOSED_ROOTS.add(root);
  root.adoptedStyleSheets = [pageStyles()];
  const mount = document.createElement("div");
  mount.className = "bg-background text-foreground p-4";
  root.appendChild(mount);
  const stopTheme = mirrorTheme(mount);
  // A closed root hides its targets from the document's delegated listeners.
  registerDelegatedRoot(mount);
  insert(mount, () => <PortalMountContext value={mount}>{props.children}</PortalMountContext>);
  onCleanup(() => {
    unregisterDelegatedRoot(mount);
    stopTheme();
    CLOSED_ROOTS.delete(root);
  });
  return host;
}
