import { describe, expect, test } from "bun:test";

import type { ReviewAnchors } from "./docx-to-folio.js";
import { PublicCommentSchema } from "../schemas/public-comment.js";
import { dashboardHtml, overlaySnippet, siteComments, stagingSlug } from "./public-comment-site.js";

const anchors: ReviewAnchors = {
  $schema: "folio-review-anchors/v1",
  document: "doc",
  library: "lib",
  source: { docx: { file: "d", sha256: "a" }, pdf: { file: "p", sha256: "b", pages: 1 } },
  chapters: [],
  sections: [{ label: "sec:1-1", number: "1.1", title: "About", chapter: "ch1" }],
  blocks: [{ label: "prose:1-1-abc", kind: "prose", chapter: "ch1", root: "p-1-1-abc", sections: ["sec:1-1"], hash: "h", excerpt: "x", page: 1, method: "numbered" }],
};

const comment = (over: Record<string, unknown> = {}) =>
  PublicCommentSchema.parse({
    $schema: "public-comment/1.0.0",
    id: "pc-0001",
    summary: "Split <the> definition",
    comment: "Split <the> definition",
    createdAt: "t",
    targetLabel: "prose:1-1-abc",
    status: "editing",
    priority: "medium",
    origin: "human",
    public: {
      ref: "PC-0001",
      source: { channel: "comment-matrix", batch: "m" },
      reviewer: { id: "r-1", organisation: "Org" },
      citation: { raw: "§1.1 p.9 l.42" },
      anchor: { targetLabel: "prose:1-1-abc", method: "page-line", confidence: "high", candidates: [] },
      text: "Split <the> definition",
      decision: { code: "accepted", reason: "", by: "ed", at: "t", changeSet: { branch: "pc/1.1 definitions", pr: 7 } },
    },
    ...over,
  });

describe("public-comment-site", () => {
  test("the staging slug is folio-staging.yml's", () => {
    expect(stagingSlug("pc/1.1 definitions")).toBe("pc-1.1-definitions");
    expect(stagingSlug("--a//b--")).toBe("a-b");
  });

  test("before, after and PR links point at the anchor", () => {
    const [r] = siteComments([comment()], anchors, { slug: "doc", site: "https://o.github.io/r/", repo: "o/r", storeDir: "review/public-comment" });
    expect(r.phase).toBe("editing");
    expect(r.section).toBe("1.1");
    expect(r.links).toMatchObject({
      document: "../doc/index.html#prose%3A1-1-abc",
      before: "https://o.github.io/r/doc/index.html#prose%3A1-1-abc",
      after: "https://o.github.io/r/STAGING/pc-1.1-definitions/doc/index.html#prose%3A1-1-abc",
      pr: "https://github.com/o/r/pull/7",
      record: "https://github.com/o/r/blob/main/review/public-comment/comments/PC-0001.json",
    });
  });

  test("comment text is escaped in the dashboard and cannot close the overlay's script", () => {
    const rows = siteComments([comment({ summary: "</script><b>x" })], anchors, { slug: "doc" });
    expect(dashboardHtml(rows, { title: "T", slug: "doc", generated: "g" })).not.toContain("<the>");
    expect(overlaySnippet(rows)).not.toContain("</script><b>");
  });

  test("the count tiles are toggles, and every row carries what they filter on (owner, 2026-10-05)", () => {
    const html = dashboardHtml(siteComments([comment({})], anchors, { slug: "doc" }), { title: "T", slug: "doc", generated: "g" });
    for (const key of ["all", "open", "unplaced", "editing", "decided", "incorporated"]) {
      expect(html).toMatch(new RegExp(`<button type="button" class="tile" data-tile="${key}" aria-pressed="false"`));
    }
    expect(html).toMatch(/<tr id="PC-0001" data-phase="\w+" data-status="\w+" data-placed="[01]"/);
  });
});
