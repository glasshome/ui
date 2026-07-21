import { Icon } from "@iconify-icon/solid";
import { type Component, createSignal, Show } from "solid-js";
import { cn } from "../lib/utils.js";
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
			onClick={handleCopy}
			class={cn(
				"absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10 backdrop-blur-sm transition-all hover:scale-105 hover:bg-foreground/20 active:scale-95",
				props.class,
			)}
			aria-label={copied() ? "Copied!" : "Copy to clipboard"}
		>
			<Show
				when={copied()}
				fallback={
					<Icon icon="lucide:copy" width={16} height={16} class="h-4 w-4 text-muted-foreground" />
				}
			>
				<Icon icon="lucide:check" width={16} height={16} class="h-4 w-4 text-success" />
			</Show>
		</button>
	);
};

export { CopyButton };
