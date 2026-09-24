#!/usr/bin/env bun
/**
 * Every `satisfies` names a skill that exists, and every skill has a Tool.
 *
 * `ToolDefinitionSchema` can require `satisfies` to be non-empty; it cannot
 * know whether the names resolve, because a schema does not get to read the
 * tree. That is this.
 *
 * ## Both directions, and they mean different things
 *
 * **A `satisfies` naming no skill** is a dangling edge — the Tool claims to
 * implement something that does not exist, and an agent following the graph
 * from Tool to skill lands nowhere. Hard error.
 *
 * **A skill with no Tool** is the more interesting one and is NOT an error. The
 * skill/Tool separation says a skill states a capability generically; plenty of
 * skills are pure judgement (`interaction-modality`, `one-voice-style-guide`)
 * and have no mechanism to name. What matters is that the number is *reported*,
 * because a skill that describes an action and has no Tool is a skill whose
 * mechanism is still inlined in its prose — the migration debt
 * `skills-and-tools` names.
 *
 * Deliberately NOT here: whether `io.*.schema` IRIs dereference. They point at
 * the published type document, which does not exist until CI publishes it, so
 * checking it locally would fail on every developer machine and be switched
 * off. What IS checked is that every `$defs` name a Tool references is one the
 * shared vocabulary actually declares — the half that can be known offline.
 *
 * @module scripts/check-tools
 * @covers tools, skills
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { tools } from "../tools/discover.js";
import { TOOL_TYPES, isInjectionSafe } from "../schemas/tool-types.js";
import { knownSkills as knownSkillsIn } from "./known-skills.js";
import { instanceDirectoryForGraph, instanceRootsIn, repoRootFor } from "../schemas/cat-harness.js";

/**
 * THIS INSTANCE'S OWN `schemas` directory, or the convention.
 *
 * declared-path-literal: the fallback is at the call site so the choice is
 * visible. `schemas/` declares TWO graphs — it is a knowledge-graph node AND
 * the schema definitions — which is why the `schemas` one is asked for by name
 * rather than being handed a single-home guess.
 *
 * `instanceDirectoryForGraph`, not `directoriesForGraph(...)[0]`, because every use
 * below composes a path INSIDE this directory. The question is "where is MY
 * schemas directory", not "who declares schemas" — and from the `cat-harness`
 * root those have different answers: measured 2026-09-20, `schemas` resolves
 * to FOUR homes (`cat-harness/`, `folio-assistant-core/`, `large-datasets/`,
 * `detangle/`), three of them arriving through the dependency overlay and
 * belonging to somebody else. `[0]` was right only because the resolver
 * happens to order the root's own declarations first; a reordering would have
 * sent this generator's output into another checkout, silently. Bean `a02m`.
 */
function schemasRoot(root: string): string {
  return instanceDirectoryForGraph(root, "schemas") ?? join(root, "schemas");
}


const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The repository, one level above the instance. `invoke.shell` runs from here. */
const REPO = join(ROOT, "..");

/**
 * Does every path a Tool node declares actually exist?
 *
 * ## The defect this exists for
 *
 * **Nine of the forty-four checkable `invoke.shell` values named a command that
 * does not run.** Every one was missing the `cat-harness/` prefix — stale since
 * the instance moved under that directory — and `bun run cat-harness/scripts/ingest-document.ts`
 * failed with `Module not found`. Two Tool nodes, `ingest-stdlib` and
 * `ingest-extended`, had been unreachable through their own declared invocation
 * for as long as the inversion has been in.
 *
 * Nothing caught it, and `code-node-review` says why it expected not to: *"what
 * no audit can tell you: whether the mechanism a Tool describes is the one that
 * runs"*. That is true of WHAT the command does. It is **not** true of whether
 * the command exists, which is a path and a filesystem — so the honest split is
 * to check the part that is mechanical and leave the rest to a reviewer.
 *
 * ## Two roots, because the two fields mean different things
 *
 * | field | resolved against | why |
 * |---|---|---|
 * | `invoke.shell` | the **repository** | it is a command a caller types, and `package.json` and `.github/` are at the repo root |
 * | `invoke.*.module` | the **instance** | it is loaded by this instance's own server, and matches `maintains.source` |
 *
 * Getting that backwards would have "fixed" twenty correct paths. The `module`
 * field's own docstring said *"Repo-relative"* while giving `src/tools/workflow.ts`
 * as its example — which is instance-relative and is where the file actually is —
 * so the word was stale and the values were right.
 *
 * A bare command (`beans`, `jq`) is a RUNTIME DEPENDENCY rather than a path, and
 * is reported as not-checkable rather than as passing: `requires.runtime` is where
 * that claim lives, and this check has no business ruling on it.
 */
export function unresolvedPaths(): { field: string; tool: string; value: string; expected: string }[] {
  const out: { field: string; tool: string; value: string; expected: string }[] = [];
  for (const t of tools()) {
    const inv = t.invoke as Record<string, unknown> | undefined;
    if (!inv) continue;

    const shell = typeof inv.shell === "string" ? inv.shell : undefined;
    if (shell !== undefined) {
      // `bun run X` where X is a path, or a bare path to a script or workflow.
      const m = /^(?:bun|bunx) run ([^\s]+)/.exec(shell);
      const target = m?.[1] ?? (/^[.\w][\w./-]*\.(?:ts|sh|ya?ml)$/.test(shell) ? shell : undefined);
      // A `package.json` script name, not a path — `check:tools` and friends.
      if (target !== undefined && /\.(?:ts|sh|ya?ml)$/.test(target) && !existsSync(join(REPO, target))) {
        out.push({ field: "invoke.shell", tool: t.id, value: shell, expected: `${target} under the repository root` });
      }
    }

    for (const arm of ["inProcess", "container", "mcp"]) {
      const a = inv[arm] as { module?: unknown } | undefined;
      const mod = a && typeof a.module === "string" ? a.module : undefined;
      if (mod !== undefined && !existsSync(join(ROOT, mod))) {
        out.push({ field: `invoke.${arm}.module`, tool: t.id, value: mod, expected: `${mod} under the instance root` });
      }
    }
  }
  return out.sort((x, y) => x.tool.localeCompare(y.tool));
}

/**
 * Skill names, from the ONE definition of where a skill lives.
 *
 * ## It had its own, and both halves of the disagreement were live
 *
 * This module carried a local scan: the FIRST declared `cat-harness` root, its
 * immediate subdirectories, and two literal extras. `known-skills.ts` exists
 * precisely so that no second answer to "does this skill exist" can drift from
 * the first — its own header says two copies are "how one of them ends up
 * reporting a wall of false dangling refs" — and this was the second copy.
 *
 * Measured 2026-09-20, the two sets differed **both ways** at once:
 *
 *  - **36 non-skills admitted.** `skills/memory/` then held agent-memory nodes,
 *    every one a `.md` in a declared directory and none an instruction body.
 *    {@link isSkillMd} excludes them by their `$schema:` line; a directory
 *    scan cannot. So `satisfies: ["the-complement"]` would have RESOLVED —
 *    a Tool claiming to implement a memory entry, checked and passed.
 *  - **2 real skills missed.** `bootstrap/skills/` holds its skills DIRECTLY
 *    rather than in packages, and a scan of one root's subdirectories never
 *    looks at the root itself. `confirm-harness` and `log-message` read as
 *    dangling — which is how this was found: a Tool naming a skill that is
 *    there, reported as an error.
 *
 * Taking the first root alone is the `dh4f` shape as well: a second declared
 * root is scanned by nobody and reports clean.
 *
 * Zero-argument, because every caller here means THIS repository and the root
 * is this module's own. The canonical function takes one, since a checker for
 * another instance is a thing that exists.
 */
export function knownSkills(): Set<string> {
  return knownSkillsIn(ROOT);
}

/**
 * What a skill's input contract requires, by property name.
 *
 * Reads `schemas/skills/<skill>/input.schema.json` — the same directory
 * `.claude/skills/local/<skill>.json` points at with `schemaRef`, and the same
 * one `kg-export` publishes. Returns `undefined` for a skill with no contract,
 * which is the common case and not a defect: most skills declare none.
 *
 * **`undefined` and `[]` are different answers and both are kept.** A skill
 * with no contract cannot be checked; a skill whose contract requires nothing
 * is checked and passes. Collapsing them would turn an unreadable file into a
 * silent pass, which is the "could not determine rendered as green" failure
 * this repo keeps writing down.
 */
export function contractRequires(root: string, skill: string): string[] | undefined {
  const f = join(schemasRoot(root), "skills", skill, "input.schema.json");
  if (!existsSync(f)) return undefined;
  try {
    const d = JSON.parse(readFileSync(f, "utf-8")) as { required?: unknown };
    return Array.isArray(d.required) ? d.required.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return undefined;
  }
}

export interface ToolCheck {
  danglingSatisfies: Array<{ tool: string; skill: string }>;
  unknownTypes: Array<{ tool: string; port: string; ref: string }>;
  /** Command-line inputs whose type can express a shell payload. */
  unsafeArgs: Array<{ tool: string; port: string; type: string }>;
  /**
   * A Tool claiming to satisfy a skill whose input contract it cannot receive.
   *
   * `satisfies` asserts "this Tool is one concrete way to exercise that skill".
   * If the skill's contract requires an input the Tool has no port for, the
   * Tool cannot exercise it and the edge is false.
   */
  unmetContracts: Array<{ tool: string; skill: string; missing: string[]; has: string[] }>;
  /** Skills whose contract could not be read — never counted as agreement. */
  unreadableContracts: string[];
  /**
   * An `alternativeTo` naming a Tool that does not exist.
   *
   * Same class as a dangling `satisfies`: an edge to nothing, which reads as a
   * choice the agent cannot find.
   */
  danglingAlternatives: Array<{ tool: string; names: string }>;
  /**
   * A declared alternative the other end does not return.
   *
   * If A names B and B is silent, a reader arriving at B never learns a choice
   * exists — the failure this relation exists to prevent, occurring exactly
   * half the time, which is worse than not declaring it because the half that
   * works makes it look maintained.
   */
  asymmetricAlternatives: Array<{ tool: string; names: string }>;
  skillsWithTools: number;
  skillsWithoutTools: number;
}

/**
 * Skill ids a `satisfies` may legitimately name, which is WIDER than the ones
 * this instance overlays.
 *
 * `knownSkills()` answers *"which skills are in MY overlay"*. For "every skill
 * has a Tool" that is the right question — an instance is not accountable for
 * covering another instance's skills. For *"does this `satisfies` name a real
 * skill"* it is the WRONG one, and the difference is the same conflation this
 * repository keeps paying for: **not in my overlay is not does not exist.**
 *
 * Found 2026-09-21 by the owner's ruling on `pve3` (*"neither"*), which
 * removed `bootstrap/skills/` from the root's declared directories. Two
 * Tools then reported as dangling — `discuss` → `discussion` and
 * `log-message` → `log-message` — and both skills exist, declared, in
 * `bootstrap/harness.json`. The Tools live here because a Tool is
 * cat-harness's vocabulary and bootstrap may not import it (bean `gn4l`
 * records that as a limitation, with the node moving unchanged when tool
 * collection stops being import-bound), so the cross-instance edge is the
 * architecture rather than a defect.
 *
 * This widens ONE direction on purpose. Coverage still counts only this
 * instance's skills, so adding a sibling cannot silently create an obligation
 * to write Tools for it.
 */
function satisfiableSkills(): Set<string> {
  const out = new Set(knownSkills());
  // `ROOT` is THIS INSTANCE (`cat-harness/`), not the checkout. Sibling
  // instances are enumerated from the repository root, and reading the wrong
  // one here returns an empty list that looks exactly like "no siblings
  // declare it" — the vacuous-green shape, arrived at by using a variable
  // whose name does not say which root it is.
  for (const instance of instanceRootsIn(repoRootFor(ROOT))) {
    if (resolve(instance) === resolve(ROOT)) continue;
    for (const id of knownSkillsIn(instance)) out.add(id);
  }
  return out;
}

export function checkTools(): ToolCheck {
  // Coverage is asked of THIS instance's skills; resolution is asked of every
  // declared one. Two questions, two sets — see `satisfiableSkills`.
  const skills = knownSkills();
  const resolvable = satisfiableSkills();
  const typeNames = new Set(Object.keys(TOOL_TYPES));
  const dangling: Array<{ tool: string; skill: string }> = [];
  const unknownTypes: Array<{ tool: string; port: string; ref: string }> = [];
  const unsafeArgs: Array<{ tool: string; port: string; type: string }> = [];
  const unmetContracts: ToolCheck["unmetContracts"] = [];
  const unreadable = new Set<string>();
  const covered = new Set<string>();
  const danglingAlternatives: ToolCheck["danglingAlternatives"] = [];
  const asymmetricAlternatives: ToolCheck["asymmetricAlternatives"] = [];

  for (const t of tools()) {
    const portNames = new Set(t.io.inputs.map((i) => i.name));
    for (const s of t.satisfies) {
      if (skills.has(s)) covered.add(s);
      // Resolvable-but-not-ours is neither covered nor dangling: the edge is
      // real and this instance is not accountable for the skill.
      else if (!resolvable.has(s)) dangling.push({ tool: t.id, skill: s });

      // ## What is compared, and what deliberately is not
      //
      // NAMES ONLY. A skill's contract is free-form JSON Schema; a Tool's `io`
      // is named ports referencing shared `$defs` IRIs. The two shapes are not
      // structurally comparable and pretending otherwise would produce a check
      // that is either vacuous or wrong.
      //
      // Types are excluded on evidence rather than on principle: measured
      // across the 22 contracts in this repo, nearly every property is a bare
      // `{"type": "string"}`, so a type comparison would pass on anything.
      //
      // A name mismatch that is only a naming difference (`path` vs
      // `targetPath`) is a FINDING here rather than a false positive to
      // suppress. Two names for one input across a skill and the Tool that
      // claims to implement it is itself worth fixing — an agent reading the
      // contract cannot call the Tool.
      const required = contractRequires(ROOT, s);
      if (required === undefined) {
        // No contract at all is the common case and not a defect. A contract
        // that exists but will not parse IS one, and is reported separately.
        if (existsSync(join(ROOT, "schemas", "skills", s, "input.schema.json"))) unreadable.add(s);
        continue;
      }
      const missing = required.filter((r) => !portNames.has(r));
      if (missing.length > 0) {
        unmetContracts.push({ tool: t.id, skill: s, missing, has: [...portNames] });
      }
    }
    for (const p of [...t.io.inputs, ...t.io.outputs]) {
      const name = p.schema.split("#/$defs/")[1];
      if (name === undefined || !typeNames.has(name)) {
        unknownTypes.push({ tool: t.id, port: p.name, ref: p.schema });
      }
    }
    // The injection rule, enforced rather than documented: a value that reaches
    // argv must be of a type that cannot express a shell payload. Free prose
    // goes on stdin, where it is data instead of program text.
    for (const i of t.io.inputs) {
      if (i.arg === undefined || "stdin" in i.arg) continue;
      const name = i.schema.split("#/$defs/")[1] ?? "";
      if (!isInjectionSafe(name)) unsafeArgs.push({ tool: t.id, port: i.name, type: name });
    }
  }

  // The alternative relation, checked in a second pass because it is about
  // pairs: the first pass cannot know whether a Tool later in the list returns
  // the edge. Built from the same `tools()` call, so a Tool that fails to
  // parse never reaches here.
  {
    const byId = new Map(tools().map((t) => [t.id, t]));
    for (const t of tools()) {
      for (const other of t.alternativeTo ?? []) {
        const peer = byId.get(other);
        if (peer === undefined) {
          danglingAlternatives.push({ tool: t.id, names: other });
          continue;
        }
        if (!(peer.alternativeTo ?? []).includes(t.id)) {
          asymmetricAlternatives.push({ tool: t.id, names: other });
        }
      }
    }
  }

  return {
    danglingSatisfies: dangling,
    unknownTypes,
    unsafeArgs,
    unmetContracts,
    unreadableContracts: [...unreadable].sort(),
    danglingAlternatives,
    asymmetricAlternatives,
    skillsWithTools: covered.size,
    skillsWithoutTools: skills.size - covered.size,
  };
}

if (import.meta.main) {
  const r = checkTools();
  const all = tools();
  console.log(`Tools: ${all.length}\n`);
  for (const t of all) console.log(`  ${t.id.padEnd(16)} → ${t.satisfies.length} skill(s)`);
  console.log(`\n  ${r.skillsWithTools} skill(s) have a Tool; ${r.skillsWithoutTools} do not.`);
  console.log("  A skill with no Tool is not an error — many are pure judgement.");
  console.log("  It is reported because a skill that describes an ACTION and has no");
  console.log("  Tool still has its mechanism inlined in its prose.");

  let bad = false;
  if (r.danglingSatisfies.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.danglingSatisfies.length} satisfies naming no skill:`);
    for (const d of r.danglingSatisfies) console.error(`    ${d.tool} → ${d.skill}`);
  }
  if (r.unsafeArgs.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.unsafeArgs.length} command-line input(s) of a type that can express a shell payload:`);
    for (const u of r.unsafeArgs) console.error(`    ${u.tool}.${u.port} : ${u.type} — put free text on stdin`);
  }
  if (r.unknownTypes.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.unknownTypes.length} port(s) referencing an unknown type:`);
    for (const u of r.unknownTypes) console.error(`    ${u.tool}.${u.port} → ${u.ref}`);
  }
  if (r.danglingAlternatives.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.danglingAlternatives.length} alternativeTo naming no Tool:`);
    for (const d of r.danglingAlternatives) console.error(`    ${d.tool} → ${d.names}`);
  }
  if (r.asymmetricAlternatives.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.asymmetricAlternatives.length} one-sided alternative(s):`);
    for (const d of r.asymmetricAlternatives) {
      console.error(`    ${d.tool} names ${d.names}, but ${d.names} does not name ${d.tool}`);
    }
    console.error(
      "    An agent arriving at the silent end never learns a choice exists.\n" +
        "    Add the return edge, and give both ends a `selection`.",
    );
  }
  if (r.unmetContracts.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.unmetContracts.length} satisfies edge(s) the skill's own contract contradicts:`);
    for (const u of r.unmetContracts) {
      console.error(`    ${u.tool} → ${u.skill}`);
      console.error(`       contract requires : ${u.missing.join(", ")}`);
      console.error(`       tool accepts      : ${u.has.length > 0 ? u.has.join(", ") : "(no inputs)"}`);
    }
    console.error(
      "    A `satisfies` edge asserts the Tool is one concrete way to exercise the skill.\n" +
        "    Either the Tool needs the input, or the edge is wrong and should be dropped.",
    );
  }
  if (r.unreadableContracts.length > 0) {
    // Never rendered as agreement. A contract that will not parse is a third
    // state, and a check that treats it as a pass is worse than no check.
    bad = true;
    console.error(`\n✗ ${r.unreadableContracts.length} skill contract(s) present but unreadable:`);
    for (const s of r.unreadableContracts) console.error(`    schemas/skills/${s}/input.schema.json`);
  }
  const unresolved = unresolvedPaths();
  if (unresolved.length > 0) {
    bad = true;
    console.error(`\n✗ ${unresolved.length} declared path(s) that do not exist:`);
    for (const u of unresolved) console.error(`    ${u.tool}.${u.field} = ${u.value}\n      expected ${u.expected}`);
    console.error(
      "\n    A node naming a command that does not run is unreachable through its own\n" +
        "    declaration, which is the one thing a Tool node is for.",
    );
  }
  if (bad) process.exit(1);
  console.log(
    "\n✓ every satisfies resolves and agrees with its skill's contract; " +
      "every io type is declared; every argv input is injection-safe; " +
      "every declared path exists",
  );
}
