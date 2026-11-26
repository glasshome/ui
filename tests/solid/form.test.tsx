import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Form, FormField, useFormField } from "../../src/solid/form.js";

afterEach(cleanup);

function Probe() {
  const field = useFormField();
  return <output data-name={field.name()}>{field.error()}</output>;
}

function renderProbe(errors: Record<string, string> = {}, name = "email") {
  return render(() => (
    <Form errors={errors}>
      <FormField name={name}>
        <Probe />
      </FormField>
    </Form>
  ));
}

describe("Form", () => {
  it("hands a field its own error by name", () => {
    const { container } = renderProbe({ email: "Email is required.", other: "no" });
    const probe = container.querySelector("output");
    expect(probe?.getAttribute("data-name")).toBe("email");
    expect(probe?.textContent).toBe("Email is required.");
  });

  it("reads no error for a field the errors do not name", () => {
    const { container } = renderProbe({ other: "no" });
    expect(container.querySelector("output")?.textContent).toBe("");
  });
});
