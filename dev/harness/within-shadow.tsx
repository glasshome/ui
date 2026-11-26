import { createEffect, createSignal, getOwner, runWithOwner } from "solid-js";
import { type JSX, render } from "@solidjs/web";
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
  const [host, setHost] = createSignal<HTMLDivElement>();
  const owner = getOwner();
  createEffect(host, (el) => {
    if (!el) return;
    const root = el.attachShadow({ mode: "closed" });
    CLOSED_ROOTS.add(root);
    root.adoptedStyleSheets = [pageStyles()];
    const mount = document.createElement("div");
    mount.className = "bg-background text-foreground p-4";
    root.appendChild(mount);
    const stopTheme = mirrorTheme(mount);
    const dispose = runWithOwner(owner, () =>
      render(() => <PortalMountContext value={mount}>{props.children}</PortalMountContext>, mount),
    );
    return () => {
      dispose();
      stopTheme();
      CLOSED_ROOTS.delete(root);
    };
  });
  return <div ref={setHost} data-within="shadow-root" class="min-h-24" />;
}
