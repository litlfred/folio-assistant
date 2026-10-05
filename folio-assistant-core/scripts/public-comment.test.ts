import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  parseCaptionRef,
  parseLines,
  parseSection,
  PUBLIC_COMMENT_TRANSITIONS,
  type PublicComment,
  transition,
} from "../schemas/public-comment.js";
import type { ReviewAnchors } from "./docx-to-folio.js";
import {
  applyGithubComment,
  filterComments,
  importRows,
  isCommittee,
  narrativeRows,
  parseGithubTag,
  resolveAnchor,
  Store,
  summary,
  tableRows,
} from "./public-comment.js";

const anchors: ReviewAnchors = {
  $schema: "folio-review-anchors/v1",
  document: "doc",
  library: "lib",
  source: { docx: { file: "d.docx", sha256: "a" }, pdf: { file: "d.pdf", sha256: "b", pages: 30 } },
  chapters: [{ dir: "ch1-intro", title: "Introduction", number: 1, label: "chap:ch1-intro" }],
  sections: [
    { label: "sec:1-1", number: "1.1", title: "About", chapter: "ch1-intro" },
    { label: "sec:1-1-2", number: "1.1.2", title: "DPI", chapter: "ch1-intro", parent: "sec:1-1" },
    { label: "sec:3-4", number: "3.4", title: "Governance", chapter: "ch1-intro" },
  ],
  blocks: [
    // Printed page 9 is PDF page 20.
    { label: "prose:1-1-2-aaa", kind: "prose", chapter: "ch1-intro", root: "p-1-1-2-aaa", sections: ["sec:1-1", "sec:1-1-2"], hash: "h1", excerpt: "In 2020, WHO and ITU", page: 20, printedPage: "9", lineStart: 20, lineEnd: 41, method: "numbered" },
    { label: "prose:1-1-2-bbb", kind: "prose", chapter: "ch1-intro", root: "p-1-1-2-bbb", sections: ["sec:1-1", "sec:1-1-2"], hash: "h2", excerpt: "Building on this understanding, the G20", page: 20, printedPage: "9", lineStart: 42, lineEnd: 55, method: "numbered" },
    { label: "prose:1-1-2-ccc", kind: "prose", chapter: "ch1-intro", root: "p-1-1-2-ccc", sections: ["sec:1-1", "sec:1-1-2"], hash: "h3", excerpt: "Spans a page", page: 20, pageEnd: 21, printedPage: "9", lineStart: 56, lineEnd: 70, method: "numbered" },
    { label: "tbl:2-2", kind: "table", chapter: "ch1-intro", root: "t-2-2", sections: ["sec:1-1"], caption: "Table 2.2", hash: "h4", excerpt: "Foundational capability", page: 22, method: "inherited-page" },
  ],
};

describe("citation parsing", () => {
  test("line ranges, in every way a reviewer writes them", () => {
    expect(parseLines("618–624")).toEqual([[618, 624]]);
    expect(parseLines("618-24")).toEqual([[618, 624]]);
    expect(parseLines("l. 618")).toEqual([[618, 618]]);
    expect(parseLines("618, 620–622")).toEqual([[618, 618], [620, 622]]);
    expect(parseLines(undefined)).toEqual([]);
  });
  test("table and figure references", () => {
    expect(parseCaptionRef("Table 3.1")).toBe("Table 3.1");
    expect(parseCaptionRef("see fig. 2.2 above")).toBe("Figure 2.2");
    expect(parseCaptionRef("lines 4-5")).toBeUndefined();
  });
  test("section numbers", () => {
    expect(parseSection("§3.4.5")).toBe("3.4.5");
    expect(parseSection("Section 2.1.")).toBe("2.1");
    expect(parseSection("Appendix C")).toBe("C");
  });
});

describe("resolveAnchor", () => {
  test("printed page and lines land on the paragraph, and the section agrees", () => {
    const a = resolveAnchor({ section: "1.1.2", page: "9", lines: "42-46" }, "", anchors);
    expect(a).toMatchObject({ targetLabel: "prose:1-1-2-bbb", method: "page-line", confidence: "high" });
  });
  test("a line on the second page of a block that crosses a page", () => {
    expect(resolveAnchor({ page: "21", lines: "3" }, "", anchors).targetLabel).toBe("prose:1-1-2-ccc");
  });
  test("a cited table is the table, whatever the line column says", () => {
    expect(resolveAnchor({ lines: "Table 2.2" }, "", anchors)).toMatchObject({ targetLabel: "tbl:2-2", method: "caption" });
  });
  test("a section alone anchors to the section", () => {
    expect(resolveAnchor({ section: "3.4" }, "", anchors)).toMatchObject({ targetLabel: "sec:3-4", method: "section" });
  });
  test("a quotation is found in the text", () => {
    const a = resolveAnchor({}, "The phrase “Building on this understanding, the G20” is vague.", anchors, (b) => b.excerpt);
    expect(a).toMatchObject({ targetLabel: "prose:1-1-2-bbb", method: "quote" });
  });
  test("nothing resolvable is unplaced, not guessed", () => {
    expect(resolveAnchor({}, "Overall useful.", anchors)).toMatchObject({ targetLabel: null, method: "unplaced" });
  });
  test("a section that disagrees with the page is reported, not trusted", () => {
    const a = resolveAnchor({ section: "3.4", page: "9", lines: "42" }, "", anchors);
    expect(a.confidence).toBe("low");
    expect(a.note).toContain("does NOT agree");
  });
});

describe("intake", () => {
  test("the WHO comment matrix: reviewer block above, example row skipped", () => {
    const rows = [
      ["Comment matrix", null, null, null, null, null, null],
      ["Reviewer name", null, "Ada Example", null, null, null, null],
      ["Organisation / affiliation", null, "Health Agency", null, null, null, null],
      ["Country / region", null, "Kenya", null, null, null, null],
      ["Email (optional)", null, "ada@example.org", null, null, null, null],
      ["Acknowledgement — may we recognise you? (Yes / No)", null, "Yes", null, null, null, null],
      ["No.", "Section no.", "Page", "Line no(s), Table or Figure", "Comment type", "Comment / issue", "Suggested revision"],
      ["e.g.", "3.4.5", "22", "618–624", "Technical", "Example text", "Example fix"],
      [1, "1.1.2", "9", "42-46", "Technical", "Split the definition.", "Two sentences."],
      [2, null, null, null, null, null, null],
    ];
    const t = tableRows(rows);
    expect(t.rows).toHaveLength(1);
    expect(t.skipped).toEqual([{ row: 8, why: "the template's example row" }]);
    expect(t.rows[0]).toMatchObject({
      row: 9,
      reviewer: { name: "Ada Example", organisation: "Health Agency", country: "Kenya", email: "ada@example.org", acknowledge: true },
      citation: { section: "1.1.2", page: "9", lines: "42-46" },
      type: "Technical",
      text: "Split the definition.",
      suggestedRevision: "Two sentences.",
    });
  });
  test("a form export: reviewer columns on every row", () => {
    const t = tableRows([
      ["Name", "Email", "Organisation", "Section", "Page", "Comment"],
      ["B. Example", "b@x.org", "Org", "3.4", "", "Needs governance detail"],
    ]);
    expect(t.rows[0].reviewer).toMatchObject({ name: "B. Example", organisation: "Org" });
    expect(t.rows[0].citation.section).toBe("3.4");
  });
  test("a narrative is split only where it cites something", () => {
    const r = narrativeRows(
      "Thank you for the draft.\n\nIn section 3.4 governance is thin.\n\nOn page 9, lines 42-46, the definition is long.\n\nWe look forward to the final.",
      { name: "C" },
    );
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({ type: "general", citation: { raw: "(no citation)" } });
    expect(r[0].text).toContain("Thank you");
    expect(r[0].text).toContain("look forward");
    expect(r[1].citation.section).toBe("3.4");
    expect(r[2].citation).toMatchObject({ page: "9", lines: "42-46" });
  });
});

function tempStore(): Store {
  const repo = mkdtempSync(join(tmpdir(), "pc-"));
  mkdirSync(join(repo, "folio", "doc"), { recursive: true });
  writeFileSync(join(repo, "folio", "doc", "review-anchors.json"), JSON.stringify(anchors));
  mkdirSync(join(repo, "review", "public-comment"), { recursive: true });
  writeFileSync(join(repo, "review", "public-comment", "config.json"), JSON.stringify({ document: "doc", editors: ["ed"], committee: ["cm"] }));
  return Store.open(repo);
}

describe("the store and the lifecycle", () => {
  const at = "2026-10-04T00:00:00Z";
  const rows = [
    { row: 9, reviewer: { name: "Ada", email: "ada@x.org", acknowledge: false }, citation: { section: "1.1.2", page: "9", lines: "42" }, type: "Technical", text: "One." },
    { row: 10, reviewer: { name: "Ada", email: "ada@x.org", acknowledge: false }, citation: {}, text: "Two." },
  ];

  test("import numbers comments, keeps the unplaced, and never writes an email", () => {
    const s = tempStore();
    const r = importRows(s, rows, { channel: "comment-matrix", batch: "m1", sha256: "x" }, at);
    expect(r.created).toEqual(["PC-0001", "PC-0002"]);
    expect(r.unplaced).toEqual(["PC-0002"]);
    const raw = readFileSync(join(s.dir, "comments", "PC-0001.json"), "utf-8");
    expect(raw).not.toContain("ada@x.org");
    // Acknowledgement "No": no name either; same pseudonym for both rows.
    expect(raw).not.toContain("Ada");
    const [a, b] = s.all();
    expect(a.public.reviewer.id).toBe(b.public.reviewer.id);
    expect(importRows(s, rows, { channel: "comment-matrix", batch: "m1-again", sha256: "x" }, at).alreadyImported).toBe(true);
  });

  test("every move is a task in public-comment.bpmn", () => {
    const bpmn = readFileSync(join(import.meta.dir, "..", "processes", "content", "public-comment.bpmn"), "utf-8");
    for (const t of PUBLIC_COMMENT_TRANSITIONS) {
      expect(bpmn).toContain(`id="${t.by.task}"`);
      expect(bpmn).toContain(`id="${t.by.process}"`);
    }
  });

  test("triage → assign → recommend → decide → edit (author) → incorporate", () => {
    const s = tempStore();
    importRows(s, rows, { channel: "comment-matrix", batch: "m1", sha256: "y" }, at);
    let c: PublicComment = s.get("PC-0001");
    c = transition(c, "triage", { by: "co", at, type: "editorial" });
    c = transition(c, "assign", { by: "co", at, assignees: ["cm"] });
    c = transition(c, "recommend", { by: "cm", at, recommendation: { by: "cm", code: "accepted-modified", rationale: "yes, shorter" } });
    expect(() => transition(c, "decide", { by: "ed", at, decision: { code: "not-accepted" } })).toThrow(/needs a reason/);
    c = transition(c, "decide", { by: "ed", at, decision: { code: "accepted" } });
    expect(() => transition(c, "edit", { by: "author-agent", at })).toThrow(/names the feature branch/);
    c = transition(c, "edit", { by: "author-agent", at, changeSet: { branch: "pc/definitions" }, assignees: ["author-agent"] });
    expect(c).toMatchObject({ status: "editing", public: { assignees: ["author-agent"], decision: { changeSet: { branch: "pc/definitions" } } } });
    c = transition(c, "incorporate", { by: "ci", at, changeSet: { branch: "pc/definitions", pr: 12 } });
    expect(c.status).toBe("incorporated");
    expect(c.public.decision?.changeSet).toMatchObject({ branch: "pc/definitions", pr: 12 });
    expect(c.public.history.map((h) => h.transition)).toEqual(["ingest", "triage", "assign", "recommend", "decide", "edit", "incorporate"]);
    expect(() => transition(c, "withdraw", { by: "x", at })).toThrow(/cannot withdraw from incorporated/);
  });

  test("only an accepted decision is incorporated", () => {
    const s = tempStore();
    importRows(s, rows, { channel: "comment-matrix", batch: "m1", sha256: "z" }, at);
    const c = transition(s.get("PC-0001"), "decide", { by: "ed", at, decision: { code: "noted", reason: "already covered in 2.1" } });
    expect(() => transition(c, "edit", { by: "au", at, changeSet: { branch: "b" } })).toThrow(/only an accepted comment/);
    expect(() => transition(c, "incorporate", { by: "ci", at, changeSet: { branch: "b" } })).toThrow(/only an accepted comment/);
  });

  test("reassign moves the anchor and keeps the status", () => {
    const s = tempStore();
    importRows(s, rows, { channel: "comment-matrix", batch: "m1", sha256: "w" }, at);
    const c = transition(s.get("PC-0002"), "reassign", { by: "co", at, anchor: { targetLabel: "sec:3-4", method: "section", confidence: "high", candidates: [] } });
    expect(c).toMatchObject({ status: "received", targetLabel: "sec:3-4" });
    expect(c.public.anchor.method).toBe("manual");
  });

  test("list by page and line, by section, and the unplaced", () => {
    const s = tempStore();
    importRows(s, rows, { channel: "comment-matrix", batch: "m1", sha256: "v" }, at);
    const all = s.all();
    expect(filterComments(all, anchors, { page: 20, line: 42 }).map((c) => c.public.ref)).toEqual(["PC-0001"]);
    expect(filterComments(all, anchors, { section: "1.1" }).map((c) => c.public.ref)).toEqual(["PC-0001"]);
    expect(filterComments(all, anchors, { unplaced: true }).map((c) => c.public.ref)).toEqual(["PC-0002"]);
    expect(summary(all)).toMatchObject({ total: 2, open: 2, unplaced: 1 });
  });
});

describe("GitHub tags", () => {
  test("parse", () => {
    expect(parseGithubTag("pc: PC-0042, PC-43\nrecommend: accepted modified\n\nShorter is better.")).toEqual({
      refs: ["PC-0042", "PC-0043"],
      verb: "recommend",
      code: "accepted-modified",
      text: "Shorter is better.",
    });
    expect(parseGithubTag("Just talking.")).toBeNull();
    expect(parseGithubTag("pc: PC-1\nrecommend: maybe")).toMatchObject({ error: expect.stringContaining("is not one of") });
  });

  test("by default the committee is the repository's collaborators", () => {
    const s = tempStore();
    writeFileSync(join(s.dir, "config.json"), JSON.stringify({ document: "doc", editors: ["ed"] }));
    importRows(s, [{ row: 1, reviewer: {}, citation: { section: "3.4" }, text: "One." }], { channel: "comment-matrix", batch: "m", sha256: "c" }, "t0");
    const ev = (login: string, association: string) => ({ login, association, body: "pc: PC-0001\nrecommend: noted\n\nCovered.", url: "https://github.com/o/r/pull/1#issuecomment-1", at: "t1" });
    expect(applyGithubComment(s, ev("outsider", "CONTRIBUTOR")).refused[0]).toContain("not a collaborator on this repository");
    expect(applyGithubComment(s, ev("member", "COLLABORATOR")).applied).toEqual(["PC-0001"]);
    // A collaborator still cannot decide: deciding is the editors' alone.
    expect(applyGithubComment(s, { ...ev("member", "OWNER"), body: "pc: PC-0001\ndecide: noted\n\nx" }).refused[0]).toContain("an editor");
    expect(isCommittee({}, "x", "member")).toBe(true);
    expect(isCommittee({ committee: ["cm"] }, "x", "OWNER")).toBe(false);
  });

  test("a committee member recommends; only an editor decides; strangers are refused", () => {
    const s = tempStore();
    importRows(s, [{ row: 1, reviewer: {}, citation: { section: "3.4" }, text: "One." }], { channel: "comment-matrix", batch: "m", sha256: "q" }, "t0");
    const ev = (login: string, body: string) => ({ login, body, url: "https://github.com/o/r/issues/1#issuecomment-1", at: "t1" });
    expect(applyGithubComment(s, ev("cm", "pc: PC-0001\nrecommend: noted\n\nCovered.")).applied).toEqual(["PC-0001"]);
    expect(s.get("PC-0001").status).toBe("recommended");
    expect(applyGithubComment(s, ev("cm", "pc: PC-0001\ndecide: noted\n\nCovered.")).refused[0]).toContain("is not an editor in config.json");
    expect(applyGithubComment(s, ev("someone", "pc: PC-0001\nrecommend: accepted")).refused[0]).toContain("not on the committee list");
    expect(applyGithubComment(s, ev("ed", "pc: PC-0001\ndecide: noted\n\nAlready in 2.1.")).applied).toEqual(["PC-0001"]);
    expect(s.get("PC-0001").public.decision).toMatchObject({ code: "noted", by: "ed", reason: "Already in 2.1." });
  });
});
