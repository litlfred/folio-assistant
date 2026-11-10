import { describe, expect, test } from "bun:test";

import { inject } from "./readme-sections.ts";
import { headingsOf, tocOf, tocSection } from "./readme-toc.ts";

describe("kg:toc — a README's own headings, as GitHub anchors them", () => {
  test("level 2 with level 3 nested; level 1 and 4 left out", () => {
    const md = "# Title\n\n## One\n\n### One, part A\n\n#### deep\n\n## Two\n";
    expect(tocOf(md)).toBe("- [One](#one)\n  - [One, part A](#one-part-a)\n- [Two](#two)\n");
  });

  test("a `#` line inside fenced code is not a heading", () => {
    const md = "## Real\n\n```sh\n## not a heading\n```\n\n~~~\n### nor this\n~~~\n";
    expect(headingsOf(md).map((h) => h.text)).toEqual(["Real"]);
  });

  test("duplicates get GitHub's -1, -2, counted over headings of every level", () => {
    const md = "# Notes\n\n## Notes\n\n## Notes\n";
    expect(tocOf(md)).toBe("- [Notes](#notes-1)\n- [Notes](#notes-2)\n");
  });

  test("links, code and emphasis are dropped from the text and the anchor", () => {
    const md = "## The [`kg:files`](x.md) *section*\n";
    expect(tocOf(md)).toBe("- [The kg:files section](#the-kgfiles-section)\n");
  });

  test("its own region is skipped, so a second run changes nothing", () => {
    const readme = "intro\n<!-- kg:toc:begin -->\n<!-- kg:toc:end -->\n\n## A\n\n## B\n";
    const once = inject(readme, tocSection.render({ root: "/nonexistent", readme }).markdown, "kg:toc");
    const twice = inject(once, tocSection.render({ root: "/nonexistent", readme: once }).markdown, "kg:toc");
    expect(once).toContain("- [A](#a)\n- [B](#b)");
    expect(twice).toBe(once);
  });

  test("no README anywhere is could-not-determine, never an empty list", () => {
    expect(tocSection.render({ root: "/nonexistent" }).skip).toBe(true);
  });
});
