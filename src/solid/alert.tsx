import { children, type Component, createContext, Show, omit, useContext } from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
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
import { trusted } from "./icon-nodes.js";

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
const AlertToneContext = createContext<(() => string) | null>(null);

// Its own component so title and children resolve under AlertToneContext.
const AlertBody: Component<{ title?: JSX.Element; toneColor: string; children?: JSX.Element }> = (
  props,
) => {
  const title = children(() => props.title);
  const body = children(() => props.children);
  return (
    <>
      <Show when={title()}>
        <p
          data-slot="alert-title"
          class={ALERT_TITLE_CLASS}
          style={{ color: glassToneText(props.toneColor) }}
        >
          {title()}
        </p>
      </Show>
      <Show when={body()}>
        <div data-slot="alert-description" class={ALERT_DESCRIPTION_CLASS}>
          {body()}
        </div>
      </Show>
    </>
  );
};

const Alert: Component<AlertProps> = (props) => {
  const rest = omit(props, "class", "tone", "icon", "title", "action", "children", "size");
  const toneKey = () => props.tone ?? "info";
  const tone = () => ALERT_TONES[toneKey()];
  const icon = children(() => props.icon);
  const action = children(() => props.action);
  return (
    <div
      data-slot="alert"
      role={props.tone === "destructive" ? "alert" : "status"}
      data-size={props.size ?? "default"}
      class={cn(
        ALERT_CLASS,
        "glass glass-tint shrink-0",
        props.size === "sm" && ALERT_SM_CLASS,
        props.class,
      )}
      style={{ "--glass-tone": tone().color, color: "var(--foreground)" }}
      {...rest}
    >
      <span class={ALERT_ICON_BG_CLASS} style={alertIconBgStyle(tone().color)} aria-hidden="true">
        <Show
          when={icon()}
          fallback={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              innerHTML={trusted(ALERT_ICON_PATHS[toneKey()])}
            />
          }
        >
          {icon()}
        </Show>
      </span>
      <div class={ALERT_CONTENT_CLASS}>
        <AlertToneContext value={() => tone().color}>
          <AlertBody title={props.title} toneColor={tone().color}>
            {props.children}
          </AlertBody>
        </AlertToneContext>
      </div>
      <Show when={action()}>
        {/* self-center: the row is items-start for the icon, which would strand
				    the action at the top of a multi-line body. */}
        <div class="flex shrink-0 items-center self-center">{action()}</div>
      </Show>
    </div>
  );
};

const AlertTitle: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  const toneColor = useContext(AlertToneContext);
  return (
    <div
      data-slot="alert-title"
      class={cn(ALERT_TITLE_CLASS, props.class)}
      style={toneColor ? { color: glassToneText(toneColor()) } : undefined}
      {...rest}
    />
  );
};

const AlertDescription: Component<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class");
  return (
    <div data-slot="alert-description" class={cn(ALERT_DESCRIPTION_CLASS, props.class)} {...rest} />
  );
};

export { Alert, AlertDescription, AlertTitle };
