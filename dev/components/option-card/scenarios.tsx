import { createSignal } from "solid-js";
import { OptionCard, OptionCardGroup, OptionChoice } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const SignIn = () => {
  const [value, setValue] = createSignal<string | null>("invite");
  return (
    <OptionCardGroup value={value()} onChange={setValue} aria-label="How they sign in" class="w-80">
      <OptionCard
        value="invite"
        title="Send an invite"
        description="They pick a password."
        icon="lucide:mail"
      />
      <OptionCard value="code" title="Share a code" icon="lucide:key-round" />
      <OptionCard value="later" title="Later" disabled />
    </OptionCardGroup>
  );
};

const Digits = () => {
  const [value, setValue] = createSignal<string | null>("code");
  const [digits, setDigits] = createSignal("6");
  return (
    <OptionCardGroup value={value()} onChange={setValue} aria-label="How they sign in" class="w-80">
      <OptionCard value="invite" title="Send an invite" icon="lucide:mail" />
      <OptionCard
        value="code"
        title="Share a code"
        icon="lucide:key-round"
        subValue={digits()}
        onSubChange={setDigits}
      >
        <OptionChoice value="6" label="Six digits" hint="Quick to type" />
        <OptionChoice value="8" label="Eight digits" />
      </OptionCard>
    </OptionCardGroup>
  );
};

const next = [{ key: "Tab" }, { key: "ArrowDown" }];

export default defineScenarios({
  component: "OptionCard",
  scenarios: [
    { id: "default", title: "Three ways in, the first picked, Later disabled", render: SignIn },
    {
      id: "keyboard-nav",
      title: "Arrow keys pick the next card, skipping Later",
      render: SignIn,
      steps: [...next, { key: "ArrowDown" }],
    },
    {
      id: "sub-options",
      title: "The picked card opens its sub-options, chosen in place",
      render: Digits,
      steps: [{ press: { role: "radio", name: "Eight digits" } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: SignIn,
      within: "shadow-root",
      steps: next,
    },
  ],
});
