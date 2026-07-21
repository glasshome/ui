/* Render smoke tests: each core primitive mounts without throwing and puts its
 * content in the DOM. Guards against regressions in the component wiring, not
 * visual output. */
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "../../src/solid/alert.js";
import { Badge } from "../../src/solid/badge.js";
import { Button } from "../../src/solid/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/solid/card.js";
import { Input } from "../../src/solid/input.js";
import { Kbd } from "../../src/solid/kbd.js";
import { Label } from "../../src/solid/label.js";
import { Progress } from "../../src/solid/progress.js";
import { Separator } from "../../src/solid/separator.js";
import { Skeleton } from "../../src/solid/skeleton.js";
import { Spinner } from "../../src/solid/spinner.js";
import { Switch } from "../../src/solid/switch.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/solid/tabs.js";
import { Textarea } from "../../src/solid/textarea.js";

describe("solid primitives render", () => {
	it("Button", () => {
		const { getByRole } = render(() => <Button>Click me</Button>);
		expect(getByRole("button").textContent).toBe("Click me");
	});

	it("Badge", () => {
		const { container } = render(() => <Badge tone="var(--success)">Online</Badge>);
		expect(container.textContent).toContain("Online");
	});

	it("Card family", () => {
		const { container } = render(() => (
			<Card>
				<CardHeader>
					<CardTitle>Living Room</CardTitle>
				</CardHeader>
				<CardContent>3 lights</CardContent>
			</Card>
		));
		expect(container.textContent).toContain("Living Room");
		expect(container.textContent).toContain("3 lights");
	});

	it("Alert family", () => {
		const { container } = render(() => (
			<Alert>
				<AlertTitle>Heads up</AlertTitle>
				<AlertDescription>Something happened.</AlertDescription>
			</Alert>
		));
		expect(container.textContent).toContain("Heads up");
		expect(container.textContent).toContain("Something happened.");
	});

	it("Input + Label", () => {
		const { getByLabelText } = render(() => (
			<>
				<Label for="name">Name</Label>
				<Input id="name" value="glasshome" />
			</>
		));
		expect((getByLabelText("Name") as HTMLInputElement).value).toBe("glasshome");
	});

	it("Textarea", () => {
		const { container } = render(() => <Textarea value="notes" />);
		expect(container.querySelector("textarea")?.value).toBe("notes");
	});

	it("Tabs switch content", () => {
		const { container } = render(() => (
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Panel A</TabsContent>
				<TabsContent value="b">Panel B</TabsContent>
			</Tabs>
		));
		expect(container.textContent).toContain("Panel A");
	});

	it("Switch", () => {
		const { container } = render(() => <Switch checked />);
		expect(container.querySelector("input[type=checkbox], [role=switch]")).toBeTruthy();
	});

	it("Progress", () => {
		const { container } = render(() => <Progress value={40} />);
		expect(container.querySelector("[role=progressbar]")).toBeTruthy();
	});

	it("Separator / Skeleton / Spinner / Kbd", () => {
		const { container } = render(() => (
			<>
				<Separator />
				<Skeleton class="h-4 w-8" />
				<Spinner />
				<Kbd>K</Kbd>
			</>
		));
		expect(container.textContent).toContain("K");
	});
});
