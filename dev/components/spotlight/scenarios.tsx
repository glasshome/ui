import { createSignal } from "solid-js";
import { Button, Spotlight } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Tour = () => {
  const [step, setStep] = createSignal(0);
  const [first, setFirst] = createSignal<HTMLElement>();
  const [second, setSecond] = createSignal<HTMLElement>();
  return (
    <div class="flex flex-col gap-24 p-8">
      <Button ref={setFirst}>First stop</Button>
      <Button ref={setSecond}>Second stop</Button>
      <Spotlight target={step() === 0 ? first() : second()} scrim onSkip={() => setStep(0)}>
        <p>Step {step() + 1}</p>
        <Button onClick={() => setStep(1)}>Next</Button>
      </Spotlight>
    </div>
  );
};

export default defineScenarios({
  component: "Spotlight",
  scenarios: [
    {
      id: "tour-step",
      title: "Moves to the next stop",
      render: () => <Tour />,
      steps: [{ press: { role: "button", name: "Next" } }],
    },
  ],
});
