import { Icon } from "@iconify-icon/solid";
import { createSignal, For } from "solid-js";
import {
	Button,
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
	CopyButton,
	Dock,
	Kbd,
	KbdGroup,
	SlidingIndicator,
	Toggle,
	ToggleGroup,
	ToggleGroupItem,
} from "../../src/solid";
import { CatalogGroup, CatalogItem, CatalogNote } from "../CatalogKit";

export function ActionsCatalog() {
	const [pressed, setPressed] = createSignal(true);
	const [align, setAlign] = createSignal("center");
	const [dock, setDock] = createSignal("home");
	const [seg, setSeg] = createSignal(0);

	return (
		<CatalogGroup id="cat-actions" title="Actions">
			<CatalogItem name="Button" hint="6 variants" span={2}>
				<Button variant="default">Default</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="link">Link</Button>
				<CatalogNote>sizes</CatalogNote>
				<Button size="sm">sm</Button>
				<Button size="default">default</Button>
				<Button size="lg">lg</Button>
				<Button size="icon" aria-label="settings">
					<Icon icon="lucide:settings" width={16} height={16} />
				</Button>
			</CatalogItem>

			<CatalogItem name="ButtonGroup" hint="joined actions">
				<ButtonGroup>
					<Button variant="outline">Copy</Button>
					<Button variant="outline">Paste</Button>
					<ButtonGroupSeparator />
					<Button variant="outline">Cut</Button>
				</ButtonGroup>
				<CatalogNote>with text label</CatalogNote>
				<ButtonGroup>
					<ButtonGroupText>https://</ButtonGroupText>
					<Button variant="outline">glasshome.app</Button>
				</ButtonGroup>
			</CatalogItem>

			<CatalogItem name="Toggle" hint="pressed state">
				<Toggle pressed={pressed()} onChange={setPressed}>
					<Icon icon="lucide:bell" width={16} height={16} />
					Notify
				</Toggle>
				<Toggle variant="outline">
					<Icon icon="lucide:search" width={16} height={16} />
				</Toggle>
			</CatalogItem>

			<CatalogItem name="ToggleGroup" hint={`value: ${align()}`}>
				<ToggleGroup value={align()} onChange={(v) => v && setAlign(v as string)}>
					<ToggleGroupItem value="left">Left</ToggleGroupItem>
					<ToggleGroupItem value="center">Center</ToggleGroupItem>
					<ToggleGroupItem value="right">Right</ToggleGroupItem>
				</ToggleGroup>
			</CatalogItem>

			<CatalogItem name="CopyButton" hint="clipboard">
				<div class="relative flex h-16 w-full items-center rounded-md border border-border/50 bg-muted/30 px-3 font-mono text-muted-foreground text-xs">
					npm run build
					<CopyButton text="npm run build" />
				</div>
			</CatalogItem>

			<CatalogItem name="Kbd" hint="shortcut hints">
				<Kbd>Esc</Kbd>
				<KbdGroup>
					<Kbd>⌘</Kbd>
					<Kbd>K</Kbd>
				</KbdGroup>
				<KbdGroup>
					<Kbd>Ctrl</Kbd>
					<Kbd>⇧</Kbd>
					<Kbd>P</Kbd>
				</KbdGroup>
			</CatalogItem>

			<CatalogItem name="Dock" hint="floating nav · click to slide the active pill" span={2}>
				<Dock
					items={[
						{
							id: "home",
							icon: <Icon icon="lucide:house" width={20} height={20} />,
							label: "Home",
							isActive: dock() === "home",
							onClick: () => setDock("home"),
						},
						{
							id: "search",
							icon: <Icon icon="lucide:search" width={20} height={20} />,
							label: "Search",
							isActive: dock() === "search",
							onClick: () => setDock("search"),
						},
						{
							id: "user",
							icon: <Icon icon="lucide:user" width={20} height={20} />,
							label: "Profile",
							isActive: dock() === "user",
							onClick: () => setDock("user"),
						},
						{
							id: "settings",
							icon: <Icon icon="lucide:settings" width={20} height={20} />,
							label: "Settings",
							isActive: dock() === "settings",
							onClick: () => setDock("settings"),
						},
					]}
				/>
			</CatalogItem>

			<CatalogItem name="SlidingIndicator" hint="the moving background · click to slide" span={2}>
				<SlidingIndicator
					active={seg()}
					class="inline-flex gap-1 rounded-lg border border-border/50 bg-card/40 p-1"
					indicatorClass="rounded-md"
				>
					<For each={["Day", "Week", "Month"]}>
						{(label, i) => (
							<button
								type="button"
								onClick={() => setSeg(i())}
								class="rounded-md px-3 py-1 text-sm transition-colors"
								classList={{
									"text-foreground": seg() === i(),
									"text-muted-foreground hover:text-foreground": seg() !== i(),
								}}
							>
								{label}
							</button>
						)}
					</For>
				</SlidingIndicator>
				<CatalogNote>
					the reusable "moving background" — powers Dock + Tabs; index-driven (active) or
					attribute-driven (activeSelector, e.g. Kobalte's [data-selected])
				</CatalogNote>
			</CatalogItem>
		</CatalogGroup>
	);
}
