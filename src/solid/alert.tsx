import {
  type Component,
  type ComponentProps,
  createContext,
  type JSX,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import {
  ALERT_CLASS,
  ALERT_CONTENT_CLASS,
  ALERT_DESCRIPTION_CLASS,
  ALERT_ICON_BG_CLASS,
  ALERT_ICON_PATHS,
  ALERT_SM_CLASS,
  ALERT_TITLE_CLASS,
  ALERT_TONES,
  type AlertTone,
  alertIconBgStyle,
} from "../lib/alert-tones.js";
import { glassToneText } from "../lib/glass-tone.js";
import { cn } from "../lib/utils.js";

export type { AlertTone };

type AlertProps = ComponentProps<"div"> & {
  tone?: AlertTone;
  icon?: JSX.Element;
  title?: JSX.Element;
  action?: JSX.Element;
  /** `sm`: a one-line note inside a list, with tighter padding and smaller text. */
  size?: "default" | "sm";
};

// Lets `AlertTitle`, used as a child, pick up the same tone colour the
// `title` prop gets. Without this an `<AlertTitle>` inside an `<Alert
// tone="destructive">` rendered in plain foreground: same markup, same slot,
// same size class, but colourless, because it had no way to see the tone its
// parent had already resolved.
const AlertToneContext = createContext<() => string>();

const Alert: Component<AlertProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "tone",
    "icon",
    "title",
    "action",
    "children",
    "size",
  ]);
  const toneKey = () => local.tone ?? "info";
  const tone = () => ALERT_TONES[toneKey()];
  return (
    <div
      data-slot="alert"
      role={local.tone === "destructive" ? "alert" : "status"}
      data-size={local.size ?? "default"}
      class={cn(
        ALERT_CLASS,
        "glass glass-tint",
        local.size === "sm" && ALERT_SM_CLASS,
        local.class,
      )}
      style={{ "--glass-tone": tone().color, color: "var(--foreground)" }}
      {...rest}
    >
      <span class={ALERT_ICON_BG_CLASS} style={alertIconBgStyle(tone().color)} aria-hidden="true">
        <Show
          when={local.icon}
          fallback={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              innerHTML={ALERT_ICON_PATHS[toneKey()]}
            />
          }
        >
          {local.icon}
        </Show>
      </span>
      <div class={ALERT_CONTENT_CLASS}>
        <AlertToneContext.Provider value={() => tone().color}>
          <Show when={local.title}>
            <p
              data-slot="alert-title"
              class={ALERT_TITLE_CLASS}
              style={{ color: glassToneText(tone().color) }}
            >
              {local.title}
            </p>
          </Show>
          <Show when={local.children}>
            <div data-slot="alert-description" class={ALERT_DESCRIPTION_CLASS}>
              {local.children}
            </div>
          </Show>
        </AlertToneContext.Provider>
      </div>
      <Show when={local.action}>
        {/* self-center: the row is items-start for the icon, which would strand
				    the action at the top of a multi-line body. */}
        <div class="flex shrink-0 items-center self-center">{local.action}</div>
      </Show>
    </div>
  );
};

const AlertTitle: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const toneColor = useContext(AlertToneContext);
  return (
    <div
      data-slot="alert-title"
      class={cn(ALERT_TITLE_CLASS, local.class)}
      style={toneColor ? { color: glassToneText(toneColor()) } : undefined}
      {...rest}
    />
  );
};

const AlertDescription: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div data-slot="alert-description" class={cn(ALERT_DESCRIPTION_CLASS, local.class)} {...rest} />
  );
};

export { Alert, AlertDescription, AlertTitle };
