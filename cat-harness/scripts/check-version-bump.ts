#!/usr/bin/env bun
/**
 * check-version-bump.ts — `instance-versioning.md` §4.1's gate.
 *
 * > `check:version-bump` compares the exported surface at `HEAD` against the
 * > last released tag for that instance and fails when the declared `version`
 * > is lower than the computed one. **It never *writes* the version** — the
 * > author may always bump further than computed (a prose rewrite released as
 * > minor is their call), but never less.
 *
 * The rules live in `schemas/version-bump.ts`, including the record of §4.1's
 * falsifier being run before any of this was written. This script is the
 * plumbing: find the baseline, produce two surfaces, compare.
 *
 * ## Four states, and only one of them is a pass
 *
 * | state | what it means |
 * |---|---|
 * | `ok` | the declared version clears the computed floor |
 * | `under` | it does not — the finding this gate exists for |
 * | `unreleased` | the instance is publishable and has never been tagged; there is no baseline to diff against |
 * | `undetermined` | the baseline could not be exported, or a version is a pseudo-version with no triple |
 *
 * **`undetermined` is not `ok`**, and keeping them apart is the whole reason
 * this is an enum. A gate that could not build the baseline and exited 0 would
 * report a clean run over a comparison it never made — `xom7`, `dh4f`, `a6kl`,
 * and the shape this repository pays for most often.
 *
 * ## Why the baseline is EXPORTED rather than read from a file
 *
 * `_kg/` is a build output: gitignored, absent in a fresh checkout, stale in a
 * dirty one, and never committed at a tag. So the baseline is produced by
 * checking the tag out into a throwaway worktree and running that commit's own
 * exporter. That is slow and it is the only honest option — a snapshot
 * committed alongside the code would be a second answer to "what did we
 * publish", free to disagree with the first.
 *
 * **Verified end-to-end, not only typechecked**: run against this
 * repository's one existing tag, `folio-assistant-v0.1.0`, the worktree
 * export produced 2035 subjects against HEAD's 2303. That is the path most
 * likely to be quietly broken — a failed export returning `undefined` scores
 * as `undetermined`, which looks like a cautious gate rather than a
 * non-functioning one.
 *
 * @module scripts/check-version-bump
 * @covers cat-harness
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { instanceRootFor, instanceRootsIn, readDeclaration, repoRootFor } from "../schemas/cat-harness.js";
import {
  type Bump,
  type SurfaceSubject,
  applyBump,
  clearsFloor,
  comparable,
  diffSurface,
  surfaceOf,
} from "../schemas/version-bump.js";

export type BumpState = "ok" | "under" | "unreleased" | "undetermined";

export interface BumpRow {
  instance: string;
  name: string;
  state: BumpState;
  declared?: string;
  baselineTag?: string;
  baselineVersion?: string;
  computed?: Bump;
  floor?: string;
  added?: number;
  removed?: number;
  /** Why the state is `undetermined` or `unreleased`. Never left to be inferred. */
  detail?: string;
}

export interface BumpReport {
  rows: BumpRow[];
  /** Why no row was produced, when none was. */
  note?: string;
}

function git(repoRoot: string, ...args: string[]): { ok: boolean; out: string } {
  const r = spawnSync("git", args, { cwd: repoRoot, encoding: "utf-8" });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim() };
}

/**
 * The release tags for an instance, newest version first.
 *
 * Convention `<name>-v<major>.<minor>.<patch>`, which is what the repository's
 * one existing tag uses. Sorted by the parsed triple rather than by git's tag
 * order or by string comparison — `v0.10.0` sorts before `v0.9.0` as a string,
 * and a baseline picked by the wrong ordering is a comparison against the
 * wrong release.
 */
export function releaseTags(repoRoot: string, name: string): { tag: string; version: string }[] {
  const { ok, out } = git(repoRoot, "tag", "--list", `${name}-v*`);
  if (!ok || out === "") return [];
  return out
    .split("\n")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
    .flatMap((tag) => {
      const m = new RegExp(`^${name}-v(\\d+\\.\\d+\\.\\d+)$`).exec(tag);
      return m === null ? [] : [{ tag, version: m[1]! }];
    })
    .sort((x, y) => {
      const px = x.version.split(".").map(Number);
      const py = y.version.split(".").map(Number);
      for (let i = 0; i < 3; i += 1) if (px[i]! !== py[i]!) return py[i]! - px[i]!;
      return 0;
    });
}

/**
 * Export the surface at `ref`, via a throwaway worktree running that commit's
 * own exporter.
 *
 * `node_modules` is symlinked in rather than installed: a historical commit's
 * lockfile may not even resolve any more, and the surface being measured is a
 * function of the repository's CONTENT, not of its dependency tree. `undefined`
 * on any failure, which the caller reports as `undetermined` — never as an
 * empty surface, which would score every subject as removed and call it major.
 */
export function surfaceAtRef(repoRoot: string, ref: string): SurfaceSubject[] | undefined {
  const wt = mkdtempSync(join(tmpdir(), "vbump-"));
  const out = join(wt, "surface.jsonld");
  try {
    if (!git(repoRoot, "worktree", "add", "-q", "--detach", wt, ref).ok) return undefined;
    try {
      symlinkSync(join(repoRoot, "node_modules"), join(wt, "node_modules"));
    } catch {
      // Already present, or not needed. Not fatal on its own — the export
      // below is what decides.
    }
    // The exporter moved under `cat-harness/` on 2026-09-20; a tag older than
    // that carries it at the root. Both are tried rather than one assumed,
    // because "the script is not there" and "the export failed" would
    // otherwise be one observation.
    const candidates = ["cat-harness/scripts/kg-export.ts", "scripts/kg-export.ts"];
    const script = candidates.find((c) => existsSync(join(wt, c)));
    if (script === undefined) return undefined;
    const r = spawnSync("bun", ["run", script, "--out", out], { cwd: wt, encoding: "utf-8", timeout: 600_000 });
    if (r.status !== 0 || !existsSync(out)) return undefined;
    return surfaceOf(JSON.parse(readFileSync(out, "utf-8")));
  } catch {
    return undefined;
  } finally {
    git(repoRoot, "worktree", "remove", "-f", wt);
    rmSync(wt, { recursive: true, force: true });
  }
}

/** Export the surface of the working tree as it stands. */
export function surfaceAtHead(repoRoot: string): SurfaceSubject[] | undefined {
  const out = join(mkdtempSync(join(tmpdir(), "vbump-head-")), "surface.jsonld");
  const script = ["cat-harness/scripts/kg-export.ts", "scripts/kg-export.ts"].find((c) =>
    existsSync(join(repoRoot, c)),
  );
  if (script === undefined) return undefined;
  const r = spawnSync("bun", ["run", script, "--out", out], { cwd: repoRoot, encoding: "utf-8", timeout: 600_000 });
  if (r.status !== 0 || !existsSync(out)) return undefined;
  return surfaceOf(JSON.parse(readFileSync(out, "utf-8")));
}

export function auditVersionBumps(repoRoot: string): BumpReport {
  const rows: BumpRow[] = [];
  const publishable: { root: string; name: string; version: string }[] = [];

  for (const root of instanceRootsIn(repoRoot)) {
    let decl;
    try {
      decl = readDeclaration(root);
    } catch {
      continue; // `check:publishable` is the census; this gate is about versions
    }
    // EVERY instance now carries a version — owner's ruling, 2026-09-23 — so
    // this no longer filters on publishability. It still skips a declaration
    // with no version, and that is NOT the same as the old skip: the type
    // allows absence (376 fixtures would break otherwise), so `check:publishable`
    // is what FAILS on it. Scoring a bump for an instance with no version would
    // be scoring against nothing.
    if (decl === undefined || decl.version === undefined) continue;
    publishable.push({ root, name: decl.name, version: decl.version });
  }

  if (publishable.length === 0) {
    return {
      rows,
      note:
        "no instance declaration parsed, so there is no version to hold to a floor. " +
        "That is a broken checkout rather than a clean run — see `bun run check:publishable` for the census",
    };
  }

  // Exported ONCE and reused: the surface is a property of the working tree,
  // not of the instance being scored, and re-exporting per instance would
  // multiply the slowest step by the number of publishable instances.
  const head = surfaceAtHead(repoRoot);

  for (const { root, name, version } of publishable) {
    const where = relative(repoRoot, root) || ".";
    const tags = releaseTags(repoRoot, name);
    if (tags.length === 0) {
      rows.push({
        instance: where,
        name,
        state: "unreleased",
        declared: version,
        detail: `no tag matching \`${name}-v*\` — this instance has never been released, so there is no baseline to diff against`,
      });
      continue;
    }
    const { tag, version: baselineVersion } = tags[0]!;
    if (head === undefined) {
      rows.push({
        instance: where,
        name,
        state: "undetermined",
        declared: version,
        baselineTag: tag,
        detail: "the working tree's own export failed, so no surface could be compared — this is NOT a pass",
      });
      continue;
    }
    const before = surfaceAtRef(repoRoot, tag);
    if (before === undefined) {
      rows.push({
        instance: where,
        name,
        state: "undetermined",
        declared: version,
        baselineTag: tag,
        detail: `could not export the graph at \`${tag}\` — the baseline is unknown, which is not the same as unchanged`,
      });
      continue;
    }
    const diff = diffSurface(before, head);
    const floor = applyBump(baselineVersion, diff.bump);
    const base: BumpRow = {
      instance: where,
      name,
      declared: version,
      baselineTag: tag,
      baselineVersion,
      computed: diff.bump,
      floor,
      added: diff.added.length,
      removed: diff.removed.length,
      state: "ok",
    };
    if (!comparable(version, floor)) {
      rows.push({
        ...base,
        state: "undetermined",
        detail: `\`${version}\` is a pseudo-version with no triple to compare — staging-tier (§3.3), and this gate does not score it`,
      });
      continue;
    }
    rows.push(clearsFloor(version, floor) ? base : { ...base, state: "under" });
  }

  return { rows };
}

export function formatReport(report: BumpReport): string {
  const out: string[] = ["Version bumps — computed from the exported surface (instance-versioning.md §4)", ""];
  for (const r of report.rows) {
    const mark = { ok: "✓", under: "✗", unreleased: "–", undetermined: "?" }[r.state];
    out.push(`  ${mark} ${r.instance.padEnd(24)} ${r.name.padEnd(22)} ${r.state}`);
    if (r.computed !== undefined) {
      out.push(
        `      ${r.baselineTag} (${r.baselineVersion}) → +${r.added} −${r.removed} = ${r.computed}, ` +
          `floor ${r.floor}, declared ${r.declared}`,
      );
    }
    if (r.detail !== undefined) out.push(`      – ${r.detail}`);
    if (r.state === "under") {
      out.push(
        `      the declared version is BELOW the computed floor. Bump to at least ${r.floor} — ` +
          "further is the author's call, less is a consumer's broken build",
      );
    }
  }
  if (report.note !== undefined) {
    out.push(`  – ${report.note}`);
  }
  out.push("");
  const count = (s: BumpState) => report.rows.filter((r) => r.state === s).length;
  out.push(
    `${report.rows.length} publishable instance(s): ${count("ok")} ok, ${count("under")} under, ` +
      `${count("unreleased")} unreleased, ${count("undetermined")} undetermined.`,
  );
  if (count("undetermined") > 0) {
    out.push("UNDETERMINED IS NOT A PASS — those comparisons were never made. See each row's reason above.");
  }
  out.push(
    "A rename reads as MAJOR (the old id is removed, a new one added). That is the conservative direction, " +
      "and it means a major does not imply capability was withdrawn — read `+`/`−` above for what happened.",
  );
  return out.join("\n");
}

if (import.meta.main) {
  const repoRoot = resolve(repoRootFor(instanceRootFor(import.meta.dir)));
  const report = auditVersionBumps(repoRoot);
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));

  // ADVISORY by default, matching its two siblings. `--strict` fails on an
  // under-bump AND on an undetermined row — the second deliberately, because a
  // comparison that could not be made is the state a strict gate most needs to
  // stop, not the one it may wave through.
  const bad = report.rows.filter((r) => r.state === "under" || r.state === "undetermined");
  if (process.argv.includes("--strict") && bad.length > 0) process.exit(1);
  process.exit(0);
}
