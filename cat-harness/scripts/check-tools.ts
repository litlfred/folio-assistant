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
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { tools, toolsOf } from "../tools/discover.js";
import { TOOL_TYPES, isInjectionSafe } from "../schemas/tool-types.js";
import { alternativesWithoutSelection } from "../schemas/tool.js";
import { toJsonSchema } from "../schemas/to-json-schema.js";
import { contractFile, skillContracts } from "./skill-contracts.js";
import { corpusScopeFor, knownSkills as knownSkillsIn, workflowFiles } from "./known-skills.js";
import { instanceRootsIn, repoRootFor } from "../schemas/cat-harness.js";
import { resolveImplementingPath } from "../schemas/harness-config.js";
import type { ToolDefinition } from "../schemas/tool.js";

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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The Tools an answer is about: ONE instance's, or the whole repository's.
 *
 * **Absent means the repository, and that is the pre-existing behaviour rather
 * than a default chosen here.** `tools()` reads every declared instance's
 * `tools` graph, which is right for a repo-wide check — `discover.ts` says so
 * on `tools` itself ("A check or an audit over the whole repository reads
 * tools"). Passing an instance switches to `toolsOf`, whose docblock names
 * exactly the failure this parameter exists to fix: filling one instance's
 * document with another's Tools gives `satisfies` links into documents that are
 * never published.
 *
 * Measured 2026-09-26, and it is why the parameter was added: `kg:audit
 * --instance ./bootstrap` wrote **119** tool sidecars into an instance that
 * declares no `tools` directory and has no `bootstrap/tools/`. They were
 * cat-harness's Tool nodes audited as bootstrap's, so `graph.test.ts > nothing
 * in bootstrap/ names anything above it` (bean `iwtn`) failed on the NAMES —
 * `tools/folio-init` and three more — with zero path escapes. A criterion
 * scoped to an instance is only as instance-scoped as the data it reads.
 */
export function toolsFor(instance?: string) {
  return instance === undefined ? tools() : toolsOf(instance);
}

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
 * | `invoke.*.module` | the **declaring instance**, then the one instance that **implements** it | it is loaded by the implementing instance's server, and matches `maintains.source` |
 *
 * "Implements" is owner ruling T1 (2026-10-01, bean `70lx`): the definitions
 * stay in the harness and the code moves to the layer above, so a module path
 * stays as written (`src/tools/x.ts`) and is found in the instance whose own
 * `needs` names the declarer — `resolveImplementingPath` in
 * `schemas/harness-config.ts`. Writing the implementer's name into the path
 * instead would be the harness naming a layer above it. Two implementers
 * holding the same path is reported, never resolved by order.
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
export function unresolvedPaths(
  instance?: string,
): { field: string; tool: string; value: string; expected: string }[] {
  const out: { field: string; tool: string; value: string; expected: string }[] = [];
  // `REPO` stays the checkout either way: an `invoke` path is repo-relative
  // whichever instance declared the Tool, so narrowing the tool SET must not
  // narrow where its paths are resolved.
  //
  // A `module`, by contrast, is resolved against the instance that DECLARED
  // the Tool, and then against the instance that implements it — so the Tools
  // are read per declaring instance rather than as one flat list.
  const roots = instance === undefined ? instanceRootsIn(REPO) : [instance];
  const declared: Array<{ declaringRoot: string; t: ToolDefinition }> = roots.flatMap((r) =>
    toolsOf(r).map((t) => ({ declaringRoot: resolve(r), t })),
  );
  for (const { declaringRoot, t } of declared) {
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
      if (mod === undefined) continue;
      const found = resolveImplementingPath(declaringRoot, mod);
      if (found.state === "missing") {
        out.push({
          field: `invoke.${arm}.module`,
          tool: t.id,
          value: mod,
          expected: `${mod} under the declaring instance or one instance that needs it (looked in ${found.looked.map((r) => relative(REPO, r) || ".").join(", ")})`,
        });
      } else if (found.state === "ambiguous") {
        out.push({
          field: `invoke.${arm}.module`,
          tool: t.id,
          value: mod,
          expected: `exactly one implementing instance, but ${found.candidates.map((c) => c.name).join(" and ")} both hold ${mod}`,
        });
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
  return knownSkillsIn(ROOT, corpusScopeFor(ROOT));
}

/**
 * A skill's input contract, parsed, or why it could not be.
 *
 * Found through the skill's own front matter (`input:`), never by a directory
 * name (#1168, B3b). `absent` is the common case and not a defect: most skills
 * declare no contract. `unreadable` covers a declared file that is missing or
 * does not parse, and `external` an https IRI this offline check cannot fetch —
 * both are reported, never counted as agreement.
 */
export type InputContract =
  | { kind: "absent" }
  | { kind: "external"; ref: string }
  | { kind: "unreadable"; ref: string }
  | { kind: "ok"; required: string[]; types: Map<string, string> };

export function inputContract(root: string, skill: string): InputContract {
  const c = skillContracts(root).get(skill);
  const ref = c?.input;
  if (c === undefined || ref === undefined) return { kind: "absent" };
  const f = contractFile(c.instanceRoot, ref);
  if (f === undefined) return { kind: "external", ref };
  if (!existsSync(f)) return { kind: "unreadable", ref };
  try {
    const d = JSON.parse(readFileSync(f, "utf-8")) as { required?: unknown; properties?: Record<string, { type?: unknown }> };
    const required = Array.isArray(d.required) ? d.required.filter((x): x is string => typeof x === "string") : [];
    const types = new Map<string, string>();
    for (const [k, v] of Object.entries(d.properties ?? {})) if (typeof v?.type === "string") types.set(k, v.type);
    return { kind: "ok", required, types };
  } catch {
    return { kind: "unreadable", ref };
  }
}

/**
 * What a skill's input contract requires, by property name.
 *
 * **`undefined` and `[]` are different answers and both are kept.** A skill
 * with no readable contract cannot be checked; a skill whose contract requires
 * nothing is checked and passes. Collapsing them would turn an unreadable file
 * into a silent pass, which is the "could not determine rendered as green"
 * failure this repo keeps writing down.
 */
export function contractRequires(root: string, skill: string): string[] | undefined {
  const c = inputContract(root, skill);
  return c.kind === "ok" ? c.required : undefined;
}

/** The JSON Schema `type` a shared vocabulary type projects to, when it has one. */
function jsonTypeOf(vocabularyName: string): string | undefined {
  const z = (TOOL_TYPES as Record<string, Parameters<typeof toJsonSchema>[0]>)[vocabularyName];
  if (z === undefined) return undefined;
  const t = toJsonSchema(z).type;
  return typeof t === "string" ? t : undefined;
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
  /**
   * A Tool input whose type contradicts the contract property of the same name
   * — the contract says `array`, the port takes a `string` — so the Tool
   * cannot receive what the skill is specified to take.
   */
  mistypedContracts: Array<{ tool: string; skill: string; port: string; contract: string; tool_type: string }>;
  /** Skills whose contract could not be read — never counted as agreement. */
  unreadableContracts: string[];
  /**
   * A Tool with a DERIVED alternative ({@link deriveAlternatives}) that
   * carries no `selection`.
   *
   * The reader learns a choice exists and cannot make it. Checked here rather
   * than in the schema because whether a Tool HAS an alternative is a fact
   * about the whole set, which a single node cannot see (#1168, B9a). The
   * dangling and one-sided checks this replaces are gone with the field: a
   * derived relation cannot name a Tool that does not exist, and is
   * symmetric by construction.
   */
  unselectableAlternatives: Array<{ tool: string; alternatives: string[] }>;
  /**
   * A Tool naming a `subprocesses` id no `.bpmn` in the checkout has as its
   * stem (placement ruling 6: a Tool may describe its own specific
   * subprocess). A pointer at nothing is the dangling-edge shape `satisfies`
   * is already held to.
   */
  danglingSubprocesses: Array<{ tool: string; process: string }>;
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
/**
 * Every process id (`.bpmn` stem) any instance in this checkout declares —
 * the set a Tool's `subprocesses` may name. Every instance, for the reason
 * `satisfiableSkills` gives: not in my overlay is not does not exist.
 */
function declaredProcessIds(instance: string = ROOT): Set<string> {
  const out = new Set<string>();
  for (const inst of new Set([resolve(instance), ...instanceRootsIn(repoRootFor(instance)).map((r) => resolve(r))])) {
    for (const f of workflowFiles(inst)) {
      if (f.endsWith(".bpmn")) out.add(f.replace(/^.*\//, "").slice(0, -".bpmn".length));
    }
  }
  return out;
}

function satisfiableSkills(instance: string = ROOT): Set<string> {
  const out = new Set(knownSkillsIn(instance));
  // `ROOT` is THIS INSTANCE (`cat-harness/`), not the checkout. Sibling
  // instances are enumerated from the repository root, and reading the wrong
  // one here returns an empty list that looks exactly like "no siblings
  // declare it" — the vacuous-green shape, arrived at by using a variable
  // whose name does not say which root it is.
  for (const sibling of instanceRootsIn(repoRootFor(instance))) {
    if (resolve(sibling) === resolve(instance)) continue;
    for (const id of knownSkillsIn(sibling)) out.add(id);
  }
  return out;
}

export function checkTools(instance?: string): ToolCheck {
  // Coverage is asked of THE AUDITED instance's skills; resolution is asked of
  // every declared one. Two questions, two sets — see `satisfiableSkills`.
  //
  // `instance` absent keeps every existing call site and the repo-wide gate
  // exactly as they were: this instance's skills, the repository's Tools.
  const skills = instance === undefined ? knownSkills() : knownSkillsIn(instance);
  const resolvable = satisfiableSkills(instance);
  const typeNames = new Set(Object.keys(TOOL_TYPES));
  const dangling: Array<{ tool: string; skill: string }> = [];
  const unknownTypes: Array<{ tool: string; port: string; ref: string }> = [];
  const unsafeArgs: Array<{ tool: string; port: string; type: string }> = [];
  const unmetContracts: ToolCheck["unmetContracts"] = [];
  const mistypedContracts: ToolCheck["mistypedContracts"] = [];
  const unreadable = new Set<string>();
  const covered = new Set<string>();
  const unselectableAlternatives: ToolCheck["unselectableAlternatives"] = [];
  const danglingSubprocesses: ToolCheck["danglingSubprocesses"] = [];
  let processIds: Set<string> | undefined;

  for (const t of toolsFor(instance)) {
    for (const p of t.subprocesses ?? []) {
      processIds ??= declaredProcessIds(instance);
      if (!processIds.has(p)) danglingSubprocesses.push({ tool: t.id, process: p });
    }
    const portNames = new Set(t.io.inputs.map((i) => i.name));
    for (const s of t.satisfies) {
      if (skills.has(s)) covered.add(s);
      // Resolvable-but-not-ours is neither covered nor dangling: the edge is
      // real and this instance is not accountable for the skill.
      else if (!resolvable.has(s)) dangling.push({ tool: t.id, skill: s });

      // ## What is compared
      //
      // NAMES, then TYPES of the names both sides share. A skill's contract is
      // free-form JSON Schema; a Tool's `io` is named ports referencing shared
      // `$defs`. They meet at two points: a required property must have a port
      // of that name, and where a port and a property share a name, the JSON
      // type the port's vocabulary type projects to must be the property's.
      //
      // Types were once excluded as vacuous — nearly every contract property
      // is a bare `{"type": "string"}`. That makes the comparison WEAK, not
      // empty: it still catches an `array` contract served by a `string` port,
      // or a `string` served by a boolean `Flag`, which is a Tool that cannot
      // receive what the skill takes (#1168, B3b).
      //
      // A name mismatch that is only a naming difference (`path` vs
      // `targetPath`) is a FINDING rather than a false positive to suppress.
      const contract = inputContract(ROOT, s);
      if (contract.kind === "absent" || contract.kind === "external") continue;
      if (contract.kind === "unreadable") {
        unreadable.add(s);
        continue;
      }
      const missing = contract.required.filter((r) => !portNames.has(r));
      if (missing.length > 0) {
        unmetContracts.push({ tool: t.id, skill: s, missing, has: [...portNames] });
      }
      for (const i of t.io.inputs) {
        const want = contract.types.get(i.name);
        const have = jsonTypeOf(i.schema.split("#/$defs/")[1] ?? "");
        // An integer IS a number; the reverse does not hold.
        const compatible = want === have || (want === "number" && have === "integer");
        if (want !== undefined && have !== undefined && !compatible) {
          mistypedContracts.push({ tool: t.id, skill: s, port: i.name, contract: want, tool_type: have });
        }
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

  // The alternative relation, in a second pass because it is about pairs.
  // Built from the same `toolsFor()` call, so a Tool that fails to parse
  // never reaches here.
  unselectableAlternatives.push(...alternativesWithoutSelection(toolsFor(instance)));

  return {
    danglingSatisfies: dangling,
    unknownTypes,
    unsafeArgs,
    unmetContracts,
    mistypedContracts,
    unreadableContracts: [...unreadable].sort(),
    unselectableAlternatives,
    danglingSubprocesses,
    skillsWithTools: covered.size,
    skillsWithoutTools: skills.size - covered.size,
  };
}

if (import.meta.main) {
  // The CLI is the REPOSITORY-wide gate and passes no instance on purpose:
  // `check:tools` is one verdict over every declared instance's Tools, which is
  // what it has always been. Per-instance auditing is `kg:audit --instance`.
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
  if (r.danglingSubprocesses.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.danglingSubprocesses.length} subprocess(es) naming no declared .bpmn:`);
    for (const d of r.danglingSubprocesses) console.error(`    ${d.tool} → ${d.process}`);
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
  if (r.unselectableAlternatives.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.unselectableAlternatives.length} Tool(s) with an alternative and no \`selection\`:`);
    for (const d of r.unselectableAlternatives) console.error(`    ${d.tool} ~ ${d.alternatives.join(", ")}`);
    console.error("    A reader learns a choice exists without learning how to make it. Add `selection` (when, limits, cost).");
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
  if (r.mistypedContracts.length > 0) {
    bad = true;
    console.error(`\n✗ ${r.mistypedContracts.length} Tool input(s) whose type contradicts the skill's contract:`);
    for (const m of r.mistypedContracts) {
      console.error(`    ${m.tool}.${m.port} → ${m.skill}: contract says ${m.contract}, the port takes ${m.tool_type}`);
    }
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
