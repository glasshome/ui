import { type Component, type ComponentProps, splitProps } from "solid-js";
import { cn } from "../lib/utils";

const Table: Component<ComponentProps<"table">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div data-slot="table-container" class="relative w-full overflow-x-auto">
      <table data-slot="table" class={cn("w-full caption-bottom text-sm", local.class)} {...rest} />
    </div>
  );
};

const TableHeader: Component<ComponentProps<"thead">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return <thead data-slot="table-header" class={cn("[&_tr]:border-b", local.class)} {...rest} />;
};

const TableBody: Component<ComponentProps<"tbody">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <tbody data-slot="table-body" class={cn("[&_tr:last-child]:border-0", local.class)} {...rest} />
  );
};

const TableFooter: Component<ComponentProps<"tfoot">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <tfoot
      data-slot="table-footer"
      class={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", local.class)}
      {...rest}
    />
  );
};

const TableRow: Component<ComponentProps<"tr">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <tr
      data-slot="table-row"
      class={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        local.class,
      )}
      {...rest}
    />
  );
};

const TableHead: Component<ComponentProps<"th">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <th
      data-slot="table-head"
      class={cn(
        "h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.class,
      )}
      {...rest}
    />
  );
};

const TableCell: Component<ComponentProps<"td">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <td
      data-slot="table-cell"
      class={cn(
        "whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.class,
      )}
      {...rest}
    />
  );
};

const TableCaption: Component<ComponentProps<"caption">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <caption
      data-slot="table-caption"
      class={cn("mt-4 text-muted-foreground text-sm", local.class)}
      {...rest}
    />
  );
};

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
