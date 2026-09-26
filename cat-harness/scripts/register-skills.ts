/**
 * Adding a skill is never a one-file change, and for seven merges running
 * nobody found that out until CI told somebody else.
 *
 * ## The defect this exists to end
 *
 * A skill file is authored. It owes three declarations nothing derives for it —
 * a package-manifest entry, a published reference page, a `kg-qa` sidecar — and
 * the merge that adds the file adds none of them. Six tests then fail on every
 * open PR, because CI judges the MERGE of each head into the base, so the cost
 * lands on whoever opens the next PR rather than on the change that caused it.
 *
 * Measured over 2026-09-24..26: **seven merges**, each repaired downstream by a
 * different session. Three of those merges also reintroduced the retired
 * `roles:` front-matter key, which `check-retired-front-matter.ts` predicted in
 * its own docblock — *"copy an adjacent skill's front matter and the field is
 * back"*.
 *
 * Detection was never the gap. The gates named the files exactly, every time.
 * The gaps were that an author had nowhere to look up what to run, and that
 * running it once is not enough — the generators feed each other, so one pass
 * leaves the earliest stale against the latest. Both are closed here: this
 * module PERFORMS the obligation, and `--check` REFUSES a skill that arrives
 * without it, naming the command that fixes it.
 *
 * ## Why it shells out instead of importing
 *
 * Every step runs as the package script CI runs. Importing the generators
 * would be faster and would be wrong twice over: the versions would be free to
 * drift from what the gate set actually executes, and
 * `declared-directory-resolves.test.ts` guards a real defect where IMPORTING a
 * generator wrote files. A registration command that writes by import is the
 * unguarded entry point that test exists to catch.
 *
 * ## Third state
 *
 * Exit 2 — never 0, never 1 — when the question could not be answered: no
 * `skills/` directory, no package manifests, a generator that is not a
 * registered script. A sweep that examined nothing has cleared nothing, and
 * this repository has paid for the opposite reading (bean `dh4f`).
 *
 * @module cat-harness/scripts/register-skills
 * @covers skills — and ONLY that kind, deliberately. This gate judges a skill's
 *   DECLARATIONS: its manifest entry, its front matter, and whether the manifest
 *   points at anything absent. The derived `folio` reference pages and `qa` sidecars
 *   are produced by the chain and judged by their own gates (`skills:docs:check`,
 *   `kg:audit:check`), so claiming them here would report coverage this gate does
 *   not provide. `kg` was written here first and is not a kind at all — it names a
 *   graph LAYER, which `audit-coverage`'s own test caught
 *
 *   The subject set is resolved from the instance's declarations via
 *   `kgDirectories`, never from a list written here
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { kgDirectories } from "./known-skills.js";

const INSTANCE = resolve(import.meta.dir, "..");

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
 * The retired front-matter keys a registration must not carry forward.
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
 * here), so a skill added in one of those is registered by the same command
 * instead of being a case nobody thought of.
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
 * probe skill and then deleting the file left the entry this command had just
 * added pointing at nothing, and `kg:audit` raised `manifest-skill-exists` at
 * severity **critical**. So the tool that closed one direction opened the
 * other.
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

/**
 * Add names to a manifest's `skills`, sorted and deduplicated.
 *
 * **Sorted, and that is the whole point.** Bean `kfkh` records the ordering
 * convention as unenforced, and an unenforced order is what let two sessions
 * insert the same name at different indices, merge with no conflict, and keep
 * BOTH entries. `#1383` appended instead, on the belief that the lists were not
 * sorted; they were, and are. A command that always sorts removes the ambiguity
 * rather than arguing about it, and makes a second run a no-op.
 *
 * Returns the new text, or `undefined` when nothing changed — so a caller can
 * tell "already correct" from "repaired", which a blind write cannot.
 */
export function withSkills(manifestText: string, add: string[]): string | undefined {
  const parsed = JSON.parse(manifestText) as { skills?: string[] };
  const before = parsed.skills ?? [];
  const after = [...new Set([...before, ...add])].sort();
  if (before.length === after.length && before.every((s, i) => s === after[i])) return undefined;
  parsed.skills = after;
  return `${JSON.stringify(parsed, null, 2)}\n`;
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

/**
 * The generator chain, in dependency order, as package scripts.
 *
 * **These five are MEASURED, and the nine this listed first were not.** The
 * original set was inferred from what went red in this session's incidents,
 * which is precisely the method `skill-register.ts` records failing three times:
 * *"it named `gen-docs-pages`, `docs:harness`, `translation:index` and
 * `state:visualizer`, none of which adding a skill stales. They had gone red in
 * the same sessions for unrelated reasons and were attributed here."* My four
 * extras — `glossary:export`, `uml:overview`, `prov:qaqc`, `tools:viz` — were
 * the same error: they staled in the runs I watched because that branch also
 * added three Tool nodes and merged 20 translated pages, not because a skill
 * was added.
 *
 * Their method, which mine was not: add a throwaway skill to a green tree, run
 * each check **individually**, and subtract a baseline measured the same way.
 * `bun run gates` cannot derive it, because `bun test` runs the detangle and
 * kg-audit writers, so by the time those checks execute the artefacts are
 * already repaired — bean `ymsu`'s blind spot.
 *
 * Order is for deterministic output, NOT dependency: they measured all five in
 * reverse and re-checked green. I had asserted order-dependence from watching
 * `docs:auto` stale behind `glossary:page`, and that observation was real but
 * belonged to a tree changing for four reasons at once.
 *
 * {@link CHECKS} still verifies rather than assumes, which costs one extra pass
 * and is the difference between "ran the chain" and "the chain landed".
 *
 * Every entry must be a script `package.json` declares, which
 * {@link missingScripts} asserts rather than assumes, because a renamed script
 * would otherwise make this chain silently skip a step.
 */
export const CHAIN = [
  "skills:docs",
  "glossary:page",
  "docs:auto",
  "kg:audit",
  "kg:detangle",
] as const;

/**
 * The `--check` form of each step that has one, used to decide convergence.
 *
 * Convergence is ASSERTED, never assumed. One pass is expected to suffice for a
 * skill — `skill-register.ts` measured these five as order-independent — so this
 * loop is not there to shuffle a dependency; it is there so the command can say
 * the chain LANDED rather than that it RAN. A writer exiting 0 over an artefact
 * it failed to update is the case that costs a CI cycle, and only the `:check`
 * form catches it.
 */
export const CHECKS = [
  "skills:docs:check",
  "glossary:check",
  "docs:auto:check",
  "kg:audit:check",
  "kg:detangle:check",
] as const;

/** Scripts named here that `package.json` does not declare. */
export function missingScripts(instance: string = INSTANCE): string[] {
  const pkgPath = join(resolve(instance, ".."), "package.json");
  if (!existsSync(pkgPath)) return [...CHAIN, ...CHECKS];
  const scripts = (JSON.parse(readFileSync(pkgPath, "utf-8")) as { scripts?: Record<string, string> })
    .scripts ?? {};
  return [...CHAIN, ...CHECKS].filter((s) => !(s in scripts));
}

/** What a registration would change, without changing it. */
export interface Findings {
  unlisted: Unlisted[];
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

/** Apply the declaration repairs. Returns the files written. */
export function repair(instance: string = INSTANCE): string[] {
  const written: string[] = [];
  const f = audit(instance);

  for (const r of f.retired) {
    writeFileSync(r.file, withoutKey(readFileSync(r.file, "utf-8"), r.key));
    written.push(r.file);
  }

  const byManifest = new Map<string, string[]>();
  for (const u of f.unlisted) {
    byManifest.set(u.manifest, [...(byManifest.get(u.manifest) ?? []), u.skill]);
  }
  for (const [manifest, add] of byManifest) {
    const next = withSkills(readFileSync(manifest, "utf-8"), add);
    if (next !== undefined) {
      writeFileSync(manifest, next);
      written.push(manifest);
    }
  }
  return written;
}

async function sh(script: string, root: string): Promise<boolean> {
  const p = Bun.spawn(["bun", "run", script], { cwd: root, stdout: "pipe", stderr: "pipe" });
  return (await p.exited) === 0;
}

async function run(): Promise<number> {
  const check = process.argv.includes("--check");
  const root = resolve(INSTANCE, "..");
  const f = audit();

  if (f.packages === 0) {
    console.error("✗ no skill package manifests found — cannot tell registered from unregistered");
    return 2;
  }
  const absent = missingScripts();
  if (absent.length > 0) {
    console.error(`✗ this chain names ${absent.length} script(s) package.json does not declare:`);
    for (const s of absent) console.error(`    ${s}`);
    return 2;
  }

  const total = f.unlisted.length + f.retired.length + f.dangling.length;

  if (check) {
    for (const u of f.unlisted) {
      console.log(`✗ ${u.pkg}/${u.skill}.md is in no package manifest`);
    }
    for (const r of f.retired) {
      console.log(`✗ ${r.pkg}/${r.skill}.md carries the retired key \`${r.key}\``);
    }
    for (const d of f.dangling) {
      console.log(
        `✗ ${d.pkg}/package-manifest.json lists \`${d.skill}\`, which has no ${d.skill}.md ` +
          "— restore the skill, or remove the entry (this command will not)",
      );
    }
    if (total > 0) {
      console.error(
        `\n✗ ${total} skill declaration problem(s) across ${f.packages} package(s) ` +
        `(${f.unlisted.length} undeclared, ${f.retired.length} retired key(s), ${f.dangling.length} dangling).\n` +
          "  One command performs all of it, including the derived pages and sidecars:\n\n" +
          "      bun run skills:register\n\n" +
          "  Adding a skill is never a one-file change. Seven merges between\n" +
          "  2026-09-24 and 2026-09-26 each broke the gate set this way, and each was\n" +
          "  repaired by whoever opened the next PR rather than by its author.\n" +
          "  A retired key is not a judgement call: see the record\n" +
          "  `check-retired-front-matter.ts` points at before re-adding one.",
      );
      return 1;
    }
    console.log(
      `✓ ${f.skills} skill(s) across ${f.packages} package(s): every one declared, none carrying a retired key`,
    );
    return 0;
  }

  const written = repair();
  for (const w of written) console.log(`  declared  ${w.replace(`${root}/`, "")}`);
  if (written.length === 0) console.log("  declarations already correct");
  for (const d of f.dangling) {
    // Said on the performing path too, because an author running this to fix
    // one thing should not have a critical finding left silently behind them.
    console.log(
      `  NOT TOUCHED  ${d.pkg}/package-manifest.json lists \`${d.skill}\` with no file ` +
        "— yours to resolve; `kg:audit` calls this critical",
    );
  }

  // The chain, then convergence asserted rather than counted. The bound exists
  // so a genuine cycle fails loudly instead of running forever; reaching it is
  // itself the finding, which is why it reports rather than retrying.
  const MAX = 4;
  for (let pass = 1; pass <= MAX; pass++) {
    for (const step of CHAIN) {
      if (!(await sh(step, root))) {
        console.error(`✗ \`bun run ${step}\` failed on pass ${pass} — chain not run to completion`);
        return 2;
      }
    }
    const stale: string[] = [];
    for (const c of CHECKS) if (!(await sh(c, root))) stale.push(c);
    if (stale.length === 0) {
      console.log(`✓ chain converged after ${pass} pass(es); ${CHECKS.length} check(s) current`);
      return 0;
    }
    console.log(`  pass ${pass}: still stale — ${stale.join(", ")}`);
  }
  console.error(
    `✗ the chain did not converge in ${MAX} passes, and re-running will not help.\n` +
      "  Two causes look identical from here and this command does NOT guess between\n" +
      "  them — run the stale check above directly and read what it names:\n\n" +
      "    · a subject was REMOVED, leaving a derived artefact orphaned. `kg:audit`\n" +
      "      reports `SUBJECT GONE` and refuses to delete it, which is correct:\n" +
      "      `deletion-requires-confirmation` makes removing a durable artefact a\n" +
      "      person's decision, so no amount of regenerating can settle it. Delete\n" +
      "      the named file yourself, or restore its subject.\n" +
      "    · a genuine cycle among the generators, where one undoes another. Report\n" +
      "      it with the step names rather than raising the bound above.\n\n" +
      "  Measured 2026-09-26: the first cause is the one that actually occurs, found\n" +
      "  by deleting a probe skill and watching this bound fire.",
  );
  return 2;
}

if (import.meta.main) process.exit(await run());
