import { Term } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";
import { OUTSIDE } from "../popover/scenarios";

const HUB_ACCOUNT = {
  icon: "lucide:cloud",
  title: "Hub account",
  line: "Your account on glasshome.app.",
  href: "https://glasshome.app/docs/hub/faq",
};

const Sentence = () => (
  <p style={{ "margin-top": "120px", "margin-left": "40px" }}>
    Connect your <Term term={HUB_ACCOUNT} /> to share.
  </p>
);

const TallPage = () => (
  <div style={{ height: "2400px" }}>
    <Sentence />
  </div>
);

const OPEN = { press: { role: "button", name: "Hub account" } };
const BY_KEY = [{ key: "Tab" }, { key: "Enter" }];

export default defineScenarios({
  component: "Term",
  scenarios: [
    {
      id: "open",
      title: "A tap explains the word in place",
      render: Sentence,
      steps: [OPEN],
      keyboard: BY_KEY,
    },
    {
      id: "escape",
      title: "Escape closes it and focus returns to the word",
      render: Sentence,
      steps: [OPEN, { key: "Escape" }],
      keyboard: [...BY_KEY, { key: "Escape" }],
    },
    {
      id: "outside-press",
      title: "A press outside closes it",
      render: Sentence,
      steps: [OPEN, { pressAt: OUTSIDE }],
    },
    {
      id: "in-dialog",
      title: "Inside a dialog, Escape closes only the explanation",
      render: Sentence,
      within: "dialog",
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: Sentence,
      within: "shadow-root",
      steps: [OPEN, { key: "Escape" }],
    },
    {
      id: "scroll-follows",
      title: "The explanation follows its word as the page scrolls",
      render: TallPage,
      steps: [OPEN, { key: "PageDown" }],
    },
  ],
});
