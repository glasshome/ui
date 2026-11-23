/** Exports with no specimen, each with the reason. Reasons are a backlog. */
export const ALLOW: Array<[name: string, reason: string]> = [
  ["LocaleProvider", "Draws nothing of its own: it renders its children in the member's language."],
  [
    "AlertDialogHeader",
    "Raw header part: apps compose AlertDialogHead, whose specimen is the picture; the free-children Header is left for ui internals and tab-row headers.",
  ],
  [
    "AlertDialogTitle",
    "Rendered inside AlertDialogHead, which the AlertDialog and ConfirmDialog specimens show.",
  ],
  [
    "AlertDialogDescription",
    "Rendered inside AlertDialogHead, which the AlertDialog and ConfirmDialog specimens show.",
  ],
  [
    "AlertDialogBody",
    "Rendered by ConfirmDialog when it has children; its specimen is the picture.",
  ],
  [
    "ResponsiveDialogHeader",
    "Raw header part: apps compose ResponsiveDialogHead, whose specimen is the picture.",
  ],
  [
    "ResponsiveDialogTitle",
    "Rendered inside ResponsiveDialogHead, which the ResponsiveDialog specimen shows.",
  ],
  [
    "ResponsiveDialogDescription",
    "Rendered inside ResponsiveDialogHead, which the ResponsiveDialog specimen shows.",
  ],
  [
    "Logo",
    "Its mark loads /assets/glasshome_logo.png, which dev/ does not serve, so a specimen 404s and gallery:shots fails on the console error (GALLERY-PLAN.md gap 4).",
  ],
  [
    "SlidingIndicator",
    "Deprecated: it measures the active item and keeps a copy of layout. The SelectionScope specimen is what replaces it. Goes at the next major.",
  ],
  [
    "HeroOption",
    "Deprecated alias of OptionCard, the same function; the OptionCard specimen is its pixels. Goes at the next major.",
  ],
  [
    "SectionSubtitle",
    "Deprecated: a bare heading has no owner. A specimen would advertise it over SectionGroup and FieldLegend, the doors that replace it.",
  ],
  [
    "BottomSheetHeader",
    "Deprecated alias of the shared modal Header part. A titled sheet is ResponsiveDialog, whose specimen renders the header.",
  ],
  [
    "BottomSheetFooter",
    "Deprecated alias of the shared modal Footer part. A footed sheet is ResponsiveDialog, whose specimen renders the footer.",
  ],
  [
    "SelectGroup",
    "No consumer and no composition to show: Select renders options flat through sectionComponent, so a wrapping div never holds a section's items.",
  ],
  [
    "SelectLabel",
    "The Select's form label, which names its trigger and list, in menu-group label chrome. No consumer settles which of the two it is, so a specimen would guess.",
  ],
  [
    "SelectSeparator",
    "Its only placement is between the sections of a grouped Select, which nothing composes yet (see SelectGroup).",
  ],
  [
    "SectionRowSkeleton",
    "The one row SectionRowSkeletons repeats. Nothing renders it alone, and the SectionRowSkeletons specimen is exactly these pixels.",
  ],
];
