#!/usr/bin/env bun
/**
 * Every `degradation: "fallback"` has something real to fall back TO.
 *
 * Bean `folio-assistant-85e8`. The degradation model could express *use a
 * different tool* and not *use a different kind of participant* — the
 * owner's case, 2026-09-20: an air-gapped actor whose API cannot be
 * reached, where a person signs instead.
 *
 * ## What this checked before, and why it changed
 *
 * It checked that a declared `fallbackRole: "…"` named a real role. The
 * owner asked the better question the same day — *"do we need fallbackRole,
 * can it be computed, i dont like duplicate data maintenace issues"* — and
 * it can, exactly. The diagram already carries the fact executably:
 * `Task_HumanSign` is a `userTask` in `Lane_Human`, which binds
 * `publication-manager`. The declaration was a second copy with nothing
 * asserting the two agreed.
 *
 * So the field is gone and this checks the property the field was standing
 * in for, which is **strictly stronger**: a `fallback` must resolve to a
 * declared capability OR to a derivable human lane. The old check could
 * only catch a misspelt role; this catches a fallback with nothing behind
 * it at all — including the case the old one was blind to, a `fallback`
 * that declared neither.
 *
 * ## Why a human-only lane is the right derivation
 *
 * `fulfilmentKindsForBpmnType` maps `bpmn:UserTask` to `person` alone. The
 * signing diagram's own documentation already leans on it — *"will not let
 * a system actor fill it, which is what stops the air-gapped route quietly
 * becoming another machine route"*. Reusing that join means the fallback
 * role and the thing that enforces the route cannot disagree, because they
 * are the same fact.
 *
 * Measured before the field was removed: the derivation returns exactly the
 * declared value for `qa-report-signing`, and is unambiguous — 3 of 3
 * skills with any human-only lane have exactly one such role.
 *
 * ## The vacuity guard
 *
 * A check over a corpus it never loaded passes trivially, which is not the
 * same as passing. This repository has paid for that three times: a `grep`
 * over zero Lean files printing OK, a `ruff` scan of missing paths
 * reporting a baseline it never computed, and `readme:sync:check` passing
 * over a README with no markers. So the run states what it examined, and
 * refuses when the corpus is empty rather than reporting a clean sweep.
 *
 * Usage:
 *   bun run check:fallback-roles
 *   bun run check:fallback-roles -- --explain   # print each derivation
 *
 * @module scripts/check-fallback-roles
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { kgRoots, workflowFiles } from "./known-skills.js";
import { readRoleGraph } from "../schemas/role-graph.js";
import { fulfilmentKindsForBpmnType } from "../schemas/role-graph.js";
import { isActivity, loadProcessModel } from "../src/workflow/process-model.js";

const ROOT = resolve(import.meta.dir, "..");

/** One `degradation: "fallback"` occurrence, with enough to find it again. */
export interface FallbackUse {
  file: string;
  /** The skill id, taken from the module basename. */
  skill: string;
  capabilityId: string;
  /** `fallbackCapabilityId`, when the module declares one. */
  fallbackCapabilityId?: string;
}

/**
 * Every declared role id, across every declared knowledge-graph root.
 *
 * Through `kgRoots` and `readRoleGraph` rather than a literal path: the
 * `kg` directory is declared in `harness.json` and an instance may put it
 * anywhere, so a hardcoded `skills/roles/roles.json` is one relocation away
 * from checking nothing. `check:declared-paths` caught exactly that in the
 * first draft of this file.
 */
export function declaredRoles(root: string): Set<string> {
  const out = new Set<string>();
  for (const kgRoot of kgRoots(root)) {
    for (const r of readRoleGraph(kgRoot)?.roles ?? []) out.add(r.id);
  }
  return out;
}

/** Every declared capability id. */
export function declaredCapabilities(root: string): Set<string> {
  const out = new Set<string>();
  // `.claude/skills/capabilities/` is a convention rather than a declared
  // graph — the same place `src/tools/capabilities.ts` reads.
  for (const base of new Set([root, resolve(root, "..")])) {
    const dir = join(base, ".claude", "skills", "capabilities");
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const f of names.filter((n) => n.endsWith(".json"))) {
      try {
        out.add(JSON.parse(readFileSync(join(dir, f), "utf-8")).id ?? basename(f, ".json"));
      } catch {
        // A capability file that will not parse is not a declared
        // capability. It is also not this check's business to report —
        // `kg:validate` owns that — so it is skipped rather than swallowed
        // into a pass.
      }
    }
  }
  return out;
}

/**
 * Blank out comments, keeping line numbers and code intact.
 *
 * Not cosmetic. This file's own header discusses `degradation: "fallback"`
 * in prose, and the first run of the rewritten check reported
 * `schemas/assistant-types.ts` as a skill with an unresolvable fallback —
 * it had matched a JSDoc table. A scanner that reads its own documentation
 * as corpus is the "measured the wrong thing" failure in miniature.
 *
 * It also fixes the reverse: a commented-out capability ref no longer
 * counts as a declaration.
 */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .split("\n")
    .map((l) => (/^\s*\/\//.test(l) ? "" : l))
    .join("\n");
}

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    // Every segment, not just the first — the dot-prefix guard this repo
    // already applies in `directory-conventions`.
    if (e.startsWith(".") || e === "node_modules") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".ts") && !e.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

/**
 * Find every `degradation: "fallback"` entry in the scanned trees.
 *
 * A regex rather than the type checker, deliberately: the value must be a
 * literal for this to be checkable at all, and a computed one should be
 * visible as a miss rather than silently resolved.
 */
export function fallbackUses(root: string, dirs: string[]): FallbackUse[] {
  const out: FallbackUse[] = [];
  for (const d of dirs) {
    for (const f of walk(join(root, d))) {
      const text = stripComments(readFileSync(f, "utf-8"));
      // One capability ref per line is how every module in the corpus
      // writes them, and a ref split over lines would be a miss rather
      // than a false pass — visible in the count this prints.
      for (const line of text.split("\n")) {
        if (!/degradation:\s*["'`]fallback["'`]/.test(line)) continue;
        const cap = /capabilityId:\s*["'`]([^"'`]+)["'`]/.exec(line);
        const fb = /fallbackCapabilityId:\s*["'`]([^"'`]+)["'`]/.exec(line);
        out.push({
          file: relative(root, f),
          skill: basename(f, ".ts"),
          capabilityId: cap?.[1] ?? "(unparsed)",
          ...(fb ? { fallbackCapabilityId: fb[1]! } : {}),
        });
      }
    }
  }
  return out;
}

/**
 * The role a skill falls back to when no capability can do the work:
 * the role of a lane holding a task ONLY A PERSON can fill.
 *
 * Replaces the `fallbackRole` declaration. Returns every such role rather
 * than one, because "exactly one" is a property of today's corpus (3 of 3)
 * and not something this function may assume — a caller that needs one
 * should say what it does when there are two.
 */
export async function fallbackRoleFor(root: string, skill: string): Promise<string[]> {
  const roles = new Set<string>();
  for (const f of workflowFiles(root).filter((x) => x.endsWith(".bpmn"))) {
    const model = await loadProcessModel(f);
    for (const n of [...model.nodes.values()].filter(isActivity)) {
      if (!(n.skills ?? []).includes(skill)) continue;
      const kinds = fulfilmentKindsForBpmnType(n.type);
      // `undefined` means the BPMN type carries no fulfilment rule — not
      // that anyone may fill it. Treating that as human-fillable would
      // invent a fallback out of a gap in the mapping.
      if (!kinds || kinds.length === 0 || !kinds.every((k) => k === "person")) continue;
      if (n.roleRef) roles.add(n.roleRef);
    }
  }
  return [...roles].sort();
}

/** The trees a skill's capability refs can live in. */
export const SCANNED = ["skills", "src", "schemas", "content", "adapters"];

if (import.meta.main) {
  const explain = process.argv.includes("--explain");
  const roles = declaredRoles(ROOT);
  const caps = declaredCapabilities(ROOT);
  const uses = fallbackUses(ROOT, SCANNED);
  const diagrams = workflowFiles(ROOT).filter((f) => f.endsWith(".bpmn"));

  console.log(
    `fallback: ${uses.length} use(s) across ${SCANNED.length} tree(s); ` +
      `${roles.size} declared role(s), ${caps.size} declared capability(ies), ` +
      `${diagrams.length} diagram(s)`,
  );

  // Vacuity: with no diagrams the role derivation cannot run, so a
  // "fallback with nothing behind it" is indistinguishable from one whose
  // diagram this sweep never opened.
  if (diagrams.length === 0) {
    console.error(
      "\n✗ EXAMINED NO DIAGRAMS — the role derivation had nothing to read.\n" +
        "  This is NOT a pass: a fallback with no route looks identical to one\n" +
        "  whose diagram was never opened.",
    );
    process.exit(1);
  }

  const bad: string[] = [];
  for (const u of uses) {
    const viaCap = u.fallbackCapabilityId !== undefined;
    if (viaCap && !caps.has(u.fallbackCapabilityId!)) {
      bad.push(`${u.file}  →  fallbackCapabilityId "${u.fallbackCapabilityId}" is not a declared capability`);
      continue;
    }
    if (viaCap) {
      if (explain) console.log(`  · ${u.skill.padEnd(24)} ${u.capabilityId} → capability ${u.fallbackCapabilityId}`);
      continue;
    }
    const derived = await fallbackRoleFor(ROOT, u.skill);
    const unknown = derived.filter((r) => !roles.has(r));
    if (unknown.length > 0) {
      bad.push(`${u.file}  →  derived lane role(s) ${unknown.join(", ")} not in the role registry`);
      continue;
    }
    if (derived.length === 0) {
      bad.push(
        `${u.file}  →  declares no fallbackCapabilityId and no diagram gives "${u.skill}" a ` +
          `human-only lane, so the fallback resolves to nothing`,
      );
      continue;
    }
    if (explain) console.log(`  · ${u.skill.padEnd(24)} ${u.capabilityId} → role ${derived.join(", ")} (derived)`);
  }

  if (bad.length === 0) {
    console.log(`\n✓ every \`fallback\` resolves — to a declared capability, or to a derived human lane`);
    process.exit(0);
  }

  console.log(`\n✗ ${bad.length} fallback(s) resolve to nothing:`);
  for (const b of bad) console.log(`  · ${b}`);
  console.log(
    `\nEither declare a \`fallbackCapabilityId\` that exists, or give the skill a\n` +
      `\`userTask\` in a lane that binds a declared role. A fallback with nothing\n` +
      `behind it is the defect this check exists to prevent.`,
  );
  process.exit(1);
}
