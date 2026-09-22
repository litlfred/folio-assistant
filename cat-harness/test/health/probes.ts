/**
 * Gathering the evidence the health checks are handed.
 *
 * The impure half. Everything that shells out to `git`, stats a directory,
 * reads front matter or calls the GitHub API is here; `./checks.ts` is pure
 * and is handed the results.
 *
 * ## Every probe is three-state
 *
 * A probe returns `{ state: "ok", value }` or `{ state: "unknown", reason }`.
 * There is no third return and no thrown error that escapes: a probe that
 * cannot answer SAYS it cannot answer, naming the command that failed, and the
 * check it feeds records `unknown` rather than a zero. This is the rule
 * `restore-staging.ts` states at length and `check-ci-health.ts` enforces at
 * its exit code — "could not read `gh-pages`" must never render as "0 MB of
 * previews", because that reading is what makes a watchdog report good news
 * while blind.
 *
 * ## Directories are resolved from the declarations, never hardcoded
 *
 * `beans/defs/` and `todos/items/` are read through `schemas/bean-graph.ts`
 * and `schemas/todo-graph.ts`, so relocating either store moves this sweep
 * with it. A literal path here would be a second spelling of one fact and
 * would go wrong on the day the store moves — which is the day somebody most
 * needs the sweep to still work.
 *
 * @module test/health/probes
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  BEAN_GRAPH_FILE,
  DEFAULT_BEAN_GRAPH,
  DEFAULT_BEAN_GRAPH_ROOT,
  nodeOfKind as beanNodeOfKind,
  parseBeanGraph,
} from "../../schemas/bean-graph.ts";
import {
  DEFAULT_TODO_GRAPH,
  DEFAULT_TODO_GRAPH_ROOT,
  TODO_GRAPH_FILE,
  nodeOfKind as todoNodeOfKind,
  parseTodoGraph,
} from "../../schemas/todo-graph.ts";
import {
  stagingSlug,
  type BranchEvidence,
  type BranchEvidenceSet,
} from "./checks.ts";
import type {
  BeanEvidence,
  DoneWhenState,
  HealthContext,
  Probe,
  RepoSizeEvidence,
  StagingEvidence,
  StagingPreview,
  TodoEvidence,
} from "./checks.ts";

/** Where the review previews live on the publish branch. Same constant as `restore-staging.ts`. */
export const STAGING_PREFIX = "STAGING";

interface Ran {
  code: number;
  out: string;
  err: string;
}

function git(cwd: string, args: string[]): Ran {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error !== undefined || r.status === null) {
    return { code: -1, out: "", err: String(r.error ?? "git did not run") };
  }
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

/** `owner/repo` from the origin remote, or `undefined`. */
export function originSlug(repoRoot: string): string | undefined {
  const r = git(repoRoot, ["remote", "get-url", "origin"]);
  if (r.code !== 0) return undefined;
  const m = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/.exec(r.out.trim());
  return m ? `${m[1]}/${m[2]}` : undefined;
}

// ── Front matter ────────────────────────────────────────────────

/**
 * The value of one top-level YAML scalar in a `---` front-matter block.
 *
 * A regex rather than a YAML parser, deliberately and narrowly: the five keys
 * read here (`title`, `status`, `updated_at`, `id`, `createdAt`) are plain
 * scalars in every file this sweep walks, and pulling a YAML dependency into a
 * health check that must run on a bare CI runner buys nothing. Quotes are
 * stripped because `beans` writes `title: '…'` when the value contains a colon.
 */
export function frontMatterValue(block: string, key: string): string | undefined {
  const m = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(block);
  if (!m) return undefined;
  const raw = m[1].trim();
  if (raw === "") return undefined;
  const unquoted = /^(['"])(.*)\1$/.exec(raw);
  return unquoted ? unquoted[2] : raw;
}

/** The `---`-delimited front matter of a Markdown file, or `undefined`. */
export function frontMatter(text: string): string | undefined {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return m ? m[1] : undefined;
}

// ── Staging ─────────────────────────────────────────────────────

export interface StagingProbeOptions {
  repoRoot: string;
  remote: string;
  branch: string;
  prefix: string;
  /** Skip the network fetch and read this already-local rev instead. For tests. */
  localRev?: string;
}

/**
 * The preview directories on the publish branch, with their sizes.
 *
 * `git ls-remote --exit-code` first, because **exit 2 is the only way to tell
 * "there is no such branch" from "I could not ask"**. The first is a determined
 * answer (a repository before its first deploy has no previews); the second is
 * not, and reporting it as zero is the defect bean `plj1` was made of.
 */
export function probeStaging(o: StagingProbeOptions): Probe<StagingEvidence> {
  let rev = o.localRev;
  if (rev === undefined) {
    const ls = git(o.repoRoot, ["ls-remote", "--exit-code", "--heads", o.remote, o.branch]);
    if (ls.code === 2) {
      return {
        state: "ok",
        value: {
          branch: "absent",
          previews: [],
          command: `git ls-remote --exit-code --heads ${o.remote} ${o.branch} (no such branch)`,
        },
      };
    }
    if (ls.code !== 0 || ls.out.trim() === "") {
      return {
        state: "unknown",
        reason: `git ls-remote ${o.remote} ${o.branch} exited ${ls.code}: ${ls.err.trim() || ls.out.trim() || "no output"}`,
      };
    }
    const fetched = git(o.repoRoot, ["fetch", "--depth=1", "--no-tags", o.remote, o.branch]);
    if (fetched.code !== 0) {
      return {
        state: "unknown",
        reason: `git fetch ${o.remote} ${o.branch} exited ${fetched.code}: ${fetched.err.trim()}`,
      };
    }
    rev = "FETCH_HEAD";
  }

  const command = `git ls-tree -r -l ${rev}:${o.prefix}/<slug>`;
  // Is there a STAGING directory at all? An absent one is a determined empty:
  // the branch was read and carries no previews.
  const has = git(o.repoRoot, ["ls-tree", "--name-only", rev, o.prefix]);
  if (has.code !== 0) {
    return { state: "unknown", reason: `git ls-tree ${rev} ${o.prefix} exited ${has.code}: ${has.err.trim()}` };
  }
  if (has.out.trim() === "") return { state: "ok", value: { branch: "present", previews: [], command } };

  const kids = git(o.repoRoot, ["ls-tree", "-d", "--name-only", `${rev}:${o.prefix}`]);
  if (kids.code !== 0) {
    return { state: "unknown", reason: `git ls-tree ${rev}:${o.prefix} exited ${kids.code}: ${kids.err.trim()}` };
  }
  const slugs = kids.out
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .sort();

  const previews: StagingPreview[] = [];
  for (const slug of slugs) {
    const listed = git(o.repoRoot, ["ls-tree", "-r", "-l", `${rev}:${o.prefix}/${slug}`]);
    if (listed.code !== 0) {
      // One unreadable preview makes the TOTAL unknown, not smaller. A partial
      // sum compared against a threshold is a wrong answer wearing a right
      // one's clothes.
      return {
        state: "unknown",
        reason: `git ls-tree -r -l ${rev}:${o.prefix}/${slug} exited ${listed.code}: ${listed.err.trim()}`,
      };
    }
    let bytes = 0;
    let files = 0;
    for (const line of listed.out.split("\n")) {
      // `<mode> <type> <object> <size>\t<path>` — size is `-` for a non-blob.
      const m = /^\S+\s+blob\s+\S+\s+(\d+)\t/.exec(line);
      if (!m) continue;
      bytes += Number(m[1]);
      files += 1;
    }
    previews.push({ slug, bytes, files });
  }
  return { state: "ok", value: { branch: "present", previews, command } };
}

/**
 * Is this clone's history of `base` cut off at a graft boundary, and if so, where?
 *
 * Exact rather than heuristic: git reports a graft boundary as a parentless
 * commit, and every graft boundary is listed in `.git/shallow`. So the
 * parentless commits reachable from `base` are intersected with that file —
 * a real root commit is not in it, and a `--depth` fetch of a DIFFERENT
 * branch puts a boundary in it that `base` cannot reach.
 *
 * `frontier` is the newest such boundary's committer date, in epoch
 * milliseconds, and `undefined` when the history is complete. It is what
 * bounds the damage: a branch tip after the frontier cannot have been merged
 * before it, so the ancestry answer about it is sound even here.
 *
 * Returns a `reason` rather than a verdict when it could not tell, because
 * "the history might be truncated" and "the history is fine" are the two
 * answers this decides between, and guessing either way is the failure the
 * whole module is written against.
 */
function defaultBranchHistory(repoRoot: string, base: string): { frontier?: number } | { reason: string } {
  const shallowPath = git(repoRoot, ["rev-parse", "--git-path", "shallow"]);
  if (shallowPath.code !== 0) {
    return { reason: `git rev-parse --git-path shallow exited ${shallowPath.code}: ${shallowPath.err.trim()}` };
  }
  const path = resolve(repoRoot, shallowPath.out.trim());
  if (!existsSync(path)) return {};
  let grafts: Set<string>;
  try {
    grafts = new Set(
      readFileSync(path, "utf-8")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== ""),
    );
  } catch (e) {
    return { reason: `${path} exists but could not be read: ${String(e).slice(0, 160)}` };
  }
  if (grafts.size === 0) return {};
  const roots = git(repoRoot, ["log", "--format=%H %cI", "--max-parents=0", base]);
  if (roots.code !== 0) {
    return { reason: `git log --max-parents=0 ${base.slice(0, 8)} exited ${roots.code}: ${roots.err.trim()}` };
  }
  let frontier: number | undefined;
  for (const line of roots.out.split("\n")) {
    const [sha, date] = line.trim().split(" ");
    if (sha === undefined || !grafts.has(sha)) continue;
    const t = Date.parse(date ?? "");
    // A boundary whose date is unreadable is treated as infinitely recent:
    // every negative ancestry answer under it becomes `unevaluated`, which
    // reports the blindness rather than guessing past it.
    frontier = Number.isNaN(t) ? Number.POSITIVE_INFINITY : Math.max(frontier ?? Number.NEGATIVE_INFINITY, t);
  }
  return { frontier };
}

export interface BranchProbeOptions {
  repoRoot: string;
  remote: string;
  /** The preview slugs to look for branches behind. Nothing else is fetched. */
  previewSlugs: readonly string[];
  /** Skip default-branch discovery and use this. For tests, and for a runner with a pinned base. */
  defaultBranch?: string;
}

/**
 * The remote branches that could keep a preview alive, with their ancestry and tip dates.
 *
 * ## Only the candidates, and only what is missing
 *
 * Every remote head is listed — one `ls-remote`, no objects — and only those
 * whose slug matches a preview are looked at further. Of those, a tip already
 * present locally is not fetched at all, which is the common case: a branch
 * that has been merged into the default branch is, by definition, already in
 * the history this clone holds. On this repository, 2026-09-19, that was four
 * of the five candidates.
 *
 * ## Three states, per branch as well as per probe
 *
 * A `git` failure that makes the whole listing impossible is `unknown` for the
 * probe. A failure that touches ONE branch — its tip could not be fetched, its
 * ancestry could not be computed — is recorded on that branch as
 * `unevaluated`, with the fields it could not fill left undefined, and the
 * check sends that preview to `unknown` rather than to the orphan list.
 * **A branch whose ancestry could not be computed is not a merged branch.**
 *
 * ## The truncated-history trap
 *
 * `merge-base --is-ancestor` answers "no" for a merged branch whose merge
 * point this clone does not hold — a shallow checkout, or a `--depth` fetch.
 * "No" means "carries unmerged work", which SPARES the preview, so the error
 * is in the safe direction; but a check that silently spares everything has
 * stopped working, and nothing would say so. So a negative answer is only
 * trusted when the default branch's history is known to be complete.
 *
 * **Complete is asked exactly, not inferred.** The parentless commits
 * reachable from the default branch are intersected with `.git/shallow`: a
 * graft boundary git reports as parentless is in that file, a real root
 * commit is not. `--is-shallow-repository` cannot be used for this, because
 * `probeStaging` runs first and fetches `gh-pages` with `--depth=1`, which
 * makes the whole repository shallow by that test while `main`'s own history
 * is untouched — it would report every sweep blind. A date comparison cannot
 * be used on its own either: a branch tip older than the repository's root
 * commit is unusual but legal, and it would blind a sweep over a complete
 * history for a reason that has nothing to do with truncation.
 *
 * Truncation alone does not condemn the answer, though, so the two are used
 * together. A merge of a branch whose tip is NEWER than the graft boundary
 * must itself be newer than the boundary, and so inside the fetched range —
 * "not an ancestor" is then a fact. Only a tip at or before the boundary is
 * `unevaluated`. Where a date is missing or skewed the branch reads as
 * unmerged, which spares the preview.
 */
export function probeBranches(o: BranchProbeOptions): Probe<BranchEvidenceSet> {
  const command = `git ls-remote --heads ${o.remote}, then merge-base --is-ancestor per matching branch`;
  if (o.previewSlugs.length === 0) {
    return { state: "ok", value: { candidates: [], defaultBranch: o.defaultBranch ?? "", command } };
  }

  let defaultBranch = o.defaultBranch;
  if (defaultBranch === undefined) {
    const sym = git(o.repoRoot, ["ls-remote", "--symref", o.remote, "HEAD"]);
    if (sym.code !== 0) {
      return {
        state: "unknown",
        reason: `git ls-remote --symref ${o.remote} HEAD exited ${sym.code}: ${sym.err.trim() || "no output"}`,
      };
    }
    const m = /^ref:\s+refs\/heads\/(\S+)\s+HEAD$/m.exec(sym.out);
    if (m === null) {
      return {
        state: "unknown",
        reason: `git ls-remote --symref ${o.remote} HEAD named no default branch, so "already merged" has nothing to be measured against.`,
      };
    }
    defaultBranch = m[1];
  }

  const listed = git(o.repoRoot, ["ls-remote", "--heads", o.remote]);
  if (listed.code !== 0) {
    return {
      state: "unknown",
      reason: `git ls-remote --heads ${o.remote} exited ${listed.code}: ${listed.err.trim() || "no output"}`,
    };
  }
  const wanted = new Set(o.previewSlugs);
  const heads: { ref: string; sha: string }[] = [];
  for (const line of listed.out.split("\n")) {
    const m = /^([0-9a-f]{40})\s+refs\/heads\/(.+)$/.exec(line.trim());
    if (m === null) continue;
    if (wanted.has(stagingSlug(m[2]))) heads.push({ sha: m[1], ref: m[2] });
  }
  if (heads.length === 0) {
    // A determined empty: the remote WAS listed, and nothing on it slugifies
    // to any preview. Distinct from the `unknown`s above, and the distinction
    // is the difference between "these previews are orphans" and "I could not
    // tell".
    return { state: "ok", value: { candidates: [], defaultBranch, command } };
  }

  const fetchedDefault = git(o.repoRoot, ["fetch", "--no-tags", o.remote, defaultBranch]);
  if (fetchedDefault.code !== 0) {
    return {
      state: "unknown",
      reason: `git fetch ${o.remote} ${defaultBranch} exited ${fetchedDefault.code}: ${fetchedDefault.err.trim()}`,
    };
  }
  const defaultSha = git(o.repoRoot, ["rev-parse", "FETCH_HEAD"]);
  if (defaultSha.code !== 0) {
    return { state: "unknown", reason: `git rev-parse FETCH_HEAD after fetching ${defaultBranch} exited ${defaultSha.code}` };
  }
  const base = defaultSha.out.trim();

  // Is this clone's history of the default branch complete? See the header:
  // the question is asked of `.git/shallow`, never of a date or of
  // `--is-shallow-repository`.
  const history = defaultBranchHistory(o.repoRoot, base);
  if ("reason" in history) return { state: "unknown", reason: history.reason };

  const candidates: BranchEvidence[] = [];
  for (const head of heads) {
    const have = git(o.repoRoot, ["cat-file", "-e", `${head.sha}^{commit}`]);
    if (have.code !== 0) {
      const fetched = git(o.repoRoot, ["fetch", "--no-tags", o.remote, `refs/heads/${head.ref}`]);
      if (fetched.code !== 0) {
        candidates.push({
          ref: head.ref,
          unevaluated: `git fetch ${o.remote} refs/heads/${head.ref} exited ${fetched.code}: ${fetched.err.trim() || "no output"}`,
        });
        continue;
      }
    }
    const dated = git(o.repoRoot, ["show", "-s", "--format=%cI", head.sha]);
    const headCommittedAt = dated.code === 0 && dated.out.trim() !== "" ? dated.out.trim() : undefined;

    const anc = git(o.repoRoot, ["merge-base", "--is-ancestor", head.sha, base]);
    let mergedIntoDefault: boolean | undefined;
    let why: string | undefined;
    if (anc.code === 0) mergedIntoDefault = true;
    else if (anc.code === 1) mergedIntoDefault = false;
    else why = `git merge-base --is-ancestor exited ${anc.code}: ${anc.err.trim() || "no output"}`;

    // See the header: a "not merged" answer out of a truncated history is an
    // artefact of the fetch depth unless the tip postdates the graft boundary,
    // in which case any merge of it would be inside the fetched range too.
    if (
      mergedIntoDefault === false &&
      history.frontier !== undefined &&
      (headCommittedAt === undefined || Date.parse(headCommittedAt) <= history.frontier)
    ) {
      mergedIntoDefault = undefined;
      why =
        `this clone's history of \`${defaultBranch}\` is truncated at a graft boundary, so "not an ancestor of ` +
        `${defaultBranch}" cannot be told from "the merge point was never fetched". Re-run with the full ` +
        "history (`fetch-depth: 0`).";
    }
    if (headCommittedAt === undefined) {
      why = `${why ? `${why}; ` : ""}git show -s --format=%cI ${head.sha.slice(0, 8)} exited ${dated.code}`;
    }
    candidates.push({ ref: head.ref, mergedIntoDefault, headCommittedAt, unevaluated: why });
  }
  return { state: "ok", value: { candidates, defaultBranch, command } };
}

/**
 * The head refs of the open pull requests.
 *
 * Unauthenticated works for a public repository; `GITHUB_TOKEN` raises the
 * rate limit and is required for a private one. A 403 or a 404 is `unknown`,
 * never an empty list — an empty list would make every preview look orphaned,
 * which is the one false positive the orphan check must never produce, since
 * its findings are a list somebody is invited to act on.
 */
export async function probeOpenPrHeads(slug: string | undefined): Promise<Probe<string[]>> {
  if (slug === undefined) {
    return { state: "unknown", reason: "no GitHub `origin` remote, so there are no pull requests to ask about." };
  }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const heads: string[] = [];
  // Paginated: a repository with more than 100 open PRs would otherwise have
  // its later previews reported as orphans, which is a false positive by
  // truncation — the shape `check-ci-health.ts` guards with its 300-file cap.
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/repos/${slug}/pulls?state=open&per_page=100&page=${page}`;
    try {
      const res = await fetch(url, {
        headers: {
          accept: "application/vnd.github+json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        return {
          state: "unknown",
          reason:
            `GitHub API returned ${res.status} for ${slug}/pulls` +
            (res.status === 404 && !token
              ? " — a private repo needs GITHUB_TOKEN or GH_TOKEN."
              : res.status === 403
                ? " — rate limited; set GITHUB_TOKEN to raise the limit."
                : "."),
        };
      }
      const body = (await res.json()) as Array<{ head?: { ref?: string } }>;
      for (const pr of body) if (pr.head?.ref) heads.push(pr.head.ref);
      if (body.length < 100) return { state: "ok", value: heads };
    } catch (e) {
      return { state: "unknown", reason: `could not reach the GitHub API: ${String(e).slice(0, 160)}` };
    }
  }
  return {
    state: "unknown",
    reason: "more than 1000 open pull requests; the listing was truncated, so an orphan cannot be distinguished from a missed page.",
  };
}

// ── Repository size ─────────────────────────────────────────────

/** Recursive byte total of a directory, or `undefined` if anything could not be stat'd. */
function dirBytes(path: string): number | undefined {
  let total = 0;
  const walk = (p: string): boolean => {
    let entries;
    try {
      entries = readdirSync(p, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const e of entries) {
      const child = join(p, e.name);
      if (e.isDirectory()) {
        if (!walk(child)) return false;
      } else if (e.isFile()) {
        try {
          total += statSync(child).size;
        } catch {
          return false;
        }
      }
      // A symlink contributes nothing: following one can leave the directory
      // being measured, and counting the target twice is worse than not at all.
    }
    return true;
  };
  return walk(path) ? total : undefined;
}

export function probeRepoSize(repoRoot: string): Probe<RepoSizeEvidence> {
  const listed = git(repoRoot, ["ls-tree", "-r", "-l", "HEAD"]);
  if (listed.code !== 0) {
    return { state: "unknown", reason: `git ls-tree -r -l HEAD exited ${listed.code}: ${listed.err.trim()}` };
  }
  let trackedBytes = 0;
  for (const line of listed.out.split("\n")) {
    const m = /^\S+\s+blob\s+\S+\s+(\d+)\t/.exec(line);
    if (m) trackedBytes += Number(m[1]);
  }

  const counted = git(repoRoot, ["count-objects", "-v"]);
  if (counted.code !== 0) {
    return { state: "unknown", reason: `git count-objects -v exited ${counted.code}: ${counted.err.trim()}` };
  }
  const field = (k: string): number | undefined => {
    const m = new RegExp(`^${k}: (\\d+)$`, "m").exec(counted.out);
    return m ? Number(m[1]) : undefined;
  };
  const packs = field("packs");
  // `size-pack` is in KiB, per `git count-objects` documentation.
  const packKiB = field("size-pack");
  if (packs === undefined || packKiB === undefined) {
    return { state: "unknown", reason: "git count-objects -v did not report `packs` and `size-pack`." };
  }

  // `--git-dir` rather than `<root>/.git`: in a worktree that path is a FILE
  // pointing elsewhere, and measuring it would report a few hundred bytes as
  // the cost of a clone.
  const gitDir = git(repoRoot, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (gitDir.code !== 0) {
    return { state: "unknown", reason: `git rev-parse --git-common-dir exited ${gitDir.code}: ${gitDir.err.trim()}` };
  }
  const gitDirBytes = dirBytes(gitDir.out.trim());
  if (gitDirBytes === undefined) {
    return { state: "unknown", reason: `could not measure ${gitDir.out.trim()} — a file in it could not be read.` };
  }

  return { state: "ok", value: { gitDirBytes, trackedBytes, packs, packBytes: packKiB * 1024 } };
}

// ── Stores ──────────────────────────────────────────────────────

/** Resolve a declared store directory, falling back to the documented default. */
function declaredDir(
  repoRoot: string,
  root: string,
  file: string,
  read: (raw: unknown) => { directories: { path: string; graphKinds: string[] }[] },
  pick: (g: { directories: { path: string; graphKinds: string[] }[] }) => { path: string } | undefined,
  fallback: { directories: { path: string; graphKinds: string[] }[] },
): { dir: string } | { reason: string } {
  const graphPath = join(repoRoot, root, file);
  let graph = fallback;
  if (existsSync(graphPath)) {
    try {
      graph = read(JSON.parse(readFileSync(graphPath, "utf-8")));
    } catch (e) {
      // A declaration that is PRESENT and unreadable is a hard unknown, never
      // a fallback to defaults: the store may well be somewhere else, and
      // walking the default directory would report a clean run over the wrong
      // place. Same rule `parseBeanGraph` states for its own callers.
      return { reason: `${join(root, file)} could not be read: ${String(e).slice(0, 200)}` };
    }
  }
  const node = pick(graph);
  if (!node) return { reason: `${join(root, file)} declares no such node.` };
  return { dir: resolve(repoRoot, root, node.path) };
}

/**
 * The heading that makes a bean a DECISION RECORD.
 *
 * A prefix match, and deliberately not the canonical `## Considered options`
 * alone: measured 2026-09-20, **no bean in this store uses that spelling.** The
 * two that record options write `## Options, with what each costs` and
 * `## Options, none chosen here`. A detector keyed on MADR's exact heading would
 * have had ZERO subjects, and a filter over nothing passes — which is the trap
 * `NoCheckScriptsFound` exists to refuse one layer along.
 *
 * Case-insensitive because a heading is prose, and `\b` so `## Optional` is not
 * an options section.
 */
const OPTIONS_HEADING = /^##\s+(?:considered\s+)?options\b/i;

/** A top-level list item — `- x`, `* x` or `1. x`. Indented items are sub-points of one option. */
const OPTION_ITEM = /^(?:[-*]|\d+\.)\s+\S/;

/**
 * How many options a bean's options section lists, or `undefined` when it has
 * none — the third state, which the check must not read as zero.
 *
 * Counts to the NEXT heading of level 1 or 2, so an option's own `###`
 * sub-headings stay inside it. A bean with several options sections (a decision
 * revisited later in the same file) counts the FIRST: the later ones are the
 * re-analysis, and its own record is what the later section is.
 */

/**
 * The five row labels `renderDecision` emits, in `schemas/decision-request.ts`.
 *
 * A decision put through the schema leaves this table behind; a hand-written
 * `## Options` section does not. The distinction is load-bearing and was
 * measured 2026-09-21 on bean `hajp`: the store held **10** beans with an
 * `## Options` heading and **0** carrying this table — so the count that
 * `hajp`'s gating condition names ("revisit at twelve records") was counting
 * a population containing none of the thing the evidence was meant to be
 * about. A threshold measuring the wrong set cannot be met meaningfully, and
 * would have been read as met.
 *
 * Detected from the artefact rather than from a marker somebody has to
 * remember to write, which is the same reason `check:bean-bodies` reads the
 * body rather than trusting front matter.
 */
const RENDERED_DECISION_ROWS = [
  /\|\s*\*\*What it does\*\*\s*\|/,
  /\|\s*\*\*Pro\*\*\s*\|/,
  /\|\s*\*\*Con\*\*\s*\|/,
  /\|\s*\*\*Downstream\*\*\s*\|/,
  /\|\s*\*\*Reversibility\*\*\s*\|/,
];

/** Does this bean carry a decision rendered through `renderDecision`? */
export function hasRenderedDecision(text: string): boolean {
  return RENDERED_DECISION_ROWS.every((r) => r.test(text));
}

/**
 * The `## Done when` heading, in every spelling the store actually uses.
 *
 * Measured 2026-09-21 across 457 beans: **25 distinct spellings**, among them
 * `### Done when`, `## Done when — revised`, `## Done when — REPLACES the list
 * above` and `## Done when — status`. All 25 begin with the two words, so the
 * prefix is what is matched and the qualifier is deliberately not parsed —
 * reading "revised" or "REPLACES" as an instruction about WHICH list counts
 * would make this check adjudicate supersession, which is a judgement about
 * intent rather than a fact about the file.
 */
const DONE_WHEN_HEADING = /^#{2,3}\s+done when\b/i;
/** A GFM task-list item, ticked or not. The store writes both `- [x]` and `[x]`. */
const DONE_WHEN_BOX = /^\s*(?:[-*]\s*)?\[([ xX])\]/;

/**
 * What a bean's own completion criteria say about it.
 *
 * Four states, and the two that are NOT about ticking are the point — bean
 * `fkjo`, which exists because an `in-progress` bean is a CLAIM a sibling
 * honours, so one that says "done" in its body and "claimed" in its front
 * matter is two answers to one question.
 *
 * - `absent` — no Done-when section. 26 of 96 claimed beans, measured
 *   2026-09-21. Nothing was recorded, so nothing can be concluded.
 * - `unreadable` — a Done-when section carrying **no checkboxes at all**, so
 *   its criteria are prose or plain bullets. 15 of 96.
 * - `open` / `all-ticked` — the machine-readable cases.
 *
 * **`unreadable` wins over `all-ticked` when a bean has both**, and that rule
 * is the whole reason this is not a plain box count. Bean `z4mq` carries TWO
 * matching headings: its real criteria are a `•` bullet list under the first,
 * and under `## Done when — item 3` sits a three-box SUB-CHECKLIST of one
 * item — all ticked. A body-wide count of `[x]` calls that bean finished; so
 * does a count scoped to its Done-when sections. What separates it is that one
 * of those sections states criteria this cannot read, and a bean with any
 * unreadable criterion is not a bean whose criteria are all met.
 *
 * That direction is chosen deliberately. Suppressing a genuinely finished bean
 * costs a report nobody gets; reporting an unfinished one spends a person's
 * attention on re-deriving work that is not done — and `fkjo` was opened
 * precisely because that attention had already been spent once.
 */
export function doneWhenState(text: string): DoneWhenState {
  const lines = text.split("\n");
  const starts = lines.flatMap((l, i) => (DONE_WHEN_HEADING.test(l) ? [i] : []));
  if (starts.length === 0) return { kind: "absent" };

  let ticked = 0;
  let total = 0;
  for (const at of starts) {
    let inSection = 0;
    for (let i = at + 1; i < lines.length; i++) {
      // Any heading at h1–h3 ends the section. A DEEPER heading does not, so a
      // `#### Note` inside the criteria keeps them together.
      if (/^#{1,3}\s/.test(lines[i]!)) break;
      const m = DONE_WHEN_BOX.exec(lines[i]!);
      if (!m) continue;
      inSection++;
      total++;
      if (m[1]!.toLowerCase() === "x") ticked++;
    }
    // A matching heading whose section holds no checkbox at all: the criteria
    // are there and this cannot read them. See the type's docs for why this
    // outranks everything counted above.
    if (inSection === 0) return { kind: "unreadable" };
  }
  return ticked === total ? { kind: "all-ticked", total } : { kind: "open", ticked, total };
}

export function countConsideredOptions(text: string): number | undefined {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => OPTIONS_HEADING.test(l));
  if (at < 0) return undefined;
  let n = 0;
  for (let i = at + 1; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i]!)) break;
    if (OPTION_ITEM.test(lines[i]!)) n++;
  }
  return n;
}

export function probeBeans(repoRoot: string): Probe<BeanEvidence[]> {
  const found = declaredDir(
    repoRoot,
    DEFAULT_BEAN_GRAPH_ROOT,
    BEAN_GRAPH_FILE,
    (raw) => parseBeanGraph(raw),
    (g) => beanNodeOfKind(g as never, "bean-defs"),
    DEFAULT_BEAN_GRAPH,
  );
  if ("reason" in found) return { state: "unknown", reason: found.reason };
  let files: string[];
  try {
    files = readdirSync(found.dir).filter((f) => f.endsWith(".md"));
  } catch (e) {
    return { state: "unknown", reason: `could not read the bean store at ${found.dir}: ${String(e).slice(0, 160)}` };
  }
  const beans: BeanEvidence[] = [];
  for (const f of files) {
    let text: string;
    try {
      text = readFileSync(join(found.dir, f), "utf-8");
    } catch (e) {
      return { state: "unknown", reason: `could not read ${f}: ${String(e).slice(0, 160)}` };
    }
    const fm = frontMatter(text);
    if (fm === undefined) continue;
    const title = frontMatterValue(fm, "title");
    const status = frontMatterValue(fm, "status");
    if (title === undefined || status === undefined) continue;
    beans.push({
      // The id is the `# folio-assistant-xxxx` comment beans writes as the
      // first front-matter line; the filename stem is the fallback.
      id: /^#\s*(\S+)\s*$/m.exec(fm)?.[1] ?? f.replace(/\.md$/, ""),
      title,
      status,
      updatedAt: frontMatterValue(fm, "updated_at"),
      // The WHOLE file, not the body after the front matter: a heading cannot
      // appear inside front matter, so narrowing the input would only add a
      // parse step that can go wrong.
      consideredOptions: countConsideredOptions(text),
      doneWhen: doneWhenState(text),
      renderedDecision: hasRenderedDecision(text),
    });
  }
  // An empty store is not a clean one. A walk that found nothing is how a
  // relocated directory reports health over a place that holds no beans.
  if (beans.length === 0) {
    return { state: "unknown", reason: `no beans found under ${found.dir} — refusing to report a clean work plan over an empty walk.` };
  }
  return { state: "ok", value: beans };
}

export function probeTodos(repoRoot: string): Probe<TodoEvidence[]> {
  const found = declaredDir(
    repoRoot,
    DEFAULT_TODO_GRAPH_ROOT,
    TODO_GRAPH_FILE,
    (raw) => parseTodoGraph(raw),
    (g) => todoNodeOfKind(g as never, "todo-items"),
    DEFAULT_TODO_GRAPH,
  );
  if ("reason" in found) return { state: "unknown", reason: found.reason };
  let files: string[];
  try {
    files = readdirSync(found.dir).filter((f) => f.endsWith(".md"));
  } catch (e) {
    return { state: "unknown", reason: `could not read the todo store at ${found.dir}: ${String(e).slice(0, 160)}` };
  }
  const todos: TodoEvidence[] = [];
  for (const f of files) {
    const fm = frontMatter(readFileSync(join(found.dir, f), "utf-8"));
    if (fm === undefined) continue;
    todos.push({
      id: frontMatterValue(fm, "id") ?? f.replace(/\.md$/, ""),
      status: frontMatterValue(fm, "status") ?? "unknown",
      createdAt: frontMatterValue(fm, "createdAt"),
    });
  }
  // Zero todos IS a determined empty here, unlike the bean store: `todos/`
  // legitimately holds none, and this repository shipped with an empty
  // `feedback/` node carrying only a `.gitkeep`.
  return { state: "ok", value: todos };
}

// ── The whole context ───────────────────────────────────────────

export interface GatherOptions {
  repoRoot: string;
  remote?: string;
  branch?: string;
  prefix?: string;
  now?: Date;
  /** Override the remote's default branch, which is otherwise discovered. */
  defaultBranch?: string;
}

/** Gather everything the registry needs. Never throws; every failure is a `reason`. */
export async function gatherContext(o: GatherOptions): Promise<HealthContext> {
  const slug = originSlug(o.repoRoot);
  const remote = o.remote ?? "origin";
  const staging = probeStaging({
    repoRoot: o.repoRoot,
    remote,
    branch: o.branch ?? "gh-pages",
    prefix: o.prefix ?? STAGING_PREFIX,
  });
  // The branch probe is scoped to the previews that exist, so it has to run
  // after the staging one. When staging itself is unknown there is nothing to
  // scope it to — and the orphan check is already unknown at that point, so
  // asking would be network cost spent on an answer nobody reads.
  return {
    now: o.now ?? new Date(),
    subject: slug ?? "unknown-repository",
    staging,
    branches:
      staging.state === "ok"
        ? probeBranches({
            repoRoot: o.repoRoot,
            remote,
            previewSlugs: staging.value.previews.map((p) => p.slug),
            defaultBranch: o.defaultBranch,
          })
        : { state: "unknown", reason: `the previews could not be read, so there was nothing to match branches against: ${staging.reason}` },
    openPrHeads: await probeOpenPrHeads(slug),
    repoSize: probeRepoSize(o.repoRoot),
    beans: probeBeans(o.repoRoot),
    todos: probeTodos(o.repoRoot),
  };
}
