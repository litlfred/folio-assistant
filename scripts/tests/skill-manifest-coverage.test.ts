/**
 * Every skill `.md` in a package is listed in that package's manifest.
 *
 * Found 2026-09-18. `skills/folio-core/` held 58 skill files and its
 * `package-manifest.json` listed 49. The nine unlisted ones — among them
 * `directory-conventions`, `process-state` and `swarm-management`, all added
 * days earlier — were on disk and reachable by anyone who already knew the
 * path, and invisible to everyone else.
 *
 * That is the failure mode worth naming, because it does not look like one.
 * `scripts/generate-registry.ts` builds the skill registry from
 * `loadPackageManifests()`, so the manifest is what an agent asking the
 * knowledge graph for a skill actually sees. A file omitted from it is not
 * broken, not red, and not missing — it is simply never offered. The author
 * who added it can still open it, which is exactly why nobody notices.
 *
 * Nothing checked the two against each other before this test: the manifest is
 * hand-maintained and adding a skill is two steps, of which only the first has
 * any feedback.
 *
 * Direction matters, and the two directions are not in the same state.
 *
 * A file with no manifest entry is unreachable; that check is hard.
 *
 * A manifest entry with no skill behind it is a dangling reference the registry
 * will publish. That direction was a ratchet over 19 pinned entries. Bean
 * `nup0` resolved them, and the resolution changed what the check MEANS:
 *
 * **"A skill exists" was two different questions.** This file asked whether
 * `<package>/<name>.md` was present. `scripts/known-skills.ts` — extracted
 * precisely so checkers could not disagree about this — also counts
 * `schemas/skills/<name>/`, a directory of input/output JSON schemas with no
 * instruction body. Eleven of the nineteen "dangling" entries were skills that
 * exist by the shared definition and not by this file's narrower one, and
 * `docs/skills.md` documents them as deliberate: those packages "ship the
 * manifest + JSON definitions" with bodies TBD.
 *
 * So this now uses `knownSkills()`. Two definitions of existence in one
 * repository is the defect; the checker that disagreed with the shared one was
 * this file.
 *
 * What remained after that were eight real entries, all fixed rather than
 * pinned: four were a completed rename whose manifest never moved, one claimed
 * another package's skill, and three named skills that `git log` shows were
 * never added in any commit.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { knownSkills } from "../known-skills.js";

const SKILLS = join(import.meta.dir, "../../skills");

/** Not skills: companion modules, the manifest itself, package metadata. */
function skillFilesIn(pkgDir: string): string[] {
  return readdirSync(pkgDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3));
}

function packages(): Array<{ name: string; dir: string; listed: string[] }> {
  if (!existsSync(SKILLS)) return [];
  const out: Array<{ name: string; dir: string; listed: string[] }> = [];
  for (const d of readdirSync(SKILLS, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = join(SKILLS, d.name);
    const manifest = join(dir, "package-manifest.json");
    if (!existsSync(manifest)) continue;
    const parsed = JSON.parse(readFileSync(manifest, "utf-8")) as { skills?: string[] };
    out.push({ name: d.name, dir, listed: parsed.skills ?? [] });
  }
  return out;
}

/**
 * Manifest entries with nothing behind them. **Empty, and it should stay that
 * way** — bean `nup0` cleared all nineteen. Kept as a list rather than deleted
 * so a future entry is added here consciously, with the reason, instead of the
 * check being loosened.
 */
const KNOWN_DANGLING: readonly string[] = [];

describe("skill package manifests cover the package", () => {
  test("there are packages to check — otherwise this suite proves nothing", () => {
    // Without this, a rename of `skills/` turns every assertion below into a
    // vacuous pass over an empty list, which is the defect being guarded
    // against wearing a green tick.
    expect(packages().length).toBeGreaterThan(3);
  });

  test("every skill file is listed in its package manifest", () => {
    const unlisted: string[] = [];
    for (const p of packages()) {
      const listed = new Set(p.listed);
      for (const s of skillFilesIn(p.dir)) {
        if (!listed.has(s)) unlisted.push(`${p.name}/${s}.md`);
      }
    }
    expect(unlisted).toEqual([]);
  });

  test("no NEW manifest entry is missing its skill file", () => {
    const dangling: string[] = [];
    const known = knownSkills(join(import.meta.dir, "../.."));
    for (const p of packages()) {
      // The shared definition — `<name>.md` in a skill directory OR an
      // input/output contract under `schemas/skills/<name>/`. Asking only the
      // first question is what produced eleven false "dangling" entries.
      for (const s of p.listed) {
        if (!known.has(s)) dangling.push(`${p.name}/${s}`);
      }
    }
    expect(dangling.sort()).toEqual([...KNOWN_DANGLING].sort());
  });

  test("the known-dangling list has no entry that is now resolved", () => {
    // The ratchet's other half. Without it, fixing one of the 19 turns the
    // test above red and the cheapest way out is to re-add the broken entry.
    const live = new Set<string>();
    const known = knownSkills(join(import.meta.dir, "../.."));
    for (const p of packages()) {
      for (const s of p.listed) if (!known.has(s)) live.add(`${p.name}/${s}`);
    }
    const stale = [...KNOWN_DANGLING].filter((k) => !live.has(k));
    expect(stale).toEqual([]);
  });
});
