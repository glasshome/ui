import { Polymorphic } from "../../../src/lib/behavior/polymorphic";
import { defineScenarios } from "../../harness/types";

export default defineScenarios({
  component: "polymorphic",
  kind: "block",
  scenarios: [
    {
      id: "default",
      title: "A part renders its default element",
      render: () => (
        <Polymorphic defaultAs="button" data-slot="part">
          Open
        </Polymorphic>
      ),
    },
    {
      id: "as-link",
      title: "A part renders as a link when asked",
      render: () => (
        <>
          <Polymorphic defaultAs="button" as="a" data-slot="part">
            Open
          </Polymorphic>
          <Polymorphic defaultAs="button">Close</Polymorphic>
        </>
      ),
    },
  ],
});
