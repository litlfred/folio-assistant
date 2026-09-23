/**
 * The review-comment todo kind (bean 423d): a todo with more structure, a
 * closed lifecycle only process tasks may move, idempotent ingestion from a
 * PR's tagged comments, and anchors that follow a rename and survive a removal.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { TodoNodeSchema } from "../../cat-harness/schemas/todo";
import {
  REVIEW_TRANSITIONS,
  ReviewCommentKind,
  ReviewCommentSchema,
  ingestPrComments,
  parseReviewTag,
  reanchor,
  reanchorToBlocks,
  transition,
  type PrComment,
} from "./review-comment";

const PROCESSES = resolve(import.meta.dir, "../../cat-harness/processes");
const EDITOR = { process: "Process_Review", task: "Task_EditorDecides" };
// `Process_CriterionAdjudication` since bean `bvuk` split the outcome half
// out of the shared judgement — A_RecordEntry went with the outcome.
const ADJUDICATOR = { process: "Process_CriterionAdjudication", task: "A_RecordEntry" };

const pc = (id: number, body: string): PrComment => ({
  id,
  body,
  user: "sme1",
  createdAt: "2026-09-23T07:00:00Z",
  url: `https://github.com/o/r/pull/7#issuecomment-${id}`,
});

const ingestOne = (body = "block: prose:overview\nkind: defect\nrole: clinical-sme\n\nDose contradicts table 3.") =>
  ingestPrComments({
    repo: "o/r",
    pr: 7,
    commit: "abc123",
    comments: [pc(101, body)],
    existing: [],
    blocks: new Map([["prose:overview", "h1"]]),
  }).created[0];

describe("the kind", () => {
  it("is a todo: its parent is the harness todo, and a todo reader accepts it", () => {
    expect(ReviewCommentKind.order).toEqual(["carried-note", "themed", "folio-todo/v1", "folio-review-comment/v1"]);
    const c = ingestOne();
    // A reader that knows only todos still parses it — bar the tag itself.
    expect(TodoNodeSchema.safeParse({ ...c, $schema: "folio-todo/v1" }).success).toBe(true);
  });

  it("is more structured: targetLabel is required, status is closed", () => {
    const c = ingestOne();
    const { targetLabel: _drop, ...noLabel } = c;
    expect(ReviewCommentSchema.safeParse(noLabel).success).toBe(false);
    expect(ReviewCommentSchema.safeParse({ ...c, status: "in_progress" }).success).toBe(false);
  });
});

describe("the lifecycle is closed, and only process tasks move it", () => {
  it("the editor addresses, then resolves with a Decision", () => {
    const c = transition(ingestOne(), "addressed", EDITOR);
    expect(c.status).toBe("addressed");
    const done = transition(c, "resolved", EDITOR, { decision: "decision:7" });
    expect(done.review.decision).toBe("decision:7");
  });

  it("refuses a move no task may make, a task not in the table, and a closed comment", () => {
    const c = ingestOne();
    expect(() => transition(c, "resolved", EDITOR, { decision: "d" })).toThrow(/open → resolved is not a move/);
    expect(() => transition(c, "addressed", { process: "Process_Review", task: "Task_Consolidate" })).toThrow(/not a move/);
    expect(() => transition(c, "addressed", { process: "by-hand", task: "edit-the-file" })).toThrow(/not a move/);
    const closed = transition(c, "adjudicated", ADJUDICATOR, { decision: "d" });
    expect(() => transition(closed, "open", EDITOR)).toThrow(/nothing — it is closed/);
  });

  it("refuses to close without the Decision, in the transition and in the schema", () => {
    const c = transition(ingestOne(), "addressed", EDITOR);
    expect(() => transition(c, "resolved", EDITOR)).toThrow(/names the Decision/);
    expect(ReviewCommentSchema.safeParse({ ...c, status: "resolved" }).success).toBe(false);
  });

  it("every transition names a BPMN task that exists — or the bean that will author it", () => {
    for (const t of REVIEW_TRANSITIONS) {
      if (t.by.awaits) {
        expect(t.by.awaits).toBe("en2d");
        continue;
      }
      const xml = readFileSync(join(PROCESSES, t.by.file), "utf-8");
      expect(xml).toContain(`<bpmn:process id="${t.by.process}"`);
      expect(xml).toMatch(new RegExp(`<bpmn:\\w+ id="${t.by.task}"`));
    }
  });
});

describe("the tag", () => {
  it("reads block, kind and role; a label may contain colons", () => {
    expect(parseReviewTag("block: prose:overview\nkind: defect\nrole: clinical-sme\n\nText.")).toEqual({
      block: "prose:overview",
      kind: "defect",
      role: "clinical-sme",
      text: "Text.",
    });
  });

  it("defaults kind to question and role to reviewer", () => {
    expect(parseReviewTag("block: tbl:doses\nWhy 5 mg?")).toMatchObject({ kind: "question", role: "reviewer", text: "Why 5 mg?" });
  });

  it("an untagged comment is conversation, not a review comment; a bad tag is an error", () => {
    expect(parseReviewTag("LGTM, thanks!")).toBeNull();
    expect(parseReviewTag("See below.\nblock: prose:x")).toBeNull();
    expect(parseReviewTag("block: two labels")).toEqual({ error: expect.stringContaining("one label") });
    expect(parseReviewTag("block: a\nkind: rant")).toEqual({ error: expect.stringContaining("not one of") });
  });
});

describe("ingestion", () => {
  const comments = [pc(1, "block: prose:overview\nFirst."), pc(2, "Thanks all"), pc(3, "block: a\nkind: rant\nx"), pc(4, "block: gone:block\nOn a block not in the head.")];
  const run = (existing: { id: string }[] = []) =>
    ingestPrComments({ repo: "o/r", pr: 7, commit: "abc", comments, existing, blocks: new Map([["prose:overview", "h1"]]) });

  it("creates one todo per tagged comment, counts the rest, and says what was malformed", () => {
    const r = run();
    expect(r.created.map((c) => c.id)).toEqual(["review-pr7-c1", "review-pr7-c4"]);
    expect(r.untagged).toBe(1);
    expect(r.malformed).toEqual([{ commentId: 3, url: comments[2].url, error: expect.stringContaining("rant") }]);
    expect(r.created[0]).toMatchObject({ status: "open", origin: "human", review: { blockHash: "h1", orphaned: false } });
  });

  it("a comment on a block that is not in the head is kept, orphaned from the start", () => {
    expect(run().created[1].review).toMatchObject({ blockHash: null, orphaned: true });
  });

  it("is idempotent: a re-run creates nothing", () => {
    const first = run();
    const again = run(first.created);
    expect(again.created).toEqual([]);
    expect(again.unchanged).toEqual(["review-pr7-c1", "review-pr7-c4"]);
  });
});

describe("re-anchoring across a ChangeSet", () => {
  it("follows a rename, keeps the old label, and never touches status", () => {
    const c = transition(ingestOne(), "addressed", EDITOR);
    const [moved] = reanchor([c], [{ change: "changed", label: "prose:summary", from: "prose:overview", aspects: ["renamed"] }]);
    expect(moved.targetLabel).toBe("prose:summary");
    expect(moved.review.anchoredFrom).toEqual(["prose:overview"]);
    expect(moved.status).toBe("addressed");
  });

  it("a removed block orphans the comment — kept, never dropped", () => {
    const c = ingestOne();
    const [orphan] = reanchor([c], [{ change: "removed", label: "prose:overview" }]);
    expect(orphan).toMatchObject({ id: c.id, targetLabel: "prose:overview", status: "open", review: { orphaned: true } });
  });

  it("an unrelated change leaves the comment alone", () => {
    expect(reanchor([ingestOne()], [{ change: "added", label: "prose:new" }])).toEqual([]);
  });
});

describe("re-anchoring against the head's blocks (renamedFrom)", () => {
  const blocks = (entries: [string, string[]][]) =>
    new Map(entries.map(([label, renamedFrom]) => [label, { hash: `h-${label}`, renamedFrom }]));

  it("follows a block's renamedFrom — even for a block the PR itself added", () => {
    const [c] = reanchorToBlocks([ingestOne()], blocks([["prose:summary", ["prose:overview"]]]));
    expect(c.targetLabel).toBe("prose:summary");
    expect(c.review.anchoredFrom).toEqual(["prose:overview"]);
  });

  it("orphans a comment whose block is gone, and un-orphans it if the block returns", () => {
    const [gone] = reanchorToBlocks([ingestOne()], blocks([["prose:other", []]]));
    expect(gone.review.orphaned).toBe(true);
    const [back] = reanchorToBlocks([gone], blocks([["prose:overview", []]]));
    expect(back.review.orphaned).toBe(false);
  });

  it("returns every comment, and an anchored one unchanged", () => {
    const c = ingestOne();
    expect(reanchorToBlocks([c], blocks([["prose:overview", []]]))).toEqual([c]);
  });
});
