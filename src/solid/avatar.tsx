import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  Show,
  omit,
  createEffect,
} from "solid-js";
import { useRequired } from "../lib/context.js";
import { type ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils.js";

type LoadingStatus = "idle" | "loading" | "loaded" | "error";

type AvatarProps = ComponentProps<"span"> & {
  fallbackDelay?: number;
  onLoadingStatusChange?: (status: LoadingStatus) => void;
};

interface AvatarContextValue {
  fallbackDelay: Accessor<number | undefined>;
  status: Accessor<LoadingStatus>;
  report: (status: LoadingStatus) => void;
}

const AvatarContext = createContext<AvatarContextValue>();

function useAvatar(): AvatarContextValue {
  const ctx = useRequired(AvatarContext, "An avatar part", "Avatar");
  return ctx;
}

const Avatar: Component<AvatarProps> = (props) => {
  const rest = omit(props, "class", "fallbackDelay", "onLoadingStatusChange");
  const [status, setStatus] = createSignal<LoadingStatus>("idle");
  const ctx: AvatarContextValue = {
    fallbackDelay: () => props.fallbackDelay,
    status,
    report: (next) => {
      setStatus(next);
      props.onLoadingStatusChange?.(next);
    },
  };
  return (
    <AvatarContext value={ctx}>
      <span
        data-slot="avatar"
        class={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", props.class)}
        {...rest}
      />
    </AvatarContext>
  );
};

const AvatarImage: Component<ComponentProps<"img">> = (props) => {
  const ctx = useAvatar();
  const rest = omit(props, "class");
  const [status, setStatus] = createSignal<LoadingStatus>("idle");

  // A detached probe, so the photo replaces the fallback only once it has decoded.
  createEffect(
    () => props.src,
    (src) => {
      if (!src) return void setStatus("error");
      let live = true;
      const probe = document.createElement("img");
      const settle = (next: LoadingStatus) => () => live && setStatus(next);
      setStatus("loading");
      if (typeof props.crossorigin === "string") probe.crossOrigin = props.crossorigin;
      if (typeof props.referrerpolicy === "string") probe.referrerPolicy = props.referrerpolicy;
      probe.onload = settle("loaded");
      probe.onerror = settle("error");
      probe.src = src;
      return () => {
        live = false;
      };
    },
  );
  createEffect(status, (next) => {
    if (next !== "idle") ctx.report(next);
  });

  return (
    <Show when={status() === "loaded"}>
      <img data-slot="avatar-image" class={cn("aspect-square size-full", props.class)} {...rest} />
    </Show>
  );
};

const AvatarFallback: Component<ComponentProps<"span">> = (props) => {
  const ctx = useAvatar();
  const rest = omit(props, "class");
  const [due, setDue] = createSignal(ctx.fallbackDelay() === undefined);
  createEffect(ctx.fallbackDelay, (delay) => {
    if (delay === undefined) return;
    const timer = setTimeout(() => setDue(true), delay);
    return () => clearTimeout(timer);
  });
  return (
    <Show when={due() && ctx.status() !== "loaded"}>
      <span
        data-slot="avatar-fallback"
        class={cn(
          "glass flex size-full items-center justify-center rounded-full font-semibold [--glass-tone:var(--primary)]",
          props.class,
        )}
        {...rest}
      />
    </Show>
  );
};

export { Avatar, AvatarFallback, AvatarImage };
