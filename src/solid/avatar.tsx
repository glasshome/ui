import {
  type Accessor,
  type Component,
  type ComponentProps,
  createContext,
  createSignal,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { effect } from "../lib/behavior/solid.js";
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
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("An avatar part renders inside an Avatar");
  return ctx;
}

const Avatar: Component<AvatarProps> = (props) => {
  const [local, rest] = splitProps(props, ["class", "fallbackDelay", "onLoadingStatusChange"]);
  const [status, setStatus] = createSignal<LoadingStatus>("idle");
  const ctx: AvatarContextValue = {
    fallbackDelay: () => local.fallbackDelay,
    status,
    report: (next) => {
      setStatus(next);
      local.onLoadingStatusChange?.(next);
    },
  };
  return (
    <AvatarContext.Provider value={ctx}>
      <span
        data-slot="avatar"
        class={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", local.class)}
        {...rest}
      />
    </AvatarContext.Provider>
  );
};

const AvatarImage: Component<ComponentProps<"img">> = (props) => {
  const ctx = useAvatar();
  const [local, rest] = splitProps(props, ["class"]);
  const [status, setStatus] = createSignal<LoadingStatus>("idle");

  // A detached probe, so the photo replaces the fallback only once it has decoded.
  effect(
    () => props.src,
    (src) => {
      if (!src) return void setStatus("error");
      let live = true;
      const probe = document.createElement("img");
      const settle = (next: LoadingStatus) => () => live && setStatus(next);
      setStatus("loading");
      if (props.crossOrigin !== undefined) probe.crossOrigin = props.crossOrigin;
      if (props.referrerPolicy !== undefined) probe.referrerPolicy = props.referrerPolicy;
      probe.onload = settle("loaded");
      probe.onerror = settle("error");
      probe.src = src;
      return () => {
        live = false;
      };
    },
  );
  effect(status, (next) => {
    if (next !== "idle") ctx.report(next);
  });

  return (
    <Show when={status() === "loaded"}>
      <img data-slot="avatar-image" class={cn("aspect-square size-full", local.class)} {...rest} />
    </Show>
  );
};

const AvatarFallback: Component<ComponentProps<"span">> = (props) => {
  const ctx = useAvatar();
  const [local, rest] = splitProps(props, ["class"]);
  const [due, setDue] = createSignal(ctx.fallbackDelay() === undefined);
  effect(ctx.fallbackDelay, (delay) => {
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
          local.class,
        )}
        {...rest}
      />
    </Show>
  );
};

export { Avatar, AvatarFallback, AvatarImage };
