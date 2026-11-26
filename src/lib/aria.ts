/** Solid 2 drops a boolean aria attribute on false; a string keeps "false" on the element. */
export const ariaBool = (value: boolean): "true" | "false" => (value ? "true" : "false");
