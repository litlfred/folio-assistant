/**
 * Pin every third-party GitHub Action to a full commit SHA, keeping the
 * human-readable ref as a trailing comment: `uses: owner/repo@<sha> # v4`.
 * Bean `ieum`, issue #2389.
 *
 * GitHub's Secure use reference: *"Pinning an action to a full-length commit
 * SHA is currently the only way to use an action as an immutable release."* A
 * tag can be moved, and a branch is moved by design. Measured 2026-10-07: 0 of
 * 240 `uses:` lines here were pinned. Dependabot keeps a `@<sha> # <tag>` pair
 * current when the comment is on the same line, so pinning does not freeze a
 * version.
 *
 * ## Which workflows must pin: the owner's ruling, 2026-10-07
 *
 * *"when published, make it unpinned on staging"*. A workflow that publishes
 * or runs on `main` MUST pin. A staging-only workflow MAY stay unpinned, so a
 * preview can track a moving action. The staging-only set is declared below
 * ({@link STAGING_ONLY_WORKFLOWS}), never inferred from a file name, so adding
 * a workflow to it is a reviewed one-line change.
 *
 * **First-party reusable workflows** (`<this repo>/.github/workflows/x.yml@main`)
 * are not third-party code and are left as they are.
 *
 * ## Resolution is by `git ls-remote`, as argv, and it refuses rather than guesses
 *
 * A ref resolves to the PEELED commit of a tag (`refs/tags/v4^{}`) when the
 * tag is annotated, else the tag, else a branch head. A ref that resolves to
 * nothing, or to more than one commit, is REFUSED: the line is left unpinned
 * and reported, because pinning to a guess would be a silent repair.
 *
 * Usage:
 *   bun run actions:pin            # rewrite workflows in place
 *   bun run actions:pin --dry-run  # report what would change
 *
 * @graphNode tool
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..");

/** Workflows that only ever build a staging preview. The owner's ruling: these may stay unpinned. */
export const STAGING_ONLY_WORKFLOWS: ReadonlySet<string> = new Set(["feature-staging.yml", "folio-staging.yml"]);

/** This repository, whose own reusable workflows are first-party. */
export const FIRST_PARTY = "litlfred/folio-assistant";

const SHA40 = /^[0-9a-f]{40}$/;
/** `uses: owner/repo[/path]@ref` with an optional trailing comment. Group 1 = indent+key, 2 = action, 3 = ref, 4 = rest. */
export const USES = /^(\s*-?\s*uses:\s*)["']?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.\/-]+)@([A-Za-z0-9_.\/-]+)["']?(.*)$/;

export interface UsesLine {
  action: string;
  ref: string;
  pinned: boolean;
  firstParty: boolean;
}

export function parseUses(line: string): UsesLine | undefined {
  const m = USES.exec(line);
  if (!m) return undefined;
  const action = m[2]!;
  if (action.startsWith("./") || action.startsWith("docker:")) return undefined;
  const repo = action.split("/").slice(0, 2).join("/");
  return { action, ref: m[3]!, pinned: SHA40.test(m[3]!), firstParty: repo === FIRST_PARTY };
}

/** Resolve `ref` of `owner/repo` to one commit SHA, or explain why not. */
export function resolveRef(repo: string, ref: string, lsRemote = defaultLsRemote): { sha: string } | { refused: string } {
  let out: string;
  try {
    out = lsRemote(repo, ref);
  } catch (e) {
    return { refused: `ls-remote failed: ${String(e).split("\n")[0]}` };
  }
  const rows = out.split("\n").filter(Boolean).map((l) => l.split("\t") as [string, string]);
  const pick = (name: string) => rows.filter(([, r]) => r === name).map(([s]) => s);
  for (const candidate of [`refs/tags/${ref}^{}`, `refs/tags/${ref}`, `refs/heads/${ref}`]) {
    const shas = [...new Set(pick(candidate))];
    if (shas.length === 1 && SHA40.test(shas[0]!)) return { sha: shas[0]! };
    if (shas.length > 1) return { refused: `${candidate} names ${shas.length} commits` };
  }
  return { refused: `no tag or branch named ${ref}` };
}

const REF_LISTS = new Map<string, string>();
/**
 * Every ref of `repo`, fetched once per run. A pattern argument cannot be used:
 * `git ls-remote <url> refs/tags/v5^{}` matches nothing, so a pattern query
 * silently loses the PEELED commit of an annotated tag and pins the tag OBJECT
 * instead. Measured 2026-10-07 on googleapis/release-please-action v5.
 */
function defaultLsRemote(repo: string, _ref: string): string {
  if (!REF_LISTS.has(repo)) {
    REF_LISTS.set(repo, execFileSync("git", ["ls-remote", `https://github.com/${repo}`], { encoding: "utf-8", timeout: 60_000, maxBuffer: 64 * 1024 * 1024 }));
  }
  return REF_LISTS.get(repo)!;
}

export interface PinResult {
  file: string;
  pinned: number;
  refused: string[];
}

export function pinWorkflows(root = ROOT, opts: { dryRun?: boolean; lsRemote?: typeof defaultLsRemote } = {}): PinResult[] {
  const dir = join(root, ".github", "workflows");
  const cache = new Map<string, { sha: string } | { refused: string }>();
  const results: PinResult[] = [];
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    if (STAGING_ONLY_WORKFLOWS.has(f)) continue;
    const path = join(dir, f);
    const lines = readFileSync(path, "utf-8").split("\n");
    const r: PinResult = { file: f, pinned: 0, refused: [] };
    lines.forEach((line, i) => {
      const u = parseUses(line);
      if (!u || u.pinned || u.firstParty) return;
      const repo = u.action.split("/").slice(0, 2).join("/");
      const key = `${repo}@${u.ref}`;
      if (!cache.has(key)) cache.set(key, resolveRef(repo, u.ref, opts.lsRemote));
      const res = cache.get(key)!;
      if ("refused" in res) {
        r.refused.push(`${f}:${i + 1} ${u.action}@${u.ref} — ${res.refused}`);
        return;
      }
      const m = USES.exec(line)!;
      // Keep any existing trailing comment after the ref comment.
      const rest = m[4]!.replace(/^\s*#.*$/, "");
      lines[i] = `${m[1]}${u.action}@${res.sha} # ${u.ref}${rest}`;
      r.pinned++;
    });
    if (r.pinned > 0 && !opts.dryRun) writeFileSync(path, lines.join("\n"));
    if (r.pinned > 0 || r.refused.length > 0) results.push(r);
  }
  return results;
}

if (import.meta.main) {
  const dryRun = process.argv.includes("--dry-run");
  const results = pinWorkflows(ROOT, { dryRun });
  let pinned = 0;
  const refused: string[] = [];
  for (const r of results) {
    pinned += r.pinned;
    refused.push(...r.refused);
    if (r.pinned) console.log(`${dryRun ? "would pin" : "pinned"} ${r.pinned} in ${r.file}`);
  }
  for (const x of refused) console.log(`✗ refused ${x}`);
  console.log(`\n${dryRun ? "would pin" : "pinned"} ${pinned}; refused ${refused.length}. Staging-only workflows left as they are: ${[...STAGING_ONLY_WORKFLOWS].join(", ")}.`);
  process.exit(refused.length > 0 ? 1 : 0);
}
