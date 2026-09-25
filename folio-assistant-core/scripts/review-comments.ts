#!/usr/bin/env bun
/**
 * review-comments — ingest a pull request's tagged comments into
 * `folio-review-comment/v1` todos and write `review-comments.json`. Bean
 * `423d`, epic `q4jm`.
 *
 * ## Why this is a Tool and not a workflow step
 *
 * The owner, 2026-09-23: *"make sure it is a Skill/Tool so process can be
 * modified later"*. The staging workflow only calls this command. What it does
 * lives here, declared as the `folio-review-comments` Tool (in
 * `folio-assistant-core/tools/index.ts`) and governed by the `review-comments`
 * skill. So changing the process means editing a skill and a Tool that every
 * caller shares, not a YAML step each folio has copied. An agent can run the
 * same command locally with the same result.
 *
 * ## Two ways to know the blocks, for two callers that trust different things
 *
 * - `--folio <dir>`: read the folio's manifests (as text; nothing is
 *   executed) and write `--blocks-out`. The PR build uses this, because it
 *   has checked out the PR anyway.
 * - `--blocks <file>`: the `blocks.json` that build published. The refresh
 *   triggered by a new comment uses this, so it never checks out the PR's
 *   code. That run has a WRITE token and is started by anyone who can
 *   comment, and checking out code there is the well-known way to hand that
 *   token to a stranger.
 *
 * ## Idempotent, and never drops a comment
 *
 * `--existing` is the previous `review-comments.json`. Every comment in it is
 * kept, status included. New tagged comments are added; one already ingested
 * is left alone. Then every comment is re-anchored against the head's blocks
 * (`reanchorToBlocks`): a rename is followed through `renamedFrom`, and a
 * block that is gone orphans the comment rather than deleting it.
 *
 * ## A status committed on the feature branch wins
 *
 * The owner ruled that a status change is COMMITTED to the folio's todos
 * graph on the edit-set's feature branch (`review-comment-move.ts`). With
 * `--todos <root>`, every review comment committed under the graph's
 * `todo-feedback` directory replaces the previously published copy of that
 * comment. The committed file is the reviewed record, and the published one
 * is derived. The PR build passes it. The comment-triggered refresh cannot,
 * because it checks out no feature-branch code, so it keeps the statuses the
 * last build published. A status commit is a push, and that push rebuilds.
 *
 * ## Comment bodies are data
 *
 * A body is parsed by `parseReviewTag` and stored as a string. It never
 * reaches a shell, a template or a path.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { snapshot } from "../schemas/changeset.js";
import { feedbackDir, readCommitted } from "./review-comment-move.js";
import { readCommittedVerdicts, verdictsDir } from "./review-coverage.js";
import {
  REVIEW_COMMENTS_FILE_SCHEMA,
  ReviewCommentsFileSchema,
  ingestPrComments,
  reanchorToBlocks,
  type BlockAnchor,
  type PrComment,
  type ReviewComment,
  type ReviewCommentsFile,
} from "../schemas/review-comment.js";
import { ingestVerdicts, parseVerdictTag, type ReviewVerdict } from "../schemas/review-verdict.js";

/** `blocks.json`: label → the content hash and former labels. */
export type BlocksFile = Record<string, BlockAnchor>;

/** The head's blocks, from the folio's manifests. The hash is the prose if there is any, else the manifest. */
export function blocksOf(folioDir: string): BlocksFile {
  const out: BlocksFile = {};
  for (const [label, s] of snapshot(folioDir)) {
    out[label] = { hash: s.proseHash ?? s.manifestHash, renamedFrom: s.renamedFrom, ...(s.section ? { section: s.section } : {}) };
  }
  return out;
}

/**
 * Every conversation comment on a pull request, all pages.
 *
 * A PR's conversation comments are ISSUE comments in GitHub's API. Line
 * review comments are a different endpoint and are not read: the owner ruled
 * for conversation comments, because a line comment is anchored to a file
 * line and is lost when a block moves.
 */
export async function fetchPrComments(repo: string, pr: number, token: string | undefined): Promise<PrComment[]> {
  const out: PrComment[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues/${pr}/comments?per_page=100&page=${page}`, {
      headers: {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${repo}#${pr} comments: ${await res.text()}`);
    const batch = (await res.json()) as Array<{ id: number; body?: string; user?: { login?: string }; created_at: string; html_url: string }>;
    for (const c of batch) {
      out.push({ id: c.id, body: c.body ?? "", user: c.user?.login ?? "ghost", createdAt: c.created_at, url: c.html_url });
    }
    if (batch.length < 100) return out;
  }
}

export interface RunOptions {
  repo: string;
  pr: number;
  commit: string;
  comments: readonly PrComment[];
  blocks: BlocksFile;
  existing?: ReviewCommentsFile;
  /** Review comments committed on the feature branch, by id. They win over `existing`. */
  committed?: ReadonlyMap<string, ReviewComment>;
  /** Verdicts committed on the feature branch, by id. They win over `existing`. */
  committedVerdicts?: ReadonlyMap<string, ReviewVerdict>;
  now?: string;
}

/** The whole ingestion, with no I/O: tested directly. */
export function buildReviewComments(o: RunOptions): ReviewCommentsFile {
  const committed = o.committed ?? new Map<string, ReviewComment>();
  const previous: ReviewComment[] = (o.existing?.comments ?? []).map((c) => committed.get(c.id) ?? c);
  for (const [id, c] of committed) if (!previous.some((p) => p.id === id)) previous.push(c);
  const hashes = new Map(Object.entries(o.blocks).map(([label, b]) => [label, b.hash]));
  const r = ingestPrComments({ repo: o.repo, pr: o.pr, commit: o.commit, comments: o.comments, existing: previous, blocks: hashes });
  const all = reanchorToBlocks([...previous, ...r.created], new Map(Object.entries(o.blocks)));
  // Verdicts: the same merge as comments (committed wins, nothing dropped),
  // then the PR's new ones. A verdict is never re-anchored: it is about the
  // version it names, and `computeCoverage` stops counting it once that
  // version is gone.
  const cv = o.committedVerdicts ?? new Map<string, ReviewVerdict>();
  const prevVerdicts: ReviewVerdict[] = (o.existing?.verdicts ?? []).map((v) => cv.get(v.id) ?? v);
  for (const [id, v] of cv) if (!prevVerdicts.some((p) => p.id === id)) prevVerdicts.push(v);
  const vr = ingestVerdicts({ repo: o.repo, pr: o.pr, commit: o.commit, comments: o.comments, existing: prevVerdicts, blocks: hashes });
  // `parseReviewTag` passes a verdict tag over, so it counted as untagged there. It is not.
  const verdictTagged = o.comments.filter((c) => parseVerdictTag(c.body) !== null).length;
  return ReviewCommentsFileSchema.parse({
    $schema: REVIEW_COMMENTS_FILE_SCHEMA,
    repo: o.repo,
    pr: o.pr,
    commit: o.commit,
    generatedAt: o.now ?? new Date().toISOString(),
    comments: all,
    malformed: [...r.malformed, ...vr.malformed],
    untagged: r.untagged - verdictTagged,
    verdicts: [...prevVerdicts, ...vr.created],
  });
}

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf-8")) as T;
const writeJson = (p: string, v: unknown) => {
  mkdirSync(dirname(resolve(p)), { recursive: true });
  writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
};

const USAGE = `usage: bun run folio-assistant-core/scripts/review-comments.ts
  --repo <owner/name> --pr <n> --out <review-comments.json>
  (--folio <dir> [--blocks-out <blocks.json>] | --blocks <blocks.json>)
  [--existing <previous review-comments.json>] [--commit <sha>]
  [--todos <todos graph root>]  statuses committed on the feature branch win
  [--comments <file.json>]   read comments from a file instead of GitHub (offline, tests)

GITHUB_TOKEN is used when set. A public repository can be read without it.`;

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const repo = opt("repo");
  const pr = Number(opt("pr"));
  const out = opt("out");
  if (args.includes("--help") || !repo || !Number.isInteger(pr) || pr <= 0 || !out || (!opt("folio") === !opt("blocks"))) {
    console.error(USAGE);
    process.exit(args.includes("--help") ? 0 : 2);
  }

  let blocks: BlocksFile;
  if (opt("folio")) {
    const dir = opt("folio")!;
    if (!existsSync(dir)) {
      console.error(`✗ --folio ${dir} does not exist, so no block can be anchored`);
      process.exit(1);
    }
    blocks = blocksOf(dir);
    if (opt("blocks-out")) writeJson(opt("blocks-out")!, blocks);
  } else {
    blocks = readJson<BlocksFile>(opt("blocks")!);
  }

  const existingPath = opt("existing");
  const existing = existingPath && existsSync(existingPath) ? ReviewCommentsFileSchema.parse(readJson(existingPath)) : undefined;
  const commit =
    opt("commit") ??
    process.env.GITHUB_SHA ??
    (() => {
      try {
        return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).trim();
      } catch {
        return "unknown";
      }
    })();
  const comments = opt("comments")
    ? readJson<PrComment[]>(opt("comments")!)
    : await fetchPrComments(repo, pr, process.env.GITHUB_TOKEN);

  // A folio whose todos graph declares no feedback directory has no committed
  // statuses to read. That is SAID, and the build goes on, because failing
  // every preview over it would punish a folio for a graph it has not grown yet.
  let committed: Map<string, ReviewComment> | undefined;
  if (opt("todos")) {
    try {
      committed = readCommitted(feedbackDir(opt("todos")!));
    } catch (e) {
      console.error(`⚠ no committed review statuses read: ${(e as Error).message}`);
    }
  }
  let committedVerdicts: Map<string, ReviewVerdict> | undefined;
  if (opt("todos")) {
    try {
      committedVerdicts = readCommittedVerdicts(verdictsDir(opt("todos")!));
    } catch (e) {
      console.error(`⚠ no committed verdicts read: ${(e as Error).message}`);
    }
  }
  const file = buildReviewComments({ repo, pr, commit, comments, blocks, existing, committed, committedVerdicts });
  writeJson(out, file);
  const orphaned = file.comments.filter((c) => c.review.orphaned).length;
  console.error(
    `✓ ${file.comments.length} review comment(s) (${orphaned} orphaned), ${file.verdicts.length} verdict(s) → ${out}; ` +
      `${file.untagged} untagged, ${file.malformed.length} malformed`,
  );
  for (const m of file.malformed) console.error(`  ✗ ${m.url}: ${m.error}`);
}
