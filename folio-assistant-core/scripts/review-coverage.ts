#!/usr/bin/env bun
/**
 * review-coverage — the two facts `content-change-review.bpmn`'s coverage
 * gate reads, computed rather than supplied. Bean `px0t`, epic `q4jm`.
 *
 * `GW_Covered` is backed by `decisions/review-coverage-gate.dmn`, which
 * reads `uncoveredBlocks` and `openDefects`. The workflow engine reads a fact
 * by name and does no arithmetic. So the numbers come from here, and the
 * review coordinator passes this command's `facts` to `workflow_complete`.
 *
 * ## Inputs are the preview's published files
 *
 * - `changeset.json`: which blocks changed;
 * - `blocks.json`: each head block's current hash;
 * - `review-comments.json`: open defects, and the ingested verdicts.
 *
 * With `--todos`, verdicts committed under the todos graph's declared
 * `review-verdicts` directory are read too. They win over the published copy,
 * as committed comment statuses do.
 *
 * ## `--commit`: the owner's "commit to feature branch" ruling, for verdicts
 *
 * Writes every current published verdict into the declared directory, one
 * `verdictFileName(id)` per verdict, and commits them to the current FEATURE branch.
 * It refuses the base branch and a detached HEAD, exactly as
 * `review-comment-move` does, because a verdict committed straight to `main`
 * would record a review nobody's merge accepted. So the review record lands
 * on `main` with the edit it is about, and only then.
 *
 * ## Why a verdict on an older hash is reported, not dropped
 *
 * It is evidence the block WAS read, at a version that no longer exists. It
 * does not count toward coverage, and it is listed as `stale` so a
 * coordinator can ask the same reviewer to look again rather than starting
 * over with somebody new.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { TODO_GRAPH_FILE, nodeOfKind, parseTodoGraph } from "../../cat-harness/schemas/todo-graph.js";
import { ReviewCommentsFileSchema } from "../schemas/review-comment.js";
import { REVIEW_VERDICT_SCHEMA, ReviewVerdictSchema, computeCoverage, type Coverage, type ReviewVerdict } from "../schemas/review-verdict.js";
import { featureBranch } from "./review-comment-move.js";

export const REVIEW_COVERAGE_SCHEMA = "folio-review-coverage/v1" as const;

/** The folio's declared verdicts directory, from `<todosRoot>/todos.json`. */
export function verdictsDir(todosRoot: string): string {
  const decl = join(todosRoot, TODO_GRAPH_FILE);
  if (!existsSync(decl)) {
    throw new Error(`${decl} does not exist, so this folio declares no todos graph. Declare one with a directory of graph kind "review-verdicts".`);
  }
  const node = nodeOfKind(parseTodoGraph(JSON.parse(readFileSync(decl, "utf-8"))), "review-verdicts");
  if (!node) {
    throw new Error(`${decl} declares no directory of graph kind "review-verdicts", which is where verdicts are committed.`);
  }
  return join(todosRoot, node.path);
}

/** Every verdict committed under `dir`, by id. Other files are left alone. */
export function readCommittedVerdicts(dir: string): Map<string, ReviewVerdict> {
  const out = new Map<string, ReviewVerdict>();
  if (!existsSync(dir)) return out;
  for (const f of new Bun.Glob("*.json").scanSync(dir)) {
    const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as { $schema?: unknown };
    if (raw.$schema !== REVIEW_VERDICT_SCHEMA) continue;
    const v = ReviewVerdictSchema.parse(raw);
    out.set(v.id, v);
  }
  return out;
}

export interface CoverageFile extends Coverage {
  $schema: typeof REVIEW_COVERAGE_SCHEMA;
  /** Exactly what `workflow_complete` takes for `GW_Covered`. */
  facts: { uncoveredBlocks: number; openDefects: number };
}

/** The whole computation, with no I/O: tested directly. */
export function buildCoverage(o: {
  changeset: { changes: ReadonlyArray<{ change: string; label: string }> };
  blocks: Record<string, { hash: string }>;
  reviewComments: unknown;
  committed?: ReadonlyMap<string, ReviewVerdict>;
}): CoverageFile {
  const rc = ReviewCommentsFileSchema.parse(o.reviewComments);
  const byId = new Map(rc.verdicts.map((v) => [v.id, v]));
  for (const [id, v] of o.committed ?? []) byId.set(id, v);
  const c = computeCoverage({
    changes: o.changeset.changes,
    blocks: new Map(Object.entries(o.blocks).map(([l, b]) => [l, b.hash])),
    verdicts: [...byId.values()],
    comments: rc.comments,
  });
  return { $schema: REVIEW_COVERAGE_SCHEMA, ...c, facts: { uncoveredBlocks: c.uncoveredBlocks, openDefects: c.openDefects } };
}

/**
 * A verdict's file name. Its id carries a block label, and labels contain
 * `:`, which a Windows checkout cannot hold. The file is read by its
 * `$schema` and its `id` field, never by its name, so the name only has to
 * be unique and portable.
 */
export const verdictFileName = (id: string) => `${id.replace(/[^A-Za-z0-9._-]/g, "_")}.json`;

/** Write each verdict as `<dir>/<safe id>.json`. Returns the paths written. */
export function writeVerdicts(dir: string, verdicts: readonly ReviewVerdict[]): string[] {
  mkdirSync(dir, { recursive: true });
  return verdicts.map((v) => {
    const p = join(dir, verdictFileName(v.id));
    writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
    return p;
  });
}

const USAGE = `usage: bun run folio-assistant-core/scripts/review-coverage.ts
  --changeset <changeset.json> --blocks <blocks.json> --comments <review-comments.json>
  [--out <coverage.json>]
  [--todos <todos graph root>]   read verdicts committed on the feature branch
  [--commit [--base main]]       write the published verdicts into the declared
                                 review-verdicts directory and commit them to the
                                 current FEATURE branch (needs --todos)`;

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const [cs, bl, cm] = [opt("changeset"), opt("blocks"), opt("comments")];
  if (args.includes("--help") || !cs || !bl || !cm || (args.includes("--commit") && !opt("todos"))) {
    console.error(USAGE);
    process.exit(args.includes("--help") ? 0 : 2);
  }
  const read = (p: string) => JSON.parse(readFileSync(p, "utf-8"));
  try {
    // Checked BEFORE anything is written, so a refused commit leaves nothing behind.
    const branch = args.includes("--commit") ? featureBranch(opt("base") ?? "main") : undefined;
    const dir = opt("todos") ? verdictsDir(resolve(opt("todos")!)) : undefined;
    const committed = dir ? readCommittedVerdicts(dir) : undefined;
    const reviewComments = read(cm);
    const f = buildCoverage({ changeset: read(cs), blocks: read(bl), reviewComments, committed });
    if (opt("out")) {
      mkdirSync(dirname(resolve(opt("out")!)), { recursive: true });
      writeFileSync(opt("out")!, JSON.stringify(f, null, 2) + "\n");
    }
    console.error(
      `✓ coverage: ${f.changed.length - f.uncoveredBlocks} of ${f.changed.length} changed block(s) have a current verdict; ` +
        `${f.openDefects} open defect(s); ${f.stale.length} verdict(s) on an older version`,
    );
    for (const l of f.uncovered.slice(0, 20)) console.error(`  · no verdict: ${l}`);
    if (f.uncovered.length > 20) console.error(`  · … and ${f.uncovered.length - 20} more`);
    if (branch && dir) {
      const published = ReviewCommentsFileSchema.parse(reviewComments).verdicts.filter((v) => !committed?.has(v.id));
      const paths = writeVerdicts(dir, published).map((p) => relative(process.cwd(), p));
      if (paths.length) {
        execFileSync("git", ["add", "--", ...paths], { stdio: "inherit" });
        execFileSync("git", ["commit", "-m", `review: record ${paths.length} verdict(s)`, "-m", `on feature branch ${branch}`, "--", ...paths], { stdio: "inherit" });
      } else {
        console.error("  nothing new to commit: every published verdict is already committed");
      }
    }
    // stdout carries only the facts, so a caller can pipe it to workflow_complete.
    console.log(JSON.stringify(f.facts));
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
