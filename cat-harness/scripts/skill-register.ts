#!/usr/bin/env bun
/**
 * Regenerate everything adding a skill stales, and REFUSE a skill that arrived
 * without its declarations — one command, beans `v625` and `nfv3`.
 *
 * ## Why this exists rather than a documented list
 *
 * `v625` cost twice in one hour on 2026-09-26. Six skills reached `main` with
 * no package-manifest entry and no reference page; the fix merged; forty
 * minutes later a seventh landed with the same gap, from a different session.
 *
 * The second one rules out documentation as the remedy. The commit that fixed
 * the first six wrote the chain out in full, and it was written **before** the
 * next author needed it. Prose in a merged commit is not reachable from the
 * moment of authoring — so the remedy has to be a command, not a paragraph.
 *
 * ## Two commands became one, and the owner chose which name
 *
 * `nfv3` built a second command — `skills:register` → `register-skills.ts` —
 * one letter away from this one, found in a `package.json` conflict rather than
 * by looking. It contributed three things this lacked: a **CI gate**, so the
 * obligation is refused rather than merely documented; a **dangling**-entry
 * report; and a **retired-key strip**. Those are below. Its fourth behaviour,
 * writing the manifest entry for you, was deliberately dropped — see
 * §"What it does not do".
 *
 * The owner settled the name on 2026-09-26: this one, because it was already on
 * `main`, so every other session already calls it. Consolidating was put to a
 * person rather than decided by whoever pushed next, since retiring a command is
 * removing a durable artefact (`deletion-requires-confirmation`).
 *
 * ## The list was DERIVED BY EXPERIMENT, and my remembered one was wrong
 *
 * This matters more than the list. Three times before measuring, this chain
 * was written down from memory of incidents, and each time it was wrong:
 *
 * - it named `gen-docs-pages`, `docs:harness`, `translation:index` and
 *   `state:visualizer`, **none of which adding a skill stales**. They had gone
 *   red in the same sessions for unrelated reasons and were attributed here.
 * - it omitted `glossary:page`, `docs:auto`, `kg:audit` and `kg:detangle`,
 *   **all four of which it does stale**. Two were already red on a red `main`,
 *   so they were filtered out as "not mine"; two were masked (below).
 *
 * The method that worked: add a throwaway skill to a green tree, run each
 * check **individually**, and subtract a baseline measured the same way.
 *
 * `nfv3` then made the same error a **fourth** time from the other direction,
 * inferring nine steps — `glossary:export`, `uml:overview`, `prov:qaqc` and
 * `tools:viz` on top of the five — from what went red in a branch that had also
 * added three Tool nodes and merged 20 translated pages.
 *
 * **And one of those four was right.** `uml:overview` IS staled by adding a
 * skill, measured the same day and added below as step 6. So the fourth wrong
 * answer was wrong by including three, and the five it was corrected to were
 * wrong by excluding one — the correction dropped a correct entry on the
 * authority of a sweep that had been perturbed. Neither list was arrived at
 * badly and neither was right.
 *
 * That is the reason the limit above is stated as a limit rather than a
 * procedure: no entry joins this chain without an isolated red-then-green run,
 * and an isolated run is still not proof, so {@link main} verifies at runtime
 * instead of trusting the list.
 *
 * ## `bun run gates` CANNOT derive this, and that is the subtle part
 *
 * The first experiment ran `gates` and reported four stale artefacts.
 * `kg:audit:check` and `kg:detangle:check` were green in it — and red when run
 * on their own against the identical tree. `bun test` runs those writers, so
 * by the time the checks execute the artefacts have been repaired. That is
 * bean `ymsu`'s blind spot: a gate that writes what a later gate reads.
 *
 * Running the checks in sequence perturbs too — a later loop found
 * `kg:audit:check` green again, because something earlier in it wrote.
 * **Only an isolated run of one check against a known tree measures anything**,
 * which is why the table below cites per-check runs and not a `gates` summary.
 *
 * ## The seven, each measured alone, red before and green after
 *
 * | writer | the check it clears |
 * |---|---|
 * | `skill:commands` | `skill:commands:check` — added 2026-09-30 (`j6t3`): red with 37 missing and one undeclared, green after |
 * | `skills:docs` | `skills:docs:check` |
 * | `glossary:page` | `check:glossary` |
 * | `docs:auto` | `docs:auto:check` |
 * | `kg:audit` | `kg:audit:check` |
 * | `kg:detangle` | `kg:detangle:check` |
 * | `uml:overview` | `uml:overview:check` |
 *
 * `check:ci-invocations` also goes green, and is not a step of its own: it
 * re-runs the CI invocations, one of which is step 1, so it is downstream of it.
 *
 * Step 1 was measured as a direct `gen-skill-docs.ts` invocation and is now the
 * `skills:docs` npm script; step 6 likewise names `uml:overview` rather than
 * `gen-uml-overview.ts`. Same programs. Routing them through scripts is what
 * `check:ci-invocations` asks of every CI step, and a chain that names scripts
 * uniformly can be asserted against `package.json` — {@link missingScripts}.
 *
 * **A step is an ARGUMENT LIST rather than a bare name, and that is `v625`'s
 * shape kept over this file's own.** `v625` reached `main` with
 * `readonly string[]`, because it needed `gen-skill-docs.ts --check` and there
 * was then no `skills:docs:check` script to name. Both halves were right about
 * something: a list can carry a flag, and a NAME can be asserted against
 * `package.json`. The merge keeps the list shape and populates it with script
 * names — this branch supplies the two aliases `main` lacked — so nothing has
 * to choose between expressiveness and assertability.
 *
 * It also removes a defect a merge would otherwise have shipped silently:
 * `v625`'s step arrived in the array shape while this file's field was typed
 * `string`, and `git` merged the two without complaint.
 *
 * **`gen-uml-overview` was added as a sixth step on the day this shipped**, and
 * how it was missed is the same lesson one turn later. The per-check sweep that
 * derived the first five ran the checks IN SEQUENCE, and sequence perturbs —
 * something earlier in that loop wrote, so `uml:overview:check` read as green.
 * It surfaced an hour later when an ordinary skill EDIT moved the kg-qa and
 * detangle sidecars and the UML overview, which renders that tree, went stale
 * behind them.
 *
 * So the derivation method has a stated limit: isolating one check against a
 * known tree is necessary and was not sufficient, because a check can be
 * perturbed by a NEIGHBOUR in the same sweep. The runtime verification below is
 * what catches that — it reports the checks' verdicts, so an under-declared
 * list fails loudly rather than passing quietly.
 *
 * ## Order: five were independent, and the SIXTH is not — measured 2026-09-27
 *
 * This section said the chain was order-independent, on a real measurement:
 * running all **five** in reverse and re-checking left them green. That
 * measurement predates `uml:overview`, and the six-step chain does NOT have the
 * property:
 *
 *     declare a `qa` directory for a nested instance
 *       -> kg:audit writes its sidecars
 *       -> uml:overview renders the QA tree, adding pages
 *       -> docs:auto:check goes STALE, and docs:auto ran two steps earlier
 *
 * Measured by running the command: pass 1 left `docs:auto:check` red, pass 2
 * exited 0. **One pass is not a fixed point**, and the order below is now
 * dependency-bearing whether or not it was designed to be.
 *
 * The order is deliberately NOT changed to fix it. Putting `docs:auto` last would
 * close this pair and might open another, and the verification loop already
 * reports the truth: every check runs after the writes and the command exits
 * non-zero while any is red, so a stale artefact is named rather than shipped.
 * What was wrong was this paragraph asserting a property the chain had since
 * lost — a measurement whose conclusion outlived the thing it measured.
 *
 * ## Why it shells out instead of importing
 *
 * Every step runs as the package script CI runs. Importing the generators would
 * be faster and would be wrong twice over: the versions would be free to drift
 * from what the gate set actually executes, and
 * `declared-directory-resolves.test.ts` guards a real defect where IMPORTING a
 * generator wrote files. A registration command that writes by import is the
 * unguarded entry point that test exists to catch.
 *
 * ## Third state
 *
 * Exit 2 — never 0, never 1 — when the question could not be answered: no
 * package manifests found, or a chain step that is not a registered script. A
 * sweep that examined nothing has cleared nothing, and this repository has paid
 * for the opposite reading (bean `dh4f`).
 *
 * ## What it does not do
 *
 * It does not add the package-manifest entry. That is the author's assertion
 * that the file is a skill of that package, not a derivable fact, and a
 * command that guessed it would register files someone was still drafting.
 * `skill package manifests cover the package` fails loudly when it is missing,
 * and this script says so rather than papering over it.
 *
 * `nfv3`'s command did write it. That behaviour was dropped rather than merged,
 * on this file's own argument — which is the one place the consolidation took
 * the OLDER design over the newer one, deliberately.
 *
 * It also does not prune a manifest entry whose file is gone. See
 * {@link dangling}.
 *
 * @module cat-harness/scripts/skill-register
 * @covers skills — the kind this gate JUDGES. It reads a skill's declarations:
 *   its manifest entry, its front matter, and whether the manifest points at
 *   anything absent. Those live in the directories that declare `skills`. The
 *   derived `folio` reference pages and `qa` sidecars are produced by the chain
 *   and judged by their own gates (`skills:docs:check`, `kg:audit:check`), so
 *   claiming them here would report coverage this gate does not provide. `kg`
 *   was written in `nfv3`'s version first and is not a kind at all — it names a
 *   graph LAYER, which `audit-coverage`'s own test caught
 *
 *   The subject set is resolved from the instance's declarations via
 *   `kgDirectories`, never from a list written here
 * @covers cat-harness — `v625`'s declaration, RETAINED across the merge rather
 *   than reversed, and flagged rather than quietly kept. Both names are real
 *   graph kinds (42 are registered in `BASE_GRAPH_KINDS`; `audit-coverage`
 *   validates a `@covers` name against nothing, so being accepted is not
 *   evidence of being apt), and both are declared by many other gates, so
 *   `audit:coverage:require-all` is unaffected whichever stands. The reason to
 *   query it: in `cat-harness.json` the `cat-harness` kind is declared on the
 *   `schemas/` directories, and this gate does not read a schema. Reversing a
 *   sibling's deliberate line inside a merge resolution is the wrong place to
 *   settle it, so it stays and the question is on the PR.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { corpusScopeFor, kgDirectories } from "./known-skills.js";
import { packageDirsIn } from "./skill-topics.js";
import { buildQaResult, writeQaResult } from "./qa-results.js";

/**
 * This instance's root — `cat-harness/`, one level up from `scripts/`.
 *
 * NOT `process.cwd()`, and that is a correction rather than a preference.
 * `writeQaResult` composes `<root>/test/results/`, so a cwd-relative root puts
 * the sidecar wherever the command happened to be invoked from — measured:
 * run from the repository root it landed in a fresh top-level `test/results/`,
 * a directory no instance declares and no sweep reads. Every sibling here
 * derives the root from its own module path for that reason
 * (`check-layout-norms.ts`, `check-harness-state.ts`), so the sidecar goes to
 * the same place whoever runs the command and from wherever.
 */
const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ───────────────────────── the declarations, audited ───────────────────────── */

/** A package directory that declares which skills it holds. */
export interface SkillPackage {
  name: string;
  dir: string;
  manifest: string;
  /** Names the manifest lists. */
  listed: string[];
  /** Skill basenames actually present as `<name>.md`. */
  present: string[];
}

/**
 * The retired front-matter keys a registration may strip.
 *
 * Deliberately NOT a second copy of `RETIRED` in
 * `check-retired-front-matter.ts`: that registry is the authority on what is
 * retired and why, and it refuses an entry without a record to point at. This
 * is the subset a *registration* can act on mechanically, which today is the
 * one key that keeps coming back. A key retired for a graph kind this command
 * does not touch has no business here.
 */
const STRIPPABLE = ["roles", "package", "capability"] as const;

/**
 * Skill packages, found in the directories the INSTANCE_ROOT DECLARES.
 *
 * Not `join(instance, "skills")`. That literal is what
 * `check-declared-paths.ts` refuses, and rightly — `cat-harness.json` owns the
 * `skills` entry's path, ids are stable across a relocation while paths are
 * not (bean `iwtn` moved this very id), and a command that hardcodes it audits
 * the wrong tree the day somebody moves it.
 *
 * Asking the declaration also widens the subject correctly rather than by
 * accident: `kgDirectories` resolves a dependent instance's packages too
 * (`folio-assistant-core/skills/` and `who-iris/skills/`
 * here), so a skill added in one of those is judged by the same gate instead of
 * being a case nobody thought of.
 *
 * A package is a directory holding `package-manifest.json`, which is the same
 * predicate `tests/skill-manifest-coverage.test.ts` uses — the test that fails
 * when this command has not been run.
 */
export function skillPackages(instance: string = INSTANCE_ROOT): SkillPackage[] {
  const out: SkillPackage[] = [];
  // The corpus on the platform's own run (placement PR0): what the mirrors
  // used to add — `fhir-harness/skills/`'s packages among them — is asked of
  // the checkout now.
  for (const graph of kgDirectories(instance, corpusScopeFor(instance))) {
    for (const d of packageDirsIn(graph.absPath)) {
      const dir = d.dir;
      const manifest = join(dir, "package-manifest.json");
      if (!existsSync(manifest)) continue;
      const parsed = JSON.parse(readFileSync(manifest, "utf-8")) as { skills?: string[] };
      out.push({
        // Qualified by its graph, so two instances' packages of the same name
        // are two rows rather than one ambiguous finding.
        name: graph.id === "skills" ? d.name : `${graph.id}/${d.name}`,
        dir,
        manifest,
        listed: parsed.skills ?? [],
        present: readdirSync(dir)
          .filter((f) => f.endsWith(".md"))
          .map((f) => f.slice(0, -3)),
      });
    }
  }
  return out;
}

/** A skill present in its package and absent from the manifest. */
export interface Unlisted {
  pkg: string;
  skill: string;
  manifest: string;
}

export function unlisted(pkgs: SkillPackage[]): Unlisted[] {
  const out: Unlisted[] = [];
  for (const p of pkgs) {
    const have = new Set(p.listed);
    for (const s of p.present) {
      if (!have.has(s)) out.push({ pkg: p.name, skill: s, manifest: p.manifest });
    }
  }
  return out;
}

/** A manifest entry with no `<name>.md` behind it. */
export interface Dangling {
  pkg: string;
  skill: string;
  manifest: string;
}

/**
 * The inverse of {@link unlisted}, and this command REPORTS it rather than
 * fixing it.
 *
 * Found by falsification on 2026-09-26 rather than by design: registering a
 * probe skill and then deleting the file left an entry pointing at nothing, and
 * `kg:audit` raised `manifest-skill-exists` at severity **critical**.
 *
 * Pruning is deliberately NOT done. `KNOWN_DANGLING` in
 * `tests/skill-manifest-coverage.test.ts` is empty on purpose, with its own
 * note that an entry belongs there *"consciously, with the reason, instead of
 * the check being loosened"* — and a command that silently drops declarations
 * makes that decision for whoever renamed or removed the file, which is
 * `deletion-requires-confirmation` pointed at a declaration instead of a file.
 * Two remedies exist and only a person can choose: restore the skill, or remove
 * the entry knowing what referenced it.
 */
export function dangling(pkgs: SkillPackage[]): Dangling[] {
  const out: Dangling[] = [];
  for (const p of pkgs) {
    const have = new Set(p.present);
    for (const s of p.listed) {
      if (!have.has(s)) out.push({ pkg: p.name, skill: s, manifest: p.manifest });
    }
  }
  return out;
}

/** A skill file carrying a key that was retired. */
export interface RetiredKey {
  pkg: string;
  skill: string;
  key: string;
  file: string;
}

/**
 * Front-matter keys, read without a YAML parser.
 *
 * Only top-level `key:` lines inside the leading `---` fence, which is all a
 * retired-key question needs. A nested `roles:` under some other key is a
 * different field with the same seven letters — the distinction
 * `check-retired-front-matter.ts` makes with `exceptSchemas`, and the reason
 * this does not simply grep the file.
 */
export function frontMatterKeys(src: string): string[] {
  if (!src.startsWith("---\n")) return [];
  const end = src.indexOf("\n---", 3);
  if (end === -1) return [];
  return src
    .slice(4, end)
    .split("\n")
    .filter((l) => /^[A-Za-z_][\w-]*\s*:/.test(l))
    .map((l) => l.slice(0, l.indexOf(":")).trim());
}

export function retiredKeys(pkgs: SkillPackage[]): RetiredKey[] {
  const out: RetiredKey[] = [];
  for (const p of pkgs) {
    for (const s of p.present) {
      const file = join(p.dir, `${s}.md`);
      const keys = frontMatterKeys(readFileSync(file, "utf-8"));
      for (const k of STRIPPABLE) {
        if (keys.includes(k)) out.push({ pkg: p.name, skill: s, key: k, file });
      }
    }
  }
  return out;
}

/** Remove a top-level front-matter key's line(s). */
export function withoutKey(src: string, key: string): string {
  if (!src.startsWith("---\n")) return src;
  const end = src.indexOf("\n---", 3);
  if (end === -1) return src;
  const head = src.slice(4, end).split("\n");
  const kept: string[] = [];
  let dropping = false;
  for (const line of head) {
    if (new RegExp(`^${key}\\s*:`).test(line)) {
      dropping = true;
      continue;
    }
    // A dropped key's continuation lines are indented; the next top-level key
    // ends the drop. Without this a block value would leave orphaned lines that
    // parse as something else.
    if (dropping && /^\s+\S/.test(line)) continue;
    dropping = false;
    kept.push(line);
  }
  return `---\n${kept.join("\n")}${src.slice(end)}`;
}

/** What a registration would report, without changing anything. */
export interface Findings {
  /** Reported, never repaired — the manifest entry is the author's assertion. */
  unlisted: Unlisted[];
  /** Repaired by {@link stripRetired}. */
  retired: RetiredKey[];
  /** Reported, never repaired — see {@link dangling}. */
  dangling: Dangling[];
  packages: number;
  skills: number;
}

export function audit(instance: string = INSTANCE_ROOT): Findings {
  const pkgs = skillPackages(instance);
  return {
    unlisted: unlisted(pkgs),
    retired: retiredKeys(pkgs),
    dangling: dangling(pkgs),
    packages: pkgs.length,
    skills: pkgs.reduce((n, p) => n + p.present.length, 0),
  };
}

/**
 * Strip retired front-matter keys. Returns the files written.
 *
 * The one repair this command performs, and it is safe to perform for the same
 * reason the manifest entry is not: a retired key carries no information. It was
 * read by nothing and pointed at actor ids that never existed in any commit, so
 * there is no author intent to guess at.
 */
export function stripRetired(instance: string = INSTANCE_ROOT): string[] {
  const written: string[] = [];
  for (const r of audit(instance).retired) {
    writeFileSync(r.file, withoutKey(readFileSync(r.file, "utf-8"), r.key));
    written.push(r.file);
  }
  return written;
}

/* ──────────────────────────── the generator chain ──────────────────────────── */

/** One regeneration step: the writer, and the check that proves it landed. */
export interface Step {
  /** What to run, as `bun run` arguments. One script name, for the reasons above. */
  readonly write: readonly string[];
  /** The same question asked rather than written — the repo-wide `--check` convention. */
  readonly verify: readonly string[];
  /** Why this is in the chain, so a reader can re-derive rather than trust. */
  readonly because: string;
}

/**
 * The chain. Hand-declared, because no file states which artefacts a skill
 * feeds — but every entry was measured red-then-green in isolation, and
 * {@link main} re-proves sufficiency at runtime rather than asserting it.
 *
 * **`check:glossary` is not a typo for `glossary:check`.** They are different
 * programs: `check:glossary` is `glossary-page.ts --check`, the checker for what
 * `glossary:page` writes, while `glossary:check` is `glossary-export.ts --check`
 * over the SKOS projection. `nfv3`'s version paired `glossary:page` with
 * `glossary:check` — a writer against an unrelated check — and the reason is
 * worth recording: its test asserted *every check ends in `:check`*, a naming
 * convention this repository does not hold, and that assertion drove out the
 * correct pairing. A convention test can enforce a defect.
 */
export const STEPS: readonly Step[] = [
  {
    write: ["skill:commands"],
    verify: ["skill:commands:check"],
    because: "a skill declaring `user_invocable: true` owes a slash command (bean `j6t3`)",
  },
  {
    write: ["skills:docs"],
    verify: ["skills:docs:check"],
    because: "the skill's published reference page",
  },
  {
    write: ["glossary:page"],
    verify: ["check:glossary"],
    because: "the glossary page and its SKOS projection",
  },
  {
    write: ["docs:auto"],
    verify: ["docs:auto:check"],
    because: "the generated docs index",
  },
  {
    write: ["lsi:skills"],
    verify: ["lsi:skills:check"],
    because: "the skills graph's LSI index — a new or edited skill changes its fingerprint, and the run record it writes is what kg:audit's `tool-downstream-fresh` reads next",
  },
  {
    write: ["lsi:viz"],
    verify: ["lsi:viz:check"],
    because:
      "the LSI index's VIEWER PAGE, which `lsi:skills` above stales and nothing here regenerated until 2026-09-30. Measured: adding one skill left `cat-harness/docs/lsi/index.md` stale while this chain reported \"8 artefact(s) current\" — so the claim to be at a fixed point was false in exactly the way this chain exists to prevent, and it reddened `main` through `lsi:viz:check` in the Repository-gates job. The index and its page are two artefacts, and a chain that writes one and verifies only the other is a chain with a hole in it. " +
      "Since bean `tqjj` (2026-10-04) that measurement is the ARGUMENT RATHER THAN THE SYMPTOM: the page is no longer committed, because an artefact one skill edit stales is an artefact this chain can only chase. The step stays, and the two commands now ask a weaker question honestly — `lsi:viz` writes the ignored local copy a reader can look at, and `lsi:viz:check` asks whether the page can be DRAWN from this commit's evidence. Keeping it registered is deliberate: dropping it would make the chain silent about an unreadable index store, which is the one way this still breaks",
  },
  {
    write: ["kg:audit"],
    verify: ["kg:audit:check"],
    because: "the skill's kg-qa sidecar — masked inside `gates` by `bun test`",
  },
  {
    write: ["kg:detangle"],
    verify: ["kg:detangle:check"],
    because: "the skills subgraph gains a node, so its detangle sidecar moves",
  },
  {
    write: ["uml:overview"],
    verify: ["uml:overview:check"],
    because: "the UML overview renders the QA tree the two steps above just wrote",
  },
];

/**
 * The writers, in order. Derived from {@link STEPS} so there is one list.
 *
 * Joined to a string per step, which keeps the public shape a `string[]` across
 * `v625`'s move to argument lists — and keeps the tests' comparisons MEANINGFUL.
 * `s.verify !== s.write` on two arrays compares references and is true of every
 * conceivable pair, so an assertion written against the old shape would have
 * gone vacuous rather than red. A test that cannot fail is bean `1xhc` inside
 * the test suite.
 */
export const CHAIN: readonly string[] = STEPS.map((s) => s.write.join(" "));

/** The checks that decide convergence. Derived from {@link STEPS}. */
export const CHECKS: readonly string[] = STEPS.map((s) => s.verify.join(" "));

/** Scripts named here that `package.json` does not declare. */
export function missingScripts(instance: string = INSTANCE_ROOT): string[] {
  // A step's first argument is what `bun run` resolves; anything after it is a
  // flag. Only names are asserted against `package.json` — a step given as a
  // path (`v625`'s original shape, and still legal) is checked as a FILE, since
  // asking `package.json` about it would report every path as missing and turn
  // the third state below into a permanent exit 2.
  const heads = STEPS.flatMap((s) => [s.write[0]!, s.verify[0]!]);
  const paths = heads.filter((h) => h.includes("/") || h.endsWith(".ts"));
  const named = heads.filter((h) => !paths.includes(h));
  const absentPaths = paths.filter((p) => !existsSync(resolve(instance, "..", p)));
  const pkgPath = join(resolve(instance, ".."), "package.json");
  if (!existsSync(pkgPath)) return [...named, ...absentPaths];
  const scripts =
    (JSON.parse(readFileSync(pkgPath, "utf-8")) as { scripts?: Record<string, string> }).scripts ??
    {};
  return [...named.filter((s) => !(s in scripts)), ...absentPaths];
}

/* ────────────────────────────────── the command ────────────────────────────── */

/**
 * Run one step. `spawnSync` with inherited stdio, so a generator's own output
 * reaches the reader rather than being swallowed and summarised.
 *
 * It shells out instead of importing for the reason in §"Why it shells out":
 * an imported generator is free to drift from the one CI executes, and
 * `declared-directory-resolves.test.ts` guards a real defect where importing a
 * generator WROTE files.
 */
function run(args: readonly string[]): number {
  const r = spawnSync("bun", ["run", ...args], {
    stdio: "inherit",
    cwd: resolve(INSTANCE_ROOT, ".."),
  });
  return r.status ?? 1;
}

/**
 * Run one VERIFY step quietly, without blocking — the verification pass starts
 * all of them at once.
 *
 * Every step it is given is a `--check` (or `check`) command that writes
 * nothing, so they share only the cores. Serially they were 29 s of the
 * Repository gates job, measured 2026-10-03 (bean `fmdl`). Verdicts are still
 * printed in `STEPS` order, so the report reads the same whichever finished
 * first. Generating steps stay on {@link run}: those write, and their order is
 * the chain.
 */
async function verifyQuietly(args: readonly string[]): Promise<number> {
  const p = Bun.spawn(["bun", "run", ...args], {
    cwd: resolve(INSTANCE_ROOT, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });
  // Drained so a chatty check cannot fill the pipe and stall.
  await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  return (await p.exited) ?? 1;
}

/**
 * The flags, and why each exists rather than being inferred.
 *
 * `--check` predates the others: verify without writing. The rest were added
 * on the owner's instruction (2026-09-26) alongside the QA report and the gate,
 * because a command that only ever streams to a terminal cannot be read by CI,
 * by a sibling session, or by a person asking *"was this ever checked?"*.
 */
export interface Flags {
  /** Verify only — regenerate nothing and write no sidecar (bean `bo44`). What CI runs. */
  check: boolean;
  /** Print the chain and exit 0. Writes nothing, verifies nothing. */
  dryRun: boolean;
  /** Emit the report as JSON on stdout instead of prose. Implies no colour, no prompts. */
  json: boolean;
  /** Skip the committed QA sidecar. For a scratch tree that must not be dirtied. */
  noReport: boolean;
}

/**
 * Does a VERIFYING run write the committed QA sidecar?
 *
 * Never under `--check` (bean `bo44`): the gate form judges and writes
 * nothing, and measured 2026-10-01 it was rewriting
 * `test/results/skill-register.qa-results.json` whenever that differed — the
 * gate CI runs was a writer of the record it reports into. `--no-report` keeps
 * its meaning for the writing path. (`--dry-run` decides separately, above
 * the verify.)
 */
export function writesReport(flags: Flags): boolean {
  return !flags.noReport && !flags.check;
}

export function parseFlags(argv: readonly string[]): Flags {
  return {
    check: argv.includes("--check"),
    dryRun: argv.includes("--dry-run"),
    json: argv.includes("--json"),
    noReport: argv.includes("--no-report"),
  };
}

/** One step's verdict, as the report and the JSON both carry it. */
export interface StepVerdict {
  /** The `--check` invocation, exactly as run. */
  verify: string;
  /** What staling it means for a reader — the step's own `because`. */
  because: string;
  /**
   * Was the check RUN at all? Emitted on every step, never left to absence.
   *
   * `--dry-run` produces `ran: false`, and a reader must be able to tell that
   * from a clean verify. An absent `current` would have carried that fact
   * implicitly, which is the rule this repository states on `hasInstructions`
   * in `kg-export`: absence must not be the carrier of a fact.
   */
  ran: boolean;
  /** `true` only when the check exited 0. Absent iff `ran` is false. */
  current?: boolean;
}

/** One declaration finding, as the sidecar carries it. */
export interface DeclarationVerdict {
  /** `undeclared` | `retired-key` | `dangling` — which of the three audits fired. */
  finding: string;
  /** `<package>/<skill>`, qualified by graph where the graph is not `skills`. */
  subject: string;
  /** What a reader must do, and who must do it. */
  remedy: string;
}

/**
 * Write the run's verdicts as a committed `qa-results/v1` sidecar.
 *
 * **Why a file and not just the console.** The checks in this chain are the only
 * ones nothing else verifies UNMASKED — `bun test` runs the `kg-audit` and
 * `detangle` writers, so by the time `gates` reaches their checks the artefacts
 * are already repaired (bean `ymsu`). A printed verdict is gone the moment the
 * terminal scrolls, which makes *"never verified"* and *"verified clean"* the
 * same observation. That is the exact confusion this repository builds sidecars
 * to prevent.
 *
 * `ran: false` on every step is therefore a REAL state and not a placeholder:
 * it says the chain was listed and not run (`--dry-run`). It is emitted rather
 * than implied, because absence must not be the carrier of a fact.
 *
 * **Two families, because this command answers two questions.** `v625` recorded
 * the chain; the consolidation added the DECLARATION audit, and a sidecar that
 * carried only the chain would report a clean run over a skill registered
 * nowhere. An empty `declarations` family is a real verdict — audited, nothing
 * found — which is why it is written rather than omitted when empty.
 */
export function writeReport(
  root: string,
  verdicts: readonly StepVerdict[],
  declarations: readonly DeclarationVerdict[],
): string {
  return writeQaResult(
    root,
    "skill-register",
    buildQaResult({
      script: "cat-harness/scripts/skill-register.ts",
      scriptAbsPath: fileURLToPath(import.meta.url),
      subject: { kind: "corpus", id: "skill-registration-chain" },
      families: {
        "registration-chain": {
          summary:
            "Each artefact that adding a skill stales, with the verdict of its own `--check` run " +
            "INDIVIDUALLY rather than through `bun run gates`. The distinction is the point: " +
            "`bun test` runs the kg-audit and detangle writers, so a gates run repairs two of " +
            "these before their checks read them and reports as current what is not (bean `ymsu`). " +
            "`ran: false` means the step was listed but not run — what `--dry-run` produces — and is " +
            "not a pass. It is emitted on every entry so that absence never carries that fact.",
          entries: verdicts as unknown[],
        },
        declarations: {
          summary:
            "Skills whose DECLARATIONS are wrong: present in no package manifest, carrying a " +
            "retired front-matter key, or listed in a manifest with no file. Empty means audited " +
            "and clean, not unaudited — the chain family above records whether the run happened. " +
            "Only the retired key is repaired; the other two are the author's assertion to make " +
            "and this command reports them rather than guessing.",
          entries: declarations as unknown[],
        },
      },
    }),
  );
}

const FIX_UNLISTED =
  "  Add the slug to its `package-manifest.json` `skills` list, sorted. This\n" +
  "  command deliberately will not: which package a file belongs to is your\n" +
  "  assertion, not a derivable fact, and a command that guessed it would\n" +
  "  register files somebody was still drafting.\n";

const HELP =
  `skill-register — regenerate everything adding a skill stales, and refuse a\n` +
  `skill that arrived without its declarations (beans \`v625\`, \`nfv3\`).\n\n` +
  `  bun run skill:register              regenerate, then verify\n` +
  `  bun run skill:register --check      verify only, write nothing (not even the QA sidecar) — what CI runs\n` +
  `  bun run skill:register --dry-run    print the chain; write and verify nothing\n` +
  `  bun run skill:register --json       emit the verdicts as JSON\n` +
  `  bun run skill:register --no-report  skip the committed QA sidecar\n\n` +
  `It deliberately does NOT add a package-manifest entry: which package a\n` +
  `file belongs to is your assertion, not a derivable fact.\n\n` +
  `Exit 2 is a THIRD STATE, never a pass and never a finding: no package\n` +
  `manifests found, or a chain step naming a script that is not registered.\n`;

/** The audit's findings, flattened for the sidecar. */
function declarationVerdicts(f: Findings): DeclarationVerdict[] {
  return [
    ...f.unlisted.map((u) => ({
      finding: "undeclared",
      subject: `${u.pkg}/${u.skill}`,
      remedy: "add the slug to its package-manifest.json — the author's assertion, not derivable",
    })),
    ...f.retired.map((r) => ({
      finding: "retired-key",
      subject: `${r.pkg}/${r.skill}`,
      remedy: `strip the retired \`${r.key}\` key — this command repairs it on the writing path`,
    })),
    ...f.dangling.map((d) => ({
      finding: "dangling",
      subject: `${d.pkg}/${d.skill}`,
      remedy:
        "restore the skill or remove the manifest entry — a deletion, so a person's decision",
    })),
  ];
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv);
  const checking = flags.check;

  if (process.argv.includes("--help")) {
    console.log(HELP);
    return 0;
  }

  const f = audit();

  // Third state, all three directions. A run that found no packages, an empty
  // chain, or a chain naming a script nothing registered has cleared nothing —
  // and reporting any of them as clean is bean `dh4f`.
  if (f.packages === 0) {
    console.error(
      "skill-register: no package manifests found — cannot tell registered from unregistered.",
    );
    return 2;
  }
  // The vacuity guard `gates.ts` argues for: a runner that executes an empty
  // list exits 0 and reads as a clean sweep. An empty chain is a defect in
  // this file, never a tree that needs nothing.
  if (STEPS.length === 0) {
    console.error("skill-register: the chain is empty — that is a bug here, not a clean tree.");
    return 2;
  }
  const absent = missingScripts();
  if (absent.length > 0) {
    console.error(`skill-register: this chain names ${absent.length} unresolvable step(s):`);
    for (const s of absent) console.error(`    ${s}`);
    return 2;
  }

  if (flags.dryRun) {
    // Listed, not run. The report records `ran: false` for each, which is a
    // third state rather than a pass — see {@link writeReport}.
    const listed: StepVerdict[] = STEPS.map((st) => ({
      verify: st.verify.join(" "),
      because: st.because,
      ran: false,
    }));
    if (flags.json) console.log(JSON.stringify({ dryRun: true, steps: listed }, null, 2));
    else {
      console.log(`\nWould regenerate ${STEPS.length} artefact(s), then verify each:\n`);
      for (const st of listed) console.log(`  ${st.verify}\n      (${st.because})`);
      console.log("");
    }
    if (!flags.noReport) writeReport(INSTANCE_ROOT, listed, declarationVerdicts(f));
    return 0;
  }

  /*
   * The declaration audit runs in BOTH modes, and under `--check` it no longer
   * short-circuits the chain.
   *
   * `nfv3`'s version returned as soon as it had a declaration finding, so the
   * six checks never ran and the gate reported ONE of the two things it exists
   * to judge. Whoever fixed the manifest entry then got the staleness on their
   * next run instead of this one. Both halves are reported, then one exit
   * decision is taken over both.
   */
  const problems = f.unlisted.length + f.retired.length + f.dangling.length;
  if (checking) {
    for (const u of f.unlisted) console.log(`✗ ${u.pkg}/${u.skill}.md is in no package manifest`);
    for (const r of f.retired) {
      console.log(`✗ ${r.pkg}/${r.skill}.md carries the retired key \`${r.key}\``);
    }
    for (const d of f.dangling) {
      console.log(
        `✗ ${d.pkg}/package-manifest.json lists \`${d.skill}\`, which has no ${d.skill}.md ` +
          "— restore the skill, or remove the entry (this command will not)",
      );
    }
    if (problems === 0) {
      console.log(
        `✓ ${f.skills} skill(s) across ${f.packages} package(s): every one declared, ` +
          "none carrying a retired key, nothing dangling",
      );
    }
  } else {
    const stripped = stripRetired();
    for (const s of stripped) {
      console.log(`  stripped a retired key from  ${s.replace(`${resolve(INSTANCE_ROOT, "..")}/`, "")}`);
    }

    // Said on the performing path too. An author running this to fix one thing
    // should not have a critical finding left silently behind them — and neither
    // of these is this command's to repair.
    for (const u of f.unlisted) {
      console.log(`  NOT DECLARED  ${u.pkg}/${u.skill}.md is in no package manifest — yours to add`);
    }
    for (const d of f.dangling) {
      console.log(
        `  NOT TOUCHED  ${d.pkg}/package-manifest.json lists \`${d.skill}\` with no file ` +
          "— yours to resolve; `kg:audit` calls this critical",
      );
    }

    console.log(`\nRegenerating ${STEPS.length} artefact(s) that adding a skill stales.\n`);
    for (const s of STEPS) {
      console.log(`── ${s.write.join(" ")}   (${s.because})`);
      const rc = run(s.write);
      if (rc !== 0) {
        console.error(`\nskill-register: \`${s.write.join(" ")}\` exited ${rc}. Stopping.`);
        return rc;
      }
    }
  }

  // Verification is the point. The list above is hand-maintained and so can
  // UNDER-declare; this cannot make the command claim success falsely, because
  // what it reports is the checks' own verdicts rather than "I ran six things".
  if (!flags.json) console.log(`\nVerifying — each check run on its own, never through \`gates\`:\n`);
  const red: string[] = [];
  const verdicts: StepVerdict[] = [];
  const codes = await Promise.all(STEPS.map((s) => verifyQuietly(s.verify)));
  for (const [i, s] of STEPS.entries()) {
    const rc = codes[i]!;
    verdicts.push({ verify: s.verify.join(" "), because: s.because, ran: true, current: rc === 0 });
    if (!flags.json) console.log(`${rc === 0 ? "  ✓" : "  ✗"} ${s.verify.join(" ")}`);
    if (rc !== 0) red.push(s.verify.join(" "));
  }

  // Written BEFORE the exit branches, so a red run is recorded rather than only
  // printed. A sidecar that exists only on success cannot distinguish "clean"
  // from "never ran".
  //
  // NOT under `--check` (bean `bo44`). The gate form judges and writes nothing:
  // measured 2026-10-01, `skill:register:check` rewrote
  // `test/results/skill-register.qa-results.json` whenever it differed, so the
  // gate CI runs was also a writer of the record it reports into. The record is
  // the author's command's to write (`bun run skill:register`); the gate's
  // verdict is its exit code.
  const reportAt = writesReport(flags)
    ? writeReport(INSTANCE_ROOT, verdicts, declarationVerdicts(f))
    : undefined;
  if (flags.json) {
    console.log(
      JSON.stringify(
        { checking, red, problems, steps: verdicts, declarations: declarationVerdicts(f), report: reportAt },
        null,
        2,
      ),
    );
    return red.length > 0 || problems > 0 ? 1 : 0;
  }
  if (reportAt !== undefined) console.log(`\n  report → ${reportAt}`);

  if (problems > 0) {
    console.error(
      `\n✗ ${problems} skill declaration problem(s) across ${f.packages} package(s) ` +
        `(${f.unlisted.length} undeclared, ${f.retired.length} retired key(s), ` +
        `${f.dangling.length} dangling).\n` +
        (f.unlisted.length > 0 ? `\n${FIX_UNLISTED}` : "") +
        "\n  Adding a skill is never a one-file change. Seven merges between\n" +
        "  2026-09-24 and 2026-09-26 each broke the gate set this way, and each was\n" +
        "  repaired by whoever opened the next PR rather than by its author, because\n" +
        "  CI judges the MERGE of every open head into the base.\n" +
        "  A retired key is not a judgement call: see the record\n" +
        "  `check-retired-front-matter.ts` points at before re-adding one.\n",
    );
  }

  if (red.length > 0) {
    console.error(
      // The wording must state WHICH mode ran, and that is a correction rather
      // than a nicety. Under `--check` nothing is regenerated, so "still red
      // after regenerating" was false in exactly the mode CI runs — measured
      // on this gate's first CI run, where it also pointed the reader at a
      // missing package-manifest entry that was not the cause. A diagnostic
      // that names the wrong remedy costs more than none.
      (checking
        ? `\n${red.length} check(s) red — nothing was regenerated (\`--check\`):\n`
        : `\n${red.length} check(s) still red after regenerating:\n`) +
        red.map((r) => `    ${r}`).join("\n") +
        (checking
          ? `\n\nRun \`bun run skill:register\` (without \`--check\`) to regenerate, then\n` +
            `commit what it writes. If a check is STILL red after that, read on.\n\n`
          : "\n\n") +
        "Three causes look identical from here and this command does NOT guess\n" +
        "between them — run the red check above directly and read what it names:\n\n" +
        "  · a MISSING PACKAGE-MANIFEST ENTRY. Reported above when this run found\n" +
        "    one; this command deliberately does not add it.\n" +
        "  · a subject was REMOVED, leaving a derived artefact orphaned. `kg:audit`\n" +
        "    reports `SUBJECT GONE` and refuses to delete it, which is correct:\n" +
        "    `deletion-requires-confirmation` makes removing a durable artefact a\n" +
        "    person's decision, so no amount of regenerating can settle it. Delete\n" +
        "    the named file yourself, or restore its subject. Measured 2026-09-26 by\n" +
        "    registering a probe skill and then deleting it.\n" +
        "  · the chain is not at a FIXED POINT yet. A later step can stale an\n" +
        "    earlier step's artefact: `uml:overview` renders the QA tree `kg:audit`\n" +
        "    writes, and its new pages stale `docs:auto`, two steps earlier.\n" +
        "    Measured 2026-09-27: pass 1 red, pass 2 exit 0. If the red check is one\n" +
        "    an EARLIER step owns, run this command again before reading on.\n" +
        "  · the chain above is INCOMPLETE. Measure by running that ONE check against\n" +
        "    a clean tree with and without your skill. Do NOT measure through\n" +
        "    `bun run gates` — `bun test` runs some of these writers and repairs what\n" +
        "    later gates read (bean `ymsu`), so gates reports artefacts as current\n" +
        "    that are not. Four separate attempts to recall this list were wrong.\n\n" +
        "And if it is red in CI but green here: ask git what the corpus is, not\n" +
        "the disk. A gitignored `node_modules/` in a subpackage inflated\n" +
        "`cat-harness/schemas` from 227 nodes to 1441 in one container while a\n" +
        "fresh checkout saw 227 — see `kg-detangle.ts`'s `walk` and\n" +
        "`scripts/git-corpus.ts`.\n",
    );
  }

  if (red.length > 0 || problems > 0) return 1;

  console.log(
    `\n✓ ${STEPS.length} artefact(s) current, ${f.skills} skill(s) across ${f.packages} ` +
      `package(s) declared. Commit them with the skill.\n`,
  );
  return 0;
}

if (import.meta.main) process.exit(await main());
