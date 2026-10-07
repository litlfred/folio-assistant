import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readDeclaration, siteDir } from "../../../schemas/cat-harness.js";
import { BLOCK_URLS_JS, editLinkHtml, editLinksAsset, editUrl, feedbackUrl, sourceUrl } from "../edit-links.js";

describe("edit-links: one recipe for every page's edit and feedback links (bean v433)", () => {
  test("the published runtime is the generated one (run --write-asset after changing the recipe)", () => {
    const harness = join(import.meta.dir, "..", "..", "..");
    const asset = readFileSync(join(harness, siteDir(readDeclaration(harness)!), "assets", "js", "edit-links.js"), "utf-8");
    expect(asset).toBe(editLinksAsset());
  });

  const urls = new Function(`${BLOCK_URLS_JS}; return faBlockUrls;`)() as (c: unknown, b: unknown) => { edit: string; source: string; feedback: string };
  const b = { label: "h-intro", source: "input/pagecontent/index.md", section: "Introduction", line: 12, repo: "who/smart-base" };

  test("a source line and a submodule's repository reach every URL, in both halves", () => {
    const cfg = { repo: "o/r", branch: "main" };
    const u = urls(cfg, b);
    expect(u.source).toBe(sourceUrl(cfg, b.source, b.line, b.repo)!);
    expect(u.source).toBe("https://github.com/who/smart-base/blob/main/input/pagecontent/index.md#L12");
    expect(u.edit).toBe(editUrl(cfg, b.source, b.repo)!);
    expect(u.feedback).toBe(feedbackUrl(cfg, b)!);
    // feedback goes to the SITE's repository, whatever repository the source is in
    expect(u.feedback.startsWith("https://github.com/o/r/issues/new?")).toBe(true);
  });

  test("a single link carries its facts, and edit keeps a plain href for readers without JavaScript", () => {
    const html = editLinkHtml({ repo: "o/r" }, { source: "docs/a b.md", line: 3 });
    expect(html).toContain('data-fa-link="edit"');
    expect(html).toContain('data-src="docs/a b.md"');
    expect(html).toContain('href="https://github.com/o/r/edit/main/docs/a%20b.md"');
    expect(editLinkHtml({ repo: "o/r" }, { source: "x.md", kind: "feedback" })).not.toContain("href=");
  });
});
