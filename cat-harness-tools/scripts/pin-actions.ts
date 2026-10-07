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
 * ## Which workflows must pin: the owner's rulings, 2026-10-07
 *
 * First *"when published, make it unpinned on staging"*; then, once the roast
 * (bean `1ygp`, L4.1) found a staging workflow holding `contents: write` on
 * `pull_request_target` and pushing to the branch that serves the live site,
 * *"pin write-token workflows"*. So every workflow pins, except one listed in
 * {@link STAGING_ONLY_WORKFLOWS} that also passes {@link stagingExempt}: no
 * write permission, and no `pull_request_target` trigger. The list is a
 * reviewed one-line change, and the list alone never grants the exemption.
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
 *   bun run cat actions:pin            # rewrite workflows in place
 *   bun run cat actions:pin --dry-run  # report what would change
 *
 * @graphNode tool
 * @covers none — .github/workflows/ is not a declared graph typology
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..");

/**
 * Workflows that only ever build a staging preview: CANDIDATES for the
 * unpinned exemption, never granted it by name alone. See {@link stagingExempt}.
 */
export const STAGING_ONLY_WORKFLOWS: ReadonlySet<string> = new Set(["feature-staging.yml", "folio-staging.yml"]);

/**
 * May this workflow keep its actions unpinned? The owner's two rulings,
 * 2026-10-07: *"when published, make it unpinned on staging"*, and, once the
 * roast (bean `1ygp`, L4.1) showed `feature-staging.yml` holds `contents:
 * write` on `pull_request_target` and pushes to the branch that serves the
 * live site, *"pin write-token workflows"*.
 *
 * So the exemption is decided from what the workflow can DO, never from its
 * name: a listed staging workflow is exempt only when it has no
 * `pull_request_target` trigger (which runs with the base repository's token
 * and secrets) and grants no `write` permission anywhere. A file name is a
 * label anyone can give a publishing step.
 */
export function stagingExempt(file: string, text: string): boolean {
  if (!STAGING_ONLY_WORKFLOWS.has(file)) return false;
  // Anchored at line start, so a comment that mentions the trigger does not count.
  const privilegedTrigger = /^[ \t]*pull_request_target[ \t]*:/m.test(text);
  const writes = /^[ \t]*[a-z-]+[ \t]*:[ \t]*write\b/m.test(text) || /^[ \t]*permissions[ \t]*:[ \t]*write-all\b/m.test(text);
  return !privilegedTrigger && !writes;
}

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
    const path = join(dir, f);
    const text = readFileSync(path, "utf-8");
    if (stagingExempt(f, text)) continue;
    const lines = text.split("\n");
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
  console.log(`\n${dryRun ? "would pin" : "pinned"} ${pinned}; refused ${refused.length}. Exempt (staging-only, no write token, no pull_request_target): ${[...STAGING_ONLY_WORKFLOWS].filter((f) => stagingExempt(f, readFileSync(join(ROOT, ".github", "workflows", f), "utf-8"))).join(", ") || "none"}.`);
  process.exit(refused.length > 0 ? 1 : 0);
}
