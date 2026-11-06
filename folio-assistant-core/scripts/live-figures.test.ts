import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { liveFiguresFor, withLiveFigures, type FigureTarget } from "./live-figures.ts";

const target: FigureTarget = {
  block: "folio/doc/ch1/f-1.md",
  label: "Figure 1",
  model: "1.0.0",
  view: "id-v1",
  viewName: "Overview",
  svg: "archimate/1.0.0/views/id-v1.svg",
  page: "en/inst/archimate/1.0.0/views/overview/",
};

describe("a figure that is a model view is drawn from the model", () => {
  const root = mkdtempSync(join(tmpdir(), "live-figures-"));
  mkdirSync(join(root, "folio/doc/ch1"), { recursive: true });
  writeFileSync(join(root, target.block), "![Figure](media/image1.png)\n");
  const live = liveFiguresFor([target, { ...target, block: "folio/doc/gone.md" }], root, "en/doc");

  it("finds the block's image, with links from the document page", () => {
    expect([...live.keys()]).toEqual(["media/image1.png"]);
    expect(live.get("media/image1.png")).toMatchObject({ svg: "../../archimate/1.0.0/views/id-v1.svg", page: "../inst/archimate/1.0.0/views/overview/" });
  });

  it("embeds the drawing as an object, so its links work, and keeps the PNG as the fallback", () => {
    const html = withLiveFigures(`<p><img src="media/image1.png" alt="Figure"></p>\n<p><img src="media/other.png" alt="x"></p>`, live);
    expect(html).toContain(`<object class="fa-live-figure" type="image/svg+xml" data="../../archimate/1.0.0/views/id-v1.svg"`);
    // A link inside an SVG loaded through <img> is never clickable, and a link
    // around the drawing would take every click to the view page instead.
    expect(html).not.toContain(`<img src="../../archimate/1.0.0/views/id-v1.svg"`);
    expect(html).not.toContain(`<a class="fa-live-figure"`);
    expect(html).toContain(`><img src="media/image1.png" alt="Figure 1: view &quot;Overview&quot; of ArchiMate model 1.0.0, drawn from the model" loading="lazy"></object>`);
    expect(html).toContain(`<a href="../inst/archimate/1.0.0/views/overview/">view &ldquo;Overview&rdquo;</a> (1.0.0)`);
    expect(html).toContain(`<img src="media/other.png" alt="x">`);
  });

  it("changes nothing when no figure is mapped", () => {
    expect(withLiveFigures(`<img src="media/image1.png">`, new Map())).toBe(`<img src="media/image1.png">`);
    rmSync(root, { recursive: true, force: true });
  });
});
