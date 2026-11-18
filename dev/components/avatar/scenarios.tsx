import { Avatar, AvatarFallback, AvatarImage } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%232563eb'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23bfdbfe'/%3E%3C/svg%3E";
const BROKEN = "data:image/png;base64,AA==";

const Person = (props: { src?: string }) => (
  <Avatar>
    {props.src && <AvatarImage src={props.src} alt="Ada Lovelace" />}
    <AvatarFallback>AL</AvatarFallback>
  </Avatar>
);

export default defineScenarios({
  component: "Avatar",
  scenarios: [
    { id: "fallback", title: "No photo, the initials", render: () => <Person /> },
    { id: "image", title: "The photo once it loads", render: () => <Person src={PHOTO} /> },
    {
      id: "broken",
      title: "A photo that fails keeps the initials",
      render: () => <Person src={BROKEN} />,
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: () => <Person src={PHOTO} />,
      within: "shadow-root",
    },
  ],
});
