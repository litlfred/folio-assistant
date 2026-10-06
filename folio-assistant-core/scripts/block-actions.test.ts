import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { blockActionsHtml, editUrl, feedbackUrl, injectBlockActions, readIssueForm, sourceUrl } from "./block-actions.js";

const block = { label: "prose:2-1-2-ab12", source: "folio/doc/ch2/p-2-1-2.md", section: "2.1.2 Business services layer", page: "doc/index.html" };

describe("block-actions (REQ-17, bean uphx)", () => {
  test("[edit] opens the block's source in GitHub's editor on main", () => {
    expect(editUrl({ repo: "o/r" }, block.source)).toBe("https://github.com/o/r/edit/main/folio/doc/ch2/p-2-1-2.md");
    expect(editUrl({ repo: "o/r", branch: "draft" }, block.source)).toBe("https://github.com/o/r/edit/draft/folio/doc/ch2/p-2-1-2.md");
    expect(sourceUrl({ repo: "o/r" }, block.source)).toBe("https://github.com/o/r/blob/main/folio/doc/ch2/p-2-1-2.md");
  });

  test("no repository, no links: nothing is drawn rather than a broken link", () => {
    expect(editUrl({}, block.source)).toBeUndefined();
    expect(blockActionsHtml({}, block)).toBe("");
    const html = '<html><head></head><body><a id="prose:2-1-2-ab12"></a><p>x</p></body></html>';
    expect(injectBlockActions(html, [block], {})).toEqual({ html, inserted: 0 });
  });

  test("[feedback] without a form puts the block's facts in the body", () => {
    const u = new URL(feedbackUrl({ repo: "o/r", siteUrl: "https://o.github.io/r/" }, block)!);
    expect(u.pathname).toBe("/o/r/issues/new");
    expect(u.searchParams.get("template")).toBeNull();
    expect(u.searchParams.get("title")).toBe("Feedback: 2.1.2 Business services layer — prose:2-1-2-ab12");
    const body = u.searchParams.get("body")!;
    expect(body).toContain("`prose:2-1-2-ab12`");
    expect(body).toContain("https://github.com/o/r/blob/main/folio/doc/ch2/p-2-1-2.md");
    expect(body).toContain("https://o.github.io/r/doc/index.html#prose%3A2-1-2-ab12");
  });

  test("[feedback] with a form prefills only the fields the form declares", () => {
    const u = new URL(feedbackUrl({ repo: "o/r", template: "block-feedback.yml", templateFields: ["block", "source"], labels: ["feedback"] }, block)!);
    expect(u.searchParams.get("template")).toBe("block-feedback.yml");
    expect(u.searchParams.get("block")).toBe("prose:2-1-2-ab12");
    expect(u.searchParams.get("source")).toBe("folio/doc/ch2/p-2-1-2.md");
    expect(u.searchParams.get("section")).toBeNull();
    expect(u.searchParams.get("body")).toBeNull();
    expect(u.searchParams.get("labels")).toBe("feedback");
  });

  test("the form's field ids are read from the folio's issue form, and its absence is undefined", () => {
    const root = mkdtempSync(join(tmpdir(), "ba-"));
    expect(readIssueForm(root)).toBeUndefined();
    mkdirSync(join(root, ".github", "ISSUE_TEMPLATE"), { recursive: true });
    writeFileSync(
      join(root, ".github", "ISSUE_TEMPLATE", "block-feedback.yml"),
      "name: Block feedback\nbody:\n  - type: input\n    id: block\n    attributes:\n      label: Block\n  - type: textarea\n    id: \"feedback\"\n",
    );
    expect(readIssueForm(root)).toEqual(["block", "feedback"]);
  });

  test("the links go right after the block's anchor, once, and the style once", () => {
    const html = '<html><head></head><body><a id="prose:2-1-2-ab12"></a><p>x</p><a id="other"></a></body></html>';
    const r = injectBlockActions(html, [block, { ...block, label: "missing" }], { repo: "o/r" });
    expect(r.inserted).toBe(1);
    expect(r.html).toContain('<a id="prose:2-1-2-ab12"></a><span class="block-actions" data-block="prose:2-1-2-ab12">');
    expect(r.html.match(/class="block-actions"/g)!.length).toBe(1);
    expect(r.html.match(/<style>/g)!.length).toBe(1);
    expect(r.html).toContain("✎ edit");
    expect(r.html).toContain("📣 feedback");
  });
});
