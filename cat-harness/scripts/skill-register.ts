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
 * ## The six, each measured alone, red before and green after
 *
 * | writer | the check it clears |
 * |---|---|
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
 * ## They are NOT order-dependent, and the earlier claim that they were is wrong
 *
 * Measured by running all five in reverse and re-checking: still green. An
 * earlier session asserted this chain was order-sensitive. The ordering it
 * observed is real but belongs to a **different pair** — `gen-docs-pages`
 * writes what `docs:harness` reads — and neither is in this chain. The claim
 * was true of something else and attached to this.
 *
 * The fixed order below is for deterministic output, not dependency.
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
 * @covers skills — and ONLY that kind, deliberately. This gate judges a skill's
 *   DECLARATIONS: its manifest entry, its front matter, and whether the manifest
 *   points at anything absent. The derived `folio` reference pages and `qa`
 *   sidecars are produced by the chain and judged by their own gates
 *   (`skills:docs:check`, `kg:audit:check`), so claiming them here would report
 *   coverage this gate does not provide. `kg` was written in `nfv3`'s version
 *   first and is not a kind at all — it names a graph LAYER, which
 *   `audit-coverage`'s own test caught
 *
 *   The subject set is resolved from the instance's declarations via
 *   `kgDirectories`, never from a list written here
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { kgDirectories } from "./known-skills.js";

const INSTANCE = resolve(import.meta.dir, "..");

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
const STRIPPABLE = ["roles"] as const;

/**
 * Skill packages, found in the directories the INSTANCE DECLARES.
 *
 * Not `join(instance, "skills")`. That literal is what
 * `check-declared-paths.ts` refuses, and rightly — `cat-harness.json` owns the
 * `skills` entry's path, ids are stable across a relocation while paths are
 * not (bean `iwtn` moved this very id), and a command that hardcodes it audits
 * the wrong tree the day somebody moves it.
 *
 * Asking the declaration also widens the subject correctly rather than by
 * accident: `kgDirectories` resolves a dependent instance's packages too
 * (`folio-assistant-core/skills/`, `who-iris/skills/`, `large-datasets/skills/`
 * here), so a skill added in one of those is judged by the same gate instead of
 * being a case nobody thought of.
 *
 * A package is a directory holding `package-manifest.json`, which is the same
 * predicate `tests/skill-manifest-coverage.test.ts` uses — the test that fails
 * when this command has not been run.
 */
export function skillPackages(instance: string = INSTANCE): SkillPackage[] {
  const out: SkillPackage[] = [];
  for (const graph of kgDirectories(instance)) {
    for (const d of readdirSync(graph.absPath, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const dir = join(graph.absPath, d.name);
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

export function audit(instance: string = INSTANCE): Findings {
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
export function stripRetired(instance: string = INSTANCE): string[] {
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
  /** The package script that writes. */
  readonly write: string;
  /** The script asking the same question rather than writing. */
  readonly verify: string;
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
    write: "skills:docs",
    verify: "skills:docs:check",
    because: "the skill's published reference page",
  },
  {
    write: "glossary:page",
    verify: "check:glossary",
    because: "the glossary page and its SKOS projection",
  },
  {
    write: "docs:auto",
    verify: "docs:auto:check",
    because: "the generated docs index",
  },
  {
    write: "kg:audit",
    verify: "kg:audit:check",
    because: "the skill's kg-qa sidecar — masked inside `gates` by `bun test`",
  },
  {
    write: "kg:detangle",
    verify: "kg:detangle:check",
    because: "the skills subgraph gains a node, so its detangle sidecar moves",
  },
  {
    write: "uml:overview",
    verify: "uml:overview:check",
    because: "the UML overview renders the QA tree the two steps above just wrote",
  },
];

/** The writers, in order. Derived from {@link STEPS} so there is one list. */
export const CHAIN: readonly string[] = STEPS.map((s) => s.write);

/** The checks that decide convergence. Derived from {@link STEPS}. */
export const CHECKS: readonly string[] = STEPS.map((s) => s.verify);

/** Scripts named here that `package.json` does not declare. */
export function missingScripts(instance: string = INSTANCE): string[] {
  const named = [...CHAIN, ...CHECKS];
  const pkgPath = join(resolve(instance, ".."), "package.json");
  if (!existsSync(pkgPath)) return named;
  const scripts =
    (JSON.parse(readFileSync(pkgPath, "utf-8")) as { scripts?: Record<string, string> }).scripts ??
    {};
  return named.filter((s) => !(s in scripts));
}

/* ────────────────────────────────── the command ────────────────────────────── */

async function sh(script: string, root: string, quiet: boolean): Promise<boolean> {
  const p = Bun.spawn(["bun", "run", script], {
    cwd: root,
    stdout: quiet ? "pipe" : "inherit",
    stderr: quiet ? "pipe" : "inherit",
  });
  return (await p.exited) === 0;
}

const FIX_UNLISTED =
  "  Add the slug to its `package-manifest.json` `skills` list, sorted. This\n" +
  "  command deliberately will not: which package a file belongs to is your\n" +
  "  assertion, not a derivable fact, and a command that guessed it would\n" +
  "  register files somebody was still drafting.\n";

async function main(): Promise<number> {
  const checking = process.argv.includes("--check");
  const root = resolve(INSTANCE, "..");
  const f = audit();

  // Third state, both directions. A run that found no packages, or a chain
  // naming a script that no longer exists, has cleared nothing — and reporting
  // either as clean is bean `dh4f`.
  if (f.packages === 0) {
    console.error(
      "skill-register: no package manifests found — cannot tell registered from unregistered.",
    );
    return 2;
  }
  if (STEPS.length === 0) {
    console.error("skill-register: the chain is empty — that is a bug here, not a clean tree.");
    return 2;
  }
  const absent = missingScripts();
  if (absent.length > 0) {
    console.error(`skill-register: this chain names ${absent.length} undeclared script(s):`);
    for (const s of absent) console.error(`    ${s}`);
    return 2;
  }

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
    const total = f.unlisted.length + f.retired.length + f.dangling.length;
    if (total > 0) {
      console.error(
        `\n✗ ${total} skill declaration problem(s) across ${f.packages} package(s) ` +
          `(${f.unlisted.length} undeclared, ${f.retired.length} retired key(s), ` +
          `${f.dangling.length} dangling).\n\n` +
          "  For the derived pages and sidecars, one command performs all of it:\n\n" +
          "      bun run skill:register\n\n" +
          (f.unlisted.length > 0 ? `\n${FIX_UNLISTED}` : "") +
          "\n  Adding a skill is never a one-file change. Seven merges between\n" +
          "  2026-09-24 and 2026-09-26 each broke the gate set this way, and each was\n" +
          "  repaired by whoever opened the next PR rather than by its author, because\n" +
          "  CI judges the MERGE of every open head into the base.\n" +
          "  A retired key is not a judgement call: see the record\n" +
          "  `check-retired-front-matter.ts` points at before re-adding one.",
      );
      return 1;
    }
    console.log(
      `✓ ${f.skills} skill(s) across ${f.packages} package(s): every one declared, ` +
        "none carrying a retired key, nothing dangling",
    );
    return 0;
  }

  const stripped = stripRetired();
  for (const s of stripped) console.log(`  stripped a retired key from  ${s.replace(`${root}/`, "")}`);

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
    console.log(`── ${s.write}   (${s.because})`);
    if (!(await sh(s.write, root, false))) {
      console.error(`\nskill-register: \`bun run ${s.write}\` failed. Stopping.`);
      return 2;
    }
  }

  // Verification is the point. The list above is hand-maintained and so can
  // UNDER-declare; this cannot make the command claim success falsely, because
  // what it reports is the checks' own verdicts rather than "I ran five things".
  console.log(`\nVerifying — each check run on its own, never through \`gates\`:\n`);
  const red: string[] = [];
  for (const s of STEPS) {
    const ok = await sh(s.verify, root, true);
    console.log(`${ok ? "  ✓" : "  ✗"} ${s.verify}`);
    if (!ok) red.push(s.verify);
  }

  if (red.length > 0) {
    console.error(
      `\n${red.length} check(s) still red after regenerating:\n` +
        red.map((r) => `    ${r}`).join("\n") +
        "\n\n" +
        (f.unlisted.length > 0
          ? `The likely cause is a MISSING PACKAGE-MANIFEST ENTRY, and this run found ` +
            `${f.unlisted.length}:\n${FIX_UNLISTED}\n`
          : "") +
        "Two other causes look identical from here and this command does NOT guess\n" +
        "between them — run the red check above directly and read what it names:\n\n" +
        "  · a subject was REMOVED, leaving a derived artefact orphaned. `kg:audit`\n" +
        "    reports `SUBJECT GONE` and refuses to delete it, which is correct:\n" +
        "    `deletion-requires-confirmation` makes removing a durable artefact a\n" +
        "    person's decision, so no amount of regenerating can settle it. Delete\n" +
        "    the named file yourself, or restore its subject. Measured 2026-09-26 by\n" +
        "    registering a probe skill and then deleting it.\n" +
        "  · the chain above is INCOMPLETE. Measure by running that ONE check against\n" +
        "    a clean tree with and without your skill. Do NOT measure through\n" +
        "    `bun run gates` — `bun test` runs some of these writers and repairs what\n" +
        "    later gates read (bean `ymsu`), so gates reports artefacts as current\n" +
        "    that are not. Four separate attempts to recall this list were wrong.\n",
    );
    return 1;
  }

  console.log(`\n✓ ${STEPS.length} artefact(s) current. Commit them with the skill.\n`);
  return 0;
}

if (import.meta.main) process.exit(await main());
