import { describe, expect, it } from "bun:test";

import { parseReviewTag } from "./review-comment.js";
import { computeCoverage, ingestVerdicts, parseVerdictTag, reviewVerdictId } from "./review-verdict.js";

const comment = (id: number, body: string) => ({ id, body, user: "sme1", createdAt: "2026-09-23T12:00:00Z", url: `https://github.com/o/r/pull/7#issuecomment-${id}` });
const blocks = new Map([
  ["prose:dose", "h-dose-2"],
  ["prose:schedule", "h-sched-1"],
  ["prose:intro", "h-intro-1"],
]);

describe("the verdict tag", () => {
  it("reads one or several blocks, a verdict and a role", () => {
    expect(parseVerdictTag("block: prose:dose prose:schedule\nverdict: ok\nrole: clinical-sme")).toEqual({
      blocks: ["prose:dose", "prose:schedule"],
      pages: [],
      inputs: [],
      verdict: "ok",
      role: "clinical-sme",
    });
    expect(parseVerdictTag("block: prose:dose, prose:schedule\nverdict: Changes")).toMatchObject({ blocks: ["prose:dose", "prose:schedule"], verdict: "changes" });
  });

  it("a waiver carries its reason, and refuses to be empty", () => {
    expect(parseVerdictTag("block: prose:intro\nwaive: pure rename, no text changed")).toEqual({
      blocks: ["prose:intro"],
      pages: [],
      inputs: [],
      verdict: "waived",
      reason: "pure rename, no text changed",
      role: "reviewer",
    });
    expect(parseVerdictTag("block: prose:intro\nwaive:")).toHaveProperty("error");
  });

  it("a comment is a verdict OR a review comment: never counted as both", () => {
    const both = "block: prose:dose\nkind: defect\nverdict: changes\n\nThe dose is wrong.";
    expect(parseVerdictTag(both)).toHaveProperty("error");
    // ...and the comment parser passes every verdict tag over, so it is not a `question` either.
    expect(parseReviewTag(both)).toBeNull();
    expect(parseReviewTag("block: prose:dose\nverdict: ok")).toBeNull();
  });

  it("leaves ordinary conversation and review comments alone", () => {
    expect(parseVerdictTag("Looks good to me!")).toBeNull();
    expect(parseVerdictTag("block: prose:dose\nkind: question\n\nWhy?")).toBeNull();
  });

  it("refuses an unknown verdict, naming the way to waive", () => {
    expect(parseVerdictTag("block: prose:dose\nverdict: skip")).toEqual({ error: expect.stringContaining("waive:") });
  });
});

describe("verdicts on pages and inputs (bean bnjs)", () => {
  const pages = new Map([["doc/index.html", "pin-doc-1"]]);
  const inputs = new Map([["sushi-config.yaml", "pin-cfg-1"]]);
  const base = { repo: "o/r", pr: 7, commit: "abc", existing: [], blocks };

  it("reads `page:` and `input:` beside, or instead of, `block:`", () => {
    expect(parseVerdictTag("page: doc/index.html\nverdict: ok")).toMatchObject({ blocks: [], pages: ["doc/index.html"], verdict: "ok" });
    expect(parseVerdictTag("input: sushi-config.yaml\nwaive: version string only")).toMatchObject({ inputs: ["sushi-config.yaml"], verdict: "waived" });
    expect(parseVerdictTag("verdict: ok")).toEqual({ error: expect.stringContaining("page:") });
  });

  it("records a page or input verdict pinned to the build's pin, with its target", () => {
    const r = ingestVerdicts({ ...base, pages, inputs, comments: [comment(21, "page: doc/index.html\ninput: sushi-config.yaml\nverdict: ok")] });
    expect(r.created.map((v) => [v.target, v.targetLabel, v.blockHash])).toEqual([
      ["page", "doc/index.html", "pin-doc-1"],
      ["input", "sushi-config.yaml", "pin-cfg-1"],
    ]);
    expect(r.created[0]!.id).toBe(reviewVerdictId(7, 21, "page:doc/index.html"));
  });

  it("a page the build does not list, or a build with no rendered impact, is malformed and says which", () => {
    const r = ingestVerdicts({ ...base, pages, inputs, comments: [comment(22, "page: elsewhere.html\nverdict: ok")] });
    expect(r.malformed[0]!.error).toContain("no page `elsewhere.html`");
    const none = ingestVerdicts({ ...base, comments: [comment(23, "page: doc/index.html\nverdict: ok")] });
    expect(none.malformed[0]!.error).toContain("published no rendered impact");
  });
});

describe("ingesting verdicts", () => {
  it("records one verdict per label, pinned to the block's current hash, and is idempotent", () => {
    const input = { repo: "o/r", pr: 7, commit: "abc", comments: [comment(11, "block: prose:dose prose:schedule\nverdict: ok")], existing: [], blocks };
    const r = ingestVerdicts(input);
    expect(r.created.map((v) => [v.targetLabel, v.blockHash])).toEqual([
      ["prose:dose", "h-dose-2"],
      ["prose:schedule", "h-sched-1"],
    ]);
    expect(ingestVerdicts({ ...input, existing: r.created }).created).toEqual([]);
  });

  it("a label the head does not carry is said, not recorded", () => {
    const r = ingestVerdicts({ repo: "o/r", pr: 7, commit: "abc", comments: [comment(12, "block: prose:gone\nverdict: ok")], existing: [], blocks });
    expect(r.created).toEqual([]);
    expect(r.malformed[0]!.error).toContain("prose:gone");
  });
});

describe("coverage: the gate's two facts", () => {
  const changes = [
    { change: "changed", label: "prose:dose" },
    { change: "added", label: "prose:schedule" },
    { change: "removed", label: "prose:old" },
  ];
  const v = (label: string, hash: string) => ({ id: reviewVerdictId(7, 1, label), targetLabel: label, blockHash: hash });

  it("counts a changed block covered only by a verdict on its CURRENT hash", () => {
    const c = computeCoverage({ changes, blocks, verdicts: [v("prose:dose", "h-dose-1"), v("prose:schedule", "h-sched-1")], comments: [] });
    expect(c.changed).toEqual(["prose:dose", "prose:schedule"]);
    expect(c.uncovered).toEqual(["prose:dose"]);
    expect(c.uncoveredBlocks).toBe(1);
    expect(c.stale).toEqual([reviewVerdictId(7, 1, "prose:dose")]);
  });

  it("a removed block needs no verdict; unchanged blocks are not counted", () => {
    const c = computeCoverage({ changes, blocks, verdicts: [v("prose:dose", "h-dose-2"), v("prose:schedule", "h-sched-1")], comments: [] });
    expect(c.uncoveredBlocks).toBe(0);
  });

  it("counts open and addressed defects, and nothing else", () => {
    const comments = [
      { status: "open", review: { kind: "defect" } },
      { status: "addressed", review: { kind: "defect" } },
      { status: "resolved", review: { kind: "defect" } },
      { status: "open", review: { kind: "question" } },
    ];
    expect(computeCoverage({ changes, blocks, verdicts: [], comments }).openDefects).toBe(2);
  });
});

describe("coverage of rendered pages (bean bnjs)", () => {
  const changes = [{ change: "changed", label: "prose:dose" }];
  const v = (id: string, target: "block" | "page" | "input", targetLabel: string, blockHash: string) => ({ id, target, targetLabel, blockHash });
  const rendered = {
    files: [
      { path: "doc/index.html", role: "content", hash: "pin-doc", anchors: ["prose:dose"] },
      { path: "outline.json", role: "index", hash: "pin-o" },
      { path: "doc2/index.html", role: "content", hash: "pin-m" },
      { path: "doc2/media/fig.png", role: "data", hash: "pin-m" },
    ],
    undetermined: [{ input: "_config.yml", hash: "pin-cfg" }],
  };
  const base = { changes, blocks, comments: [] };

  it("without a rendered impact the page half is ABSENT, not zero, and page verdicts cannot count", () => {
    const c = computeCoverage({ ...base, verdicts: [v("p1", "page", "doc2/index.html", "pin-m")] });
    expect(c.rendered).toBe("absent");
    expect(c.measured).toBe("absent");
    expect(c.stale).toEqual(["p1"]);
  });

  it("index files are never owed; anchorless pages are owed until a page verdict; undetermined inputs until reviewed", () => {
    const c = computeCoverage({ ...base, verdicts: [], rendered });
    expect(c.rendered).toBe("known");
    expect(c.unreviewedPages).toEqual(["doc/index.html", "doc2/index.html", "doc2/media/fig.png"]);
    expect(c.undeterminedInputs).toEqual(["_config.yml"]);
  });

  it("a page is reviewed block by block, and its data file goes with a page that shares its pin", () => {
    const c = computeCoverage({
      ...base,
      verdicts: [v("b1", "block", "prose:dose", "h-dose-2"), v("p1", "page", "doc2/index.html", "pin-m"), v("i1", "input", "_config.yml", "pin-cfg")],
      rendered,
    });
    expect(c.unreviewedPages).toEqual([]);
    expect(c.undeterminedInputs).toEqual([]);
    expect(c.uncoveredBlocks).toBe(0);
  });

  it("a page verdict at an older pin is stale and does not count", () => {
    const c = computeCoverage({ ...base, verdicts: [v("p1", "page", "doc2/index.html", "pin-OLD")], rendered });
    expect(c.unreviewedPages).toContain("doc2/index.html");
    expect(c.stale).toEqual(["p1"]);
  });

  it("missed pages count only when the before side was the base, and a page verdict at the measured pin clears one", () => {
    const missed = [{ path: "x/index.html", role: "content", hash: "pin-x" }];
    const known = computeCoverage({ ...base, verdicts: [], rendered: { ...rendered, measured: { status: "known", missed } } });
    expect(known.measured).toBe("known");
    expect(known.missedPages).toEqual(["x/index.html"]);
    const notBase = computeCoverage({ ...base, verdicts: [], rendered: { ...rendered, measured: { status: "not-base", missed } } });
    expect(notBase.measured).toBe("not-base");
    expect(notBase.missedPages).toEqual([]);
    const reviewed = computeCoverage({ ...base, verdicts: [v("x1", "page", "x/index.html", "pin-x")], rendered: { ...rendered, measured: { status: "known", missed } } });
    expect(reviewed.missedPages).toEqual([]);
  });
});
