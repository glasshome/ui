import type { Component, ComponentProps } from "solid-js";
import { Toaster as SolidSonner } from "solid-sonner";

const Toaster: Component<ComponentProps<typeof SolidSonner>> = (props) => {
  return (
    <SolidSonner
      position="bottom-right"
      theme="dark"
      class="toaster group"
      toastOptions={{
        classes: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
export { toast } from "solid-sonner";
