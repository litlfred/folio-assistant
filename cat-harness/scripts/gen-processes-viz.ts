#!/usr/bin/env bun
/**
 * The processes graph → a searchable index over every executable BPMN diagram.
 *
 * @module cat-harness/scripts/gen-processes-viz
 *
 * Bean `prhr`. Owner, 2026-09-21: *"we also need a processes/ visualization as
 * it is controlled.... its basically a bpmn searcher tool or so. with various
 * filters."*
 *
 * **"As it is controlled" is the argument.** These diagrams are executable —
 * `workflow_start` / `workflow_next` / `workflow_complete` run them and
 * `workflow_complete` refuses a step that is not enabled. A corpus that governs
 * what agents may do, whose only index is a hand-maintained markdown page, is
 * controlled in name. That page's own history is the proof: it once opened
 * *"Nineteen BPMN 2.0 files"* and listed eight.
 *
 * ## It consumes the real parser, and that is not a preference
 *
 * `loadProcessModel` (bpmn-moddle) is the oracle, and the first measurement
 * here was taken with a regex instead. The regex found **30** `folio:bean` ops;
 * there are **49**. It missed two markup variants that are both legal and both
 * in the corpus — a `store=` attribute before `op=`, and attributes wrapped
 * onto the next line. `check:workflow-refs` already says *"the real parser is
 * the oracle for the generator's regex"*; this is that sentence, measured
 * again, on the generator written to index the corpus it is about.
 *
 * ## Declared vs defaulted — the distinction the engine does not need
 *
 * `ProcessModel.enforcement` is `"strict" | "advisory"`, never absent, because
 * `loadProcessModel` reads an undeclared policy as `strict`. That is right for
 * the ENGINE, and its comment says why: *"A process that forgot to say is
 * governed, not exempt — the failure mode of defaulting the other way is that
 * forgetting silently turns the gate off."*
 *
 * It is NOT right for a reader. "Somebody chose strict" and "nobody said, so
 * the engine assumed strict" are different facts, and this index reports them
 * apart. The engine keeps one answer; the reader gets the provenance of it.
 *
 * **No count is given here, on purpose.** This paragraph carried one — and it
 * was wrong, by one, in the module whose argument is that a figure belongs in
 * generated output rather than in prose beside it (bean `osyc`, 2026-09-22).
 * The page computes it every run; read it there.
 *
 * ## What is asked of the file, exactly
 *
 * Whether a policy declares an **enforcement value** — not whether a policy
 * ELEMENT is present. The two differ, and the corpus contains the case:
 * `crdm-signoff.bpmn:83` is `<folio:policy relaxable="false"/>`, an element
 * deliberately authored, carrying no `enforcement`. It counts as *defaulted*
 * here and that is the right answer for the question being asked — *somebody
 * chose an enforcement* vs *nobody said* — but it means this is NOT the same
 * measurement as `grep -L 'folio:policy'`, which bean `30hn` takes and which
 * gives a figure one smaller. Saying which of the two is meant is the whole
 * value of the column.
 *
 * ## What it is NOT
 *
 * Not a re-render: `render:bpmn` owns the SVGs and `render:bpmn:check` fails if
 * they are stale, so this consumes that art and generates none.
 *
 * And not a second answer to "where are we". Workflow STATE lives in committed
 * instances under `beans/workflows/`; an index that displayed its own idea of
 * position would be a second store free to disagree with the first, which
 * `workflow-state` names explicitly.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-processes-viz.ts
 *   bun run cat-harness/scripts/gen-processes-viz.ts --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import { declarationPathIn } from "../schemas/cat-harness.js";
import { docsLayers } from "./compose-docs.js";
import { workflowFiles } from "./known-skills.js";
import { loadProcessModel, isActivity, isDecision, branchesOf } from "../src/workflow/process-model.js";

const REPO = resolve(import.meta.dir, "..", "..");
const KIND = "processes";

function baseDocs(repo: string): string {
  const base = docsLayers(repo).layers.find((l) => !l.repositoryScoped);
  if (base === undefined) throw new Error("no instance-scoped docs layer is declared");
  return base.dir;
}

/** One diagram, as the index sees it. */
export interface ProcessRow {
  /** Repo-relative path — the identity, because basenames collide across instances. */
  file: string;
  /** The directory it lives under, which is the instance/methodology facet. */
  group: string;
  id: string;
  name: string;
  lanes: string[];
  /** `<folio:role ref>` on a lane — the join that does not depend on spelling. */
  roles: string[];
  skills: string[];
  beanOps: string[];
  enforcement: "strict" | "advisory";
  /**
   * Whether the FILE declares an enforcement VALUE, as opposed to the engine
   * defaulting one. Not the same as carrying a `<folio:policy>` element — see
   * the module doc, and `crdm-signoff.bpmn`, which has one and no value.
   */
  enforcementDeclared: boolean;
  activities: number;
  /**
   * Activities carrying no `<folio:skill ref>`, with the lane and BPMN type
   * that decide whether that is a gap or a design.
   *
   * NOT a defect list, and the first version of this page made it one. See
   * `page()`'s census section: beans `luke` and `uuhu` already established
   * that a human sign-off step and a call activity are deliberately
   * skill-less, and 31 of 31 fall into categories they settled.
   */
  activitiesWithoutSkill: { id: string; lane: string; type: string; roleRef?: string }[];
  /** The rendered SVG, site-relative — or absent, which is reported rather than hidden. */
  svg?: string;
  /** Set when the diagram would not load at all. Reported, never silently dropped. */
  loadError?: string;
  /** Basename without `.bpmn` — the page name and the SVG name. */
  stem: string;
  /** `<bpmn:documentation>` on the process element. */
  documentation?: string;
  /** Lanes with their role and documentation, in document order. */
  laneDetails: { id: string; name: string; roleRef?: string; documentation?: string }[];
  /** Every activity, in document order — what the per-process page lists. */
  steps: ProcessStep[];
  /**
   * Every DECISION (an exclusive gateway with more than one way out), in
   * document order. Merges, forks and joins decide nothing and are omitted —
   * the same line `gateway-documented` draws.
   */
  decisions: ProcessDecision[];
}

/** One decision, as its process page shows it. */
export interface ProcessDecision {
  id: string;
  name: string;
  documentation?: string;
  /** Each way out: its label (absent when unnamed) and the step it leads to. */
  branches: { label?: string; to: string }[];
}

/** One activity, as its process page shows it. */
export interface ProcessStep {
  id: string;
  name: string;
  lane: string;
  type: string;
  skills: string[];
  /** For a call activity: the process id it descends into. */
  calledElement?: string;
  documentation?: string;
}

const uniq = (xs: string[]): string[] => [...new Set(xs.filter((x) => x))].sort((a, b) => a.localeCompare(b, "en"));

/**
 * Every diagram, parsed.
 *
 * A file that will not load gets a row with `loadError` rather than being
 * omitted. Omission would shrink the denominator and make a broken diagram read
 * as one that does not exist — the `dh4f` shape, where a sweep reports a clean
 * run over what it could not see.
 */
/**
 * Every instance's diagrams, not just this one's.
 *
 * `workflowFiles` takes an INSTANCE root and resolves that instance's declared
 * graph plus its dependencies'. Handed the REPOSITORY root it returns nothing —
 * there is no declaration there — and the first run of this generator did
 * exactly that: it printed *"Wrote processes-index.md — 0 diagram(s)"* and
 * exited 0, over a corpus of 62.
 *
 * That is the `dh4f` shape, produced by the generator written to report it. The
 * vacuity guard in `main` is the fix for the symptom; this is the fix for the
 * cause.
 *
 * Asking each instance separately also keeps a real distinction: `bootstrap`
 * declares its own three diagrams and `cat-harness` does not reach them, so a
 * single-root index would omit them silently rather than group them.
 */
function instanceRoots(repo: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const dir = join(repo, e.name);
    if (declarationPathIn(dir)) out.push(dir);
  }
  return out.sort();
}

export async function processRows(repo = REPO): Promise<ProcessRow[]> {
  const rows: ProcessRow[] = [];
  const seen = new Set<string>();
  const files = instanceRoots(repo)
    .flatMap((r) => workflowFiles(r))
    // `.dmn` is a DECISION TABLE, not a process — a different kind that a
    // gateway computes from. Including them would inflate every count on this
    // page with things that have no lanes, no skills and no activities.
    .filter((f) => f.endsWith(".bpmn"))
    .filter((f) => (seen.has(f) ? false : (seen.add(f), true)))
    .sort();
  for (const abs of files) {
    const file = relative(repo, abs);
    const group = dirname(file);
    // THE SVG LIVES WHERE `render:bpmn` PUTS IT, which is the base docs layer —
    // not beside the diagram.
    //
    // The first version composed the path from the .bpmn's own location
    // (`../docs/assets/img/workflows/`), and reported **11 of 62** diagrams as
    // unrendered: all 8 CRDM and all 3 bootstrap. Every one of those SVGs
    // exists. `render:bpmn:check` was green across the whole thing, which is
    // what should have stopped me shipping it — a finding that contradicts a
    // passing gate is a finding to verify, not to publish.
    //
    // A report that claims a gap which is not there teaches its reader to
    // discount it, and this repository has paid for that once already
    // (`viewer-undiscovered.test.ts`, the same week).
    const svgRel = join(baseDocs(repo), "assets/img/workflows", `${basename(abs, ".bpmn")}.svg`);
    const svg = existsSync(svgRel) ? relative(repo, svgRel) : undefined;
    // The DECLARATION, asked of the file: is there an enforcement VALUE? A
    // presence check, not a second reading of what the policy means — and a
    // presence check on the value, not on the element. See the module doc.
    const declared = /<folio:policy[^>]*\benforcement\s*=/.test(readFileSync(abs, "utf-8"));
    try {
      const m = await loadProcessModel(abs);
      const nodes = [...m.nodes.values()];
      const acts = nodes.filter(isActivity);
      rows.push({
        file,
        group,
        id: m.id,
        name: m.name,
        lanes: uniq(m.lanes.map((l) => (l.name ?? "").replace(/\s+/g, " ").trim())),
        roles: uniq(m.lanes.map((l) => l.roleRef ?? "")),
        skills: uniq(nodes.flatMap((n) => n.skills)),
        beanOps: uniq(nodes.map((n) => n.workPlanOp ?? "")),
        enforcement: m.enforcement,
        enforcementDeclared: declared,
        activities: acts.length,
        activitiesWithoutSkill: acts
          .filter((n) => n.skills.length === 0)
          .map((n) => ({
            id: n.id,
            lane: (n.lane ?? "").replace(/\s+/g, " ").trim(),
            type: n.type,
            ...(n.roleRef ? { roleRef: n.roleRef } : {}),
          }))
          .sort((a, b) => a.id.localeCompare(b.id, "en")),
        ...(svg ? { svg } : {}),
        stem: basename(abs, ".bpmn"),
        ...(m.documentation ? { documentation: m.documentation } : {}),
        laneDetails: m.lanes.map((l) => ({
          id: l.id,
          name: (l.name ?? l.id).replace(/\s+/g, " ").trim(),
          ...(l.roleRef ? { roleRef: l.roleRef } : {}),
          ...(l.documentation ? { documentation: l.documentation } : {}),
        })),
        steps: acts.map((n) => ({
          id: n.id,
          name: n.name.replace(/\s+/g, " ").trim() || n.id,
          lane: (n.lane ?? "").replace(/\s+/g, " ").trim(),
          type: n.type,
          skills: n.skills,
          ...(n.calledElement ? { calledElement: n.calledElement } : {}),
          ...(n.documentation ? { documentation: n.documentation } : {}),
        })),
        decisions: [...m.nodes.values()].filter(isDecision).map((n) => ({
          id: n.id,
          name: n.name.replace(/\s+/g, " ").trim() || n.id,
          ...(n.documentation ? { documentation: n.documentation } : {}),
          branches: branchesOf(m, n).map((b) => ({
            ...(b.label ? { label: b.label.replace(/\s+/g, " ").trim() } : {}),
            to: (m.nodes.get(b.to)?.name ?? b.to).replace(/\s+/g, " ").trim() || b.to,
          })),
        })),
      });
    } catch (e) {
      rows.push({
        file,
        group,
        id: basename(file, ".bpmn"),
        name: basename(file, ".bpmn"),
        lanes: [],
        roles: [],
        skills: [],
        beanOps: [],
        enforcement: "strict",
        enforcementDeclared: declared,
        activities: 0,
        activitiesWithoutSkill: [],
        ...(svg ? { svg } : {}),
        stem: basename(abs, ".bpmn"),
        laneDetails: [],
        steps: [],
        decisions: [],
        loadError: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return rows.sort((a, b) => a.file.localeCompare(b.file, "en"));
}

/** skill → the diagrams that run it. The join nothing else exposes. */
export function skillToProcesses(rows: readonly ProcessRow[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const r of rows) for (const s of r.skills) m.set(s, [...(m.get(s) ?? []), r.file]);
  return new Map([...m].sort((a, b) => a[0].localeCompare(b[0], "en")));
}

const esc = (s: string): string => s.replace(/\|/g, "\\|");

export function page(rows: readonly ProcessRow[]): string {
  const ok = rows.filter((r) => r.loadError === undefined);
  const broken = rows.filter((r) => r.loadError !== undefined);
  const byGroup = new Map<string, number>();
  for (const r of rows) byGroup.set(r.group, (byGroup.get(r.group) ?? 0) + 1);
  const lanes = new Map<string, string[]>();
  for (const r of ok) for (const l of r.lanes) lanes.set(l, [...(lanes.get(l) ?? []), r.file]);
  const ops = new Map<string, string[]>();
  for (const r of ok) for (const o of r.beanOps) ops.set(o, [...(ops.get(o) ?? []), r.file]);
  const join = skillToProcesses(ok);
  const undeclared = ok.filter((r) => !r.enforcementDeclared);
  const noSvg = rows.filter((r) => r.svg === undefined);
  const noSkill = ok.filter((r) => r.activitiesWithoutSkill.length > 0);

  const L: string[] = [];
  L.push("---");
  L.push("title: Processes");
  L.push("nav_exclude: true");
  L.push("---");
  L.push("");
  L.push("# Processes — every executable diagram, searchable");
  L.push("");
  L.push(
    "Generated by `cat-harness/scripts/gen-processes-viz.ts`. **Every number here is " +
      "counted from the directory**, never carried in prose — `bpmn-processes`' own rule, " +
      "and the bean that asked for this page had two different counts in its title and its body.",
  );
  L.push("");
  L.push(`**${rows.length}** diagram(s), **${ok.length}** parsed, **${broken.length}** that would not load.`);
  L.push("");
  L.push("| where | diagrams |");
  L.push("|---|---|");
  for (const [g, n] of [...byGroup].sort((a, b) => b[1] - a[1])) L.push(`| \`${esc(g)}/\` | ${n} |`);
  L.push("");

  L.push("## Every process — one page each");
  L.push("");
  L.push(
    "Each page shows the diagram, what it is for, who acts in it, every step with the skill it runs, and " +
      "which processes call it. `kg:audit`'s `process-diagram-published` fails a diagram no page shows — " +
      "45 of 62 were in that state before these pages existed (bean `ooq3`).",
  );
  L.push("");
  L.push("| process | steps | undocumented steps |");
  L.push("|---|---|---|");
  for (const r of ok) {
    const undoc = r.steps.filter((st) => !st.documentation).length;
    L.push(`| [${esc(r.name)}](${r.stem}.html) | ${r.activities} | ${undoc || "—"} |`);
  }
  L.push("");

  L.push("## What runs this skill?");
  L.push("");
  L.push(
    "The reverse of `<folio:skill ref>`, which is the join nothing else exposes: a skill " +
      "says what to do, and until now nothing said which processes ask for it.",
  );
  L.push("");
  L.push(`**${join.size}** distinct skill(s) are named by an activity.`);
  L.push("");
  L.push("| skill | run by |");
  L.push("|---|---|");
  for (const [s, fs] of join) L.push(`| \`${esc(s)}\` | ${fs.map((f) => `\`${esc(basename(f))}\``).join(", ")} |`);
  L.push("");

  L.push("## Who appears in a process?");
  L.push("");
  L.push(
    "A lane IS a role. The NAME is free text — `process-model.ts` notes that sixty lanes " +
      "spell two dozen positions — so `<folio:role ref>` is the join that does not depend " +
      "on spelling, and it is reported separately below rather than merged into the name.",
  );
  L.push("");
  L.push(`**${lanes.size}** distinct lane name(s).`);
  L.push("");
  L.push("| lane | in |");
  L.push("|---|---|");
  for (const [l, fs] of [...lanes].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "en"))) {
    L.push(`| ${esc(l)} | ${fs.length} |`);
  }
  L.push("");

  L.push("## Which steps touch the work plan?");
  L.push("");
  L.push("`<folio:bean op>` — the audit trail for who reserves and resolves work.");
  L.push("");
  L.push("| op | diagrams |");
  L.push("|---|---|");
  for (const [o, fs] of [...ops].sort((a, b) => b[1].length - a[1].length)) L.push(`| \`${esc(o)}\` | ${fs.length} |`);
  L.push("");

  L.push("## Strict, advisory — and nobody said");
  L.push("");
  L.push(
    "Three states, not two. `loadProcessModel` reads an undeclared policy as `strict`, " +
      "which is right for the engine — *\"a process that forgot to say is governed, not " +
      "exempt\"* — and hides a fact a reader wants. **Somebody chose strict** and " +
      "**nobody said, so the engine assumed strict** are different, and the second is " +
      `**${undeclared.length}** of ${ok.length} here.`,
  );
  L.push("");
  L.push("| enforcement | declared | defaulted |");
  L.push("|---|---|---|");
  for (const e of ["strict", "advisory"] as const) {
    const d = ok.filter((r) => r.enforcement === e && r.enforcementDeclared).length;
    const f = ok.filter((r) => r.enforcement === e && !r.enforcementDeclared).length;
    L.push(`| \`${e}\` | ${d} | ${f} |`);
  }
  L.push("");

  L.push("## Findings");
  L.push("");
  if (broken.length > 0) {
    L.push(`**${broken.length} diagram(s) would not load.** Reported rather than omitted — a`);
    L.push("dropped file shrinks every denominator above and reads as one that does not exist.");
    L.push("");
    for (const r of broken) L.push(`- \`${esc(r.file)}\` — ${esc(r.loadError ?? "")}`);
    L.push("");
  }
  if (noSvg.length > 0) {
    L.push(`**${noSvg.length} diagram(s) have no rendered SVG.** \`bun run render:bpmn\`.`);
    L.push("");
    for (const r of noSvg) L.push(`- \`${esc(r.file)}\``);
    L.push("");
  } else {
    // Stated rather than left silent: "all rendered" and "the check did not run"
    // are different facts and an absent section cannot tell them apart.
    L.push(`Every one of the **${rows.length}** diagrams has a rendered SVG.`);
    L.push("");
  }
  if (noSkill.length > 0) {
    const all = noSkill.flatMap((r) => r.activitiesWithoutSkill);
    const calls = all.filter((a) => a.type.endsWith("CallActivity"));
    const rest = all.filter((a) => !a.type.endsWith("CallActivity"));
    const byLane = new Map<string, number>();
    for (const a of rest) byLane.set(a.lane || "(no lane)", (byLane.get(a.lane || "(no lane)") ?? 0) + 1);

    L.push("### Activities carrying no `<folio:skill ref>` — a census, not a gap list");
    L.push("");
    L.push(
      `**${all.length}** across **${noSkill.length}** diagram(s). This section reported them as ` +
        "defects in its first version, and that was wrong: beans `luke` and `uuhu` worked this " +
        "corpus from 90 down to this remainder and settled what is left. `luke`: *\"coverage is " +
        "deliberately NOT gated — a human sign-off step has no skill\"*. `uuhu` added the " +
        "call-activity exemption and recorded that its own remainder *\"are not gaps\"*.",
    );
    L.push("");
    L.push(
      `**${calls.length}** are call activities, which delegate to a subprocess — the skill is ` +
        "named there, and naming it twice would be one fact in two places. The other " +
        `**${rest.length}** are listed by lane, because the lane is what says whether a person, ` +
        "a pipeline or an agent performs the step, and only the last of those has a skill to run.",
    );
    L.push("");
    L.push("| lane | steps |");
    L.push("|---|---|");
    for (const [l, n] of [...byLane].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))) {
      L.push(`| ${esc(l)} | ${n} |`);
    }
    L.push("");
    L.push(
      "**No verdict is offered on which of these is a gap**, and that is the honest state rather " +
        "than a hedge: distinguishing a person's judgement step from an agent step somebody " +
        "forgot needs the lane's actor KIND, which a free-text lane name does not give — " +
        "`process-model.ts` notes sixty lanes spell two dozen positions. `<folio:role ref>` is " +
        `the join that would answer it, and it is present on **${rest.filter((a) => a.roleRef).length}** ` +
        `of these **${rest.length}** steps — which is the measurement, not an impression. ` +
        "An earlier draft of this sentence said *few of these* and was counting whether the lane " +
        "had a NAME, a different question with a different answer.",
    );
    L.push("");
  }
  return `${L.join("\n")}\n`;
}

/**
 * One page per process — the surface `process-diagram-published` asks for.
 *
 * Everything on it is READ from the diagram, so it cannot say anything the
 * diagram does not. The two relations a single file cannot show are computed
 * over the whole corpus: who CALLS this process (a call activity naming its
 * id), and who NAMES its skill without calling it — the second is what
 * `activity-calls-skill-process` turns into a finding.
 *
 * `skillPages` is the set of skills with a generated instruction page; a skill
 * without one is shown as code rather than as a link that 404s.
 */
export function processPage(row: ProcessRow, rows: readonly ProcessRow[], skillPages: ReadonlySet<string>): string {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const skill = (s: string): string =>
    skillPages.has(s) ? `[\`${s}\`](../reference/skill-instructions/${s}.html)` : `\`${s}\``;
  const proc = (r: ProcessRow): string => `[${esc(r.name)}](${r.stem}.html)`;
  const cell = (s: string | undefined): string => (s ? esc(s) : "—");
  const callers = rows.filter((r) => r.stem !== row.stem && r.steps.some((st) => st.calledElement === row.id));
  const namers = rows.filter(
    (r) => r.stem !== row.stem && r.steps.some((st) => st.calledElement === undefined && st.skills.includes(row.stem)),
  );
  const callees = uniq(row.steps.flatMap((st) => (st.calledElement ? [st.calledElement] : [])));

  const L: string[] = [];
  L.push("---");
  L.push(`title: '${row.name.replace(/'/g, "''")}'`);
  L.push("nav_exclude: true");
  L.push("---");
  L.push("");
  L.push("{: .note }");
  L.push(`> Generated from \`${row.file}\` by \`gen-processes-viz.ts\` — do not edit here. [All processes](index.html)`);
  L.push("");
  L.push("{% raw %}");
  L.push(`# ${row.name}`);
  L.push("");
  L.push(`\`${row.id}\` · ${row.enforcement}${row.enforcementDeclared ? "" : " (defaulted)"} · ${row.activities} step(s)`);
  L.push("");
  L.push(row.documentation ?? "_This process carries no `<bpmn:documentation>`._");
  L.push("");
  if (row.svg) {
    L.push(`<img src="../assets/img/workflows/${row.stem}.svg" alt="BPMN diagram: ${esc(row.name).replace(/"/g, "&quot;")}" style="max-width:100%">`);
  } else {
    L.push("_No rendered diagram — run `bun run render:bpmn`._");
  }
  L.push("");

  L.push("## How it connects");
  L.push("");
  L.push(`- **Called by:** ${callers.length ? callers.map(proc).join(", ") : "no call activity names this process"}`);
  L.push(
    `- **Calls:** ${callees.length ? callees.map((id) => (byId.get(id) ? proc(byId.get(id)!) : `\`${id}\` (not loadable here)`)).join(", ") : "none"}`,
  );
  if (namers.length) {
    L.push(
      `- **Names the \`${row.stem}\` skill without calling this process:** ${namers.map(proc).join(", ")} — ` +
        "`activity-calls-skill-process` asks whether each should be a call activity.",
    );
  }
  if (skillPages.has(row.stem)) L.push(`- **Skill:** ${skill(row.stem)}`);
  L.push("");

  L.push("## Lanes — who acts");
  L.push("");
  if (row.laneDetails.length === 0) {
    L.push("_No lanes._");
  } else {
    L.push("| lane | role | what it does here |");
    L.push("|---|---|---|");
    for (const l of row.laneDetails) L.push(`| ${esc(l.name)} | ${l.roleRef ? `\`${l.roleRef}\`` : "—"} | ${cell(l.documentation)} |`);
  }
  L.push("");

  L.push("## Steps");
  L.push("");
  const undoc = row.steps.filter((st) => !st.documentation).length;
  L.push(
    undoc === 0
      ? `Every one of the ${row.steps.length} step(s) is documented.`
      : `**${undoc}** of ${row.steps.length} step(s) carry no documentation — \`activity-documented\` lists them.`,
  );
  L.push("");
  L.push("| step | lane | skill / sub-process | what it does |");
  L.push("|---|---|---|---|");
  for (const st of row.steps) {
    const target = st.calledElement
      ? `calls ${byId.get(st.calledElement) ? proc(byId.get(st.calledElement)!) : `\`${st.calledElement}\``}`
      : "";
    const how = [target, ...st.skills.map(skill)].filter(Boolean).join("<br>") || "—";
    L.push(`| **${esc(st.name)}**<br>\`${st.id}\` | ${cell(st.lane)} | ${how} | ${cell(st.documentation)} |`);
  }
  L.push("");

  // Only when there is one: a linear process has no decision to show, and an
  // empty table would read as a section somebody forgot to fill.
  if (row.decisions.length > 0) {
    L.push("## Decisions");
    L.push("");
    const undocDec = row.decisions.filter((d) => !d.documentation).length;
    L.push(
      undocDec === 0
        ? `Every one of the ${row.decisions.length} decision(s) is documented.`
        : `**${undocDec}** of ${row.decisions.length} decision(s) carry no documentation — \`gateway-documented\` lists them.`,
    );
    L.push("");
    L.push("| decision | what decides it | branches |");
    L.push("|---|---|---|");
    for (const d of row.decisions) {
      const branches = d.branches.map((b) => `${b.label ? `**${esc(b.label)}**` : "_(unnamed)_"} → ${esc(b.to)}`).join("<br>");
      L.push(`| **${esc(d.name)}**<br>\`${d.id}\` | ${cell(d.documentation)} | ${branches} |`);
    }
    L.push("");
  }
  L.push("{% endraw %}");
  return `${L.join("\n")}\n`;
}

/** Where the declaration says this page goes. Never a literal — `site-dir-single-answer` refuses one. */
export function pageRelPath(repo = REPO): string | undefined {
  const declPath = declarationPathIn(join(repo, "cat-harness"));
  if (!declPath || !existsSync(declPath)) return undefined;
  const d = JSON.parse(readFileSync(declPath, "utf-8")) as {
    directories?: { graphKinds?: string[]; coverage?: { visualiser?: unknown } }[];
  };
  for (const e of d.directories ?? []) {
    if (!(e.graphKinds ?? []).includes(KIND)) continue;
    const v = e.coverage?.visualiser;
    for (const one of Array.isArray(v) ? v : [v]) {
      const ref = typeof one === "string" ? one : (one as { ref?: string } | undefined)?.ref;
      if (!ref) continue;
      const rel = relative(baseDocs(repo), resolve(repo, ref));
      if (rel.startsWith("..") || rel === "") return undefined;
      return rel;
    }
  }
  return undefined;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const rel = pageRelPath();
  if (rel === undefined) {
    console.error("no visualiser declared for the `processes` graph — nothing to write");
    process.exit(1);
  }
  const out = join(baseDocs(REPO), rel);
  const rows = await processRows();
  // VACUITY GUARD. A sweep that found nothing reports a clean corpus, which is
  // the `dh4f` shape this page's own Findings section exists to raise — and the
  // first run of this generator did it: 0 diagrams, exit 0, over a corpus of 62.
  // An empty result is never a pass here; if the corpus is genuinely empty this
  // page has no reason to exist.
  if (rows.length === 0) {
    console.error("✗ no BPMN diagrams found — refusing to write an index over nothing");
    process.exit(1);
  }
  const html = page(rows);
  const skillDir = join(baseDocs(REPO), "reference", "skill-instructions");
  const skillPages = new Set(
    existsSync(skillDir) ? readdirSync(skillDir).filter((f) => f.endsWith(".md")).map((f) => basename(f, ".md")) : [],
  );
  const pages = new Map<string, string>([[out, html]]);
  for (const r of rows.filter((x) => x.loadError === undefined)) {
    pages.set(join(dirname(out), `${r.stem}.md`), processPage(r, rows, skillPages));
  }
  // A page whose diagram is gone is REPORTED, never deleted — the
  // deletion-requires-confirmation rule, applied to generated output too.
  const orphans = readdirSync(dirname(out))
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(dirname(out), f))
    .filter((f) => !pages.has(f));
  for (const o of orphans) console.error(`! ${relative(REPO, o)} matches no diagram — remove it if the diagram is gone`);
  if (check) {
    const stale = [...pages].filter(([f, body]) => (existsSync(f) ? readFileSync(f, "utf-8") : "") !== body);
    if (stale.length) {
      for (const [f] of stale) console.error(`✗ ${relative(REPO, f)} is stale — run \`bun run processes:viz\``);
      process.exit(1);
    }
    console.log(`✓ ${rel} and ${pages.size - 1} process page(s) are current (${rows.length} diagram(s))`);
  } else {
    mkdirSync(dirname(out), { recursive: true });
    for (const [f, body] of pages) writeFileSync(f, body);
    console.log(`Wrote ${rel} + ${pages.size - 1} process page(s) — ${skillToProcesses(rows).size} skill(s) joined`);
  }
}
