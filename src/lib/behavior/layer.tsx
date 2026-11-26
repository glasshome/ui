// oxlint-disable-next-line solid/portal-in-layer -- this file is ui's layer
import { Portal, type JSX } from "@solidjs/web";
import { Show } from "solid-js";

export interface LayerProps {
  mount?: Element;
  /** Whether the layer shows. The portal stays put while it is hidden, so opening adds no node beside the opener. */
  when?: boolean;
  ref?: (el: HTMLDivElement) => void;
  class?: string;
  children?: JSX.Element;
}

/** The one Portal in ui. Solid 2's Portal adds no element of its own, so the layer renders the container overlays sit in. */
export function Layer(props: LayerProps): JSX.Element {
  return (
    <Portal mount={props.mount ?? document.body}>
      <Show when={props.when ?? true}>
        <div ref={props.ref} class={props.class}>
          {props.children}
        </div>
      </Show>
    </Portal>
  );
}
