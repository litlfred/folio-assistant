#!/usr/bin/env bun
/**
 * A ChangeSet: what changed in a folio between two git refs, block by block.
 *
 * @module folio-assistant-core/schemas/changeset
 * @graphNode schema
 *
 * Bean `jwox`, epic `q4jm` (large-document review). The review page, the
 * change-density heat map and the review comments all need one answer to
 * "what changed between `main` and this staging branch", keyed on the block's
 * identity in the `folio/` graph — its **label** — rather than on file paths.
 *
 * ## Why not `git diff`
 *
 * The `diff` skill runs `git diff origin/main..HEAD` over manifest files. At
 * that level a block moved between chapters is a deletion in one file and an
 * addition in another, a relabelled block is indistinguishable from a
 * replaced one, and a reordered section is noise. A ChangeSet matches blocks
 * by label, follows declared renames (`renamedFrom`, bean `5xzc`), and reads
 * position from the manifests.
 *
 * ## One entry per block that differs
 *
 * A block is `added`, `removed`, or `changed`. A changed block carries every
 * aspect that applies, because they co-occur — a block can be moved AND
 * reworded AND renamed in one edit, and forcing one label would hide two:
 *
 * | aspect     | meaning |
 * |------------|---------|
 * | `renamed`  | its label changed, and the new block records the old in `renamedFrom` |
 * | `prose`    | its `.md` sibling differs (or appeared, or went away) |
 * | `manifest` | its `.ts` differs, ignoring the label and `renamedFrom` fields |
 * | `moved`    | it is in a different section, or its order changed relative to the blocks around it |
 *
 * **Moved is relative, not positional.** Inserting one block at the top of a
 * section shifts every later index by one. Reporting all of them as moved
 * would bury the one real move, so within a section a block is moved only if
 * it falls outside the longest common subsequence of the blocks present on
 * both sides.
 *
 * ## Reading the base does not execute it
 *
 * The base ref is extracted with `git archive` and walked with
 * `verify: false`, so manifests are read as TEXT. Importing them would run
 * whatever code the old ref held. Section membership is read the same way,
 * from each manifest's `blocks: [...]` arrays through the string- and
 * comment-masking parser the QA axes already use.
 *
 * ## Known limits, stated rather than hidden
 *
 * - An **unlabelled** block (`prose()` with no `label:`) is identified by its
 *   slug, as `walkBlocks` identifies it everywhere else. Renaming its file
 *   reads as removed + added. Give it a label if its history matters.
 * - Section identity is its `label`, else its `title`, else its position in
 *   the manifest. Retitling an unlabelled section moves every block in it.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { z } from "zod";

import { walkBlocks } from "../../cat-harness/content/pipeline/qa-utils.js";
import { parseManifestStringArray } from "../../cat-harness/content/pipeline/qa-checkers-extended.js";
import { maskStringsAndComments, parseStringField } from "../../cat-harness/content/pipeline/uses-field.js";

// ── Schema ──────────────────────────────────────────────────────

export const CHANGESET_SCHEMA = "folio-changeset/v1" as const;

export const CHANGE_ASPECTS = ["renamed", "prose", "manifest", "moved"] as const;
export type ChangeAspect = (typeof CHANGE_ASPECTS)[number];

/** Where a block sits on one side of the comparison. */
export const BlockAtSchema = z.object({
  /** Manifest path relative to the folio root. */
  file: z.string(),
  kind: z.string(),
  /**
   * The section listing it: `<manifest dir>::<section label | title | #n>`.
   * Absent when no manifest lists the block — an orphan, which is itself
   * worth a reviewer's attention and is not guessed at.
   */
  section: z.string().optional(),
  /** Zero-based position within that section. */
  index: z.number().int().nonnegative().optional(),
});
export type BlockAt = z.infer<typeof BlockAtSchema>;

export const BlockChangeSchema = z.discriminatedUnion("change", [
  z.object({ change: z.literal("added"), label: z.string(), head: BlockAtSchema }),
  z.object({ change: z.literal("removed"), label: z.string(), base: BlockAtSchema }),
  z.object({
    change: z.literal("changed"),
    /** The label on the head side. */
    label: z.string(),
    /** The base label, present only when `aspects` includes `renamed`. */
    from: z.string().optional(),
    aspects: z.array(z.enum(CHANGE_ASPECTS)).min(1),
    base: BlockAtSchema,
    head: BlockAtSchema,
  }),
]);
export type BlockChange = z.infer<typeof BlockChangeSchema>;

export const RefSchema = z.object({
  /** What was asked for — `origin/main`, a branch, or `worktree`. */
  ref: z.string(),
  /** The commit it resolved to; `null` for the uncommitted working tree. */
  commit: z.string().nullable(),
});

export const ChangeSetSchema = z.object({
  $schema: z.literal(CHANGESET_SCHEMA),
  /** Folio root, relative to the repository root. */
  folio: z.string(),
  base: RefSchema,
  head: RefSchema,
  summary: z.object({
    added: z.number().int(),
    removed: z.number().int(),
    changed: z.number().int(),
    unchanged: z.number().int(),
    /** Per-aspect counts over `changed` entries; they overlap by design. */
    renamed: z.number().int(),
    prose: z.number().int(),
    manifest: z.number().int(),
    moved: z.number().int(),
  }),
  /** Every block that differs, in head reading order, then removed blocks. */
  changes: z.array(BlockChangeSchema),
});
export type ChangeSet = z.infer<typeof ChangeSetSchema>;

// ── One side: a snapshot of a folio directory ───────────────────

interface Snap extends BlockAt {
  label: string;
  manifestHash: string;
  proseHash?: string;
  renamedFrom: string[];
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * The manifest with its identity fields blanked, so a rename alone does not
 * also read as a manifest edit. Done on the masked copy's offsets so a
 * `label:` inside a string or comment is never the one blanked.
 */
function manifestFingerprint(src: string): string {
  let out = src;
  const cut = (re: RegExp) => {
    const m = re.exec(maskStringsAndComments(out));
    if (m) out = out.slice(0, m.index) + out.slice(m.index + m[0].length);
  };
  // The label's VALUE sits in a string the mask blanks, so match its extent
  // on the mask and remove the same span from the original.
  cut(/(?<=[{,\s])label\s*:\s*["'][^"'\n]*["']\s*,?/);
  cut(/(?<=[{,\s])renamedFrom\s*:\s*\[[^\]]*\]\s*,?/);
  return sha(out.replace(/\s+/g, " "));
}

/** Every `.ts` under `dir`, skipping dot-directories and `node_modules`. */
function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...tsFiles(p));
    else if (name.endsWith(".ts")) out.push(p);
  }
  return out;
}

/**
 * Section membership, read from every manifest's `blocks: [...]` arrays as
 * text. Returns block manifest path (relative to `root`) → its position.
 *
 * A section is keyed by the `label:` or `title:` in the object literal that
 * holds the `blocks` array, read from the part of that object BEFORE the
 * array, so a nested subsection's fields later in the object are not taken
 * for the section's own.
 */
export function readPositions(root: string): Map<string, { section: string; index: number }> {
  const pos = new Map<string, { section: string; index: number }>();
  for (const file of tsFiles(root)) {
    const src = readFileSync(file, "utf-8");
    const masked = maskStringsAndComments(src);
    const re = /(^|[{,\s])blocks\s*:\s*\[/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(masked))) {
      const at = m.index + m[1]!.length;
      // The enclosing `{`: walk back, balancing braces.
      let depth = 0;
      let open = -1;
      for (let k = at - 1; k >= 0; k--) {
        const c = masked[k];
        if (c === "}") depth++;
        else if (c === "{") {
          if (depth === 0) { open = k; break; }
          depth--;
        }
      }
      const head = src.slice(open + 1, at);
      const key = parseStringField(head, "label") ?? parseStringField(head, "title") ?? `#${n}`;
      const section = `${relative(root, dirname(file)) || "."}::${key}`;
      const slugs = parseManifestStringArray(src.slice(at), "blocks");
      slugs.forEach((slug, index) => {
        const rel = relative(root, join(dirname(file), `${slug}.ts`));
        if (!pos.has(rel)) pos.set(rel, { section, index });
      });
      n++;
    }
  }
  return pos;
}

/** Every block under `root`, by label. Reads text only; executes nothing. */
export function snapshot(root: string): Map<string, Snap> {
  const out = new Map<string, Snap>();
  if (!existsSync(root)) return out;
  const positions = readPositions(root);
  for (const b of walkBlocks(root, { verify: false, includeUnlabelled: true, onLoadFailure: () => {} })) {
    const src = readFileSync(b.ts, "utf-8");
    const file = relative(root, b.ts);
    const at = positions.get(file);
    out.set(b.label, {
      label: b.label,
      kind: b.kind,
      file,
      ...(at ? { section: at.section, index: at.index } : {}),
      manifestHash: manifestFingerprint(src),
      proseHash: b.md && existsSync(b.md) ? sha(readFileSync(b.md, "utf-8")) : undefined,
      renamedFrom: parseManifestStringArray(src, "renamedFrom"),
    });
  }
  return out;
}

// ── Comparing two snapshots ─────────────────────────────────────

/** Indices of `a` that lie on one longest common subsequence with `b`. */
function lcsKeep(a: string[], b: string[]): Set<string> {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const keep = new Set<string>();
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { keep.add(a[i]!); i++; j++; }
    else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i++;
    else j++;
  }
  return keep;
}

const at = (s: Snap): BlockAt => ({
  file: s.file,
  kind: s.kind,
  ...(s.section !== undefined ? { section: s.section, index: s.index } : {}),
});

/** Compare two snapshots. Pure: no git, no filesystem. */
export function compareSnapshots(
  base: Map<string, Snap>,
  head: Map<string, Snap>,
): Pick<ChangeSet, "summary" | "changes"> {
  // Pair head blocks with their base selves: same label, or a declared rename
  // of a label that exists at the base and is gone from the head.
  const pairs: Array<{ b: Snap; h: Snap; renamed: boolean }> = [];
  const pairedBase = new Set<string>();
  for (const h of head.values()) {
    const same = base.get(h.label);
    if (same) {
      pairs.push({ b: same, h, renamed: false });
      pairedBase.add(same.label);
    }
  }
  for (const h of head.values()) {
    if (base.has(h.label)) continue;
    // Newest former label first: the one it was called at the base.
    const old = [...h.renamedFrom].reverse().find((l) => base.has(l) && !head.has(l) && !pairedBase.has(l));
    if (old) {
      pairs.push({ b: base.get(old)!, h, renamed: true });
      pairedBase.add(old);
    }
  }

  // Moved: a different section, or off the LCS of its section's common blocks.
  const moved = new Set<Snap>();
  const bySection = new Map<string, typeof pairs>();
  for (const p of pairs) {
    if (p.b.section !== p.h.section) {
      if (p.b.section !== undefined || p.h.section !== undefined) moved.add(p.h);
      continue;
    }
    if (p.h.section === undefined) continue;
    bySection.set(p.h.section, [...(bySection.get(p.h.section) ?? []), p]);
  }
  for (const group of bySection.values()) {
    const baseOrder = [...group].sort((x, y) => x.b.index! - y.b.index!).map((p) => p.h.label);
    const headOrder = [...group].sort((x, y) => x.h.index! - y.h.index!).map((p) => p.h.label);
    const keep = lcsKeep(baseOrder, headOrder);
    for (const p of group) if (!keep.has(p.h.label)) moved.add(p.h);
  }

  const changes: BlockChange[] = [];
  let unchanged = 0;
  const count = { renamed: 0, prose: 0, manifest: 0, moved: 0 };
  const paired = new Map(pairs.map((p) => [p.h.label, p]));
  const headOrder = [...head.values()].sort(
    (x, y) => (x.section ?? "~").localeCompare(y.section ?? "~") || (x.index ?? 0) - (y.index ?? 0) || x.label.localeCompare(y.label),
  );
  for (const h of headOrder) {
    const p = paired.get(h.label);
    if (!p) {
      changes.push({ change: "added", label: h.label, head: at(h) });
      continue;
    }
    const aspects: ChangeAspect[] = [];
    if (p.renamed) aspects.push("renamed");
    if (p.b.proseHash !== p.h.proseHash) aspects.push("prose");
    if (p.b.manifestHash !== p.h.manifestHash) aspects.push("manifest");
    if (moved.has(h)) aspects.push("moved");
    if (aspects.length === 0) {
      unchanged++;
      continue;
    }
    for (const a of aspects) count[a]++;
    changes.push({
      change: "changed",
      label: h.label,
      ...(p.renamed ? { from: p.b.label } : {}),
      aspects,
      base: at(p.b),
      head: at(h),
    });
  }
  const removed = [...base.values()].filter((b) => !pairedBase.has(b.label)).sort((x, y) => x.label.localeCompare(y.label));
  for (const b of removed) changes.push({ change: "removed", label: b.label, base: at(b) });

  return {
    summary: {
      added: changes.filter((c) => c.change === "added").length,
      removed: removed.length,
      changed: changes.filter((c) => c.change === "changed").length,
      unchanged,
      ...count,
    },
    changes,
  };
}

// ── Git: materialise a ref's folio as files ─────────────────────

/** `worktree` means the files on disk, uncommitted edits included. */
export const WORKTREE = "worktree";

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/**
 * Extract `folio` at `ref` into a temporary directory and return its path.
 * A path absent at that ref yields an empty directory — the folio did not
 * exist yet, so everything at the head is an addition, which is the truth.
 */
function materialise(repoRoot: string, ref: string, folio: string): { dir: string; cleanup: () => void } {
  const tmp = mkdtempSync(join(tmpdir(), "changeset-"));
  const tar = spawnSync("git", ["archive", "--format=tar", ref, "--", folio], { cwd: repoRoot, maxBuffer: 1 << 30 });
  if (tar.status === 0 && tar.stdout.length > 0) {
    const x = spawnSync("tar", ["-x", "-C", tmp], { input: tar.stdout });
    if (x.status !== 0) throw new Error(`could not unpack ${ref}:${folio}: ${x.stderr}`);
  } else if (!/did not match any files|pathspec/.test(String(tar.stderr))) {
    throw new Error(`git archive ${ref} failed: ${String(tar.stderr).trim()}`);
  }
  return { dir: join(tmp, folio), cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

export interface ComputeOptions {
  /** Repository holding the folio. */
  repoRoot: string;
  /** Folio root, relative to `repoRoot`. */
  folio: string;
  /** Default `origin/main`. */
  base?: string;
  /** A ref, or {@link WORKTREE} (the default) for the files on disk. */
  head?: string;
}

/**
 * The ChangeSet for `folio` between two refs.
 *
 * Throws when the base cannot be resolved. An unresolvable base is not "no
 * changes", and returning an empty set for it would read as a clean review.
 */
export function computeChangeSet(opts: ComputeOptions): ChangeSet {
  const repoRoot = resolve(opts.repoRoot);
  const folio = opts.folio.replace(/\/+$/, "") || ".";
  const baseRef = opts.base ?? "origin/main";
  const headRef = opts.head ?? WORKTREE;
  const baseCommit = git(repoRoot, ["rev-parse", "--verify", `${baseRef}^{commit}`]);
  const headCommit = headRef === WORKTREE ? null : git(repoRoot, ["rev-parse", "--verify", `${headRef}^{commit}`]);

  const b = materialise(repoRoot, baseCommit, folio);
  const h = headRef === WORKTREE ? { dir: join(repoRoot, folio), cleanup: () => {} } : materialise(repoRoot, headCommit!, folio);
  try {
    const { summary, changes } = compareSnapshots(snapshot(b.dir), snapshot(h.dir));
    return ChangeSetSchema.parse({
      $schema: CHANGESET_SCHEMA,
      folio,
      base: { ref: baseRef, commit: baseCommit },
      head: { ref: headRef, commit: headCommit },
      summary,
      changes,
    });
  } finally {
    b.cleanup();
    h.cleanup();
  }
}

// ── CLI ─────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes("--help") || !opt("folio")) {
    console.log(
      "usage: bun run folio-assistant-core/schemas/changeset.ts --folio <path> " +
        "[--repo <dir>] [--base origin/main] [--head <ref>|worktree] [--out <file>]",
    );
    process.exit(args.includes("--help") ? 0 : 2);
  }
  const repoRoot = resolve(opt("repo") ?? process.cwd());
  const cs = computeChangeSet({
    repoRoot,
    folio: relative(repoRoot, resolve(repoRoot, opt("folio")!)) || ".",
    base: opt("base"),
    head: opt("head"),
  });
  const json = JSON.stringify(cs, null, 2) + "\n";
  const out = opt("out");
  if (out) writeFileSync(out, json);
  else process.stdout.write(json);
  const s = cs.summary;
  console.error(
    `changeset ${cs.base.ref}..${cs.head.ref}: ${s.added} added, ${s.removed} removed, ` +
      `${s.changed} changed (${s.renamed} renamed, ${s.prose} prose, ${s.manifest} manifest, ${s.moved} moved), ` +
      `${s.unchanged} unchanged`,
  );
}
