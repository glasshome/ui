import { createSignal } from "solid-js";
import { Dock, Icon } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const ICONS = ["lucide:house", "lucide:sofa", "lucide:bed", "lucide:utensils", "lucide:car"];

const Boards = (props: { count: number; width: number }) => {
  const [active, setActive] = createSignal("board-1");
  const items = () =>
    Array.from({ length: props.count }, (_, i) => {
      const id = `board-${i + 1}`;
      return {
        id,
        icon: <Icon icon={ICONS[i % ICONS.length] ?? "lucide:house"} width={20} height={20} />,
        label: `Board ${i + 1}`,
        isActive: active() === id,
        onClick: () => setActive(id),
      };
    });
  return (
    <div style={{ width: `${props.width}px` }}>
      <Dock items={items()} />
    </div>
  );
};

export default defineScenarios({
  component: "Dock",
  scenarios: [
    {
      id: "fits",
      title: "Every board fits on one page",
      render: () => <Boards count={3} width={360} />,
      steps: [{ press: { role: "button", name: "Board 2" } }],
    },
    {
      id: "pages",
      title: "More boards than room: whole items per page, and dots to turn",
      render: () => <Boards count={20} width={240} />,
      steps: [{ press: { role: "button", name: "Page 2" } }],
    },
  ],
});
