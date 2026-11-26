import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { Layer } from "../lib/behavior/layer.js";
import { OVERLAY_SURFACE } from "../lib/overlay-classes.js";
import { cn } from "../lib/utils.js";
import { usePortalMount } from "./portal-mount.js";

export interface FollowPoint {
  x: number;
  y: number;
}

export interface FollowTooltipProps {
  /** Viewport point the tooltip trails; undefined hides it. */
  at: FollowPoint | undefined;
  class?: string;
  children?: JSX.Element;
}

const OFFSET = { x: 16, y: 20 };

/** A tooltip that trails the pointer, for one shared hint over many targets. */
export function FollowTooltip(props: FollowTooltipProps): JSX.Element {
  const portalMount = usePortalMount();
  return (
    <Show when={props.at}>
      {(at) => (
        <Layer mount={portalMount}>
          <div
            role="tooltip"
            data-slot="follow-tooltip"
            class={cn(
              OVERLAY_SURFACE,
              "pointer-events-none fixed z-50 rounded-[var(--radius-md)] px-3 py-2",
              props.class,
            )}
            style={{ left: `${at().x + OFFSET.x}px`, top: `${at().y + OFFSET.y}px` }}
          >
            {props.children}
          </div>
        </Layer>
      )}
    </Show>
  );
}
