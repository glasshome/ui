import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../src/solid";
import { defineScenarios } from "../../harness/types";

const RoomTabs = () => (
  <Tabs defaultValue="lights" class="w-80">
    <TabsList>
      <TabsTrigger value="lights">Lights</TabsTrigger>
      <TabsTrigger value="climate" disabled>
        Climate
      </TabsTrigger>
      <TabsTrigger value="media">Media</TabsTrigger>
    </TabsList>
    <TabsContent value="lights">Three lights are on.</TabsContent>
    <TabsContent value="climate">21 °C</TabsContent>
    <TabsContent value="media">Nothing playing.</TabsContent>
  </Tabs>
);

const GlyphTabs = () => (
  <Tabs defaultValue="lights" class="w-96">
    <TabsList>
      <TabsTrigger value="lights" icon="lucide:lightbulb" inline>
        Lights
      </TabsTrigger>
      <TabsTrigger value="climate" icon="lucide:thermometer" inline>
        Climate
      </TabsTrigger>
      <TabsTrigger value="media" icon="lucide:music" inline>
        Media
      </TabsTrigger>
    </TabsList>
    <TabsContent value="lights">Three lights are on.</TabsContent>
    <TabsContent value="climate">21 °C</TabsContent>
    <TabsContent value="media">Nothing playing.</TabsContent>
  </Tabs>
);

const KEYS = [{ key: "ArrowRight" }, { key: "ArrowRight" }, { key: "Home" }];

export default defineScenarios({
  component: "Tabs",
  scenarios: [
    { id: "default", title: "Three tabs, the second disabled", render: RoomTabs },
    { id: "inline-icon", title: "A glyph beside each word", render: GlyphTabs },
    {
      id: "keyboard-nav",
      title: "Arrow keys move between tabs",
      render: RoomTabs,
      steps: [{ press: { role: "tab", name: "Lights" } }, ...KEYS],
      keyboard: [{ key: "Tab" }, ...KEYS],
    },
    {
      id: "press-media",
      title: "Pressing a tab shows its panel",
      render: RoomTabs,
      steps: [{ press: { role: "tab", name: "Media" } }],
      keyboard: [{ key: "Tab" }, { key: "ArrowRight" }],
    },
    {
      id: "in-dialog",
      title: "Inside a dialog",
      render: RoomTabs,
      within: "dialog",
      steps: [{ press: { role: "tab", name: "Media" } }],
    },
    {
      id: "in-shadow-root",
      title: "Inside a closed shadow root",
      render: RoomTabs,
      within: "shadow-root",
      steps: [{ press: { role: "tab", name: "Media" } }],
    },
  ],
});
