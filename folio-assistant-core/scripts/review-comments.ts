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
 * ## Comment bodies are data
 *
 * A body is parsed by `parseReviewTag` and stored as a string. It never
 * reaches a shell, a template or a path.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { snapshot } from "../schemas/changeset.js";
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

/** `blocks.json`: label → the content hash and former labels. */
export type BlocksFile = Record<string, BlockAnchor>;

/** The head's blocks, from the folio's manifests. The hash is the prose if there is any, else the manifest. */
export function blocksOf(folioDir: string): BlocksFile {
  const out: BlocksFile = {};
  for (const [label, s] of snapshot(folioDir)) {
    out[label] = { hash: s.proseHash ?? s.manifestHash, renamedFrom: s.renamedFrom };
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
  now?: string;
}

/** The whole ingestion, with no I/O: tested directly. */
export function buildReviewComments(o: RunOptions): ReviewCommentsFile {
  const previous: ReviewComment[] = o.existing?.comments ?? [];
  const hashes = new Map(Object.entries(o.blocks).map(([label, b]) => [label, b.hash]));
  const r = ingestPrComments({ repo: o.repo, pr: o.pr, commit: o.commit, comments: o.comments, existing: previous, blocks: hashes });
  const all = reanchorToBlocks([...previous, ...r.created], new Map(Object.entries(o.blocks)));
  return ReviewCommentsFileSchema.parse({
    $schema: REVIEW_COMMENTS_FILE_SCHEMA,
    repo: o.repo,
    pr: o.pr,
    commit: o.commit,
    generatedAt: o.now ?? new Date().toISOString(),
    comments: all,
    malformed: r.malformed,
    untagged: r.untagged,
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

  const file = buildReviewComments({ repo, pr, commit, comments, blocks, existing });
  writeJson(out, file);
  const orphaned = file.comments.filter((c) => c.review.orphaned).length;
  console.error(
    `✓ ${file.comments.length} review comment(s) (${orphaned} orphaned) → ${out}; ` +
      `${file.untagged} untagged, ${file.malformed.length} malformed`,
  );
  for (const m of file.malformed) console.error(`  ✗ ${m.url}: ${m.error}`);
}
