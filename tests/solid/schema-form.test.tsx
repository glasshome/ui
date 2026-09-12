/* SchemaForm renderer contract:
 * - controlled form: parent-driven data changes (revert/reset/widget-switch)
 *   reach the visible controls (audit finding #33),
 * - one recursive dispatch: entity/area fields nested in groups render their
 *   real pickers instead of downgrading to text inputs,
 * - unknown formType renders a read-only notice, never a broken control,
 * - formType "list" and "variants" branches per sdk-2.md D.3. */
import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import { type EntityDataAdapter, EntityDataContext } from "../../src/solid/entity-data.js";
import { dragTargetIndex } from "../../src/solid/list-reorder.js";
import { type MediaStore, MediaStoreContext } from "../../src/solid/media-store.js";
import {
	type ExtendedJSONSchema,
	extractItemDefaults,
	SchemaForm,
	switchVariantValue,
} from "../../src/solid/schema-form.js";

const stubEntityData: EntityDataAdapter = {
	entityIdsByDomain: () => ({ sensor: ["sensor.a"] }),
	useEntities: () => () => [],
	getEntityView: () => undefined,
	useAreas: () => () => [],
};

const powerEntities: ExtendedJSONSchema = {
	default: [],
	domain: "sensor",
	deviceClass: "power",
	title: "Entities",
	type: "array",
	items: { type: "string" },
};

const inputBranch: ExtendedJSONSchema = {
	type: "object",
	properties: {
		label: { title: "Label", type: "string" },
		entities: powerEntities,
		kind: { type: "string", const: "input" },
	},
	required: ["entities", "kind"],
};

const outputBranch: ExtendedJSONSchema = {
	type: "object",
	properties: {
		label: { title: "Label", type: "string" },
		entities: powerEntities,
		remainder: { default: false, title: "Remainder node", type: "boolean" },
		kind: { type: "string", const: "output" },
	},
	required: ["entities", "remainder", "kind"],
};

/** Wire shape of a field.variants item (spec D.2), as field.list serializes it. */
const nodeItemSchema: ExtendedJSONSchema = {
	oneOf: [inputBranch, outputBranch],
	default: { kind: "input", entities: [] },
	formType: "variants",
	discriminator: "kind",
	title: "Type",
	labels: { input: "Input", output: "Output" },
};

const nodesList: ExtendedJSONSchema = {
	minItems: 2,
	maxItems: 3,
	type: "array",
	items: nodeItemSchema,
	default: [],
	formType: "list",
	title: "Flow nodes",
	addLabel: "Add node",
	labelField: "label",
};

const listSchema: ExtendedJSONSchema = {
	type: "object",
	properties: { nodes: nodesList },
};

describe("SchemaForm is controlled", () => {
	it("parent data changes (revert/reset) reach the visible form", () => {
		const [data, setData] = createSignal<Record<string, unknown>>({ name: "Alpha" });
		const { getByLabelText } = render(() => (
			<SchemaForm
				schema={{ type: "object", properties: { name: { type: "string", title: "Name" } } }}
				data={data()}
				onChange={setData}
			/>
		));
		const input = getByLabelText("Name") as HTMLInputElement;
		expect(input.value).toBe("Alpha");
		setData({ name: "Beta" });
		expect(input.value).toBe("Beta");
	});

	it("edits lift through onChange without local state", () => {
		const onChange = vi.fn();
		const { getByLabelText } = render(() => (
			<SchemaForm
				schema={{ type: "object", properties: { name: { type: "string", title: "Name" } } }}
				data={{ name: "Alpha" }}
				onChange={onChange}
			/>
		));
		fireEvent.input(getByLabelText("Name"), { target: { value: "Gamma" } });
		expect(onChange).toHaveBeenCalledWith({ name: "Gamma" });
	});

	it("passes a probe class through to the DOM", () => {
		const { container } = render(() => (
			<SchemaForm
				class="probe"
				schema={{ type: "object", properties: {} }}
				data={{}}
				onChange={() => {}}
			/>
		));
		expect(container.querySelector(".probe")).toBeTruthy();
		expect(container.querySelector('[data-slot="schema-form"]')).toBeTruthy();
	});
});

describe("recursive dispatch", () => {
	it("renders entity pickers inside nested objects instead of text inputs", () => {
		const schema: ExtendedJSONSchema = {
			type: "object",
			properties: {
				group: {
					type: "object",
					title: "Group",
					properties: { entities: powerEntities },
				},
			},
		};
		const { container } = render(() => (
			<EntityDataContext.Provider value={stubEntityData}>
				<SchemaForm schema={schema} data={{}} onChange={() => {}} />
			</EntityDataContext.Provider>
		));
		expect(container.querySelector('input[id="group.entities"]')).toBeNull();
		const combobox = container.querySelector('[role="combobox"]');
		expect(combobox?.textContent).toContain("Select sensor entities");
	});
});

describe("unknown formType fallback", () => {
	it("renders a read-only notice, not a broken control", () => {
		const future: ExtendedJSONSchema = {
			type: "object",
			formType: "hologram",
			title: "Future setting",
		};
		const schema: ExtendedJSONSchema = { type: "object", properties: { future } };
		const { container } = render(() => (
			<SchemaForm schema={schema} data={{}} onChange={() => {}} />
		));
		expect(container.textContent).toContain("This setting needs a newer dashboard");
		expect(container.querySelector('[data-slot="schema-form-unknown"]')).toBeTruthy();
		expect(container.querySelector("input")).toBeNull();
	});
});

describe("formType list", () => {
	const twoNodes = [
		{ kind: "input", label: "Solar", entities: [] },
		{ kind: "output", label: "", entities: [], remainder: false },
	];

	it("captions rows by labelField, then variant label, then Item N", () => {
		const { container } = render(() => (
			<SchemaForm schema={listSchema} data={{ nodes: [...twoNodes, {}] }} onChange={() => {}} />
		));
		const rows = Array.from(container.querySelectorAll('[data-slot="schema-form-list-item"]'));
		expect(rows).toHaveLength(3);
		expect(rows[0]?.textContent).toContain("Solar");
		// Empty labelField value falls back to the variant label from `labels`.
		expect(rows[1]?.textContent).toContain("Output");
		// No labelField value and no kind: positional fallback.
		expect(rows[2]?.textContent).toContain("Item 3");
	});

	it("add appends the item defaults and is disabled at maxItems", () => {
		const onChange = vi.fn();
		const { getByRole, unmount } = render(() => (
			<SchemaForm schema={listSchema} data={{ nodes: twoNodes }} onChange={onChange} />
		));
		const add = getByRole("button", { name: "Add node" }) as HTMLButtonElement;
		expect(add.disabled).toBe(false);
		fireEvent.click(add);
		expect(onChange).toHaveBeenCalledWith({
			nodes: [...twoNodes, { kind: "input", entities: [] }],
		});
		unmount();

		const { getByRole: getByRoleFull } = render(() => (
			<SchemaForm
				schema={listSchema}
				data={{ nodes: [...twoNodes, { kind: "input", entities: [] }] }}
				onChange={onChange}
			/>
		));
		expect((getByRoleFull("button", { name: "Add node" }) as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it("remove drops the item but is disabled at minItems", () => {
		const onChange = vi.fn();
		const three = [...twoNodes, { kind: "input", label: "Grid", entities: [] }];
		const { getByRole, unmount } = render(() => (
			<SchemaForm schema={listSchema} data={{ nodes: three }} onChange={onChange} />
		));
		fireEvent.click(getByRole("button", { name: "Remove Solar" }));
		expect(onChange).toHaveBeenCalledWith({ nodes: three.slice(1) });
		unmount();

		const { getByRole: atMin } = render(() => (
			<SchemaForm schema={listSchema} data={{ nodes: twoNodes }} onChange={onChange} />
		));
		expect((atMin("button", { name: "Remove Solar" }) as HTMLButtonElement).disabled).toBe(true);
	});

	it("reorders items from the grip handle via arrow keys", () => {
		const onChange = vi.fn();
		const { getAllByRole } = render(() => (
			<SchemaForm schema={listSchema} data={{ nodes: twoNodes }} onChange={onChange} />
		));
		const handles = getAllByRole("button", { name: /^Reorder / }) as HTMLButtonElement[];
		expect(handles).toHaveLength(2);
		fireEvent.keyDown(handles[0] as HTMLButtonElement, { key: "ArrowDown" });
		expect(onChange).toHaveBeenCalledWith({ nodes: [twoNodes[1], twoNodes[0]] });
		onChange.mockClear();
		fireEvent.keyDown(handles[0] as HTMLButtonElement, { key: "ArrowUp" });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("dragTargetIndex crosses a neighbor at half its height", () => {
		const heights = [40, 40, 120, 40];
		expect(dragTargetIndex(heights, 0, 0)).toBe(0);
		expect(dragTargetIndex(heights, 0, 21)).toBe(1);
		expect(dragTargetIndex(heights, 0, 19)).toBe(0);
		expect(dragTargetIndex(heights, 0, 40 + 61)).toBe(2);
		expect(dragTargetIndex(heights, 3, -(120 / 2 + 1))).toBe(2);
		expect(dragTargetIndex(heights, 1, -21)).toBe(0);
		expect(dragTargetIndex(heights, 0, -50)).toBe(0);
		expect(dragTargetIndex(heights, 3, 999)).toBe(3);
	});

	it("expands a row to the recursive item editor", () => {
		const { container, getByRole } = render(() => (
			<EntityDataContext.Provider value={stubEntityData}>
				<SchemaForm schema={listSchema} data={{ nodes: twoNodes }} onChange={() => {}} />
			</EntityDataContext.Provider>
		));
		expect(container.querySelector('[data-slot="schema-form-variants"]')).toBeNull();
		fireEvent.click(getByRole("button", { name: "Solar", expanded: false }));
		expect(container.querySelector('[data-slot="schema-form-variants"]')).toBeTruthy();
	});

	const pictureItemSchema: ExtendedJSONSchema = {
		type: "object",
		title: "Picture",
		properties: {
			image: { type: "string", title: "Picture" },
			crop: {
				type: "object",
				title: "Crop",
				properties: { zoom: { type: "number", title: "Zoom" } },
			},
		},
	};

	const groupPictures: ExtendedJSONSchema = {
		type: "array",
		default: [],
		formType: "list",
		title: "Pictures",
		addLabel: "Add picture",
		items: pictureItemSchema,
	};

	const groupList: ExtendedJSONSchema = {
		type: "object",
		properties: { pictures: groupPictures },
	};

	it("an item's group root drops its own box and title, a group below it keeps them", () => {
		const { container, getByRole } = render(() => (
			<SchemaForm schema={groupList} data={{ pictures: [{}] }} onChange={() => {}} />
		));
		fireEvent.click(getByRole("button", { name: "Item 1", expanded: false }));
		const item = container.querySelector('[data-slot="schema-form-list-item"]');
		const groups = Array.from(item?.querySelectorAll('[data-slot="schema-form-object"]') ?? []);
		expect(groups).toHaveLength(2);
		expect(groups[0]?.className).not.toContain("border");
		expect(groups[1]?.className).toContain("border");
		expect(item?.textContent?.match(/Picture/g)).toHaveLength(1);
	});
});

describe("formType variants", () => {
	it("renders the discriminator select and the active branch's fields", () => {
		const schema: ExtendedJSONSchema = { type: "object", properties: { node: nodeItemSchema } };
		const { container } = render(() => (
			<EntityDataContext.Provider value={stubEntityData}>
				<SchemaForm
					schema={schema}
					data={{ node: { kind: "output", label: "Main", entities: [], remainder: true } }}
					onChange={() => {}}
				/>
			</EntityDataContext.Provider>
		));
		const variants = container.querySelector('[data-slot="schema-form-variants"]');
		expect(variants).toBeTruthy();
		expect(variants?.textContent).toContain("Output");
		// The output branch's own field renders; the discriminator is not a field row.
		expect(variants?.textContent).toContain("Remainder node");
		const labels = Array.from(variants?.querySelectorAll("label") ?? []).map((l) => l.textContent);
		expect(labels).not.toContain("kind");
	});

	it("switching kind keeps same-named values and drops branch-only ones", () => {
		const current = { kind: "output", label: "Main", entities: ["sensor.a"], remainder: true };
		expect(switchVariantValue(inputBranch, "kind", "input", current)).toEqual({
			kind: "input",
			label: "Main",
			entities: ["sensor.a"],
		});
		// Back the other way: remainder reappears with its branch default.
		expect(
			switchVariantValue(outputBranch, "kind", "output", { kind: "input", entities: ["sensor.a"] }),
		).toEqual({ kind: "output", entities: ["sensor.a"], remainder: false });
	});
});

describe("extractItemDefaults", () => {
	it("prefers the serialized default (field.variants always provides one)", () => {
		expect(extractItemDefaults(nodeItemSchema)).toEqual({ kind: "input", entities: [] });
	});

	it("falls back to the first branch seeded by its discriminator const", () => {
		const { default: _omitted, ...withoutDefault } = nodeItemSchema;
		expect(extractItemDefaults(withoutDefault)).toEqual({ kind: "input", entities: [] });
	});

	it("collects plain-object property defaults", () => {
		expect(
			extractItemDefaults({
				type: "object",
				properties: {
					name: { type: "string" },
					count: { type: "number", default: 3 },
				},
			}),
		).toEqual({ count: 3 });
	});
});

describe("formType image-picker", () => {
	it("renders an ImagePicker for formType image-picker", () => {
		const stubMediaStore = {
			index: async () => ({
				media: [],
				usage: { bytes: 0, limitBytes: 1024, files: 0, limitFiles: 10 },
			}),
			upload: async () => ({
				id: "test",
				mimeType: "image/png",
				width: 100,
				height: 100,
				size: 1000,
				usedBy: 0,
			}),
			remove: async () => {},
			url: (id: string) => `/api/images/${id}`,
		};
		const artField: ExtendedJSONSchema = { type: "string", formType: "image-picker", title: "Art" };
		const schema: ExtendedJSONSchema = { type: "object", properties: { art: artField } };
		const { container } = render(() => (
			<MediaStoreContext.Provider value={stubMediaStore}>
				<SchemaForm schema={schema} data={{}} onChange={() => {}} />
			</MediaStoreContext.Provider>
		));
		expect(container.querySelector('[data-slot="image-picker"]')).toBeTruthy();
		expect(container.querySelector('[data-slot="schema-form-unknown"]')).toBeNull();
	});
});

describe("list rows preview their picture", () => {
	const store: MediaStore = {
		index: async () => ({
			media: [],
			usage: { bytes: 0, limitBytes: 1024, files: 0, limitFiles: 10 },
		}),
		upload: async () => ({ id: "x", mimeType: "image/png", size: 1, usedBy: 0 }),
		remove: async () => {},
		url: (id, variant) => (variant === "thumb" ? `/api/images/${id}/thumb` : `/api/images/${id}`),
	};

	const pictureList = (itemProperties: Record<string, ExtendedJSONSchema>): ExtendedJSONSchema => {
		const pictures: ExtendedJSONSchema = {
			type: "array",
			default: [],
			formType: "list",
			title: "Pictures",
			addLabel: "Add picture",
			items: { type: "object", title: "Picture", properties: itemProperties },
		};
		return { type: "object", properties: { pictures } };
	};

	const oneImage = pictureList({ image: { type: "string", formType: "image-picker" } });

	const renderList = (schema: ExtendedJSONSchema, data: Record<string, unknown>) =>
		render(() => (
			<MediaStoreContext.Provider value={store}>
				<SchemaForm schema={schema} data={data} onChange={() => {}} />
			</MediaStoreContext.Provider>
		));

	const thumb = (container: Element) =>
		container.querySelector('[data-slot="schema-form-list-item-thumb"]');

	it("draws the row chip from the thumb variant, never the full original", () => {
		const { container } = renderList(oneImage, { pictures: [{ image: "photo1" }] });
		const img = thumb(container)?.querySelector("img");
		expect(img?.getAttribute("src")).toBe("/api/images/photo1/thumb");
	});

	it("keeps a ten-row list off the originals entirely", () => {
		const pictures = Array.from({ length: 10 }, (_, i) => ({ image: `p${i}` }));
		const { container } = renderList(oneImage, { pictures });
		const sources = [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"));
		expect(sources.length).toBe(10);
		for (const src of sources) expect(src?.endsWith("/thumb")).toBe(true);
	});

	it("shows the picker's empty glyph when no picture is chosen yet", () => {
		const { container } = renderList(oneImage, { pictures: [{}] });
		const box = thumb(container);
		expect(box?.querySelector("img")).toBeNull();
		expect(box?.querySelector('svg[data-slot="icon"]')?.getAttribute("data-icon")).toBe(
			"lucide:image",
		);
	});

	it("falls back to the broken-image glyph when the file is gone", () => {
		const { container } = renderList(oneImage, { pictures: [{ image: "gone" }] });
		const img = thumb(container)?.querySelector("img");
		expect(img).toBeTruthy();
		if (img) fireEvent.error(img);
		expect(thumb(container)?.querySelector("img")).toBeNull();
		expect(
			thumb(container)?.querySelector('svg[data-slot="icon"]')?.getAttribute("data-icon"),
		).toBe("lucide:image-off");
	});

	it("stays a text row with no image field, and with two of them", () => {
		const { container: none } = renderList(pictureList({ label: { type: "string" } }), {
			pictures: [{ label: "One" }],
		});
		expect(thumb(none)).toBeNull();

		const { container: two } = renderList(
			pictureList({
				front: { type: "string", formType: "image-picker" },
				back: { type: "string", formType: "image-picker" },
			}),
			{ pictures: [{ front: "a", back: "b" }] },
		);
		expect(thumb(two)).toBeNull();
	});

	it("stays a text row when no media store is registered", () => {
		const { container } = render(() => (
			<SchemaForm
				schema={oneImage}
				data={{ pictures: [{ image: "photo1" }] }}
				onChange={() => {}}
			/>
		));
		expect(thumb(container)).toBeNull();
		expect(container.querySelector('[data-slot="schema-form-list-item"]')?.textContent).toContain(
			"Item 1",
		);
	});
});

/* The generated form is the same field stack as a hand-written one: parent
 * gap, the control's hint below the control, a group's explanation above the
 * group, and every add button as wide as the fields it sits under. */
describe("field stack", () => {
	const scene: ExtendedJSONSchema = {
		type: "object",
		properties: {
			name: { type: "string", title: "Name", description: "Display name for this scene." },
			place: {
				type: "object",
				title: "Placement",
				description: "Where the scene shows up.",
				properties: { room: { type: "string", title: "Room" } },
			},
		},
	};

	function renderScene() {
		return render(() => (
			<SchemaForm schema={scene} data={{ name: "Evening" }} onChange={() => {}} />
		));
	}

	it("stacks the field on the parent gap alone", () => {
		const { container } = renderScene();
		const root = container.querySelector<HTMLElement>('[data-slot="schema-form"]');
		expect(root?.className).toContain("gap-6");
		expect(root?.className).not.toContain("space-y");
	});

	it("puts a field's own hint between its label and its control", () => {
		const { container } = renderScene();
		const field = container.querySelector<HTMLElement>('[data-slot="field"]');
		const slots = Array.from(field?.children ?? []).map((child) => child.getAttribute("data-slot"));
		expect(slots).toEqual(["field-label", "field-description", "input"]);
	});

	it("puts a group's explanation above the group", () => {
		const { container } = renderScene();
		const group = container.querySelector<HTMLElement>('[data-slot="schema-form-object"]');
		expect(group?.tagName).toBe("FIELDSET");
		const first = group?.children[0];
		const second = group?.children[1];
		expect(first?.getAttribute("data-slot")).toBe("field-legend");
		expect(first?.textContent).toBe("Placement");
		expect(second?.getAttribute("data-slot")).toBe("field-description");
		expect(second?.textContent).toBe("Where the scene shows up.");
	});

	it("gives the list add button the width of the fields above it", () => {
		const { container } = render(() => (
			<SchemaForm
				schema={{ type: "object", properties: { nodes: nodesList } }}
				data={{ nodes: [] }}
				onChange={() => {}}
			/>
		));
		const add = container.querySelector<HTMLElement>('[data-slot="schema-form-list-add"]');
		expect(add?.className).toContain("w-full");
		expect(add?.className).not.toContain("self-start");
	});

	it("reports validation errors through the Alert door", () => {
		const { container } = render(() => (
			<SchemaForm
				schema={{ type: "object", properties: {} }}
				data={{}}
				onChange={() => {}}
				errors={["Name is required."]}
			/>
		));
		const alert = container.querySelector<HTMLElement>('[data-slot="alert"]');
		expect(alert?.getAttribute("role")).toBe("alert");
		expect(alert?.textContent).toContain("Name is required.");
	});

	it("renders string-list chips as badges", () => {
		const { container } = render(() => (
			<SchemaForm
				schema={{
					type: "object",
					properties: { tags: { type: "array", items: { type: "string" } } },
				}}
				data={{ tags: ["kitchen"] }}
				onChange={() => {}}
			/>
		));
		const badge = container.querySelector<HTMLElement>('[data-slot="badge"]');
		expect(badge?.textContent).toContain("kitchen");
	});

	it("spaces the list row with a gap instead of per-child margins", () => {
		const { container } = render(() => (
			<SchemaForm
				schema={{ type: "object", properties: { nodes: nodesList } }}
				data={{ nodes: [{ kind: "input", label: "Solar", entities: [] }] }}
				onChange={() => {}}
			/>
		));
		const row = container.querySelector<HTMLElement>('[data-slot="schema-form-list-row"]');
		expect(row?.className).toContain("gap-1.5");
		for (const child of Array.from(row?.children ?? [])) {
			expect(child.className, `${child.getAttribute("data-slot") ?? child.tagName}`).not.toMatch(
				/(^|\s)-?m[trblxy]?-/,
			);
		}
	});
});

/* One row per control kind the dispatch can reach: `for` only where the control
 * renders an element carrying the field id, aria-labelledby everywhere else.
 * "Label" and the second "Entities" come from the variants branch fields. */
const WIRING: Record<string, string> = {
	Name: "for",
	Count: "for",
	Picture: "for",
	Label: "for",
	Enabled: "labelledby",
	Mode: "labelledby",
	Room: "labelledby",
	Glyph: "labelledby",
	Entities: "labelledby",
	Tags: "labelledby",
	"Flow nodes": "labelledby",
	Type: "labelledby",
};

describe("SchemaForm labelling", () => {
	const labelStore: MediaStore = {
		index: async () => ({
			media: [],
			usage: { bytes: 0, limitBytes: 1024, files: 0, limitFiles: 10 },
		}),
		upload: async () => {
			throw new Error("unused");
		},
		remove: async () => {},
		url: (id) => `/api/images/${id}`,
	};

	const everyKind: ExtendedJSONSchema = {
		type: "object",
		properties: {
			name: { type: "string", title: "Name" },
			count: { type: "integer", title: "Count" },
			picture: { type: "string", formType: "image-picker", title: "Picture" },
			enabled: { type: "boolean", title: "Enabled" },
			mode: { type: "string", enum: ["auto", "manual"], title: "Mode" },
			room: { type: "string", formType: "area-picker", title: "Room" },
			glyph: { type: "string", formType: "icon-picker", title: "Glyph" },
			sensors: powerEntities,
			tags: { type: "array", items: { type: "string" }, title: "Tags" },
			nodes: nodesList,
			shape: nodeItemSchema,
		},
	};

	const renderEveryKind = () =>
		render(() => (
			<EntityDataContext.Provider value={stubEntityData}>
				<MediaStoreContext.Provider value={labelStore}>
					<SchemaForm schema={everyKind} data={{}} onChange={() => {}} />
				</MediaStoreContext.Provider>
			</EntityDataContext.Provider>
		));

	it("never points a label's `for` at an element that does not exist", () => {
		const { container } = renderEveryKind();
		const labels = container.querySelectorAll<HTMLLabelElement>('[data-slot="field-label"][for]');
		expect(labels.length).toBeGreaterThan(0);
		for (const label of labels) {
			const target = label.getAttribute("for") ?? "";
			expect(container.querySelector(`[id="${target}"]`), `label for="${target}"`).not.toBeNull();
		}
	});

	it("wires each control kind to its label the one way that works", () => {
		const { container } = renderEveryKind();
		const wiring: Record<string, string> = {};
		for (const label of container.querySelectorAll<HTMLLabelElement>('[data-slot="field-label"]')) {
			const text = label.textContent ?? "";
			if (label.hasAttribute("for")) wiring[text] = "for";
			else if (container.querySelector(`[aria-labelledby~="${label.id}"]`))
				wiring[text] = "labelledby";
			else wiring[text] = "none";
		}
		expect(wiring).toEqual(WIRING);
	});

	it("labels every control that renders no element with the field id", () => {
		const { container } = renderEveryKind();
		const labels = Array.from(
			container.querySelectorAll<HTMLLabelElement>('[data-slot="field-label"]'),
		);
		const idless = labels.filter((label) => !label.hasAttribute("for"));
		expect(idless.length).toBeGreaterThan(0);
		for (const label of idless) {
			expect(label.id, "an aria-labelledby target needs an id").not.toBe("");
			expect(
				// `~=`: Kobalte appends its own value id to the trigger's list.
				container.querySelector(`[aria-labelledby~="${label.id}"]`),
				`${label.textContent} has no labelled control`,
			).not.toBeNull();
		}
	});
});

describe("multi-choice arrays", () => {
	it("renders an array of enum as a multiple toggle group and lifts toggles", () => {
		const onChange = vi.fn();
		const { getByRole } = render(() => (
			<SchemaForm
				schema={{
					type: "object",
					properties: {
						chips: {
							type: "array",
							title: "Show",
							items: { type: "string", enum: ["lights", "locks"] },
							labels: { lights: "Lights", locks: "Locks" },
						},
					},
				}}
				data={{ chips: ["lights"] }}
				onChange={onChange}
			/>
		));
		const locks = getByRole("button", { name: "Locks" });
		expect(getByRole("button", { name: "Lights" }).getAttribute("aria-pressed")).toBe("true");
		fireEvent.click(locks);
		expect(onChange).toHaveBeenCalledWith({ chips: ["lights", "locks"] });
	});
});

describe("labelled choices", () => {
	it("shows a choice's label instead of its raw value", () => {
		const { getByText, queryByText } = render(() => (
			<SchemaForm
				schema={{
					type: "object",
					properties: {
						scope: {
							type: "string",
							title: "Where",
							enum: ["dashboard", "home", "area"],
							labels: {
								dashboard: "This dashboard's area",
								home: "The whole home",
								area: "Somewhere specific",
							},
						},
					},
				}}
				data={{ scope: "dashboard" }}
				onChange={() => {}}
			/>
		));
		expect(getByText("This dashboard's area")).toBeTruthy();
		expect(queryByText("dashboard")).toBeNull();
	});
});
