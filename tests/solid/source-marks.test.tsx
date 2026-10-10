import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { PreviewTile, PreviewTileGroup, SourceMarks } from "../../src/solid/index.js";

afterEach(cleanup);

describe("SourceMarks", () => {
  it("marks a built-in as official and built in", () => {
    render(() => <SourceMarks official builtIn />);
    expect(screen.getByText("Official")).toBeTruthy();
    expect(screen.getByText("Built in")).toBeTruthy();
  });

  it("marks a community item as community, with no built-in badge", () => {
    render(() => <SourceMarks official={false} />);
    expect(screen.getByText("Community")).toBeTruthy();
    expect(screen.queryByText("Built in")).toBeNull();
  });

  it("sits in a preview tile's caption, after the label", () => {
    render(() => (
      <PreviewTileGroup aria-label="Themes">
        <PreviewTile value="dusk" label="Dusk" marks={<SourceMarks official builtIn />}>
          <div />
        </PreviewTile>
      </PreviewTileGroup>
    ));
    const caption = screen.getByText("Dusk").parentElement as HTMLElement;
    expect(caption.dataset.slot).toBe("preview-tile-caption");
    expect(caption.textContent).toBe("DuskOfficialBuilt in");
  });
});
