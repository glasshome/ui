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
import { Icon } from "../../src/solid/icon.js";
import { Axis, CatalogGroup, Specimen } from "../CatalogKit";

export function ActionsCatalog() {
	const [pressed, setPressed] = createSignal(true);
	const [align, setAlign] = createSignal("center");
	const [styles, setStyles] = createSignal<string[]>(["bold"]);
	const [dock, setDock] = createSignal("home");
	const [seg, setSeg] = createSignal(0);

	return (
		<CatalogGroup id="cat-actions" title="Actions">
			<Specimen name="Button" span={2}>
				<Axis of="variant">
					<Button variant="default">Default</Button>
					<Button variant="destructive">Destructive</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="link">Link</Button>
				</Axis>
				<Axis of="size">
					<Button size="sm">sm</Button>
					<Button size="default">default</Button>
					<Button size="lg">lg</Button>
					<Button size="icon" aria-label="settings">
						<Icon icon="lucide:settings" width={16} height={16} />
					</Button>
				</Axis>
			</Specimen>

			<Specimen name="ButtonGroup">
				<ButtonGroup>
					<Button variant="outline">Copy</Button>
					<Button variant="outline">Paste</Button>
					<ButtonGroupSeparator />
					<Button variant="outline">Cut</Button>
				</ButtonGroup>
				<ButtonGroup>
					<ButtonGroupText>https://</ButtonGroupText>
					<Button variant="outline">glasshome.app</Button>
				</ButtonGroup>
			</Specimen>

			<Specimen name="Toggle" state={pressed() ? "pressed" : "released"}>
				<Toggle pressed={pressed()} onChange={setPressed}>
					<Icon icon="lucide:bell" width={16} height={16} />
					Notify
				</Toggle>
				<Toggle variant="outline">
					<Icon icon="lucide:search" width={16} height={16} />
				</Toggle>
			</Specimen>

			<Specimen name="ToggleGroup" state={`${align()} · ${styles().join(", ") || "none"}`}>
				<Axis of="value">
					<ToggleGroup value={align()} onChange={(v) => v && setAlign(v as string)}>
						<ToggleGroupItem value="left">Left</ToggleGroupItem>
						<ToggleGroupItem value="center">Center</ToggleGroupItem>
						<ToggleGroupItem value="right">Right</ToggleGroupItem>
					</ToggleGroup>
				</Axis>
				<Axis of="multiple">
					<ToggleGroup multiple value={styles()} onChange={(v) => setStyles(v as string[])}>
						<ToggleGroupItem value="bold">Bold</ToggleGroupItem>
						<ToggleGroupItem value="italic">Italic</ToggleGroupItem>
						<ToggleGroupItem value="underline">Underline</ToggleGroupItem>
					</ToggleGroup>
				</Axis>
			</Specimen>

			<Specimen name="CopyButton">
				<div class="relative flex h-16 w-full items-center rounded-md border border-border/50 bg-muted/30 px-3 font-mono text-muted-foreground text-xs">
					npm run build
					<CopyButton text="npm run build" />
				</div>
			</Specimen>

			<Specimen name="Kbd">
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
			</Specimen>

			<Specimen name="Dock" state={dock()} span={2}>
				<Axis of="items">
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
				</Axis>
				<Axis of="badge">
					<Dock
						items={[
							{
								id: "updates",
								icon: <Icon icon="lucide:download" width={20} height={20} />,
								label: "Updates",
								badge: 3,
							},
							{
								id: "inbox",
								icon: <Icon icon="lucide:inbox" width={20} height={20} />,
								label: "Inbox",
								badge: 12,
							},
						]}
					/>
				</Axis>
			</Specimen>

			<Specimen name="SlidingIndicator" try="Week" span={2}>
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
			</Specimen>
		</CatalogGroup>
	);
}
