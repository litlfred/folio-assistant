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
 * A file with no manifest entry is unreachable; that check is hard, and as of
 * this commit `skills/` is clean under it.
 *
 * A manifest entry with no file is a dangling reference the registry will
 * publish, and 19 of those already exist, in three packages that predate this
 * test. They are not typos. `authoring-document` lists four skills of which
 * two — `document-authoring`, `normative-statements` — exist under
 * `folio-document-adapter/`, a directory carrying no manifest at all; so that
 * pair is a package rename left half-finished, not a missing file.
 * `authoring-math` lists six that exist nowhere in the tree. Resolving them
 * means deciding, per package, whether the skill was renamed, moved, or never
 * written — which is editorial work on someone else's packages, not a fix.
 *
 * So that direction is a ratchet rather than a gate: the known set is pinned
 * below and may only shrink. A new dangling entry fails; an existing one is
 * carried with its provenance recorded. Bean `fa/nup0`.
 *
 * The baseline is asserted exactly, not as a count. A count permits a swap —
 * fix one, introduce another — and reports the ledger balanced.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
 * Manifest entries with no file behind them, measured on this branch
 * 2026-09-18. This list may only shrink — see the note above. Removing an
 * entry here without fixing the underlying package turns the other test red.
 */
const KNOWN_DANGLING: readonly string[] = [
  "authoring-document/document-authoring",
  "authoring-document/document-publishing",
  "authoring-document/document-structure",
  "authoring-document/normative-statements",
  "authoring-math/hypothesis-generation",
  "authoring-math/latex-authoring",
  "authoring-math/lean-formalization",
  "authoring-math/proof-verification",
  "authoring-math/scientific-critical-thinking",
  "authoring-math/scientific-visualization",
  "authoring-who-smart-guidelines/bpmn-authoring",
  "authoring-who-smart-guidelines/content-review",
  "authoring-who-smart-guidelines/dmn-authoring",
  "authoring-who-smart-guidelines/fhir-validation",
  "authoring-who-smart-guidelines/ig-publication",
  "authoring-who-smart-guidelines/l2-dak-authoring",
  "authoring-who-smart-guidelines/l3-fhir-authoring",
  "authoring-who-smart-guidelines/quality-control",
  "authoring-who-smart-guidelines/terminology-management",
];

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
    for (const p of packages()) {
      const onDisk = new Set(skillFilesIn(p.dir));
      for (const s of p.listed) {
        if (!onDisk.has(s)) dangling.push(`${p.name}/${s}`);
      }
    }
    expect(dangling.sort()).toEqual([...KNOWN_DANGLING].sort());
  });

  test("the known-dangling list has no entry that is now resolved", () => {
    // The ratchet's other half. Without it, fixing one of the 19 turns the
    // test above red and the cheapest way out is to re-add the broken entry.
    const live = new Set<string>();
    for (const p of packages()) {
      const onDisk = new Set(skillFilesIn(p.dir));
      for (const s of p.listed) if (!onDisk.has(s)) live.add(`${p.name}/${s}`);
    }
    const stale = [...KNOWN_DANGLING].filter((k) => !live.has(k));
    expect(stale).toEqual([]);
  });
});
