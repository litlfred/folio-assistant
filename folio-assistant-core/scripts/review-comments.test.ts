/**
 * The `folio-review-comments` Tool (bean 423d): the ingestion as a pure
 * function, then the command itself, offline, exactly as the workflow calls it.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { ReviewCommentsFileSchema, type PrComment } from "../schemas/review-comment";
import { buildReviewComments, type BlocksFile } from "./review-comments";

const pc = (id: number, body: string): PrComment => ({
  id,
  body,
  user: "sme1",
  createdAt: "2026-09-23T07:00:00Z",
  url: `https://github.com/o/r/pull/7#issuecomment-${id}`,
});
const blocks: BlocksFile = { "prose:overview": { hash: "h1", renamedFrom: [] } };
const base = { repo: "o/r", pr: 7, commit: "c1", blocks, now: "2026-09-23T08:00:00Z" };

describe("buildReviewComments", () => {
  it("writes the todo kind itself, with what was not ingested beside it", () => {
    const f = buildReviewComments({ ...base, comments: [pc(1, "block: prose:overview\nWhy?"), pc(2, "thanks"), pc(3, "block: x\nkind: rant")] });
    expect(f.comments.map((c) => c.$schema)).toEqual(["folio-review-comment/v1"]);
    expect(f.untagged).toBe(1);
    expect(f.malformed).toHaveLength(1);
  });

  it("ingests verdicts from the same comments, and does not count them as untagged (px0t)", () => {
    const f = buildReviewComments({ ...base, comments: [pc(1, "block: prose:overview\nverdict: ok"), pc(2, "thanks")] });
    expect(f.comments).toEqual([]);
    expect(f.verdicts.map((v) => [v.targetLabel, v.verdict, v.blockHash])).toEqual([["prose:overview", "ok", "h1"]]);
    expect(f.untagged).toBe(1);
    // ...and keeps them on the next build.
    expect(buildReviewComments({ ...base, comments: [], existing: f }).verdicts).toHaveLength(1);
  });

  it("is idempotent over its own output, and keeps a status the process set", () => {
    const first = buildReviewComments({ ...base, comments: [pc(1, "block: prose:overview\nWhy?")] });
    const moved = { ...first, comments: [{ ...first.comments[0]!, status: "addressed" as const }] };
    const again = buildReviewComments({ ...base, comments: [pc(1, "block: prose:overview\nWhy?")], existing: moved });
    expect(again.comments).toHaveLength(1);
    expect(again.comments[0]!.status).toBe("addressed");
  });

  it("follows a rename the next build makes, and orphans rather than drops", () => {
    const first = buildReviewComments({ ...base, comments: [pc(1, "block: prose:overview\nWhy?")] });
    const renamed = buildReviewComments({
      ...base,
      comments: [],
      existing: first,
      blocks: { "prose:summary": { hash: "h2", renamedFrom: ["prose:overview"] } },
    });
    expect(renamed.comments[0]!.targetLabel).toBe("prose:summary");
    const removed = buildReviewComments({ ...base, comments: [], existing: renamed, blocks: {} });
    expect(removed.comments).toHaveLength(1);
    expect(removed.comments[0]!.review.orphaned).toBe(true);
  });
});

describe("the command, offline, as the refresh job calls it", () => {
  let dir: string | undefined;
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  it("reads --blocks and --comments, writes a valid review-comments.json, and re-runs cleanly", () => {
    dir = mkdtempSync(join(tmpdir(), "review-comments-"));
    writeFileSync(join(dir, "blocks.json"), JSON.stringify(blocks));
    writeFileSync(join(dir, "comments.json"), JSON.stringify([pc(5, "block: prose:overview\nkind: defect\n\nWrong dose.")]));
    const out = join(dir, "review-comments.json");
    const run = () =>
      Bun.spawnSync(
        ["bun", "run", resolve(import.meta.dir, "review-comments.ts"),
          "--repo", "o/r", "--pr", "7", "--commit", "c1",
          "--blocks", join(dir!, "blocks.json"), "--comments", join(dir!, "comments.json"),
          "--existing", out, "--out", out],
        { stderr: "pipe" },
      );
    expect(run().exitCode).toBe(0);
    expect(run().exitCode).toBe(0);
    const f = ReviewCommentsFileSchema.parse(JSON.parse(readFileSync(out, "utf-8")));
    expect(f.comments.map((c) => [c.id, c.review.kind, c.priority])).toEqual([["review-pr7-c5", "defect", "high"]]);
  });

  it("refuses to run without a way to know the blocks", () => {
    const r = Bun.spawnSync(["bun", "run", resolve(import.meta.dir, "review-comments.ts"), "--repo", "o/r", "--pr", "7", "--out", "/dev/null"], { stderr: "pipe" });
    expect(r.exitCode).toBe(2);
  });
});
