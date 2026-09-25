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
      verdict: "ok",
      role: "clinical-sme",
    });
    expect(parseVerdictTag("block: prose:dose, prose:schedule\nverdict: Changes")).toMatchObject({ blocks: ["prose:dose", "prose:schedule"], verdict: "changes" });
  });

  it("a waiver carries its reason, and refuses to be empty", () => {
    expect(parseVerdictTag("block: prose:intro\nwaive: pure rename, no text changed")).toEqual({
      blocks: ["prose:intro"],
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
