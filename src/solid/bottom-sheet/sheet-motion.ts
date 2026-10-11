export const isSheetMotion = (a: Animation) =>
  "animationName" in a
    ? a.animationName === "bs-slide-up" || a.animationName === "bs-slide-down"
    : "transitionProperty" in a && a.transitionProperty === "transform";
