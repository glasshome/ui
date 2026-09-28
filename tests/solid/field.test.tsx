/* One field stack: the container owns the gap, the parts own no margin, and
 * a control's own hint sits BELOW the control (a group's explanation sits
 * above the group). Both halves are invisible from the call site, so the
 * order and the absence of compensating margins are asserted here. */
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldSubGroup,
  FieldTitle,
} from "../../src/solid/field.js";
import { Input } from "../../src/solid/input.js";

afterEach(cleanup);

function slots(container: HTMLElement, root: string): string[] {
  const parent = container.querySelector<HTMLElement>(root);
  if (!parent) throw new Error(`no element matched ${root}`);
  return Array.from(parent.children).map(
    (child) => child.getAttribute("data-slot") ?? child.tagName,
  );
}

function classOf(container: HTMLElement, selector: string): string {
  const el = container.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`no element matched ${selector}`);
  return el.className;
}

const NO_MARGIN = /(^|\s)-?m[trblxy]?-/;

describe("Field stack", () => {
  it("renders label, control, description, error in that order", () => {
    const { container } = render(() => (
      <Field>
        <FieldLabel for="name">Name</FieldLabel>
        <Input id="name" />
        <FieldDescription>Shown on your public profile.</FieldDescription>
        <FieldError errors={[{ message: "Required." }]} />
      </Field>
    ));

    expect(slots(container, '[data-slot="field"]')).toEqual([
      "field-label",
      "input",
      "field-description",
      "field-error",
    ]);
  });

  it("owns the gap itself and leaves every part margin-free", () => {
    const { container } = render(() => (
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel for="a">Name</FieldLabel>
            <Input id="a" />
            <FieldDescription>Shown on your public profile.</FieldDescription>
          </Field>
          <FieldSeparator>then</FieldSeparator>
        </FieldGroup>
      </FieldSet>
    ));

    expect(classOf(container, '[data-slot="field-set"]')).toContain("gap-4");
    expect(classOf(container, '[data-slot="field-group"]')).toContain("gap-6");
    expect(classOf(container, '[data-slot="field-group"]')).not.toContain("gap-7");
    expect(classOf(container, '[data-slot="field"]')).toContain("gap-2");

    for (const slot of ["field-legend", "field-description", "field-separator"]) {
      expect(classOf(container, `[data-slot="${slot}"]`), `${slot} carries a margin`).not.toMatch(
        NO_MARGIN,
      );
    }
  });

  it("spaces a horizontal field with the same parent gap", () => {
    const { container } = render(() => (
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Notifications</FieldTitle>
          <FieldDescription>Email me about account activity.</FieldDescription>
        </FieldContent>
      </Field>
    ));
    expect(classOf(container, '[data-slot="field"]')).toContain("gap-3");
    expect(classOf(container, '[data-slot="field-content"]')).toContain("gap-1.5");
  });

  it("grows the caption of a horizontal row, whether it is a label or a title", () => {
    const { container } = render(() => (
      <Field orientation="horizontal">
        <FieldTitle>Enable notifications</FieldTitle>
      </Field>
    ));
    const field = classOf(container, '[data-slot="field"]');
    expect(field).toContain("[&>[data-slot=field-label]]:flex-auto");
    expect(field).toContain("[&>[data-slot=field-title]]:flex-auto");
    expect(field).toContain("not-has-[>[data-slot=field-content]]:items-center");
  });

  it("gives the title its own slot instead of borrowing the label's", () => {
    const { container } = render(() => <FieldTitle>Door locks</FieldTitle>);
    expect(container.querySelector('[data-slot="field-title"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="field-label"]')).toBeNull();
  });

  it("targets the attributes Kobalte actually emits", () => {
    const { container } = render(() => <FieldLabel>Plan</FieldLabel>);
    const label = classOf(container, '[data-slot="field-label"]');
    expect(label, "Radix data-state never reaches this package").not.toContain("data-[state=");
    expect(label).toContain("has-data-[checked]:");
  });

  it("tints only the card-shaped label when the control inside is checked", () => {
    const { container } = render(() => <FieldLabel>Plan</FieldLabel>);
    const tokens = classOf(container, '[data-slot="field-label"]').split(/\s+/);
    const checkedTints = tokens.filter((t) => t.includes("has-data-[checked]:"));
    expect(checkedTints.length).toBeGreaterThan(0);
    for (const token of checkedTints) {
      // A plain checkbox label is not a card, so the tint has to be gated on
      // the label actually wrapping a Field.
      expect(token, token).toContain("has-[>[data-slot=field]]:");
    }
  });

  it("masks the separator rule against the card it sits on", () => {
    const { container } = render(() => <FieldSeparator>or</FieldSeparator>);
    const content = classOf(container, '[data-slot="field-separator-content"]');
    expect(content).toContain("bg-card");
    expect(content).not.toContain("bg-background");
  });

  it("keeps no dead group selector on the set", () => {
    const { container } = render(() => <FieldSet />);
    expect(classOf(container, '[data-slot="field-set"]')).not.toContain("checkbox-group");
  });
});

describe("FieldLegend", () => {
  it("reads at the sub-heading rung, not as an eyebrow", () => {
    const { container } = render(() => <FieldLegend>Control</FieldLegend>);
    const legend = container.querySelector<HTMLElement>('[data-slot="field-legend"]');
    expect(legend?.tagName).toBe("LEGEND");
    expect(legend?.className).toContain("data-[variant=legend]:text-base");
    expect(legend?.className).toContain("data-[variant=legend]:font-semibold");
  });

  it("drops to the label rung on request", () => {
    const { container } = render(() => <FieldLegend variant="label">Rooms</FieldLegend>);
    const legend = container.querySelector<HTMLElement>('[data-slot="field-legend"]');
    expect(legend?.getAttribute("data-variant")).toBe("label");
  });
});

describe("FieldDescription", () => {
  it("dims with its title when the field is disabled", () => {
    const { container } = render(() => (
      <Field orientation="horizontal" data-disabled="true">
        <FieldContent>
          <FieldTitle>Door locks</FieldTitle>
          <FieldDescription>Off until you turn it on.</FieldDescription>
        </FieldContent>
      </Field>
    ));

    const title = container.querySelector<HTMLElement>('[data-slot="field-title"]');
    const description = container.querySelector<HTMLElement>('[data-slot="field-description"]');
    expect(title?.className).toContain("group-data-[disabled=true]/field:opacity-50");
    expect(description?.className).toContain("group-data-[disabled=true]/field:opacity-50");
  });
});

describe("FieldSubGroup", () => {
  it("stacks its rows flush with the row they hang off", () => {
    const { container } = render(() => (
      <FieldSubGroup>
        <span>Door locks</span>
      </FieldSubGroup>
    ));

    const group = container.querySelector<HTMLElement>('[data-slot="field-sub-group"]');
    expect(group?.className).not.toContain("border-l");
    expect(group?.className).not.toContain("pl-4");
    expect(group?.textContent).toBe("Door locks");
  });

  it("merges a caller class last", () => {
    const { container } = render(() => <FieldSubGroup class="gap-3" />);
    expect(
      container.querySelector<HTMLElement>('[data-slot="field-sub-group"]')?.className,
    ).toContain("gap-3");
  });
});
