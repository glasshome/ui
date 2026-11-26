import { type Component, omit } from "solid-js";
import { type ComponentProps, type JSX } from "@solidjs/web";
import { Polymorphic } from "../lib/behavior/polymorphic.js";
import {
  LOGO_DEFAULT_SIZE,
  LOGO_DEFAULT_SRC,
  LOGO_DEFAULT_SUB,
  LOGO_MARK_CLASS,
  LOGO_MARK_PX,
  LOGO_NAME_CLASS,
  LOGO_ROOT_CLASS,
  LOGO_SIZES,
  LOGO_STACK_CLASS,
  LOGO_SUB_CLASS,
  type LogoSize,
} from "../lib/logo-lockup.js";
import { cn } from "../lib/utils.js";

type LogoProps = Omit<ComponentProps<"div">, "children"> & {
  /** Sub-brand line. Defaults to "Dash". */
  sub?: string;
  size?: LogoSize;
  /** Renders the lockup as a link when set. */
  href?: string;
  /** Override the mark asset. Both apps serve the default path. */
  src?: string;
  /** Extra classes for the mark, e.g. a hover transform. */
  markClass?: string;
  /** Replaces the sub-brand line for surfaces that animate over it. */
  subSlot?: JSX.Element;
};

/**
 * The GlassHome lockup: mark + "GlassHome" + the sub-brand line. One ratio
 * everywhere (audit L2) — the sub-line is the dominant element, the wordmark
 * rides above it as a smaller eyebrow, and both scale together via `size`.
 * Never hand-build this stack; the spec lives in lib/logo-lockup.ts.
 */
const Logo: Component<LogoProps> = (props) => {
  const others = omit(props, "class", "sub", "size", "href", "src", "markClass", "subSlot");
  const size = () => props.size ?? LOGO_DEFAULT_SIZE;
  const s = () => LOGO_SIZES[size()];
  return (
    <Polymorphic
      defaultAs="div"
      as={props.href ? "a" : undefined}
      data-slot="logo"
      class={cn(LOGO_ROOT_CLASS, s().gap, props.class)}
      href={props.href}
      {...others}
    >
      <img
        src={props.src ?? LOGO_DEFAULT_SRC}
        alt=""
        width={LOGO_MARK_PX[size()]}
        height={LOGO_MARK_PX[size()]}
        class={cn(LOGO_MARK_CLASS, s().mark, props.markClass)}
      />
      <span class={LOGO_STACK_CLASS}>
        <span data-slot="logo-name" class={cn(s().name, LOGO_NAME_CLASS)}>
          GlassHome
        </span>
        {props.subSlot ?? (
          <span data-slot="logo-sub" class={cn(s().sub, LOGO_SUB_CLASS)}>
            {props.sub ?? LOGO_DEFAULT_SUB}
          </span>
        )}
      </span>
    </Polymorphic>
  );
};

export { Logo };
