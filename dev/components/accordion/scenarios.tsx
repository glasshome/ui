import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const Help = (props: {
  multiple?: boolean;
  collapsible?: boolean;
  open?: string[];
  powerDisabled?: boolean;
}) => (
  <Accordion
    multiple={props.multiple}
    collapsible={props.collapsible}
    defaultValue={props.open}
    class="w-80"
  >
    <AccordionItem value="wifi">
      <AccordionTrigger>Wi-Fi</AccordionTrigger>
      <AccordionContent>The hub joins the network you pick during setup.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="hub">
      <AccordionTrigger>Hub</AccordionTrigger>
      <AccordionContent>Hold the button for ten seconds to restart it.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="power" disabled={props.powerDisabled}>
      <AccordionTrigger>Power</AccordionTrigger>
      <AccordionContent>It runs on the supplied adapter only.</AccordionContent>
    </AccordionItem>
  </Accordion>
);

const press = (name: string) => ({ press: { role: "button", name } });
const ARROWS = [{ key: "ArrowDown" }, { key: "End" }, { key: "Home" }, { key: "ArrowUp" }];

export default defineScenarios({
  component: "Accordion",
  scenarios: [
    {
      id: "default",
      title: "Three items, Wi-Fi open",
      render: () => <Help collapsible open={["wifi"]} />,
    },
    {
      id: "press",
      title: "Opening one closes the other; a second press closes it",
      render: () => <Help collapsible open={["wifi"]} />,
      steps: [press("Hub"), press("Hub")],
      keyboard: [{ key: "Tab" }, { key: "Tab" }, { key: "Enter" }, { key: " " }],
    },
    {
      id: "keyboard-nav",
      title: "Arrow keys, Home and End move between triggers",
      render: () => <Help collapsible />,
      steps: [press("Wi-Fi"), ...ARROWS],
      keyboard: [{ key: "Tab" }, { key: "Enter" }, ...ARROWS],
    },
    {
      id: "multiple",
      title: "Several items open at once",
      render: () => <Help multiple open={["wifi", "power"]} />,
      steps: [press("Hub")],
    },
    {
      id: "not-collapsible",
      title: "The open item stays open when pressed",
      render: () => <Help open={["wifi"]} />,
      steps: [press("Wi-Fi")],
    },
    {
      id: "disabled-item",
      title: "A disabled item ignores a press and the arrows skip it",
      render: () => <Help collapsible powerDisabled />,
      steps: [press("Power"), press("Hub"), { key: "ArrowDown" }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Help collapsible open={["wifi"]} />,
      within: "shadow-root",
      steps: [press("Hub")],
    },
  ],
});
