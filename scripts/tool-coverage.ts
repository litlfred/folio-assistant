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
 * - **C** — a shell block, no process edge. **This is where a human read
 *   goes** — the evidence is genuinely ambiguous.
 * - **D** — nothing. Almost certainly judgement.
 *
 * The point is not that A and D are certain. It is that C is the only tier
 * needing a read, which is the difference between an afternoon and a week.
 *
 * @module scripts/tool-coverage
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { tools } from "../tools/index.js";
import { loadProcessModel } from "../src/workflow/process-model.js";
import { isSkillMd, kgRoots } from "./known-skills.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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

  const io = new Set<string>();
  const ioRoot = join(ROOT, "schemas", "skills");
  if (existsSync(ioRoot)) for (const e of readdirSync(ioRoot, { withFileTypes: true })) if (e.isDirectory()) io.add(e.name);

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
    const shell = /```(sh|bash|console)\n/.test(body);

    const evidence: string[] = [];
    if (isAuto) evidence.push("serviceTask");
    if (hasIo) evidence.push("io-contract");
    if (isHuman) evidence.push("userTask");
    if (shell) evidence.push("shell-block");

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
    C: "C — a shell block, no process edge. THE READ GOES HERE; evidence is ambiguous.",
    D: "D — no evidence. Almost certainly judgement.",
  };

  for (const t of ["A", "B", "C", "D"] as Tier[]) {
    const list = by(t);
    console.log(`\n${LABEL[t]}  (${list.length})`);
    // C and D are long and are a count, not a reading list; A and B are lists.
    if (t === "A" || t === "B") for (const r of list) console.log(`  ${r.skill.padEnd(32)} ${r.evidence.join(", ")}`);
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
