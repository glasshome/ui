import { onTestFinished, vi } from "vitest";

export function useFakeTime(config?: {
  toFake?: NonNullable<Parameters<typeof vi.useFakeTimers>[0]>["toFake"];
}): void {
  vi.useFakeTimers(config);
  onTestFinished(() => {
    vi.useRealTimers();
  });
}
