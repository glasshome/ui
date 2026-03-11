import { ChevronLeft, ChevronRight } from "lucide-solid";
import {
  type Component,
  type ComponentProps,
  createMemo,
  createSignal,
  For,
  splitProps,
} from "solid-js";
import { cn } from "../lib/utils";
import { Button, buttonVariants } from "./button";

type DateRange = { from: Date; to?: Date };

interface CalendarProps extends Omit<ComponentProps<"div">, "onSelect"> {
  mode?: "single" | "range";
  selected?: Date | DateRange;
  onSelect?: (date: Date | DateRange | undefined) => void;
  showOutsideDays?: boolean;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  disabled?: (date: Date) => boolean;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, from: Date, to: Date): boolean {
  const d = date.getTime();
  return d >= from.getTime() && d <= to.getTime();
}

const Calendar: Component<CalendarProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "class",
    "mode",
    "selected",
    "onSelect",
    "showOutsideDays",
    "month",
    "onMonthChange",
    "disabled",
  ]);

  const mode = () => local.mode ?? "single";
  const showOutsideDays = () => local.showOutsideDays ?? true;
  const today = new Date();

  const [currentMonth, setCurrentMonth] = createSignal(local.month ?? today);
  const displayMonth = () => local.month ?? currentMonth();
  const year = () => displayMonth().getFullYear();
  const month = () => displayMonth().getMonth();

  const weekdays = createMemo(() => {
    const formatter = new Intl.DateTimeFormat("default", { weekday: "short" });
    // Jan 7, 2024 is a Sunday
    return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 7 + i)));
  });

  const weeks = createMemo(() => {
    const y = year();
    const m = month();
    const daysInMonth = getDaysInMonth(y, m);
    const firstDay = getFirstDayOfMonth(y, m);
    const daysInPrevMonth = getDaysInMonth(y, m - 1);

    const cells: { date: Date; isOutside: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(y, m - 1, daysInPrevMonth - i), isOutside: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(y, m, d), isOutside: false });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ date: new Date(y, m + 1, d), isOutside: true });
      }
    }

    const result: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  });

  const goToPrev = () => {
    const prev = new Date(year(), month() - 1, 1);
    setCurrentMonth(prev);
    local.onMonthChange?.(prev);
  };

  const goToNext = () => {
    const next = new Date(year(), month() + 1, 1);
    setCurrentMonth(next);
    local.onMonthChange?.(next);
  };

  const isSelected = (date: Date): boolean => {
    if (!local.selected) return false;
    if (mode() === "single") return isSameDay(date, local.selected as Date);
    const range = local.selected as DateRange;
    if (range.from && range.to) return isInRange(date, range.from, range.to);
    if (range.from) return isSameDay(date, range.from);
    return false;
  };

  const isRangeStart = (date: Date): boolean => {
    if (mode() !== "range" || !local.selected) return false;
    const range = local.selected as DateRange;
    return !!range.from && isSameDay(date, range.from);
  };

  const isRangeEnd = (date: Date): boolean => {
    if (mode() !== "range" || !local.selected) return false;
    const range = local.selected as DateRange;
    return !!range.to && isSameDay(date, range.to);
  };

  const isRangeMiddle = (date: Date): boolean => {
    if (mode() !== "range" || !local.selected) return false;
    const range = local.selected as DateRange;
    if (!range.from || !range.to) return false;
    return (
      isInRange(date, range.from, range.to) &&
      !isSameDay(date, range.from) &&
      !isSameDay(date, range.to)
    );
  };

  const handleSelect = (date: Date) => {
    if (local.disabled?.(date)) return;
    if (mode() === "single") {
      local.onSelect?.(date);
    } else {
      const range = local.selected as DateRange | undefined;
      if (!range?.from || (range.from && range.to)) {
        local.onSelect?.({ from: date });
      } else {
        const [from, to] = date >= range.from ? [range.from, date] : [date, range.from];
        local.onSelect?.({ from, to });
      }
    }
  };

  const monthLabel = createMemo(() => {
    const formatter = new Intl.DateTimeFormat("default", {
      month: "long",
      year: "numeric",
    });
    return formatter.format(displayMonth());
  });

  return (
    <div
      data-slot="calendar"
      class={cn("group/calendar bg-background p-3 [--cell-size:--spacing(8)]", local.class)}
      {...rest}
    >
      <div class="relative flex flex-col gap-4">
        <div class="flex w-full flex-col gap-4">
          <div class="relative flex w-full items-center justify-between">
            <Button variant="ghost" class="size-(--cell-size) select-none p-0" onClick={goToPrev}>
              <ChevronLeft class="size-4" />
            </Button>
            <div class="flex h-(--cell-size) select-none items-center justify-center font-medium text-sm">
              {monthLabel()}
            </div>
            <Button variant="ghost" class="size-(--cell-size) select-none p-0" onClick={goToNext}>
              <ChevronRight class="size-4" />
            </Button>
          </div>
          <table class="w-full border-collapse">
            <thead>
              <tr class="flex">
                <For each={weekdays()}>
                  {(day) => (
                    <th class="flex-1 select-none rounded-md font-normal text-[0.8rem] text-muted-foreground">
                      {day}
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={weeks()}>
                {(week) => (
                  <tr class="mt-2 flex w-full">
                    <For each={week}>
                      {(cell) => {
                        if (cell.isOutside && !showOutsideDays()) {
                          return <td class="aspect-square flex-1 p-0" />;
                        }

                        const cellIsToday = isSameDay(cell.date, today);
                        const selected = () => isSelected(cell.date);
                        const rangeStart = () => isRangeStart(cell.date);
                        const rangeEnd = () => isRangeEnd(cell.date);
                        const rangeMiddle = () => isRangeMiddle(cell.date);
                        const cellDisabled = () => local.disabled?.(cell.date) ?? false;

                        return (
                          <td
                            class={cn(
                              "group/day relative aspect-square flex-1 select-none p-0 text-center",
                              rangeStart() && "rounded-l-md bg-accent",
                              rangeEnd() && "rounded-r-md bg-accent",
                              rangeMiddle() && "bg-accent",
                            )}
                            data-selected={selected()}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelect(cell.date)}
                              disabled={cellDisabled()}
                              class={cn(
                                buttonVariants({ variant: "ghost", size: "icon" }),
                                "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none",
                                selected() &&
                                  !rangeMiddle() &&
                                  "bg-primary text-primary-foreground",
                                rangeMiddle() && "rounded-none bg-accent text-accent-foreground",
                                rangeStart() && "rounded-l-md bg-primary text-primary-foreground",
                                rangeEnd() && "rounded-r-md bg-primary text-primary-foreground",
                                cellIsToday &&
                                  !selected() &&
                                  "rounded-md bg-accent text-accent-foreground",
                                cell.isOutside && "text-muted-foreground",
                                cellDisabled() && "text-muted-foreground opacity-50",
                              )}
                            >
                              {cell.date.getDate()}
                            </button>
                          </td>
                        );
                      }}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export { Calendar };
export type { CalendarProps, DateRange };
