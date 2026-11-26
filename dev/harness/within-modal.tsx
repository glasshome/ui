import { type JSX } from "@solidjs/web";
import { Dialog, DialogContent, DialogTitle } from "../../src/solid/dialog.js";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "../../src/solid/responsive-dialog.js";

export function InDialog(props: { children: JSX.Element }) {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Scenario</DialogTitle>
        {props.children}
      </DialogContent>
    </Dialog>
  );
}

export function InSheet(props: { children: JSX.Element }) {
  return (
    <ResponsiveDialog defaultOpen>
      <ResponsiveDialogContent>
        <ResponsiveDialogBody>
          <ResponsiveDialogTitle>Scenario</ResponsiveDialogTitle>
          {props.children}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
