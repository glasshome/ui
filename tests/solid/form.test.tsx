/* Form* is the second name for the field stack: same parts, same order, plus
 * the id and aria wiring the context knows. The wiring is the whole point, so
 * it is asserted on the control element itself, not on a wrapper. */
import { cleanup, render } from "@solidjs/testing-library";
import { onMount } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  resetFormControlWrapperWarning,
} from "../../src/solid/form.js";
import { Input } from "../../src/solid/input.js";

afterEach(cleanup);

// The deprecation warning fires once per process, so every test that looks at
// it starts from a clean flag instead of racing whichever test ran first.
beforeEach(resetFormControlWrapperWarning);

function renderForm(errors: Record<string, string> = {}) {
  return render(() => (
    <Form errors={errors}>
      <FormField name="email">
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl type="email" placeholder="you@example.com" />
          <FormDescription>We only use it for account recovery.</FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
    </Form>
  ));
}

describe("Form", () => {
  it("renders the field stack, not a second one", () => {
    const { container } = renderForm();
    const field = container.querySelector<HTMLElement>('[data-slot="field"]');
    if (!field) throw new Error("FormItem did not render a Field");
    expect(field.className).toContain("gap-2");
    expect(Array.from(field.children).map((c) => c.getAttribute("data-slot"))).toEqual([
      "field-label",
      "input",
      "field-description",
    ]);
  });

  it("puts the id and aria-describedby on the control, not on a wrapper", () => {
    const { container } = renderForm();
    const input = container.querySelector<HTMLInputElement>("input");
    const label = container.querySelector<HTMLLabelElement>('[data-slot="field-label"]');
    const description = container.querySelector<HTMLElement>('[data-slot="field-description"]');
    if (!input || !label || !description) throw new Error("form parts missing");

    expect(input.id).not.toBe("");
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toBe(description.id);
    expect(input.getAttribute("data-slot")).toBe("input");
  });

  it("adds the message to aria-describedby and marks the control invalid", () => {
    const { container } = renderForm({ email: "Email is required." });
    const input = container.querySelector<HTMLInputElement>("input");
    const message = container.querySelector<HTMLElement>('[data-slot="field-error"]');
    if (!input || !message) throw new Error("form parts missing");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
    expect(message.textContent).toBe("Email is required.");
    expect(message.getAttribute("role")).toBe("alert");
  });

  it("routes the control through a caller-named component", () => {
    const { container } = render(() => (
      <Form>
        <FormField name="note">
          <FormItem>
            <FormControl as="textarea" rows={3} />
          </FormItem>
        </FormField>
      </Form>
    ));
    const textarea = container.querySelector<HTMLTextAreaElement>("textarea");
    expect(textarea?.id).not.toBe("");
    expect(textarea?.getAttribute("rows")).toBe("3");
    // Nothing described it, so there is no idref pointing at an absent element.
    expect(textarea?.hasAttribute("aria-describedby")).toBe(false);
  });

  it("mounts a wrapped child exactly once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let mounts = 0;
    const Probe = () => {
      onMount(() => {
        mounts += 1;
      });
      return <input data-testid="probe" />;
    };
    const { container } = render(() => (
      <Form>
        <FormField name="email">
          <FormItem>
            <FormControl>
              <Probe />
            </FormControl>
          </FormItem>
        </FormField>
      </Form>
    ));
    expect(mounts).toBe(1);
    expect(container.querySelectorAll('[data-testid="probe"]')).toHaveLength(1);
    warn.mockRestore();
  });

  it("warns once for the deprecated wrapper shape, however many render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = () => (
      <Form>
        <FormField name="email">
          <FormItem>
            <FormControl>
              <Input type="email" />
            </FormControl>
          </FormItem>
        </FormField>
      </Form>
    );
    render(wrapper);
    render(wrapper);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("[FormControl]");
    warn.mockRestore();
  });

  it("keeps the legacy wrapper shape alive when a child is passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(() => (
      <Form errors={{ email: "Email is required." }}>
        <FormField name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" />
            </FormControl>
            <FormDescription>We only use it for account recovery.</FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
      </Form>
    ));
    const wrapper = container.querySelector<HTMLElement>('[data-slot="form-control"]');
    const input = container.querySelector<HTMLInputElement>("input");
    const description = container.querySelector<HTMLElement>('[data-slot="field-description"]');
    const message = container.querySelector<HTMLElement>('[data-slot="field-error"]');
    if (!wrapper || !input || !description || !message) throw new Error("form parts missing");

    expect(wrapper.contains(input)).toBe(true);
    expect(wrapper.id).not.toBe("");
    expect(wrapper.getAttribute("aria-describedby")?.split(" ")).toEqual([
      description.id,
      message.id,
    ]);
    expect(wrapper.getAttribute("aria-invalid")).toBe("true");
    warn.mockRestore();
  });

  it("drops the description id when the field renders no description", () => {
    const { container } = render(() => (
      <Form errors={{ email: "Email is required." }}>
        <FormField name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl type="email" />
            <FormMessage />
          </FormItem>
        </FormField>
      </Form>
    ));
    const input = container.querySelector<HTMLInputElement>("input");
    const message = container.querySelector<HTMLElement>('[data-slot="field-error"]');
    expect(input?.getAttribute("aria-describedby")).toBe(message?.id);
  });
});
