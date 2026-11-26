import { Match, Switch } from "solid-js";
import { type JSX } from "@solidjs/web";
import type { Within as WithinMode } from "./types";
import { InDialog, InSheet } from "./within-modal";
import { ClosedShadowRoot } from "./within-shadow";

export function Within(props: { mode: WithinMode; children: JSX.Element }) {
  return (
    <Switch>
      <Match when={props.mode === "page"}>{props.children}</Match>
      <Match when={props.mode === "dialog"}>
        <InDialog>{props.children}</InDialog>
      </Match>
      <Match when={props.mode === "sheet"}>
        <InSheet>{props.children}</InSheet>
      </Match>
      <Match when={props.mode === "shadow-root"}>
        <ClosedShadowRoot>{props.children}</ClosedShadowRoot>
      </Match>
    </Switch>
  );
}
