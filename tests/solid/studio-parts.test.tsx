/* The parts a live editor needs: a panel that leaves the page usable, choices
 * shown as what they produce, swatches, and tabs that read apart from toggles. */
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { DockedPanel, DockedPanelBody } from "../../src/solid/docked-panel.js";
import { PreviewTile, PreviewTileGroup } from "../../src/solid/preview-tile.js";
import { SwatchPicker } from "../../src/solid/swatch-picker.js";
import { Tabs, TabsList, TabsTrigger } from "../../src/solid/tabs.js";

afterEach(cleanup);

describe("DockedPanel", () => {
	it("is a labelled region with no scrim, and the page behind keeps working", () => {
		let clicks = 0;
		render(() => (
			<>
				<button type="button" onClick={() => clicks++}>
					Behind
				</button>
				<DockedPanel open ariaLabel="Editor">
					<DockedPanelBody>Inside</DockedPanelBody>
				</DockedPanel>
			</>
		));
		expect(screen.getByRole("complementary", { name: "Editor" })).toBeTruthy();
		expect(document.querySelector("[data-slot$=overlay]")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Behind" }));
		expect(clicks).toBe(1);
	});

	it("the handle folds it to its header and back", () => {
		const [collapsed, setCollapsed] = createSignal(false);
		render(() => (
			<DockedPanel open ariaLabel="Editor" collapsed={collapsed()} onCollapsedChange={setCollapsed}>
				<DockedPanelBody>Inside</DockedPanelBody>
			</DockedPanel>
		));
		fireEvent.click(screen.getByRole("button", { name: "Hide panel" }));
		expect(collapsed()).toBe(true);
		expect(screen.getByRole("complementary").hasAttribute("data-collapsed")).toBe(true);
		fireEvent.click(screen.getByRole("button", { name: "Show panel" }));
		expect(collapsed()).toBe(false);
	});
});

describe("PreviewTile", () => {
	it("picks one tile by its name, caption shown or not", () => {
		const [value, setValue] = createSignal<string | null>("a");
		render(() => (
			<PreviewTileGroup aria-label="Pictures" value={value()} onChange={setValue}>
				<PreviewTile value="a" label="Forest">
					<div />
				</PreviewTile>
				<PreviewTile value="b" label="Lake" caption={false}>
					<div />
				</PreviewTile>
			</PreviewTileGroup>
		));
		expect((screen.getByRole("radio", { name: "Forest" }) as HTMLInputElement).checked).toBe(true);
		fireEvent.click(screen.getByRole("radio", { name: "Lake" }));
		expect(value()).toBe("b");
	});
});

describe("SwatchPicker", () => {
	it("names each swatch and keeps the custom slot inside the group", () => {
		const [value, setValue] = createSignal<string | null>(null);
		render(() => (
			<SwatchPicker
				aria-label="Accent"
				colors={["red", "blue"]}
				value={value()}
				onChange={setValue}
				labelOf={(color) => `Colour ${color}`}
			>
				<button type="button">Any</button>
			</SwatchPicker>
		));
		fireEvent.click(screen.getByRole("radio", { name: "Colour blue" }));
		expect(value()).toBe("blue");
		expect(
			screen.getByRole("radiogroup", { name: "Accent" }).contains(screen.getByText("Any")),
		).toBe(true);
	});
});

describe("TabsTrigger", () => {
	it("an icon stacks over the word and the track grows to hold it", () => {
		render(() => (
			<Tabs value="a">
				<TabsList>
					<TabsTrigger value="a" icon="lucide:image">
						Background
					</TabsTrigger>
				</TabsList>
			</Tabs>
		));
		const tab = screen.getByRole("tab", { name: "Background" });
		expect(tab.querySelector("[data-slot=tabs-trigger-icon]")).not.toBeNull();
		expect(tab.className).toContain("flex-col");
	});
});
