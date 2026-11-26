import { createEffect, createSignal, type JSX, onCleanup, Show } from "solid-js";
import { render } from "solid-js/web";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "../../src/solid";
import { PortalMountContext } from "../../src/solid/portal-mount.js";
import { CLOSED_ROOTS } from "./closed-roots";
import type { Within as WithinMode } from "./types";

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

function ClosedShadowRoot(props: { children: JSX.Element }) {
  const [host, setHost] = createSignal<HTMLDivElement>();
  createEffect(() => {
    const el = host();
    if (!el) return;
    const root = el.attachShadow({ mode: "closed" });
    CLOSED_ROOTS.add(root);
    root.adoptedStyleSheets = [pageStyles()];
    const mount = document.createElement("div");
    mount.className = "bg-background text-foreground p-4";
    root.appendChild(mount);
    const stopTheme = mirrorTheme(mount);
    const dispose = render(
      () => (
        <PortalMountContext.Provider value={mount}>{props.children}</PortalMountContext.Provider>
      ),
      mount,
    );
    onCleanup(() => {
      dispose();
      stopTheme();
      CLOSED_ROOTS.delete(root);
    });
  });
  return <div ref={setHost} data-within="shadow-root" class="min-h-24" />;
}

export function Within(props: { mode: WithinMode; children: JSX.Element }) {
  return (
    <>
      <Show when={props.mode === "page"}>{props.children}</Show>
      <Show when={props.mode === "dialog"}>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Scenario</DialogTitle>
            {props.children}
          </DialogContent>
        </Dialog>
      </Show>
      <Show when={props.mode === "sheet"}>
        <ResponsiveDialog defaultOpen>
          <ResponsiveDialogContent>
            <ResponsiveDialogBody>
              <ResponsiveDialogTitle>Scenario</ResponsiveDialogTitle>
              {props.children}
            </ResponsiveDialogBody>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </Show>
      <Show when={props.mode === "shadow-root"}>
        <ClosedShadowRoot>{props.children}</ClosedShadowRoot>
      </Show>
    </>
  );
}
