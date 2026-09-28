/* The toggle family (switch, slider, colour slider, colour wheel) and every
 * typed field share two things a caller cannot see from the call site: one
 * draggable thumb and one focus ring. Both are asserted from the recipe
 * constants, so a control that retypes either fails here. */
import { parseColor } from "@kobalte/core/colors";
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

// The real custom element fetches icon data from the Iconify API; the request
// is still in flight when happy-dom tears the window down, which surfaces as an
// unhandled AbortError at teardown. Nothing here asserts icon internals.
import { FIELD_CHROME, FOCUS_RING } from "../../src/lib/input-classes.js";
import { THUMB_CLASS, THUMB_COLOR_RING } from "../../src/lib/thumb-classes.js";
import { Checkbox } from "../../src/solid/checkbox.js";
import { ColorSlider } from "../../src/solid/color-slider.js";
import { ColorWheel } from "../../src/solid/color-wheel.js";
import { Input } from "../../src/solid/input.js";
import { InputOTP, InputOTPSlot } from "../../src/solid/input-otp.js";
import { NumberField } from "../../src/solid/number-field.js";
import { PasswordInput } from "../../src/solid/password-input.js";
import { RadioGroup, RadioGroupItem } from "../../src/solid/radio-group.js";
import { Slider } from "../../src/solid/slider.js";
import { Switch } from "../../src/solid/switch.js";
import { Textarea } from "../../src/solid/textarea.js";

afterEach(cleanup);

function classOf(container: HTMLElement, selector: string): string {
  const el = container.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`no element matched ${selector}`);
  return el.className;
}

function expectTokens(actual: string, recipe: string, label: string) {
  for (const token of recipe.split(" ")) {
    expect(actual, `${label} is missing ${token}`).toContain(token);
  }
}

const FOCUS_CASES: Array<[string, () => JSX.Element, string]> = [
  ["Input", () => <Input />, "input"],
  ["Textarea", () => <Textarea />, "textarea"],
  ["NumberField", () => <NumberField />, '[data-slot="number-field"]'],
  ["PasswordInput", () => <PasswordInput aria-label="Password" />, "input"],
  [
    "InputOTPSlot",
    () => (
      <InputOTP maxLength={1}>
        <InputOTPSlot index={0} />
      </InputOTP>
    ),
    '[data-slot="input-otp-slot"]',
  ],
  ["Switch", () => <Switch />, '[data-slot="switch"]'],
  ["Slider thumb", () => <Slider value={[10]} aria-label="Level" />, '[data-slot="slider-thumb"]'],
  [
    "ColorSlider thumb",
    () => <ColorSlider channel="hue" defaultValue={parseColor("hsl(200, 98%, 39%)")} />,
    '[data-slot="color-slider-thumb"]',
  ],
];

describe("one focus ring", () => {
  for (const [name, view, selector] of FOCUS_CASES) {
    it(`${name} wears the shared ring instead of a retyped tail`, () => {
      const { container } = render(view);
      const actual = classOf(container, selector);
      expectTokens(actual, FOCUS_RING, name);
      expect(actual, `${name} retypes the focus border`).not.toContain("focus-visible:border-ring");
    });
  }
});

describe("one thumb", () => {
  it("is the same recipe on Switch, Slider and ColorSlider", () => {
    const s = render(() => <Switch />);
    const slider = render(() => <Slider value={[10]} aria-label="Level" />);
    const color = render(() => (
      <ColorSlider channel="hue" defaultValue={parseColor("hsl(200, 98%, 39%)")} />
    ));

    for (const [label, actual] of [
      ["switch", classOf(s.container, '[data-slot="switch-thumb"]')],
      ["slider", classOf(slider.container, '[data-slot="slider-thumb"]')],
      ["colour slider", classOf(color.container, '[data-slot="color-slider-thumb"]')],
    ] as const) {
      expectTokens(actual, THUMB_CLASS, `${label} thumb`);
    }
  });

  it("gives the colour thumbs their own edge, since they sit on their own colour", () => {
    const slider = render(() => (
      <ColorSlider channel="hue" defaultValue={parseColor("hsl(200, 98%, 39%)")} />
    ));
    const wheel = render(() => <ColorWheel />);
    expectTokens(
      classOf(slider.container, '[data-slot="color-slider-thumb"]'),
      THUMB_COLOR_RING,
      "colour slider thumb",
    );
    expectTokens(
      classOf(wheel.container, '[data-slot="color-wheel-thumb"]'),
      THUMB_COLOR_RING,
      "wheel thumb",
    );
  });

  it("keeps the colour wheel on the same recipe, circular", () => {
    const { container } = render(() => <ColorWheel />);
    const thumb = classOf(container, '[data-slot="color-wheel-thumb"]');
    expectTokens(thumb, THUMB_CLASS.replace("rounded-xl", "rounded-full"), "colour wheel thumb");
  });

  it("declares no second shadow recipe inline", () => {
    const { container } = render(() => <Switch checked />);
    const thumb = container.querySelector<HTMLElement>('[data-slot="switch-thumb"]');
    expect(thumb?.style.boxShadow).toBe("");
  });
});

describe("Switch", () => {
  it("honours defaultChecked when nothing controls it", () => {
    const { container } = render(() => <Switch defaultChecked />);
    expect(container.querySelector('[data-slot="switch"]')?.getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("toggles itself when uncontrolled", () => {
    const { container } = render(() => <Switch defaultChecked />);
    const root = container.querySelector<HTMLElement>('[data-slot="switch"]');
    if (!root) throw new Error("no switch");
    fireEvent.click(root);
    expect(root.getAttribute("aria-checked")).toBe("false");
  });

  it("stays controlled when checked is passed", () => {
    const { container } = render(() => <Switch checked={false} />);
    const root = container.querySelector<HTMLElement>('[data-slot="switch"]');
    if (!root) throw new Error("no switch");
    fireEvent.click(root);
    expect(root.getAttribute("aria-checked")).toBe("false");
  });

  it("sizes the track with classes, not inline geometry", () => {
    const { container } = render(() => <Switch />);
    const root = container.querySelector<HTMLElement>('[data-slot="switch"]');
    expect(root?.className).toContain("h-7");
    expect(root?.className).toContain("w-14");
    expect(root?.style.width).toBe("");
  });
});

describe("checkbox and radio wear one material", () => {
  it("gives the checkbox box the toggle chrome, no borrowed shadow", () => {
    const { container } = render(() => <Checkbox>Accept</Checkbox>);
    const box = classOf(container, '[data-slot="checkbox-box"]');
    expectTokens(box, FIELD_CHROME, "checkbox box");
    expect(box).toContain("rounded-xs");
    expect(box).not.toContain("shadow-xs");
    expect(box, "border utilities are no-ops on glass").not.toContain(
      "peer-focus-visible:border-ring",
    );
  });

  it("drops the dashed border on a disabled checkbox", () => {
    const { container } = render(() => <Checkbox disabled>Accept</Checkbox>);
    expect(classOf(container, '[data-slot="checkbox-box"]')).not.toContain("border-dashed");
  });

  it("gives the radio control the same chrome and its parts a slot", () => {
    const { container } = render(() => (
      <RadioGroup value="a">
        <RadioGroupItem value="a">Comfortable</RadioGroupItem>
      </RadioGroup>
    ));
    const control = classOf(container, '[data-slot="radio-group-item-control"]');
    expectTokens(control, FIELD_CHROME, "radio control");
    expect(control).not.toContain("shadow-xs");
    expect(control).not.toContain("data-[disabled]:border-dashed");
    expect(container.querySelector('[data-slot="radio-group-item-label"]')).toBeTruthy();
  });

  it("uses the same label row gap on both", () => {
    const check = render(() => <Checkbox>Accept</Checkbox>);
    const radio = render(() => (
      <RadioGroup value="a">
        <RadioGroupItem value="a">Comfortable</RadioGroupItem>
      </RadioGroup>
    ));
    expect(classOf(check.container, '[data-slot="checkbox-label"]')).toContain("gap-2.5");
    expect(classOf(radio.container, '[data-slot="radio-group-item-label"]')).toContain("gap-2.5");
  });
});

/* An affordance parked on top of a field reserves exactly its own width, so
 * the text never runs under it and the two fields line up. */
describe("field affordances reserve one column", () => {
  it("pads the number field for its spinner column", () => {
    const { container } = render(() => <NumberField value={3} />);
    expect(classOf(container, '[data-slot="number-field"]')).toContain("pr-10");
    expect(classOf(container, '[data-slot="number-field-spinner"]')).toContain("w-10");
  });

  it("pads the password field for its reveal button and leading well", () => {
    const { container } = render(() => (
      <PasswordInput aria-label="Password" leading={<span data-testid="lock" />} />
    ));
    const input = classOf(container, "input");
    expect(input).toContain("pr-10");
    expect(input).toContain("pl-10");
    expect(classOf(container, '[data-slot="password-input-toggle"]')).toContain("w-10");
    expect(classOf(container, '[data-slot="password-input-leading"]')).toContain("w-10");
  });
});
