# modal-root: behaviour contract

Each line is one browser test in `tests/contracts/modal-root.contract.test.tsx`, named by its id. `src/lib/behavior/modal-root.tsx` holds `ModalRoot`, its context (`useDialogContext`), `ModalTrigger`, `ModalTitle`, `ModalDescription` and `ModalFrame`: the owned modal the Dialog family skins. It assembles controllable, polymorphic, layer stack, dismiss, presence, focus scope and hide outside; every block keys on `isOpen()`. The rows run through the public `Dialog` API, so they hold the skin and the root together.

| id | when | then |
|---|---|---|
| MR1 | a panel with a `DialogTitle`, a `DialogDescription` and `ariaLabel`; then one with only `ariaLabel` | the Title names the panel and `aria-label` is absent; the Description describes it; the untitled panel is named by `ariaLabel` and has no `aria-labelledby` |
| MR2 | the trigger, closed, then pressed | `aria-haspopup="dialog"` and `aria-expanded="false"` with no `aria-controls`; open, `aria-expanded="true"` and `aria-controls` names the panel's id |
| MR3 | `defaultOpen`, Done pressed, the trigger pressed | starts open, closes, reopens; `onOpenChange` reports `[false, true]` |
| MR4 | `onEscapeKeyDown` and `onInteractOutside` call `preventDefault`; Escape, then a press beside the panel | the dialog stays open |
| MR5 | `ref`, `data-testid` and `onKeyDown` on the content | `ref` receives the panel; the attribute and the handler reach it |
| MR6 | the dialog inside a closed shadow root; then on the page | in the shadow root nothing on the page gets `aria-hidden`; on the page what is beside it gets `aria-hidden="true"` |
| MR7 | a Select list opened inside the dialog, then the dialog closes | the list closes with it: every layer whose trigger or element sits inside the panel is dismissed, newest first |
| MR8 | a `modal` Popover open; a Dialog opened from a button inside it, Confirm pressed, then Keep | the panel sits under no `aria-hidden`, holds focus and takes the press; Keep closes the dialog and the popover stays open: a Kobalte root drops `modal` while an owned modal covers it, and the owned modal's portal takes pointer events whatever the body says |
| MR9 | a Dialog open on the page; one with `modal={false}`; one inside a closed shadow root | the modal panel carries `aria-modal="true"`; the non-modal panel and the shadow-root panel carry no `aria-modal` |
| MR10 | a `Toaster` beside a modal Dialog that is open, then `toast("Scene saved")` | the panel carries `aria-modal="true"` and the toast's text is in the Chromium AX tree |
| MR11 | a `data-kb-top-layer` "Wake screen" button on the page, then a modal Dialog opened | the panel carries `aria-modal="true"` and `button "Wake screen"` stays in the Chromium AX tree |
| MR12 | a controlled modal with no Trigger closes; `onCloseAutoFocus` calls `preventDefault` and focuses an unmarked page button | focus ends on that button after the exit: the trap lets go before the consumer runs |
| MR13 | `onPointerDownOutside` and `onInteractOutside` on the content, a press on the scrim | both receive the same cancelable `CustomEvent`, pointer handler first; its `target` and `detail.originalEvent.target` are the scrim, `detail.originalEvent` is the `PointerEvent`, `detail.isContextMenu` is false (Kobalte's shape) |
| MR14 | `onEscapeKeyDown` on the content, Escape with a button inside focused | the handler receives the trusted keydown itself, whose target is that button |
| MR15 | a modal Dialog; a right-button press on the scrim, then a Ctrl+primary press, then a plain press | the first two report `isContextMenu` true and the modal stays open (Kobalte's DialogContent cancelled a modal's context-menu press); the plain press closes it |
