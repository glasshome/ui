// oxlint-disable-next-line solid/portal-in-layer -- this file is ui's layer
import { Portal, type JSX } from "@solidjs/web";

export interface LayerProps {
  mount?: Element;
  ref?: (el: HTMLDivElement) => void;
  class?: string;
  children?: JSX.Element;
}

/** The one Portal in ui. Solid 2's Portal adds no element of its own, so the layer renders the container overlays sit in. */
export function Layer(props: LayerProps): JSX.Element {
  return (
    <Portal mount={props.mount ?? document.body}>
      <div ref={props.ref} class={props.class}>
        {props.children}
      </div>
    </Portal>
  );
}
