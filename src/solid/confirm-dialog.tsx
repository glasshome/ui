import type { JSX } from "solid-js";
import { children, Show } from "solid-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHead,
} from "./alert-dialog.js";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The glyph that tells this confirm from the next. */
  icon: string;
  /** Defaults to destructive red when `destructive`, else the material accent. */
  tone?: string;
  /** The question or the outcome, naming its object: "Remove Anna?". */
  title: string;
  /** The consequence, one line. */
  line: JSX.Element;
  actionLabel: string;
  /** Defaults to true: nearly every confirm is a delete or a removal. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  /** The thing the confirm is about (avatars, a preview), shown instead of described. */
  children?: JSX.Element;
}

/** A yes/no on one object: media, a short question, the consequence, Cancel and the action. */
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element {
  const destructive = () => props.destructive ?? true;
  const thing = children(() => props.children);
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHead
          icon={props.icon}
          tone={props.tone ?? (destructive() ? "var(--destructive)" : "var(--material-accent)")}
          title={props.title}
          line={props.line}
        />
        <Show when={thing()}>
          <AlertDialogBody>{thing()}</AlertDialogBody>
        </Show>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive() ? "destructive" : "default"}
            busy={props.busy}
            onClick={() => props.onConfirm()}
          >
            {props.actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
