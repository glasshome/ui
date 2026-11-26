import {
  type ComponentProps,
  createContext,
  createMemo,
  type ParentComponent,
  splitProps,
  useContext,
} from "solid-js";

interface FormFieldContextValue {
  name: string;
}

interface FormContextValue {
  errors: () => Record<string, string>;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
}

const FormFieldContext = createContext<FormFieldContextValue>();
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
  const formContext = useContext(FormContext);

  const name = () => fieldContext?.name ?? "";
  const error = createMemo(() => formContext?.errors()[name()] ?? "");

  return { name, error };
}

const FormField: ParentComponent<{ name: string }> = (props) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      {props.children}
    </FormFieldContext.Provider>
  );
};

export { Form, FormField, useFormField };
