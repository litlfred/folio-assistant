#!/usr/bin/env bun
/**
 * Which uncovered skills warrant a Tool — triaged by evidence, not by grep.
 *
 * `check:tools` reports that N skills have no Tool and deliberately does not
 * fail on it, because many skills are pure judgement and a Tool for them would
 * be an invention. That leaves a real question it cannot answer: **which of the
 * uncovered ones still have their mechanism inlined in their prose?**
 *
 * ## Why a grep is the wrong instrument
 *
 * Searching bodies for backticks or `gh `/`bun run` over-reports badly. A skill
 * may legitimately QUOTE a command as an example while stating its capability
 * generically — `one-voice-style-guide` shows a `grep` invocation and is pure
 * judgement. Measured here: 52 uncovered skills contain a fenced shell block,
 * which is 44 % of them and far too many to be a finding.
 *
 * ## The discriminator the corpus already carries
 *
 * BPMN task **type**. A process step is not just "implemented by" a skill — it
 * is a `serviceTask` (automated) or a `userTask` (performed by a person), and
 * the diagrams already say which.
 *
 * `interaction-modality` is the case that proved it. It was the standing
 * example of a "pure judgement" skill, and it turns out **two** activities name
 * it: `Task_DetectModality`, a `serviceTask` that reads the preferences file —
 * a mechanism — and `Task_AskIntent`, a `userTask` about how to frame the
 * question — judgement.
 *
 * **So the question is not "is this skill a Tool?" but "which PART of it is."**
 * Nine of the sixteen strongest candidates are `serviceTask` *and* `userTask`.
 * A skill with both is not mis-modelled; it is a skill whose mechanical half
 * should move to a Tool and whose judgement half never will.
 *
 * ## The tiers
 *
 * - **A** — a `serviceTask` names it, or it has an I/O contract under
 *   `schemas/skills/`. Somebody modelled it as a thing that runs. A Tool is
 *   warranted; this is the list to act on.
 * - **B** — a `userTask` only. Judgement exercised inside a process.
 * - **C** — a shell block **or a declared `package.json` script**, and no
 *   process edge. **This is where a human read goes** — the evidence is
 *   genuinely ambiguous.
 * - **D** — nothing. Almost certainly judgement.
 *
 * The point is not that A and D are certain. It is that C is the only tier
 * needing a read, which is the difference between an afternoon and a week.
 *
 * ## `D` meant "no evidence IN THE BODY", and that is not the same thing
 *
 * The fenced-block test reads the skill's own prose, so a skill that states its
 * rules without ever SHOWING its command landed in D — the tier whose label
 * tells you not to look. `ci-health` was the case that proved it: a real
 * command (`check:ci-health`, declared in `package.json`), documented in
 * `AGENTS.md`, no Tool node, and **tier D with an empty evidence list**, because
 * its own markdown never puts the command in a fence.
 *
 * So a declared script counts as evidence too, matched strictly — a colon
 * segment of the script's key equals the skill name, or the command runs a file
 * literally called `<skill>.ts`. Loose substring matching was tried first and
 * rejected: a short skill name matches unrelated keys. Measured: the strict rule
 * moves **6** skills from D to C (`agent-memory`, `ci-health`, `crdm-detect`,
 * `kg-viewer`, `raci`, `readme-sections`) and reclassifies **nothing** already in
 * A or B.
 *
 * @module scripts/tool-coverage
 */
import { skillContracts } from "./skill-contracts.js";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { tools } from "../tools/discover.js";
import { loadProcessModel } from "../src/workflow/process-model.js";
import { isSkillMd, kgRoots } from "./known-skills.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Every `scripts` key declared by this instance, from whichever `package.json`
 * carries them.
 *
 * Both are read and merged rather than one being hardcoded: after the
 * `cat-harness/` inversion the scripts live in the ROOT manifest while this
 * file sits one level down, and a single hardcoded path is what breaks silently
 * the next time the tree moves — yielding an empty index, which reads as "no
 * skill has a command" rather than as a failure to look.
 */
export function declaredScripts(): [string, string][] {
  const out: [string, string][] = [];
  for (const rel of ["package.json", "../package.json"]) {
    const f = join(ROOT, rel);
    if (!existsSync(f)) continue;
    try {
      const scripts = JSON.parse(readFileSync(f, "utf-8")).scripts as Record<string, string> | undefined;
      if (scripts) out.push(...Object.entries(scripts));
    } catch {
      // A manifest that will not parse is another gate's problem; skipping it
      // must not be silent, because a shrunken index reads as a clean triage.
      console.warn(`  ⚠ could not parse ${rel}; its scripts are missing from this triage`);
    }
  }
  return out;
}

/**
 * The script that runs a skill, if one is declared.
 *
 * STRICT on purpose — see the module docstring. A colon segment of the key, or a
 * command naming `<skill>.ts`. Never a substring of the key.
 */
export function scriptFor(skill: string, scripts: [string, string][]): string | undefined {
  return scripts.find(([k, v]) => k.split(":").includes(skill) || v.includes(`/${skill}.ts`))?.[0];
}

export type Tier = "A" | "B" | "C" | "D";

export interface SkillTriage {
  skill: string;
  tier: Tier;
  evidence: string[];
}

/**
 * Every directory holding skills — the declared graph, plus the one place a
 * declaration cannot reach.
 *
 * The declared part comes from {@link kgRoots} rather than from `"skills"`,
 * because an instance may put its knowledge graph anywhere and this repository
 * declares TWO such directories since `src/skills/` was declared (bean `osbo`).
 * A package is a subdirectory holding skills; a kg directory may also hold them
 * DIRECTLY, which is what `src/skills/` does.
 */
function skillDirs(): string[] {
  const d: string[] = [];
  for (const abs of kgRoots(ROOT)) {
    const rel = relative(ROOT, abs);
    if (holdsSkillMd(abs)) d.push(rel);
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory() && holdsSkillMd(join(abs, e.name))) d.push(`${rel}/${e.name}`);
    }
  }
  // declared-path-literal: `.claude/skills/local/` is the agent harness's own
  // directory and is NOT a `cat-harness` graph in any instance's declaration,
  // so no declaration answers it. It is named here rather than discovered.
  const local = ".claude/skills/local";
  if (existsSync(join(ROOT, local))) d.push(local);
  return d;
}

/** Does this directory hold at least one skill `.md` directly? */
function holdsSkillMd(dir: string): boolean {
  try {
    return readdirSync(dir).some((f) => f.endsWith(".md") && isSkillMd(join(dir, f)));
  } catch {
    return false;
  }
}

function bpmnDirs(rel = ".", depth = 0): string[] {
  if (depth > 4) return [];
  const out: string[] = [];
  let es;
  try {
    es = readdirSync(join(ROOT, rel), { withFileTypes: true });
  } catch {
    return [];
  }
  if (es.some((e) => e.isFile() && e.name.endsWith(".bpmn"))) out.push(rel);
  for (const e of es) {
    if (e.isDirectory() && !["node_modules", ".git", "_site", "_kg"].includes(e.name) && !e.name.startsWith(".")) {
      out.push(...bpmnDirs(rel === "." ? e.name : `${rel}/${e.name}`, depth + 1));
    }
  }
  return out;
}

export async function triage(): Promise<SkillTriage[]> {
  const bodies = new Map<string, string>();
  for (const dir of skillDirs()) {
    for (const f of readdirSync(join(ROOT, dir))) {
      if (f.endsWith(".md")) bodies.set(f.slice(0, -3), readFileSync(join(ROOT, dir, f), "utf-8"));
    }
  }

  const scripts = declaredScripts();

  // The skills that NAME a contract (`input:`/`output:`, #1168 B3b) — not the
  // directories under `schemas/skills/`, which is the convention B3b retired.
  const io = new Set(skillContracts(ROOT).keys());

  const auto = new Set<string>();
  const human = new Set<string>();
  for (const d of bpmnDirs()) {
    for (const f of readdirSync(join(ROOT, d))) {
      if (!f.endsWith(".bpmn")) continue;
      try {
        const m = await loadProcessModel(join(ROOT, d, f));
        for (const n of m.nodes.values()) {
          for (const s of n.skills) {
            // `serviceTask`/`scriptTask` run without a person; `userTask`/
            // `manualTask` are performed by one. That is the discriminator.
            if (/service|script|send/i.test(n.type)) auto.add(s);
            if (/user|manual|receive/i.test(n.type)) human.add(s);
          }
        }
      } catch {
        // A diagram that will not load is check:workflow-refs' problem, not this
        // tool's — but it must not silently shrink the evidence either.
        console.warn(`  ⚠ could not load ${d}/${f}; its skill edges are missing from this triage`);
      }
    }
  }

  const covered = new Set(tools().flatMap((t) => t.satisfies));
  const out: SkillTriage[] = [];
  for (const [skill, body] of [...bodies].sort()) {
    if (covered.has(skill)) continue;
    const isAuto = auto.has(skill);
    const isHuman = human.has(skill);
    const hasIo = io.has(skill);
    const fenced = /```(sh|bash|console)\n/.test(body);
    const script = scriptFor(skill, scripts);
    const shell = fenced || script !== undefined;

    const evidence: string[] = [];
    if (isAuto) evidence.push("serviceTask");
    if (hasIo) evidence.push("io-contract");
    if (isHuman) evidence.push("userTask");
    if (fenced) evidence.push("shell-block");
    // Named, so the read that tier C asks for starts from the command rather
    // than from a hunt through 114 scripts.
    if (script) evidence.push(`script:${script}`);

    const tier: Tier = isAuto || hasIo ? "A" : isHuman ? "B" : shell ? "C" : "D";
    out.push({ skill, tier, evidence });
  }
  return out;
}

if (import.meta.main) {
  const rows = await triage();
  const by = (t: Tier): SkillTriage[] => rows.filter((r) => r.tier === t);

  const LABEL: Record<Tier, string> = {
    A: "A — a serviceTask names it, or it has an I/O contract. A Tool is warranted.",
    B: "B — a userTask only. Judgement exercised inside a process.",
    C: "C — a shell block or a declared script, no process edge. THE READ GOES HERE; evidence is ambiguous.",
    D: "D — no evidence. Almost certainly judgement.",
  };

  for (const t of ["A", "B", "C", "D"] as Tier[]) {
    const list = by(t);
    console.log(`\n${LABEL[t]}  (${list.length})`);
    // C IS PRINTED, and that is the fix rather than an inconsistency: this
    // report's own label for it is "THE READ GOES HERE" and its closing line
    // says "only tier C needs reading". Printing a bare count under both
    // sentences told the reader to go and read a list it declined to name, so
    // the read could only be done by re-running the triage by hand.
    //
    // D stays a count. Its label is "no evidence, almost certainly judgement",
    // so 80 names under a heading that says not to read them is noise that
    // pushes C off the screen. That is also why the D→C rule above matters more
    // than this printing change: a skill in D is not merely unprinted, it is
    // labelled as not worth reading.
    if (t !== "D") for (const r of list) console.log(`  ${r.skill.padEnd(32)} ${r.evidence.join(", ")}`);
  }

  const both = by("A").filter((r) => r.evidence.includes("userTask"));
  console.log(
    `\n${rows.length} uncovered.  A=${by("A").length}  B=${by("B").length}  C=${by("C").length}  D=${by("D").length}`,
  );
  console.log(
    `\n${both.length} of the ${by("A").length} in A are ALSO a userTask — the same skill has a mechanical half\n` +
      `and a judgement half. For those the question is not "should this be a Tool" but\n` +
      `"which part of it is". Splitting the mechanism out is the work; the judgement stays.`,
  );
  console.log(`\nOnly tier C needs reading: ${by("C").length} files, not ${rows.length}.`);
}
