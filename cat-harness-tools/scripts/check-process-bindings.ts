#!/usr/bin/env bun
/**
 * check-process-bindings.ts — a process binds only skills it can reach.
 *
 * Owner, 2026-10-03: a process may bind only skills (and, through them, Tools)
 * from its own instance or from an instance it `needs` — *"general rule, not
 * just fhir-harness"*. The sentence is `check:import-direction`'s, applied to
 * the third kind of edge an instance has: not a module it loads, not a name
 * its prose mentions, but a SKILL one of its BPMN activities says implements
 * a step.
 *
 * ## Why the existing checks did not catch it
 *
 * `fhir-harness/processes/content/l3-fhir-pipeline.bpmn` bound smart-base's
 * `l2-dak-authoring` from inside the bare FHIR layer, and three checks were
 * green over it:
 *
 * - `kg-audit`'s `skill-ref-resolves` PASSED. Its resolvable set starts from
 *   `knownSkills(root)`, which in this pre-split checkout is CHECKOUT-scoped,
 *   so every skill in the repository resolves from every instance. "Resolves"
 *   answered "exists somewhere", not "is reachable from here".
 * - `check:workflow-refs` asks the same existence question.
 * - `check:fhir-harness-exclusions` reads text, and a skill id names nothing
 *   WHO's by its spelling.
 *
 * So this asks the reachability question directly. It uses the SAME direction
 * computation as `check:import-direction` and `check:reference-direction`
 * (`allowedFromNeeds` over `ancestorsOf`), so the three axes cannot give three
 * answers about which way an arrow may point.
 *
 * ## What is judged, and the states that are not folded into a zero
 *
 * Each `<bootstrap.processes:skill ref>` on an activity, in every `.bpmn`
 * under a declared instance, is resolved against every instance's OWN skill
 * files (a skill belongs to the innermost instance root containing it):
 *
 * - **allowed**: some holder of the skill is the process's instance or one it
 *   `needs`, transitively;
 * - **wrong-direction**: the skill exists, but only in instances the process
 *   cannot reach. GRADED;
 * - **dangling**: no instance in this checkout holds it. That is
 *   `check:workflow-refs`' finding, so it is counted here and never graded;
 * - **undetermined**: the process's instance declares no `needs`. Absent is
 *   nobody-has-said, not `[]`, so it is printed as COULD NOT DETERMINE.
 *
 * A Tool is reached THROUGH its skill (`satisfies`), and a BPMN activity binds
 * no Tool directly, so judging the skill judges the Tool too.
 *
 * ## Ratchet
 *
 * The bindings that already point the wrong way are listed with reasons in
 * `process-bindings.baseline.ts`. A new one fails, and so does a cleared one
 * the baseline still allows; `--shrink` lowers the list and never raises it.
 * The same shape as `check:fhir-harness-exclusions`, for the same reason: a
 * gate turned on red teaches the next agent `|| true`.
 *
 * ```sh
 * bun run check:process-bindings            # report + gate
 * bun run check:process-bindings --shrink   # lower the baseline after a fix
 * ```
 *
 * Tested with planted violations in `tests/check-process-bindings.test.ts`.
 *
 * @module scripts/check-process-bindings
 * @covers processes, skills
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { readInstances, ownerOf, type Instance } from "../../cat-harness/scripts/check-import-direction.ts";
import { isSkillMd, skillMdDirs } from "../../cat-harness/scripts/known-skills.ts";
import { ancestorsOf, flattenDependencies } from "../../cat-harness/schemas/dependency-order.js";
import { allowedFromNeeds } from "../../cat-harness/schemas/layer-direction.js";
import { BASELINE, type BindingBaselineEntry } from "../../cat-harness/scripts/process-bindings.baseline.ts";
import { HARNESS_ROOT } from "./lib/roots.ts";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

export type BindingVerdict = "allowed" | "wrong-direction" | "dangling" | "undetermined";

export interface Binding {
  /** Repo-relative BPMN file. */
  file: string;
  /** The activity's id. */
  node: string;
  /** The ref as written — `name` or `package/name`. */
  ref: string;
  fromInstance: string;
  /** Instances that hold a skill of that name. */
  holders: string[];
  verdict: BindingVerdict;
}

/** The skill name a ref denotes: `package/name` → `name`. */
export const skillName = (ref: string): string => ref.slice(ref.lastIndexOf("/") + 1);

/**
 * Judge one binding. Pure, so the tests can plant violations without a
 * checkout. `allowed` is `allowedFromNeeds`' map: instance → itself plus
 * everything it needs, or absent when the instance declared no `needs`.
 */
export function judgeBinding(
  b: { file: string; node: string; ref: string; fromInstance: string },
  holders: readonly string[],
  allowed: ReadonlyMap<string, ReadonlySet<string>>,
): Binding {
  const base = { ...b, holders: [...holders].sort() };
  if (holders.length === 0) return { ...base, verdict: "dangling" };
  if (holders.includes(b.fromInstance)) return { ...base, verdict: "allowed" };
  const reach = allowed.get(b.fromInstance);
  if (reach === undefined) return { ...base, verdict: "undetermined" };
  return { ...base, verdict: holders.some((h) => reach.has(h)) ? "allowed" : "wrong-direction" };
}

/**
 * `<bootstrap.processes:skill ref>` per activity, read from the XML.
 *
 * A regex over elements rather than `loadProcessModel`: that loader follows
 * call activities and refuses a cycle, and this check must judge a diagram
 * whether or not it loads. A ref is attributed to the nearest enclosing
 * element carrying an `id`.
 */
export function activityRefs(xml: string): { node: string; ref: string }[] {
  const out: { node: string; ref: string }[] = [];
  const stack: string[] = [];
  const tag = /<(\/?)([\w.-]+:[\w-]+|[\w-]+)\b([^>]*?)(\/?)>/g;
  for (const m of xml.matchAll(tag)) {
    const [, closing, name, attrs, selfClosing] = m;
    if (closing) {
      stack.pop();
      continue;
    }
    if (/:skill$/.test(name!)) {
      const ref = /\bref="([^"]+)"/.exec(attrs!)?.[1];
      const node = [...stack].reverse().find((id) => id !== "");
      if (ref && node) out.push({ node, ref });
    }
    if (!selfClosing) stack.push(/\bid="([^"]+)"/.exec(attrs!)?.[1] ?? "");
  }
  return out;
}

/** skill name → the instances whose own skill files hold one of that name. */
function skillHolders(all: readonly Instance[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const seen = new Set<string>();
  for (const inst of all) {
    for (const parts of skillMdDirs(inst.root, "instance")) {
      const dir = join(inst.root, ...parts);
      let names: string[];
      try {
        names = readdirSync(dir);
      } catch {
        continue;
      }
      for (const f of names) {
        const abs = join(dir, f);
        if (!f.endsWith(".md") || seen.has(abs) || !isSkillMd(abs)) continue;
        seen.add(abs);
        const owner = ownerOf(abs, all);
        if (!owner) continue;
        const set = out.get(f.slice(0, -3)) ?? new Set<string>();
        set.add(owner.name);
        out.set(f.slice(0, -3), set);
      }
    }
  }
  return out;
}

export function analyse(repoRoot = REPO_ROOT): Binding[] {
  const root = resolve(repoRoot);
  const all = readInstances(root);
  const byName = new Map(all.map((i) => [i.name, i]));
  const flat = flattenDependencies(
    all.map((i) => ({ id: i.name, needs: (i.needs ?? []).filter((n) => byName.has(n)), fatal: false })),
  );
  if (flat.problems.length > 0) {
    throw new Error(`check:process-bindings: the instance needs graph is broken — ${flat.problems.map((p) => p.detail).join("; ")}`);
  }
  const allowed = allowedFromNeeds(new Map(all.map((i) => [i.name, i.needs])), ancestorsOf(flat.order));
  const holders = skillHolders(all);

  const bpmn = execFileSync("git", ["ls-files", "-z", "--", "*.bpmn"], { cwd: root, encoding: "utf-8" })
    .split("\0")
    .filter(Boolean);
  const out: Binding[] = [];
  for (const rel of bpmn) {
    const abs = join(root, rel);
    const from = ownerOf(abs, all);
    if (!from) continue;
    for (const { node, ref } of activityRefs(readFileSync(abs, "utf-8"))) {
      out.push(judgeBinding({ file: relative(root, abs), node, ref, fromInstance: from.name }, [...(holders.get(skillName(ref)) ?? [])], allowed));
    }
  }
  return out;
}

const keyOf = (b: { file: string; node: string; ref: string }) => `${b.file}\u0000${b.node}\u0000${b.ref}`;

export function ratchet(found: readonly Binding[], baseline: readonly BindingBaselineEntry[]) {
  const wrong = found.filter((b) => b.verdict === "wrong-direction");
  const base = new Set(baseline.map(keyOf));
  const now = new Set(wrong.map(keyOf));
  return {
    regressions: wrong.filter((b) => !base.has(keyOf(b))),
    stale: baseline.filter((b) => !now.has(keyOf(b))),
  };
}

if (import.meta.main) {
  const found = analyse();
  const count = (v: BindingVerdict) => found.filter((b) => b.verdict === v).length;
  const { regressions, stale } = ratchet(found, BASELINE);
  console.log(`process bindings — ${found.length} skill refs in ${new Set(found.map((b) => b.file)).size} diagrams`);
  console.log(`  allowed ${count("allowed")} · wrong-direction ${count("wrong-direction")} (baseline ${BASELINE.length})`);
  console.log(`  dangling ${count("dangling")} (check:workflow-refs' finding, not graded here)`);
  if (count("undetermined") > 0) {
    const from = [...new Set(found.filter((b) => b.verdict === "undetermined").map((b) => b.fromInstance))];
    console.log(`  COULD NOT DETERMINE ${count("undetermined")}: ${from.join(", ")} declare(s) no needs`);
  }
  if (process.argv.includes("--shrink")) {
    const path = join(HARNESS_ROOT, "scripts", "process-bindings.baseline.ts"); // stayed in cat-harness (70lx B2)
    const src = readFileSync(path, "utf-8");
    const kept = BASELINE.filter((b) => !stale.includes(b));
    writeFileSync(path, `${src.slice(0, src.indexOf("export const BASELINE"))}export const BASELINE: readonly BindingBaselineEntry[] = ${JSON.stringify(kept, null, 2)};\n`);
    console.log(`  baseline shrunk: ${stale.length} dropped`);
  } else {
    for (const s of stale) console.log(`  STALE BASELINE  ${s.file} ${s.node} → ${s.ref} — run with --shrink`);
  }
  for (const r of regressions) {
    console.log(`  NEW  ${r.file} ${r.node} binds "${r.ref}", held only by ${r.holders.join(", ")} — not reachable from ${r.fromInstance}`);
  }
  const failed = regressions.length > 0 || (!process.argv.includes("--shrink") && stale.length > 0);
  if (failed) {
    console.log("\nA process binds only skills from its own instance or one it needs. Move the process up to the");
    console.log("instance that holds the skill, or move the skill down if it is generic (owner, 2026-10-03).");
  } else console.log("  ✓ no wrong-direction binding above baseline, and the baseline is tight");
  process.exit(failed ? 1 : 0);
}
