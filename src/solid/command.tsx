import { Search } from "lucide-solid";
import {
  type Component,
  type ComponentProps,
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type ParentComponent,
  Show,
  splitProps,
  useContext,
} from "solid-js";
import { cn } from "../lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";

interface CommandContextValue {
  search: () => string;
  setSearch: (v: string) => void;
  selectedIndex: () => number;
  setSelectedIndex: (i: number) => void;
  registerItem: (id: string, keywords?: string) => void;
  unregisterItem: (id: string) => void;
  filteredItems: () => string[];
}

const CommandContext = createContext<CommandContextValue>();

const Command: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class", "children"]);
  const [search, setSearch] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [itemsMap, setItemsMap] = createSignal<Map<string, string>>(new Map());

  const items = () => Array.from(itemsMap().keys());
  const filteredItems = createMemo(() => {
    const s = search().toLowerCase();
    if (!s) return items();
    return items().filter((id) => {
      const keywords = itemsMap().get(id) ?? "";
      return id.toLowerCase().includes(s) || keywords.toLowerCase().includes(s);
    });
  });

  const registerItem = (id: string, keywords?: string) => {
    setItemsMap((prev) => {
      const next = new Map(prev);
      next.set(id, keywords ?? id);
      return next;
    });
  };

  const unregisterItem = (id: string) => {
    setItemsMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const total = filteredItems().length;
    if (!total) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + total) % total);
    }
  };

  return (
    <CommandContext.Provider
      value={{
        search,
        setSearch,
        selectedIndex,
        setSelectedIndex,
        registerItem,
        unregisterItem,
        filteredItems,
      }}
    >
      <div
        data-slot="command"
        class={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
          local.class,
        )}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {local.children}
      </div>
    </CommandContext.Provider>
  );
};

const CommandDialog: ParentComponent<
  ComponentProps<typeof Dialog> & {
    title?: string;
    description?: string;
    contentClass?: string;
    showCloseButton?: boolean;
  }
> = (props) => {
  const [local, rest] = splitProps(props, [
    "title",
    "description",
    "children",
    "contentClass",
    "showCloseButton",
  ]);

  return (
    <Dialog {...rest}>
      <DialogHeader class="sr-only">
        <DialogTitle>{local.title ?? "Command Palette"}</DialogTitle>
        <DialogDescription>
          {local.description ?? "Search for a command to run..."}
        </DialogDescription>
      </DialogHeader>
      <DialogContent class={cn("overflow-hidden p-0", local.contentClass)}>
        <Command class="**:data-[slot=command-input-wrapper]:h-12 [&_[data-slot=command-input-wrapper]_svg]:h-5 [&_[data-slot=command-input-wrapper]_svg]:w-5">
          {local.children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput: Component<ComponentProps<"input">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const ctx = useContext(CommandContext);

  return (
    <div data-slot="command-input-wrapper" class="flex h-9 items-center gap-2 border-b px-3">
      <Search class="size-4 shrink-0 opacity-50" />
      <input
        data-slot="command-input"
        type="text"
        class={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          local.class,
        )}
        value={ctx?.search() ?? ""}
        onInput={(e) => {
          ctx?.setSearch(e.currentTarget.value);
          ctx?.setSelectedIndex(0);
        }}
        {...rest}
      />
    </div>
  );
};

const CommandList: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      data-slot="command-list"
      class={cn("max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden", local.class)}
      {...rest}
    />
  );
};

const CommandEmpty: ParentComponent<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const ctx = useContext(CommandContext);

  return (
    <Show when={ctx?.filteredItems().length === 0}>
      <div
        data-slot="command-empty"
        class={cn("py-6 text-center text-sm", local.class)}
        {...rest}
      />
    </Show>
  );
};

const CommandGroup: ParentComponent<ComponentProps<"div"> & { heading?: string }> = (props) => {
  const [local, rest] = splitProps(props, ["class", "heading", "children"]);

  return (
    <div
      data-slot="command-group"
      class={cn("overflow-hidden p-1 text-foreground", local.class)}
      {...rest}
    >
      <Show when={local.heading}>
        <div class="px-2 py-1.5 font-medium text-muted-foreground text-xs">{local.heading}</div>
      </Show>
      {local.children}
    </div>
  );
};

const CommandItem: ParentComponent<
  ComponentProps<"div"> & {
    value?: string;
    keywords?: string;
    onSelect?: () => void;
    disabled?: boolean;
  }
> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "value",
    "keywords",
    "onSelect",
    "disabled",
  ]);
  const ctx = useContext(CommandContext);
  const id = () => local.value ?? "";

  onMount(() => {
    if (id()) ctx?.registerItem(id(), local.keywords ?? id());
  });

  onCleanup(() => {
    if (id()) ctx?.unregisterItem(id());
  });

  const isVisible = createMemo(() => {
    if (!id()) return true;
    return ctx?.filteredItems().includes(id()) ?? true;
  });

  const isSelected = createMemo(() => {
    if (!id()) return false;
    const filtered = ctx?.filteredItems() ?? [];
    return filtered[ctx?.selectedIndex() ?? -1] === id();
  });

  return (
    <Show when={isVisible()}>
      <div
        data-slot="command-item"
        data-selected={isSelected()}
        data-disabled={local.disabled}
        data-value={id()}
        class={cn(
          "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
          local.class,
        )}
        onClick={() => !local.disabled && local.onSelect?.()}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter" && isSelected() && !local.disabled) {
            e.preventDefault();
            local.onSelect?.();
          }
        }}
        {...rest}
      >
        {local.children}
      </div>
    </Show>
  );
};

const CommandSeparator: Component<ComponentProps<"div">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div data-slot="command-separator" class={cn("-mx-1 h-px bg-border", local.class)} {...rest} />
  );
};

const CommandShortcut: Component<ComponentProps<"span">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      data-slot="command-shortcut"
      class={cn("ml-auto text-muted-foreground text-xs tracking-widest", local.class)}
      {...rest}
    />
  );
};

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
