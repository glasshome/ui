export const busyProps = {
  "aria-busy": "true",
  "aria-disabled": "true",
  "data-claim": "prevent:click",
  onClick: (event: MouseEvent) => event.preventDefault(),
} as const;
