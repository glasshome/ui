/** Exports with no specimen, each with the reason. Reasons are a backlog. */
export const ALLOW: Array<[name: string, reason: string]> = [
	[
		"Logo",
		"Its mark loads /assets/glasshome_logo.png, which dev/ does not serve, so a specimen 404s and gallery:shots fails on the console error (GALLERY-PLAN.md gap 4).",
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
		"Wraps Kobalte's Select.Label, the control's form label, in menu-group label chrome. No consumer settles which of the two it is, so a specimen would guess.",
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
