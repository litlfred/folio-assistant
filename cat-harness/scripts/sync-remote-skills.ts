#!/usr/bin/env bun
/**
 * MATERIALIZE a remote package's declared skills, at a PINNED commit, so
 * `skill_fetch` can serve them.
 *
 * @module cat-harness/scripts/sync-remote-skills
 *
 * Issue #556, bean `wlqd`. Owner, 2026-09-24:
 *
 * 1. **"Implement via #556"** — the wrappers under `skills/remote-packages/`
 *    said `shallow-clone`, `weekly`, `autoUpdate: true`, and nothing
 *    performed any of it. This is the thing that performs it.
 * 2. **"Commit, pinned, read-only"** — the synced bytes are COMMITTED, at the
 *    commit the wrapper pins, with sha256 fixity per file. That is the
 *    repository's materialized-content rule, so `check:materialized-fixity`
 *    fails an edit in place with no new code: a synced skill is somebody
 *    else's bytes, and a change to them is a re-sync, never a hand edit.
 *
 * ## Why a pinned commit and never a branch
 *
 * `ref: "main"` with `autoUpdate: true` would ingest whatever upstream pushes,
 * unreviewed, as instructions an agent then follows. A skill body IS a prompt;
 * an unpinned one is an unreviewed prompt from a stranger. So a wrapper that
 * declares a `sync` must pin a full 40-character commit, and an update is a
 * deliberate change to that pin, reviewed as a diff of the materialized
 * files. {@link pinnedRef} refuses anything else.
 *
 * ## Layout — one package per skill
 *
 * Upstream uses the Agent Skills layout, `<path>/<skill>/SKILL.md`, with
 * `references/`, `scripts/` and `assets/` beside it, and SKILL.md links to
 * them relatively. This instance serves FLAT packages, `<package>/<skill>.md`.
 * Flattening several upstream skills into one package would collide their
 * `references/` directories and break their links, so each skill becomes its
 * own package: `skills/<skill>/<skill>.md` is the upstream SKILL.md renamed,
 * and everything else keeps its upstream relative path. Discovery needs no
 * change, and every relative link still resolves.
 *
 * ## What is written, per skill
 *
 * - every upstream file under `<path>/<skill>/`, byte for byte;
 * - `materialization.json` — one `materialization` record per file, in the
 *   shape `check:materialized-fixity` already walks;
 * - `package-manifest.json` — THIS instance's wrapper for the package, which
 *   is ours rather than upstream's and so carries no fixity.
 *
 * Usage:
 *   bun run cat-harness/scripts/sync-remote-skills.ts            # fetch + write
 *   bun run cat-harness/scripts/sync-remote-skills.ts --check    # offline: is every declared skill materialized at its pin?
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { kgRoots } from "./known-skills.js";

const INSTANCE = join(import.meta.dir, "..");

/** The record file written beside a materialized skill. */
export const RECORD_FILE = "materialization.json";
export const RECORD_SCHEMA = "folio-remote-skill/v1";

export interface Wrapper {
  file: string;
  name: string;
  description: string;
  repo: string;
  ref: string;
  path: string;
  maintainer: string;
  sync?: { strategy: string; frequency: string; autoUpdate: boolean };
  wrapper: { description: string; skills: string[]; lifecycleStages?: string[] };
}

/** A full commit SHA, or the reason it is not one. */
export function pinnedRef(ref: string): { ok: true } | { ok: false; why: string } {
  if (/^[0-9a-f]{40}$/.test(ref)) return { ok: true };
  return {
    ok: false,
    why: `ref \`${ref}\` is not a full commit SHA — a synced skill is a prompt an agent follows, so it is pinned to a commit and moved only by a reviewed change`,
  };
}

/** Where the upstream skill directory is, inside a clone. */
export function upstreamSkillDir(clone: string, w: Pick<Wrapper, "path">, skill: string): string {
  const base = w.path.replace(/^\/+|\/+$/g, "");
  return base ? join(clone, base, skill) : join(clone, skill);
}

/**
 * Is this directory a synced skill — somebody else's bytes, pinned?
 *
 * For the checks that LINT authored text (paths, links, headings). A finding
 * in upstream's own prose is not ours to fix: editing it would fork the
 * pinned copy, which `check:materialized-fixity` exists to refuse. Those
 * checks skip it and leave fixity to vouch for it. The record is the
 * declaration; a directory name is not asked.
 */
export function isSyncedSkillDir(dir: string): boolean {
  try {
    const r = JSON.parse(readFileSync(join(dir, RECORD_FILE), "utf8")) as { $schema?: string };
    return r.$schema === RECORD_SCHEMA;
  } catch {
    return false;
  }
}

export function wrappersIn(skillsDir: string): Wrapper[] {
  const dir = join(skillsDir, "remote-packages");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: f, ...(JSON.parse(readFileSync(join(dir, f), "utf8")) as Omit<Wrapper, "file">) }));
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p));
    else if (e.isFile()) out.push(p);
  }
  return out.sort();
}

const sha256 = (p: string): string => createHash("sha256").update(readFileSync(p)).digest("hex");

/**
 * The record for one materialized skill. `localPath` is INSTANCE-relative,
 * which is what `check:materialized-fixity` resolves it against.
 */
export function buildRecord(
  w: Wrapper,
  skill: string,
  pkgDir: string,
  instanceRoot: string,
  upstreamRel: (local: string) => string,
  at: string,
): Record<string, unknown> {
  const repoBase = w.repo.replace(/\.git$/, "");
  const files = filesUnder(pkgDir)
    .filter((p) => ![RECORD_FILE, "package-manifest.json"].includes(relative(pkgDir, p)))
    .map((p) => {
      const local = relative(pkgDir, p);
      return {
        id: `${skill}/${local}`,
        name: local,
        materialization: {
          state: "materialized",
          provenance: { upstream: `${repoBase}/blob/${w.ref}/${upstreamRel(local)}` },
          localPath: relative(instanceRoot, p),
          bytes: statSync(p).size,
          // ARCHIVAL, not working: these bytes are the reviewed contract at
          // the pin. A working copy may be quietly re-fetched when it rots;
          // this one may only move by a reviewed change to the pin.
          purpose: "archival",
          fixity: { algorithm: "sha256", digest: sha256(p) },
          materializedAt: at,
          upstreamVersion: w.ref,
        },
      };
    });
  return {
    $schema: RECORD_SCHEMA,
    skill,
    package: w.name,
    repo: w.repo,
    ref: w.ref,
    wrapper: `remote-packages/${w.file}`,
    note: "Somebody else's bytes, pinned. Do not edit in place: change the pin in the wrapper and re-run `bun run sync:remote-skills`.",
    files,
  };
}

const LICENCE_NAMES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENCE", "COPYING"];

/** The licence governing a skill: its own, else the upstream root's. */
export function upstreamLicence(clone: string, skillDir: string): { path: string; inSkill: boolean } | undefined {
  for (const n of LICENCE_NAMES) if (existsSync(join(skillDir, n))) return { path: join(skillDir, n), inSkill: true };
  for (const n of LICENCE_NAMES) if (existsSync(join(clone, n))) return { path: join(clone, n), inSkill: false };
  return undefined;
}

function git(args: string[], cwd?: string): void {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr.trim()}`);
}

/** Fetch exactly one commit, shallowly. */
function fetchAt(repo: string, ref: string): string {
  const dir = mkdtempSync(join(tmpdir(), "remote-skill-"));
  git(["init", "-q", dir]);
  git(["remote", "add", "origin", repo], dir);
  git(["fetch", "-q", "--depth", "1", "origin", ref], dir);
  git(["checkout", "-q", "FETCH_HEAD"], dir);
  return dir;
}

/** Offline: every declared skill is materialized, at the wrapper's pin, from that wrapper. */
export function checkMaterialized(skillsDir: string): string[] {
  const problems: string[] = [];
  for (const w of wrappersIn(skillsDir)) {
    if (!w.sync) continue;
    const pin = pinnedRef(w.ref);
    if (!pin.ok) {
      problems.push(`${w.file}: ${pin.why}`);
      continue;
    }
    if (w.sync.autoUpdate) problems.push(`${w.file}: autoUpdate is true — a pinned sync never updates itself`);
    for (const skill of w.wrapper.skills) {
      const rec = join(skillsDir, skill, RECORD_FILE);
      if (!existsSync(rec)) {
        problems.push(`${w.file}: \`${skill}\` is declared and not materialized — run \`bun run sync:remote-skills\``);
        continue;
      }
      const r = JSON.parse(readFileSync(rec, "utf8")) as { ref?: string; package?: string };
      if (r.ref !== w.ref) problems.push(`${skill}: materialized at ${r.ref}, but ${w.file} pins ${w.ref} — re-sync`);
      if (r.package !== w.name) problems.push(`${skill}: materialized from \`${r.package}\`, but declared by \`${w.name}\``);
      if (!existsSync(join(skillsDir, skill, `${skill}.md`))) problems.push(`${skill}: no \`${skill}.md\` entry point`);
      if (!LICENCE_NAMES.some((n) => existsSync(join(skillsDir, skill, n)))) {
        problems.push(`${skill}: no licence file beside the copy — the notice must travel with it`);
      }
    }
  }
  return problems;
}

/**
 * NOTICE names every synced package, at its current pin (owner, 2026-09-24:
 * third-party skills keep their own licence and are listed in NOTICE). A pin
 * moved without NOTICE following would credit bytes that are no longer here.
 */
export function checkNotice(noticeText: string, wrappers: Wrapper[]): string[] {
  const problems: string[] = [];
  for (const w of wrappers) {
    if (!w.sync || w.wrapper.skills.length === 0) continue;
    const repo = w.repo.replace(/\.git$/, "");
    if (!noticeText.includes(repo)) problems.push(`NOTICE does not name ${repo}, which ${w.file} syncs`);
    else if (!noticeText.includes(w.ref)) problems.push(`NOTICE names ${repo} but not its current pin ${w.ref}`);
  }
  return problems;
}

function sync(skillsDir: string, instanceRoot: string): number {
  let failures = 0;
  const at = new Date().toISOString();
  for (const w of wrappersIn(skillsDir)) {
    if (!w.sync) continue;
    const pin = pinnedRef(w.ref);
    if (!pin.ok) {
      console.error(`  ✗ ${w.file}: ${pin.why}`);
      failures++;
      continue;
    }
    console.log(`${w.name} @ ${w.ref.slice(0, 12)}`);
    const clone = fetchAt(w.repo, w.ref);
    try {
      for (const skill of w.wrapper.skills) {
        const src = upstreamSkillDir(clone, w, skill);
        if (!existsSync(join(src, "SKILL.md"))) {
          // NOT SKIPPED QUIETLY: a declared name upstream does not have is a
          // false declaration, and `smart-launch` was one for months.
          console.error(`  ✗ ${skill}: upstream has no ${relative(clone, join(src, "SKILL.md"))} at this commit`);
          failures++;
          continue;
        }
        const dst = join(skillsDir, skill);
        rmSync(dst, { recursive: true, force: true });
        cpSync(src, dst, { recursive: true });
        renameSync(join(dst, "SKILL.md"), join(dst, `${skill}.md`));
        // THE LICENCE TRAVELS WITH THE COPY. A permissive licence (MIT and its
        // kin) is conditional on its notice being kept with every copy, and
        // upstream keeps that notice at its ROOT, outside the skill directory
        // that is copied. So it is copied in beside the skill, under fixity
        // like every other byte. A skill with no licence anywhere upstream is
        // refused: bytes nobody granted are bytes this repository may not hold.
        const licence = upstreamLicence(clone, src);
        if (!licence) {
          rmSync(dst, { recursive: true, force: true });
          console.error(`  ✗ ${skill}: no licence file in the skill or at the upstream root — not copied`);
          failures++;
          continue;
        }
        const licenceLocal = licence.inSkill ? relative(src, licence.path) : "LICENSE";
        if (!licence.inSkill) cpSync(licence.path, join(dst, licenceLocal));
        const upstreamRel = (local: string): string =>
          local === licenceLocal && !licence.inSkill
            ? relative(clone, licence.path)
            : relative(clone, join(src, local === `${skill}.md` ? "SKILL.md" : local));
        const record = buildRecord(w, skill, dst, instanceRoot, upstreamRel, at);
        writeFileSync(join(dst, RECORD_FILE), `${JSON.stringify(record, null, 2)}\n`);
        writeFileSync(
          join(dst, "package-manifest.json"),
          `${JSON.stringify(
            {
              name: skill,
              version: "0.0.0",
              description: `Materialized from ${w.name} (${w.repo}) at ${w.ref}. Read-only: see ${RECORD_FILE}.`,
              skills: [skill],
              docker: { baseImage: "ubuntu:24.04", aptPackages: [] },
              lifecycleStages: w.wrapper.lifecycleStages ?? [],
            },
            null,
            2,
          )}\n`,
        );
        console.log(`  ✓ ${skill} — ${(record.files as unknown[]).length} file(s)`);
      }
    } finally {
      rmSync(clone, { recursive: true, force: true });
    }
  }
  return failures;
}

if (import.meta.main) {
  const skillsDir = kgRoots(INSTANCE)[0];
  if (!skillsDir) {
    console.error("  ✗ this instance declares no knowledge-graph directory to materialize into");
    process.exit(1);
  }
  if (process.argv.includes("--check")) {
    const noticePath = join(INSTANCE, "..", "NOTICE");
    const problems = [
      ...checkMaterialized(skillsDir),
      ...checkNotice(existsSync(noticePath) ? readFileSync(noticePath, "utf8") : "", wrappersIn(skillsDir)),
    ];
    const declared = wrappersIn(skillsDir).filter((w) => w.sync).flatMap((w) => w.wrapper.skills);
    console.log(`Remote skills — ${declared.length} declared by a syncing wrapper`);
    if (declared.length === 0) {
      console.log("  ✓ none declared — the directory was read and no wrapper syncs");
      process.exit(0);
    }
    for (const p of problems) console.error(`  ✗ ${p}`);
    if (problems.length) process.exit(1);
    console.log("  ✓ every declared skill is materialized at its wrapper's pin");
    process.exit(0);
  }
  process.exit(sync(skillsDir, INSTANCE) ? 1 : 0);
}
