import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	GlassToast,
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
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";

export function FeedbackCatalog() {
	return (
		<CatalogGroup id="cat-feedback" title="Feedback & status">
			<Specimen name="Alert" span={2}>
				<Axis of="tone">
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
				</Axis>
			</Specimen>

			<Specimen name="Progress">
				<Axis of="tone">
					<div class="flex w-full flex-col gap-3">
						<Progress value={60} class="w-full" />
						<Progress value={92} tone="var(--success)" class="w-full" />
						<Progress value={18} tone="var(--destructive)" class="w-full" />
					</div>
				</Axis>
			</Specimen>

			<Specimen name="Skeleton">
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
			</Specimen>

			<Specimen name="Spinner">
				<Spinner />
				<Spinner class="size-6 text-primary" />
				<Button variant="outline" disabled>
					<Spinner />
					Saving
				</Button>
			</Specimen>

			<Specimen name="Toaster" try="success" span={2}>
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
			</Specimen>

			<Specimen name="GlassToast" span={2}>
				<Axis of="kind">
					<GlassToast kind="success" title="Saved" description="Your changes are live." />
					<GlassToast kind="warning" title="Certificate expires soon" />
					<GlassToast kind="error" title="Upload failed" />
					<GlassToast kind="message" title="Draft restored" />
				</Axis>
			</Specimen>

			<Specimen name="Tooltip" state="open" span={2}>
				<div class="relative flex h-32 w-full items-end justify-center overflow-hidden rounded-md">
					<div class="absolute inset-0 bg-gradient-to-br from-primary/60 via-accent/40 to-muted" />
					<Tooltip open placement="top">
						<TooltipTrigger as={Button} variant="outline" class="relative mb-4">
							Hover me
						</TooltipTrigger>
						<TooltipContent>Turn off lights</TooltipContent>
					</Tooltip>
				</div>
			</Specimen>

			<Specimen name="HoverCard" try="@glasshome">
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
			</Specimen>
		</CatalogGroup>
	);
}
