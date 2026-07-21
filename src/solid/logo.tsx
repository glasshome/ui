import { type Component, type ComponentProps, type JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
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
	const [local, others] = splitProps(props, [
		"class",
		"sub",
		"size",
		"href",
		"src",
		"markClass",
		"subSlot",
	]);
	const size = () => local.size ?? LOGO_DEFAULT_SIZE;
	const s = () => LOGO_SIZES[size()];
	return (
		<Dynamic
			component={local.href ? "a" : "div"}
			data-slot="logo"
			class={cn(LOGO_ROOT_CLASS, s().gap, local.class)}
			href={local.href}
			{...others}
		>
			<img
				src={local.src ?? LOGO_DEFAULT_SRC}
				alt=""
				width={LOGO_MARK_PX[size()]}
				height={LOGO_MARK_PX[size()]}
				class={cn(LOGO_MARK_CLASS, s().mark, local.markClass)}
			/>
			<span class={LOGO_STACK_CLASS}>
				<span data-slot="logo-name" class={cn(s().name, LOGO_NAME_CLASS)}>
					GlassHome
				</span>
				{local.subSlot ?? (
					<span data-slot="logo-sub" class={cn(s().sub, LOGO_SUB_CLASS)}>
						{local.sub ?? LOGO_DEFAULT_SUB}
					</span>
				)}
			</span>
		</Dynamic>
	);
};

export { Logo };
