# @glasshome/ui

SolidJS component library for GlassHome, built on [Kobalte](https://kobalte.dev).

56 accessible, theme-aware components plus utility functions and a Tailwind v4 CSS preset — everything you need to build smart-home dashboards. Powers [GlassHome](https://glasshome.app), the local-first dashboard for Home Assistant.

## Install

```bash
npm install @glasshome/ui solid-js
# or
bun add @glasshome/ui solid-js
```

> `solid-js ^1.9.9` is a required peer dependency.

## Subpath Imports

### `@glasshome/ui` — Utilities

Framework-agnostic helpers exported from the root entrypoint.

```typescript
import { cn, createIsMobile } from "@glasshome/ui";

// Merge Tailwind classes with conflict resolution
const cls = cn("px-4 py-2", condition && "bg-primary text-white");

// Reactive mobile breakpoint signal (SolidJS)
const isMobile = createIsMobile();
```

### `@glasshome/ui/solid` — Components

All 56 Kobalte-based components are exported from a single subpath.

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@glasshome/ui/solid";

function DeviceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Living Room</CardTitle>
        <Badge>Online</Badge>
      </CardHeader>
      <CardContent>
        <Button onClick={() => console.log("toggled")}>Toggle Light</Button>
      </CardContent>
    </Card>
  );
}
```

Available components include:

`Accordion` · `Alert` · `AlertDialog` · `AspectRatio` · `Avatar` · `Badge` · `Breadcrumb` · `Button` · `ButtonGroup` · `Calendar` · `Card` · `Carousel` · `Checkbox` · `Collapsible` · `Command` · `ContextMenu` · `CopyButton` · `Dialog` · `Dock` · `DropdownMenu` · `Empty` · `Field` · `Form` · `GeometricBackground` · `GlassEffect` · `HoverCard` · `Input` · `InputGroup` · `InputOTP` · `Item` · `Kbd` · `Label` · `Menubar` · `NavigationMenu` · `Pagination` · `Popover` · `Progress` · `RadioGroup` · `ResizablePanel` · `ResponsiveDialog` · `ScrollArea` · `Select` · `Separator` · `Sheet` · `Skeleton` · `Slider` · `Sonner (toast)` · `Spinner` · `Switch` · `Table` · `Tabs` · `Textarea` · `Toggle` · `ToggleGroup` · `Tooltip`

### `@glasshome/ui/styles` — Tailwind v4 CSS

Import the shared CSS preset in your app's stylesheet:

```css
@import "@glasshome/ui/styles";
```

This provides the GlassHome design tokens (colors, radii, animations) as a Tailwind v4 theme layer.

## Peer Dependencies

| Package | Required | Notes |
| ---------- | -------- | ---------------------------------------- |
| `solid-js` | Yes | SolidJS reactive primitives and JSX runtime |

## License

MIT
