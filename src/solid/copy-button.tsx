import { type Component, createSignal, Show } from "solid-js";
import { ICON_BUTTON_CLASS } from "../lib/button-variants.js";
import { cn } from "../lib/utils.js";
import { Icon } from "./icon.js";
import { toast } from "./sonner.js";

interface CopyButtonProps {
  text: string;
  class?: string;
}

const CopyButton: Component<CopyButtonProps> = (props) => {
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      type="button"
      data-slot="copy-button"
      onClick={handleCopy}
      class={cn(ICON_BUTTON_CLASS, "size-8", props.class)}
      aria-label={copied() ? "Copied!" : "Copy to clipboard"}
    >
      <Show
        when={copied()}
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
