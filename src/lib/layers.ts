/* Stacking order for floating surfaces. Sheets sit under popovers so a
 * dropdown opened inside a sheet stacks naturally. Class strings stay literal
 * for Tailwind's scanner; numbers are for inline styles. */
export const Z = {
  sheet: 40,
  overlay: 50,
} as const;

export const Z_CLASS = {
  sheet: "z-40",
  overlay: "z-50",
} as const satisfies Record<keyof typeof Z, string>;
