import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CARD_SURFACE } from "../../src/lib/card-classes.js";
import { OptionCard, OptionCardGroup, OptionChoice } from "../../src/solid/option-card.js";

afterEach(cleanup);

function radios(container: HTMLElement) {
	return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
}

function radioAt(container: HTMLElement, index: number) {
	const found = radios(container)[index];
	if (!found) throw new Error(`option card ${index} rendered no radio`);
	return found;
}

describe("OptionCard", () => {
	it("renders one named radio per card", () => {
		const { container, getByLabelText } = render(() => (
			<OptionCardGroup value={null} onChange={() => {}} aria-label="How they sign in">
				<OptionCard value="invite" title="Send an invite" description="They pick a password." />
				<OptionCard value="code" title="Share a code" />
			</OptionCardGroup>
		));

		expect(container.querySelector('[role="radiogroup"]')?.getAttribute("aria-label")).toBe(
			"How they sign in",
		);
		expect(radios(container).map((radio) => radio.value)).toEqual(["invite", "code"]);
		expect(getByLabelText(/Send an invite/)).toBe(radios(container)[0]);
		expect(getByLabelText("Share a code")).toBe(radios(container)[1]);
	});

	it("reports the picked value once per click and marks the card checked", () => {
		const onChange = vi.fn();
		const [value, setValue] = createSignal<string | null>(null);
		const { container } = render(() => (
			<OptionCardGroup
				value={value()}
				onChange={(next) => {
					onChange(next);
					setValue(next);
				}}
			>
				<OptionCard value="invite" title="Send an invite" />
				<OptionCard value="code" title="Share a code" />
			</OptionCardGroup>
		));

		fireEvent.click(radioAt(container, 1));

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith("code");
		const items = container.querySelectorAll('[data-slot="radio-group-item"]');
		expect(items[1]?.hasAttribute("data-checked")).toBe(true);
		expect(items[0]?.hasAttribute("data-checked")).toBe(false);
	});

	// Arrow-key roving is the browser's own native radio-group behaviour, which
	// happy-dom does not implement; what the cards owe it is one shared input
	// name, so that is what is asserted here.
	it("keeps every card on one native radio name, so arrow keys rove", () => {
		const { container } = render(() => (
			<OptionCardGroup value="invite" onChange={() => {}}>
				<OptionCard value="invite" title="Send an invite" />
				<OptionCard value="code" title="Share a code" />
			</OptionCardGroup>
		));

		const names = new Set(radios(container).map((radio) => radio.name));
		expect(names.size).toBe(1);
		expect([...names][0]).toBeTruthy();
		expect(radios(container).every((radio) => radio.tabIndex >= 0)).toBe(true);
	});

	it("does not pick a disabled card", () => {
		const [value, setValue] = createSignal<string | null>(null);
		const { container } = render(() => (
			<OptionCardGroup value={value()} onChange={setValue}>
				<OptionCard value="invite" title="Send an invite" disabled />
			</OptionCardGroup>
		));

		expect(radioAt(container, 0).disabled).toBe(true);

		fireEvent.click(radioAt(container, 0));

		expect(value()).toBeNull();
	});

	it("renders sub-options inside the card, outside the radio item", () => {
		const { container, getByTestId } = render(() => (
			<OptionCardGroup value="person" onChange={() => {}}>
				<OptionCard value="person" title="A person">
					<button type="button" data-testid="slot">
						Pick a person
					</button>
				</OptionCard>
			</OptionCardGroup>
		));

		const slot = getByTestId("slot");
		expect(container.querySelector('[data-slot="option-card"]')?.contains(slot)).toBe(true);
		expect(container.querySelector('[data-slot="radio-group-item"]')?.contains(slot)).toBe(false);
		// Inside the card, in a drawer that morphs the card open on the morph token.
		const drawer = container.querySelector('[data-slot="option-card-drawer"]');
		expect(drawer?.contains(slot)).toBe(true);
		expect(drawer?.className).toContain("grid-rows-[0fr]");
		expect(drawer?.className).toContain("duration-(--duration-morph)");
		expect(
			container.querySelector('[data-slot="option-card"]:not(:has([data-testid]))'),
		).toBeNull();
	});

	it("stacks the description under the title inside the card", () => {
		const { container } = render(() => (
			<OptionCardGroup value={null} onChange={() => {}}>
				<OptionCard value="invite" title="Send an invite" description="They pick a password." />
			</OptionCardGroup>
		));

		const item = container.querySelector('[data-slot="radio-group-item"]');
		expect(item?.querySelector('[data-slot="option-card-title"]')?.textContent).toBe(
			"Send an invite",
		);
		expect(item?.querySelector('[data-slot="option-card-description"]')?.textContent).toBe(
			"They pick a password.",
		);
		const card = container.querySelector('[data-slot="option-card"]');
		expect(card?.className).toContain(
			"[&:not([style*=--glass-tone])]:[--glass-tone:var(--primary)]",
		);
	});

	it("wears the card surface and tints it when picked, never a flat fill", () => {
		const { container } = render(() => (
			<OptionCardGroup value="invite" onChange={() => {}}>
				<OptionCard value="invite" title="Send an invite" description="They pick a password." />
			</OptionCardGroup>
		));

		const card = container.querySelector('[data-slot="option-card"]');
		const className = card?.className ?? "";
		expect(card?.hasAttribute("data-checked")).toBe(true);
		for (const token of CARD_SURFACE.split(" ").filter((t) => !t.startsWith("[--glass-wash:")))
			expect(className, token).toContain(token);
		// .glass-tint would tint the card's own body copy, and mix it toward
		// `transparent` on every unpicked card.
		expect(className).not.toContain("glass-tint");
		expect(className).toContain(
			"data-[checked]:[--glass-edge:oklch(from_var(--glass-tone)_l_c_h/0.75)]",
		);
		expect(className, "bg-* is a no-op on glass").not.toContain("bg-primary/5");
		expect(className).not.toContain("border-border");
	});

	it("gives the row one padding and the text one size", () => {
		const { container } = render(() => (
			<OptionCardGroup value={null} onChange={() => {}}>
				<OptionCard value="invite" title="Send an invite" description="They pick a password." />
			</OptionCardGroup>
		));

		expect(container.querySelector('[data-slot="option-card-row"]')?.className).toContain("p-3.5");
		expect(container.querySelector('[data-slot="option-card-title"]')?.className).toContain(
			"font-semibold",
		);
		expect(container.querySelector('[data-slot="option-card-title"]')?.className).toContain(
			"text-[15px]",
		);
		const description = container.querySelector('[data-slot="option-card-description"]')?.className;
		expect(description).toContain("text-sm");
		expect(description).toContain("text-muted-foreground");
	});

	it("marks the picked card with the corner ornament, or none when asked", () => {
		const { container } = render(() => (
			<OptionCardGroup value="a" onChange={() => {}}>
				<OptionCard value="a" title="A" />
				<OptionCard value="b" title="B" ornament="none" />
			</OptionCardGroup>
		));
		const items = container.querySelectorAll('[data-slot="radio-group-item"], [role="radio"]');
		expect(container.querySelectorAll('[data-slot="ornament-check"]')).toHaveLength(1);
		expect(items.length).toBeGreaterThan(0);
	});

	it("keeps an accented card on its own tone and reports every pick, re-picks included", () => {
		let picks = 0;
		const { container } = render(() => (
			<OptionCardGroup value="a" onChange={() => {}}>
				<OptionCard value="a" title="A" accentVar="var(--success)" onPick={() => picks++} />
			</OptionCardGroup>
		));
		const card = container.querySelector<HTMLElement>('[data-slot="option-card"][data-checked]');
		expect(card?.style.getPropertyValue("--glass-tone")).toBe("var(--success)");
		const item = card?.querySelector<HTMLElement>('[data-slot="radio-group-item"]');
		fireEvent.click(item as HTMLElement);
		fireEvent.click(item as HTMLElement);
		expect(picks).toBe(2);
	});

	it("offers sub-options as rows of the card, chosen in place", () => {
		const [len, setLen] = createSignal<string | undefined>("6");
		const { container } = render(() => (
			<OptionCardGroup value="code" onChange={() => {}}>
				<OptionCard value="code" title="Share a code" subValue={len()} onSubChange={setLen}>
					<OptionChoice value="6" label="Six digits" hint="Quick to type" />
					<OptionChoice value="8" label="Eight digits" />
				</OptionCard>
			</OptionCardGroup>
		));
		const rows = container.querySelectorAll<HTMLElement>('[data-slot="option-choice"]');
		expect(rows).toHaveLength(2);
		expect(
			container.querySelector('[data-slot="option-card-drawer"] [role="radiogroup"]'),
		).not.toBeNull();
		expect(rows[0]?.getAttribute("aria-checked")).toBe("true");
		expect(container.querySelector("select, [data-slot='select-trigger']")).toBeNull();
		fireEvent.click(rows[1] as HTMLElement);
		expect(len()).toBe("8");
		expect(rows[1]?.getAttribute("aria-checked")).toBe("true");
	});
});

describe("OptionCard colour", () => {
	it("puts the icon in a toned well", () => {
		const { container } = render(() => (
			<OptionCardGroup value={null} onChange={() => {}}>
				<OptionCard
					value="a"
					title="Home Assistant"
					icon="lucide:house"
					accentVar="oklch(0.72 0.13 226)"
				/>
			</OptionCardGroup>
		));
		const well = container.querySelector('[data-slot="option-card-icon"]');
		expect(well).not.toBeNull();
		expect(well?.className).toContain("var(--surface-tone)");
	});

	it("puts a brand image in the same well", () => {
		const { container } = render(() => (
			<OptionCardGroup value={null} onChange={() => {}}>
				<OptionCard value="a" title="Home Assistant" iconImage="/ha.svg" />
			</OptionCardGroup>
		));
		expect(container.querySelector('[data-slot="option-card-icon"] img')).not.toBeNull();
	});

	it("tints at rest, more when picked, and uses the theme colour without an accent", () => {
		const { container } = render(() => (
			<OptionCardGroup value="a" onChange={() => {}}>
				<OptionCard value="a" title="Invite" />
			</OptionCardGroup>
		));
		const card = container.querySelector('[data-slot="option-card"]');
		expect(card?.className).toContain("[--glass-wash:9%]");
		expect(card?.className).toContain("data-[checked]:[--glass-wash:30%]");
		expect(card?.className).toContain("[--glass-tone:var(--primary)]");
		expect(card?.className).not.toMatch(/shadow-\[/);
	});

	it("keeps a disabled card visibly disabled", () => {
		const { container } = render(() => (
			<OptionCardGroup value={null} onChange={() => {}}>
				<OptionCard value="a" title="Later" disabled />
			</OptionCardGroup>
		));
		const card = container.querySelector('[data-slot="option-card"]');
		expect(card?.hasAttribute("data-disabled")).toBe(true);
		expect(card?.className).toContain("data-[disabled]:opacity-50");
	});
});
