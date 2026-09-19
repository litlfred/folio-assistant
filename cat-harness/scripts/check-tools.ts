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
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { tools } from "../tools/index.js";
import { TOOL_TYPES, isInjectionSafe } from "../schemas/tool-types.js";
import { kgRoots } from "./known-skills.js";
import { directoryForGraph } from "../schemas/cat-harness.js";

/**
 * The declared `schemas` graph, or the convention.
 *
 * declared-path-literal: the fallback is at the call site so the choice is
 * visible. `schemas/` declares TWO graphs — it is a knowledge-graph node AND
 * the schema definitions — which is why `directoryForGraph` is asked for the
 * `schemas` one by name rather than being handed a single-home guess.
 */
function schemasRoot(root: string): string {
  return directoryForGraph(root, "schemas") ?? join(root, "schemas");
}


const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Skill names, discovered — never a hardcoded list. See kg-export's note. */
export function knownSkills(): Set<string> {
  const names = new Set<string>();
  const dirs: string[] = [];
  // declared-path-literal: the convention fallback. Every declared root is
  // scanned below; this names one for the message when none is declared.
  const skillsRoot = kgRoots(ROOT)[0] ?? join(ROOT, "skills");
  if (existsSync(skillsRoot)) {
    for (const d of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (d.isDirectory()) dirs.push(join(skillsRoot, d.name));
    }
  }
  for (const extra of ["src/skills", ".claude/skills/local"]) {
    if (existsSync(join(ROOT, extra))) dirs.push(join(ROOT, extra));
  }
  for (const dir of dirs) {
    for (const f of readdirSync(dir)) if (f.endsWith(".md")) names.add(f.slice(0, -3));
  }
  const io = join(ROOT, "schemas", "skills");
  if (existsSync(io)) {
    for (const e of readdirSync(io, { withFileTypes: true })) if (e.isDirectory()) names.add(e.name);
  }
  return names;
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
  skillsWithTools: number;
  skillsWithoutTools: number;
}

export function checkTools(): ToolCheck {
  const skills = knownSkills();
  const typeNames = new Set(Object.keys(TOOL_TYPES));
  const dangling: Array<{ tool: string; skill: string }> = [];
  const unknownTypes: Array<{ tool: string; port: string; ref: string }> = [];
  const unsafeArgs: Array<{ tool: string; port: string; type: string }> = [];
  const unmetContracts: ToolCheck["unmetContracts"] = [];
  const unreadable = new Set<string>();
  const covered = new Set<string>();

  for (const t of tools()) {
    const portNames = new Set(t.io.inputs.map((i) => i.name));
    for (const s of t.satisfies) {
      if (skills.has(s)) covered.add(s);
      else dangling.push({ tool: t.id, skill: s });

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

  return {
    danglingSatisfies: dangling,
    unknownTypes,
    unsafeArgs,
    unmetContracts,
    unreadableContracts: [...unreadable].sort(),
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
  if (bad) process.exit(1);
  console.log(
    "\n✓ every satisfies resolves and agrees with its skill's contract; " +
      "every io type is declared; every argv input is injection-safe",
  );
}
