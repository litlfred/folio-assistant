/**
 * A reviewer's VERDICT on one version of one block: "I read this, and here is
 * my judgement". Bean `px0t`, epic `q4jm`.
 *
 * @module folio-assistant-core/schemas/review-verdict
 * @graphNode schema
 *
 * ## Why this exists
 *
 * `content-change-review.bpmn`'s coverage gate (`GW_Covered`) asks whether
 * every changed block has been reviewed. Review COMMENTS cannot answer that:
 * a block with no comments may be unread or may be fine, and a block whose
 * comments are all resolved has had its questions answered, not its content
 * judged. Only a record of the judgement answers it.
 *
 * ## The write channel: a tagged PR comment (owner, 2026-09-23)
 *
 * Asked how a reviewer records one, the owner chose option 1: the same
 * channel as a review comment, so nothing new has to be learned or installed.
 *
 * ```
 * block: prose:dose prose:schedule
 * verdict: ok
 * role: clinical-sme
 * ```
 *
 * - `verdict: ok`: read, no objection.
 * - `verdict: changes`: read, and it needs changing. The reasons are review
 *   COMMENTS (kind `defect` or `suggestion`); the verdict only says the block
 *   was read.
 * - `waive: <reason>`: the block needs no review, for example a pure rename.
 *   The reason is required, and is kept.
 *
 * `block:` may name several labels, so a reviewer finishing a slice can say
 * so in one comment. One verdict is recorded per label.
 *
 * **A comment is either a verdict or a review comment, never both.** A tag
 * carrying `kind:` as well as `verdict:` or `waive:` is refused, so one
 * comment cannot be counted twice under two meanings.
 *
 * ## A verdict is pinned to the block's HASH
 *
 * A verdict on the version a reviewer read says nothing about the version
 * that replaced it. {@link computeCoverage} counts a verdict only when its
 * `blockHash` equals the block's current hash. So an edit after review
 * reopens exactly the blocks it touched, and no others.
 *
 * ## Not a todo
 *
 * A review comment is a todo (it asks for something). A verdict asks for
 * nothing; it records that something happened. So it is a plain node in
 * its own declared directory, of graph kind `review-verdicts`, and not a
 * kind whose parent is the todo.
 */
import { z } from "zod";

export const REVIEW_VERDICT_SCHEMA = "folio-review-verdict/v1" as const;

/** `waived` is written `waive: <reason>` in the tag; the other two are written `verdict: <value>`. */
export const REVIEW_VERDICTS = ["ok", "changes", "waived"] as const;
export type ReviewVerdictValue = (typeof REVIEW_VERDICTS)[number];

export const ReviewVerdictSchema = z
  .object({
    $schema: z.literal(REVIEW_VERDICT_SCHEMA),
    /** `verdict-pr<n>-c<comment id>-<label>`: derived, so a re-run finds it rather than adding one. */
    id: z.string().min(1),
    targetLabel: z.string().min(1),
    verdict: z.enum(REVIEW_VERDICTS),
    /** Required for `waived`: why this block needs no review. */
    reason: z.string().min(1).optional(),
    /** The block's content hash when the verdict was given. The verdict counts only while it is current. */
    blockHash: z.string().min(1),
    /** GitHub login. */
    reviewer: z.string().min(1),
    /** The lane they reviewed in: a role id from `roles.json`. */
    role: z.string().min(1),
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    pr: z.number().int().positive(),
    commentId: z.number().int().positive(),
    commentUrl: z.string().url(),
    /** The head commit the verdict was ingested against. */
    commit: z.string().min(1),
    at: z.string().min(1),
  })
  .superRefine((v, ctx) => {
    if (v.verdict === "waived" && !v.reason) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "a waived block says why it needs no review" });
    }
  });
export type ReviewVerdict = z.infer<typeof ReviewVerdictSchema>;

export const reviewVerdictId = (pr: number, commentId: number, label: string) => `verdict-pr${pr}-c${commentId}-${label}`;

// ── The tag ──────────────────────────────────────────────────────

export interface VerdictTag {
  blocks: string[];
  verdict: ReviewVerdictValue;
  reason?: string;
  role: string;
}

/**
 * Read a verdict tag. `null` when the comment is not a verdict (no `verdict:`
 * and no `waive:` line), so ordinary conversation and review comments pass
 * through untouched. The header is the leading `key: value` lines, as for a
 * review comment.
 */
export function parseVerdictTag(body: string): VerdictTag | { error: string } | null {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const header: Record<string, string> = {};
  let i = 0;
  while (i < lines.length && lines[i]!.trim() === "") i++;
  for (; i < lines.length; i++) {
    const m = /^\s*(block|kind|role|verdict|waive):\s*(.*?)\s*$/i.exec(lines[i]!);
    if (!m) break;
    header[m[1]!.toLowerCase()] = m[2]!;
  }
  if (!("verdict" in header) && !("waive" in header)) return null;
  if ("kind" in header) {
    return { error: "a comment is a verdict or a review comment, not both: drop `kind:`, or drop `verdict:`/`waive:`" };
  }
  if ("verdict" in header && "waive" in header) return { error: "give `verdict:` or `waive:`, not both" };
  if (!("block" in header) || !header.block) return { error: "a verdict names the block(s) it is on, with `block:`" };
  const blocks = header.block.split(/[\s,]+/).filter(Boolean);
  const role = header.role ?? "reviewer";
  if (!/^[a-z][a-z0-9-]*$/.test(role)) return { error: `\`role: ${role}\` is not a role id` };
  if ("waive" in header) {
    if (!header.waive) return { error: "`waive:` needs the reason the block needs no review" };
    return { blocks, verdict: "waived", reason: header.waive, role };
  }
  const v = header.verdict!.toLowerCase();
  if (v !== "ok" && v !== "changes") return { error: `\`verdict: ${header.verdict}\` is not one of ok, changes (to waive, write \`waive: <reason>\`)` };
  return { blocks, verdict: v, role };
}

// ── Ingestion ────────────────────────────────────────────────────

export interface VerdictIngestResult {
  created: ReviewVerdict[];
  unchanged: string[];
  /** Said, not dropped, so the reviewer can fix it. */
  malformed: Array<{ commentId: number; url: string; error: string }>;
}

/**
 * Ingest a PR's verdict comments. A label the head does not carry is
 * malformed rather than recorded: unlike a comment, a verdict on a block that
 * is not there has nothing to be about. Idempotent on the derived id.
 */
export function ingestVerdicts(input: {
  repo: string;
  pr: number;
  commit: string;
  comments: ReadonlyArray<{ id: number; body: string; user: string; createdAt: string; url: string }>;
  existing: readonly Pick<ReviewVerdict, "id">[];
  blocks: ReadonlyMap<string, string>;
}): VerdictIngestResult {
  const have = new Set(input.existing.map((v) => v.id));
  const out: VerdictIngestResult = { created: [], unchanged: [], malformed: [] };
  for (const c of input.comments) {
    const tag = parseVerdictTag(c.body);
    if (tag === null) continue;
    if ("error" in tag) {
      out.malformed.push({ commentId: c.id, url: c.url, error: tag.error });
      continue;
    }
    for (const label of tag.blocks) {
      const hash = input.blocks.get(label);
      if (!hash) {
        out.malformed.push({ commentId: c.id, url: c.url, error: `no block \`${label}\` in the head, so there is nothing for a verdict to be on` });
        continue;
      }
      const id = reviewVerdictId(input.pr, c.id, label);
      if (have.has(id)) {
        out.unchanged.push(id);
        continue;
      }
      have.add(id);
      out.created.push(
        ReviewVerdictSchema.parse({
          $schema: REVIEW_VERDICT_SCHEMA,
          id,
          targetLabel: label,
          verdict: tag.verdict,
          ...(tag.reason ? { reason: tag.reason } : {}),
          blockHash: hash,
          reviewer: c.user,
          role: tag.role,
          repo: input.repo,
          pr: input.pr,
          commentId: c.id,
          commentUrl: c.url,
          commit: input.commit,
          at: c.createdAt,
        }),
      );
    }
  }
  return out;
}

// ── Coverage: the gate's two facts ───────────────────────────────

export interface Coverage {
  /** `GW_Covered`'s fact: changed blocks with no CURRENT verdict. */
  uncoveredBlocks: number;
  /** `GW_Covered`'s fact: review comments of kind `defect` still open or addressed. */
  openDefects: number;
  /** The changed blocks that need review, in ChangeSet order. */
  changed: string[];
  /** Of those, the ones with no current verdict. */
  uncovered: string[];
  /** Verdicts on an OLDER version of a block, which therefore do not count. */
  stale: string[];
}

/**
 * Count what the gate reads. A changed block (`added` or `changed` in the
 * ChangeSet) is covered when at least one verdict on it carries the block's
 * CURRENT hash. Removed blocks need no verdict: there is nothing left to read,
 * and the removal is judged where the section around it is.
 */
export function computeCoverage(input: {
  changes: ReadonlyArray<{ change: string; label: string }>;
  blocks: ReadonlyMap<string, string>;
  verdicts: readonly Pick<ReviewVerdict, "id" | "targetLabel" | "blockHash">[];
  comments: ReadonlyArray<{ status: string; review: { kind: string } }>;
}): Coverage {
  const changed = input.changes.filter((c) => c.change === "added" || c.change === "changed").map((c) => c.label);
  const current = new Set<string>();
  const stale: string[] = [];
  for (const v of input.verdicts) {
    if (input.blocks.get(v.targetLabel) === v.blockHash) current.add(v.targetLabel);
    else stale.push(v.id);
  }
  const uncovered = changed.filter((l) => !current.has(l));
  const openDefects = input.comments.filter((c) => c.review.kind === "defect" && (c.status === "open" || c.status === "addressed")).length;
  return { uncoveredBlocks: uncovered.length, openDefects, changed, uncovered, stale };
}
