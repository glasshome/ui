import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	Progress,
	Skeleton,
	Spinner,
	Toaster,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

export function FeedbackCatalog() {
	return (
		<CatalogGroup id="cat-feedback" title="Feedback & status">
			<CatalogItem name="Alert" hint="4 tones" span={2}>
				<div class="w-full space-y-2">
					<Alert tone="info" title="Heads up">
						A managed tunnel is warming up. This can take a minute.
					</Alert>
					<Alert tone="warning" title="Version deprecated">
						This widget release is scheduled for removal.
					</Alert>
					<Alert
						tone="success"
						title="Widget published"
						action={
							<Button size="sm" variant="outline">
								View
							</Button>
						}
					>
						Your changes are live.
					</Alert>
					<Alert tone="destructive">
						<AlertTitle>Upload failed</AlertTitle>
						<AlertDescription>The bundle exceeded the size limit.</AlertDescription>
					</Alert>
				</div>
			</CatalogItem>

			<CatalogItem name="Progress" hint="value 60">
				<Progress value={60} class="w-full" />
				<CatalogNote>fixed 60%</CatalogNote>
			</CatalogItem>

			<CatalogItem name="Skeleton" hint="loading placeholder">
				<div class="w-full space-y-2">
					<div class="flex items-center gap-3">
						<Skeleton class="size-10 rounded-full" />
						<div class="flex-1 space-y-2">
							<Skeleton class="h-3 w-3/4" />
							<Skeleton class="h-3 w-1/2" />
						</div>
					</div>
					<Skeleton class="h-16 w-full" />
				</div>
			</CatalogItem>

			<CatalogItem name="Spinner" hint="loading indicator">
				<Spinner />
				<Spinner class="size-6 text-primary" />
				<Button variant="outline" disabled>
					<Spinner />
					Saving
				</Button>
			</CatalogItem>

			<CatalogItem name="Sonner" hint="toast + Toaster" span={2}>
				<Toaster />
				<Button
					variant="outline"
					onClick={() => toast.success("Saved", { description: "Your changes are live." })}
				>
					success
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast.error("Upload failed", { description: "The bundle exceeded the size limit." })
					}
				>
					error
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast.warning("Certificate expires soon", { description: "Renew within 7 days." })
					}
				>
					warning
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast.info("Tunnel warming up", { description: "This can take a moment." })
					}
				>
					info
				</Button>
				<Button variant="outline" onClick={() => toast.message("Draft restored")}>
					message
				</Button>
				<CatalogNote>
					own GlassToast component (sonner unstyled); title tinted, body muted, default stays
					neutral
				</CatalogNote>
			</CatalogItem>

			<CatalogItem name="Tooltip" hint="hover a Button">
				<Tooltip openDelay={150}>
					<TooltipTrigger as={Button} variant="outline">
						Hover me
					</TooltipTrigger>
					<TooltipContent>Turn off lights</TooltipContent>
				</Tooltip>
			</CatalogItem>

			<CatalogItem name="HoverCard" hint="hover a Button">
				<HoverCard openDelay={150}>
					<HoverCardTrigger as={Button} variant="outline">
						@glasshome
					</HoverCardTrigger>
					<HoverCardContent>
						<div class="space-y-1">
							<p class="font-semibold text-sm">GlassHome</p>
							<p class="text-muted-foreground text-xs">
								Your home dashboard, self-hosted and private.
							</p>
						</div>
					</HoverCardContent>
				</HoverCard>
			</CatalogItem>
		</CatalogGroup>
	);
}
