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
 * @module tests/health/probes
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
import type {
  BeanEvidence,
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
  read: (raw: unknown) => { directories: { path: string; graphs: string[] }[] },
  pick: (g: { directories: { path: string; graphs: string[] }[] }) => { path: string } | undefined,
  fallback: { directories: { path: string; graphs: string[] }[] },
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
}

/** Gather everything the registry needs. Never throws; every failure is a `reason`. */
export async function gatherContext(o: GatherOptions): Promise<HealthContext> {
  const slug = originSlug(o.repoRoot);
  return {
    now: o.now ?? new Date(),
    subject: slug ?? "unknown-repository",
    staging: probeStaging({
      repoRoot: o.repoRoot,
      remote: o.remote ?? "origin",
      branch: o.branch ?? "gh-pages",
      prefix: o.prefix ?? STAGING_PREFIX,
    }),
    openPrHeads: await probeOpenPrHeads(slug),
    repoSize: probeRepoSize(o.repoRoot),
    beans: probeBeans(o.repoRoot),
    todos: probeTodos(o.repoRoot),
  };
}
