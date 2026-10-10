import { type Component, Show } from "solid-js";
import { ICON_BUTTON_CLASS } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { toast } from "./sonner.js";
import { useCopyText } from "./use-copy-text.js";

interface CopyButtonProps {
  text: string;
  class?: string;
}

const CopyButton: Component<CopyButtonProps> = (props) => {
  const { state, copy } = useCopyText();

  const handleCopy = async () => {
    if (await copy(props.text)) toast.success("Copied to clipboard");
    else toast.error("Couldn't copy", { description: "Select it and copy by hand." });
  };

  return (
    <button
      type="button"
      data-slot="copy-button"
      onClick={handleCopy}
      class={cn(ICON_BUTTON_CLASS, "size-8", props.class)}
      aria-label={state() === "copied" ? "Copied!" : "Copy to clipboard"}
    >
      <Show
        when={state() === "copied"}
        fallback={
          <Icon icon="lucide:copy" width={16} height={16} class="text-muted-foreground h-4 w-4" />
        }
      >
        <Icon icon="lucide:check" width={16} height={16} class="text-success h-4 w-4" />
      </Show>
    </button>
  );
};

export { CopyButton };
