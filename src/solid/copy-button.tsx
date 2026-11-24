import { type Component, Show } from "solid-js";
import { ICON_BUTTON_CLASS } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { useUiText } from "./locale.js";
import { toast } from "./sonner.js";
import { useCopyText } from "./use-copy-text.js";

interface CopyButtonProps {
  text: string;
  class?: string;
}

const CopyButton: Component<CopyButtonProps> = (props) => {
  const { state, copy } = useCopyText();
  const text = useUiText();

  const handleCopy = async () => {
    if (await copy(props.text)) toast.success(text("ui.copy-button.copied-toast"));
    else
      toast.error(text("ui.copy-button.failed-toast"), {
        description: text("ui.copy-button.failed-hint"),
      });
  };

  return (
    <button
      type="button"
      data-slot="copy-button"
      onClick={handleCopy}
      class={cn(ICON_BUTTON_CLASS, "size-8", props.class)}
      aria-label={text(state() === "copied" ? "ui.copy-button.copied" : "ui.copy-button.copy")}
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
