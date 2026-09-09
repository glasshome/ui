import {
	type Component,
	type ComponentProps,
	children,
	createContext,
	createEffect,
	createMemo,
	createSignal,
	createUniqueId,
	type JSX,
	onCleanup,
	onMount,
	type ParentComponent,
	Show,
	splitProps,
	useContext,
	type ValidComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "../lib/utils.js";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field.js";
import { Input } from "./input.js";

interface FormFieldContextValue {
	name: string;
}

interface FormItemContextValue {
	id: string;
	hasDescription: () => boolean;
	setHasDescription: (value: boolean) => void;
}

interface FormContextValue {
	errors: () => Record<string, string>;
	setError: (name: string, error: string) => void;
	clearError: (name: string) => void;
}

const FormFieldContext = createContext<FormFieldContextValue>();
const FormItemContext = createContext<FormItemContextValue>();
const FormContext = createContext<FormContextValue>();

const Form: ParentComponent<
	ComponentProps<"form"> & {
		/** Headless: the parent's validation lib owns these; label, control aria-invalid and message all react to them. */
		errors?: Record<string, string>;
		onSetError?: (name: string, error: string) => void;
		onClearError?: (name: string) => void;
	}
> = (props) => {
	const [local, rest] = splitProps(props, ["children", "errors", "onSetError", "onClearError"]);
	const errors = () => local.errors ?? {};

	return (
		<FormContext.Provider
			value={{
				errors,
				setError: (name, error) => local.onSetError?.(name, error),
				clearError: (name) => local.onClearError?.(name),
			}}
		>
			<form data-slot="form" {...rest}>
				{local.children}
			</form>
		</FormContext.Provider>
	);
};

function useFormField() {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const formContext = useContext(FormContext);

	const id = () => itemContext?.id ?? "";
	const name = () => fieldContext?.name ?? "";
	const error = createMemo(() => formContext?.errors()[name()] ?? "");

	return {
		id,
		name,
		hasDescription: () => itemContext?.hasDescription() ?? false,
		formItemId: () => `${id()}-form-item`,
		formDescriptionId: () => `${id()}-form-item-description`,
		formMessageId: () => `${id()}-form-item-message`,
		error,
	};
}

const FormField: ParentComponent<{ name: string }> = (props) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			{props.children}
		</FormFieldContext.Provider>
	);
};

/** @deprecated Use `Field`. Form* is the same stack with the id wiring attached. */
const FormItem: ParentComponent<ComponentProps<typeof Field>> = (props) => {
	const id = createUniqueId();
	const [hasDescription, setHasDescription] = createSignal(false);

	return (
		<FormItemContext.Provider value={{ id, hasDescription, setHasDescription }}>
			<Field {...props} />
		</FormItemContext.Provider>
	);
};

/** @deprecated Use `FieldLabel`. */
const FormLabel: Component<ComponentProps<typeof FieldLabel>> = (props) => {
	const [local, rest] = splitProps(props, ["class"]);
	const { error, formItemId } = useFormField();

	return (
		<FieldLabel
			data-error={!!error()}
			class={cn("data-[error=true]:text-destructive", local.class)}
			for={formItemId()}
			{...rest}
		/>
	);
};

let warnedFormControlWrapper = false;

/** @internal Lets a test assert the once-per-process warning more than once. */
export function resetFormControlWrapperWarning() {
	warnedFormControlWrapper = false;
}

function warnFormControlWrapper() {
	if (warnedFormControlWrapper) return;
	if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") return;
	warnedFormControlWrapper = true;
	console.warn(
		'[FormControl] The wrapper shape (<FormControl><Input /></FormControl>) is deprecated: an aria-describedby on a div around an input is read by nothing. Render the control itself instead: <FormControl type="email" /> or <FormControl as={Textarea} />.',
	);
}

/**
 * Renders THE control (default: `Input`, any other through `as`) with the id and
 * aria the field context knows.
 *
 * Passing children keeps the old wrapper shape working: a `div` carrying the
 * same id and aria, with the children inside.
 *
 * @deprecated with `children`. Render the control itself, so the id and the
 * describedby land on the element a screen reader announces.
 */
const FormControl = <T extends ValidComponent = typeof Input>(
	props: { as?: T } & ComponentProps<T>,
) => {
	const { error, hasDescription, formItemId, formDescriptionId, formMessageId } = useFormField();
	const [local, rest] = splitProps(props as { as?: ValidComponent; children?: JSX.Element }, [
		"as",
		"children",
	]);
	// Only the ids that actually render: a dangling idref reads as nothing.
	const describedBy = () => {
		const ids = [hasDescription() ? formDescriptionId() : "", error() ? formMessageId() : ""];
		const rendered = ids.filter((id) => id !== "");
		return rendered.length > 0 ? rendered.join(" ") : undefined;
	};
	// Resolved once: `local.children` is a getter, so reading it for the presence
	// check and again in the JSX would instantiate the child component twice.
	const body = children(() => local.children);
	const wrapped = createMemo(() => body() !== undefined);
	createEffect(() => {
		if (wrapped()) warnFormControlWrapper();
	});

	return (
		<Show
			when={wrapped()}
			fallback={
				<Dynamic
					component={local.as ?? Input}
					id={formItemId()}
					aria-describedby={describedBy()}
					aria-invalid={error() ? true : undefined}
					{...rest}
				/>
			}
		>
			<div
				data-slot="form-control"
				id={formItemId()}
				aria-describedby={describedBy()}
				aria-invalid={error() ? true : undefined}
				{...(rest as ComponentProps<"div">)}
			>
				{body()}
			</div>
		</Show>
	);
};

/** @deprecated Use `FieldDescription`. */
const FormDescription: Component<ComponentProps<typeof FieldDescription>> = (props) => {
	const itemContext = useContext(FormItemContext);
	const { formDescriptionId } = useFormField();

	onMount(() => itemContext?.setHasDescription(true));
	onCleanup(() => itemContext?.setHasDescription(false));

	return <FieldDescription id={formDescriptionId()} {...props} />;
};

/** @deprecated Use `FieldError`. */
const FormMessage: ParentComponent<ComponentProps<typeof FieldError>> = (props) => {
	const [local, rest] = splitProps(props, ["children"]);
	const { error, formMessageId } = useFormField();
	const body = () => error() || local.children;

	return (
		<FieldError id={formMessageId()} {...rest}>
			{body()}
		</FieldError>
	);
};

export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
};
