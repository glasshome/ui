import {
  type Component,
  type ComponentProps,
  createContext,
  createMemo,
  createUniqueId,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { cn } from "../lib/utils";
import { Label } from "./label";

interface FormFieldContextValue {
  name: string;
}

interface FormItemContextValue {
  id: string;
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
      <form {...rest}>{local.children}</form>
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

const FormItem: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const id = createUniqueId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" class={cn("grid gap-2", local.class)} {...rest}>
        {local.children}
      </div>
    </FormItemContext.Provider>
  );
};

const FormLabel: Component<ComponentProps<typeof Label>> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error()}
      class={cn("data-[error=true]:text-destructive", local.class)}
      for={formItemId()}
      {...rest}
    />
  );
};

const FormControl: ParentComponent<ComponentProps<"div">> = (props) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  const [local, rest] = splitProps(props, ["children"]);

  return (
    <div
      data-slot="form-control"
      id={formItemId()}
      aria-describedby={
        !error() ? formDescriptionId() : `${formDescriptionId()} ${formMessageId()}`
      }
      aria-invalid={!!error()}
      {...rest}
    >
      {local.children}
    </div>
  );
};

const FormDescription: Component<ComponentProps<"p">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId()}
      class={cn("text-muted-foreground text-sm", local.class)}
      {...rest}
    />
  );
};

const FormMessage: ParentComponent<ComponentProps<"p">> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const { error, formMessageId } = useFormField();
  const body = () => error() || local.children;

  return (
    <Show when={body()}>
      <p
        data-slot="form-message"
        id={formMessageId()}
        class={cn("text-destructive text-sm", local.class)}
        {...rest}
      >
        {body()}
      </p>
    </Show>
  );
};

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
