import { cleanup, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { Alert } from "../../src/solid/alert.js";
import { DataTableRow, TableEmpty } from "../../src/solid/data-table.js";
import { DialogHeader } from "../../src/solid/dialog.js";
import { FieldSeparator } from "../../src/solid/field.js";
import { PageHeader } from "../../src/solid/page-header.js";
import { PasswordInput } from "../../src/solid/password-input.js";
import { PickerRow } from "../../src/solid/picker-row.js";
import { ListRow, SectionCard, SectionGroup, SectionIcon } from "../../src/solid/section-card.js";
import { Sheet, SheetContent } from "../../src/solid/sheet.js";
import { GlassToast } from "../../src/solid/sonner.js";

afterEach(cleanup);

// A slot read twice builds its JSX twice; under SSR hydration the first build claims
// keys the server never emitted, and a Dynamic inside it throws.
type Case = [name: string, mount: (slot: () => JSX.Element) => JSX.Element];

const CASES: Case[] = [
  ["ListRow leading", (s) => <ListRow title="t" leading={s()} />],
  ["ListRow title", (s) => <ListRow title={s()} />],
  ["ListRow badges", (s) => <ListRow title="t" badges={s()} />],
  ["ListRow subtitle", (s) => <ListRow title="t" subtitle={s()} />],
  ["ListRow meta", (s) => <ListRow title="t" meta={s()} />],
  ["ListRow actions", (s) => <ListRow title="t" onOpen={() => {}} actions={s()} />],
  ["SectionCard title", (s) => <SectionCard title={s()} />],
  ["SectionCard subtitle", (s) => <SectionCard title="t" subtitle={s()} />],
  ["SectionCard action", (s) => <SectionCard action={s()} />],
  ["SectionCard toolbar", (s) => <SectionCard title="t" toolbar={s()} />],
  ["SectionCard children", (s) => <SectionCard title="t">{s()}</SectionCard>],
  ["SectionIcon children", (s) => <SectionIcon>{s()}</SectionIcon>],
  ["SectionGroup label", (s) => <SectionGroup icon="lucide:x" label={s()} children={null} />],
  [
    "SectionGroup action",
    (s) => <SectionGroup icon="lucide:x" label="l" action={s()} children={null} />,
  ],
  ["PageHeader iconNode", (s) => <PageHeader title="t" iconNode={s()} />],
  ["PageHeader title", (s) => <PageHeader title={s()} />],
  ["PageHeader subtitle", (s) => <PageHeader title="t" subtitle={s()} />],
  ["PageHeader actions", (s) => <PageHeader title="t" actions={s()} />],
  ["PickerRow title", (s) => <PickerRow title={s()} selected={false} multi={false} />],
  [
    "PickerRow subtitle",
    (s) => <PickerRow title="t" subtitle={s()} selected={false} multi={false} />,
  ],
  ["PickerRow meta", (s) => <PickerRow title="t" meta={s()} selected={false} multi={false} />],
  ["PasswordInput leading", (s) => <PasswordInput leading={s()} />],
  ["FieldSeparator children", (s) => <FieldSeparator>{s()}</FieldSeparator>],
  ["DataTableRow actions", (s) => <DataTableRow actions={s()}>row</DataTableRow>],
  ["TableEmpty icon", (s) => <TableEmpty icon={s()} message="m" />],
  ["TableEmpty action", (s) => <TableEmpty message="m" action={s()} />],
  ["Alert icon", (s) => <Alert icon={s()}>a</Alert>],
  ["Alert children", (s) => <Alert>{s()}</Alert>],
  ["Alert action", (s) => <Alert action={s()}>a</Alert>],
  ["GlassToast title", (s) => <GlassToast kind="info" title={s()} />],
  ["GlassToast description", (s) => <GlassToast kind="info" title="t" description={s()} />],
  ["GlassToast action", (s) => <GlassToast kind="info" title="t" action={s()} />],
  ["DialogHeader media", (s) => <DialogHeader media={s()}>h</DialogHeader>],
  ["DialogHeader action", (s) => <DialogHeader action={s()}>h</DialogHeader>],
  [
    "SheetContent above",
    (s) => (
      <Sheet open>
        <SheetContent above={s()}>body</SheetContent>
      </Sheet>
    ),
  ],
];

describe("slot props build once", () => {
  it.each(CASES)("%s", (_name, mount) => {
    let built = 0;
    const Probe = () => {
      built++;
      return <span data-testid="slot-probe" />;
    };
    render(() => mount(() => <Probe />));

    expect(built).toBe(1);
    expect(document.querySelectorAll('[data-testid="slot-probe"]')).toHaveLength(1);
  });
});
