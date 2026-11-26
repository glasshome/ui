import { createContext, createMemo, type ParentComponent, omit, useContext } from "solid-js";
import { type ComponentProps } from "@solidjs/web";

interface FormFieldContextValue {
  name: string;
}

interface FormContextValue {
  errors: () => Record<string, string>;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);
const FormContext = createContext<FormContextValue | null>(null);

const Form: ParentComponent<
  ComponentProps<"form"> & {
    /** Headless: the parent's validation lib owns these; label, control aria-invalid and message all react to them. */
    errors?: Record<string, string>;
    onSetError?: (name: string, error: string) => void;
    onClearError?: (name: string) => void;
  }
> = (props) => {
  const rest = omit(props, "children", "errors", "onSetError", "onClearError");
  const errors = () => props.errors ?? {};

  return (
    <FormContext
      value={{
        errors,
        setError: (name, error) => props.onSetError?.(name, error),
        clearError: (name) => props.onClearError?.(name),
      }}
    >
      <form data-slot="form" {...rest}>
        {props.children}
      </form>
    </FormContext>
  );
};

function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const formContext = useContext(FormContext);

  const name = () => fieldContext?.name ?? "";
  const error = createMemo(() => formContext?.errors()[name()] ?? "");

  return { name, error };
}

const FormField: ParentComponent<{ name: string }> = (props) => {
  return <FormFieldContext value={{ name: props.name }}>{props.children}</FormFieldContext>;
};

export { Form, FormField, useFormField };
