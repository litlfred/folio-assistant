#!/usr/bin/env bun
/**
 * A bean that carries a SKILL'S CONTRACT instead of pointing at it.
 *
 * Bean `folio-assistant-8v0y`. `AGENTS.md`'s banner states the general rule —
 * *where a skill and a copy disagree, the skill wins and the copy is wrong* —
 * and until this check nothing could read it.
 *
 * ## The defect, already paid for
 *
 * 2026-09-23, bean `kn0t` ("PHASED TRANSITION: IG Publisher reduced to AST +
 * QA") was found holding a second copy of the contract in
 * `fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md`. The copy had
 * drifted in **four** places, and one of them was load-bearing:
 *
 * | | the bean said | the skill says |
 * |---|---|---|
 * | P1 exit | "navigation matches the Publisher's for one IG" | the derived navigation is **diffed**, and the difference is **empty or explained entry by entry** |
 * | P4 exit | "a release still cut from a full build, and provably so" | ...and the artefact **says which** build it came from |
 * | open items | 2 listed | **3** — dropped *whether P4 keeps a `tx` dependency in staging* |
 * | owner quote | elided *"you or sibling should be working on AST dump as cache of published IG"* | has it in full |
 *
 * "Matches" is an impression; "a diff that is empty or explained entry by
 * entry" is a measurement. Approving the bean's wording would have let a phase
 * be declared done on an impression — the first entry in that skill's own
 * **Do not** list. Repaired in PR #1185 by REMOVING the restatement.
 *
 * ## Why this is not a similarity check, measured rather than assumed
 *
 * A previous session built text-similarity detection and it failed. Recorded
 * here so nobody re-enters the dead end:
 *
 * | attempt | result |
 * |---|---|
 * | beans naming a skill + carrying a table | 327 hits, worthless — skill names here include `diff`, `patterns`, `conventions`, so it counted ordinary English |
 * | beans sharing a 10-word run with a skill | 254 beans. Real copied prose — but a bean that CREATED a skill shares prose legitimately, and that is its outcome record |
 * | near-match sentence pairs, Jaccard 0.55–0.95 | 134 "candidates", almost all backticks and blockquote markers stripped by the normaliser |
 *
 * **The decisive test:** `kn0t`'s three real drifts score Jaccard **0.25,
 * 0.54, 0.33** — every one below the 0.55 floor. The detector would have
 * caught NONE of the defect it was built for. That is structural, not a
 * threshold to tune: semantic drift is a *rewrite*, which shares few words
 * with the original and is indistinguishable from unrelated prose.
 *
 * ## The rule this check actually applies, and the three shapes it REFUSED
 *
 * The specification handed over named four criterion shapes. Each was measured
 * against the corpus on 2026-09-23 (888 beans, 254 open) rather than trusted,
 * and **three of the four do not survive measurement**:
 *
 * | candidate shape | measured | verdict |
 * |---|---|---|
 * | heading `## Proposed phases` | **0** occurrences, open or closed | generalised from `kn0t`'s single instance; no live evidence |
 * | heading `## Rules` | **0** occurrences | same |
 * | the word `invariant` | 34 beans (7 open) — every open one ordinary prose (*"that guards the invariant PR #410 established"*) | pure false positive |
 * | a line matching `exit criterion` | 2 beans, and **one of them is `kn0t` AFTER its repair**, five times | **fails on its own negative fixture** |
 *
 * That last row is the whole argument for structure over wording. The repaired
 * `kn0t` still discusses exit criteria — it must, it is a work plan for phased
 * work — it simply no longer *states* them. A checker that reads the words
 * cannot tell the two apart. {@link contractTables} reads the SHAPE.
 *
 * ## What a contract table is, and the two conditions that make it one
 *
 * A markdown table with at least two data rows, a column header matching
 * {@link CRITERION_COL}, and both of:
 *
 * **1. It is not an EXIT-CODE table.** This repository's checks all document
 * their 0/1/2 exit status in a table, so `| exit |` is the house idiom for
 * *exit status*, not *exit criterion*. Measured: of the 8 beans a bare
 * criterion-column rule flags, **four** are exit-code tables — `3pqn`
 * (`| state | means | exit |`), `6f1x` (`| exit | meaning |`), `35nj`, `zzar`.
 * Excluded by {@link EXIT_CODE_CELL}: every cell in the column is a bare digit.
 *
 * **2. Its rows enumerate PHASES.** The remaining four flagged beans name QA
 * criteria as identifiers in code they are building — `3kbd`
 * (`| criterion | severity | why |`), `m4zg`, `py74`, `5xfr`
 * (`| domain | criteria |`). None is a contract; each is a design-decision
 * record about a registry. What `kn0t` had and they do not is a first column
 * enumerating **named units of a plan**, each row carrying that unit's own
 * exit condition: `| phase | does | exit criterion |` over rows `P0`…`P4`.
 *
 * With both conditions the rule flags **0 of 888** beans in the store and
 * **1 of 1** on the pre-repair `kn0t` — see `check-bean-restates-skill.test.ts`,
 * which pins both directions on that fixture.
 *
 * ## The conjunction in the original specification is FALSIFIED — state it
 *
 * The brief said *"a bean that **references a skill by path** should not also
 * carry a criterion block"*. Measured against the fixture: **the pre-repair
 * `kn0t` references no skill by path at all**, and
 * `fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md` existed at that
 * commit (`git cat-file -e f8ed0c1a^:…` — it did). So requiring the pointer as
 * a *condition* reproduces the Jaccard failure exactly: the gate would have
 * caught none of the defect it was built for.
 *
 * The pointer is therefore reported as CONTEXT rather than required as a
 * condition, and it changes the remedy rather than the verdict:
 *
 * - names the skill → the contract has a home; delete the copy and keep the link.
 * - names none → the contract has no home yet; it belongs in a skill, and the
 *   bean keeps a pointer to it. That is `kn0t`'s case and it is the worse one,
 *   because nothing in the bean even admits a second copy exists.
 *
 * ## What this does NOT do
 *
 * **It does not read `## Done when`.** 607 of 888 beans carry one (180 of 254
 * open): it is the house shape for a work plan and the skill
 * [`opening-brief.md`](../skills/folio-core/opening-brief.md) asks for it. The
 * brief suggested flagging a Done-when that "restates the skill's criteria
 * rather than naming the work outstanding" — that is a judgement about
 * MEANING, which is the dead end above wearing a different hat. Left to the
 * reader, deliberately, and said here rather than silently omitted.
 *
 * **It does not repair anything.** Same rule as `check:bean-bodies` and
 * `bun run health`: the finding names something a *person* does, and the
 * person is the bean's owner. See
 * [`deletion-requires-confirmation.md`](../skills/folio-core/deletion-requires-confirmation.md).
 *
 * **It ignores closed beans**, like `check:bean-parents` and
 * `check:bean-bodies` and for their reason: a finished bean is history, and
 * back-filling it changes no plan.
 *
 * Exit: 0 clean, 1 a real defect, 2 could not check.
 *
 * @module folio-assistant/scripts/check-bean-restates-skill
 */

import { resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";

import { OPEN_STATUSES, readBeanStore, type BeanFile } from "./bean-store-read.ts";

/**
 * A column header naming an exit condition or a criterion.
 *
 * `\bexits?\b` rather than a substring, so `exits` matches and `exited` does
 * not — and note this is only ONE of three conditions. On its own it flags 8
 * beans, none of them a restatement; the module docs list all 8 by id.
 */
export const CRITERION_COL = /\bexits?\b|criteri/i;

/**
 * A first-column header that says the rows are phases.
 *
 * Anchored, and emphasis-tolerant because a header is often bolded. `steps?`
 * is included and `task` deliberately is not: a task list is what a work plan
 * legitimately IS, while a numbered phase carrying its own exit condition is a
 * contract.
 */
export const PHASE_HEADER = /^\**\s*(?:phase|stage|step|round|tier|milestone)s?\s*\**$/i;

/** A first-column CELL naming a numbered phase — `P0`, `Phase 2`, `**Step 3**`. */
export const PHASE_CELL = /^\**\s*(?:p|phase|stage|step)\s*-?\d+\b/i;

/**
 * A cell holding an exit STATUS rather than an exit condition.
 *
 * A bare digit, optionally bolded or in a code span: `0`, `**1**`, `` `2` ``.
 * The column must be ENTIRELY such cells to disqualify the table — one
 * numeric row among prose rows is a phase whose criterion is a number, which
 * is still a criterion.
 */
export const EXIT_CODE_CELL = /^\**\s*`?\d+`?\s*\**$/;

/** A path into any instance's `skills/` directory, as a bean writes one. */
export const SKILL_PATH = /(?:[\w.-]+\/)*skills\/[\w./-]+\.md/g;

/** One markdown table, as it sits in a bean body. */
export interface ParsedTable {
  header: string[];
  rows: string[][];
  /** 1-based line of the header row within the body. */
  line: number;
  /** The header row verbatim, for the finding message. */
  raw: string;
}

/**
 * Every pipe table in a body.
 *
 * Hand-parsed rather than through a markdown library, for
 * {@link readBeanStore}'s reason one level down: the question is about the
 * SOURCE shape an author typed, and a renderer normalises exactly the details
 * that carry the signal.
 */
export function parseTables(body: string): ParsedTable[] {
  const lines = body.split("\n");
  const out: ParsedTable[] = [];
  const cells = (l: string) =>
    l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  for (let i = 0; i < lines.length - 1; i++) {
    const head = lines[i]!.trim();
    const sep = lines[i + 1]!.trim();
    if (!head.startsWith("|")) continue;
    if (!/^\|[\s:|-]+\|$/.test(sep)) continue;
    const rows: string[][] = [];
    let j = i + 2;
    for (; j < lines.length && lines[j]!.trim().startsWith("|"); j++) rows.push(cells(lines[j]!));
    out.push({ header: cells(head), rows, line: i + 1, raw: head });
    i = j - 1;
  }
  return out;
}

/**
 * The contract tables in a body — see the module docs for the three conditions
 * and for the eight beans each one was measured against.
 */
export function contractTables(body: string): ParsedTable[] {
  return parseTables(body).filter((t) => {
    if (t.rows.length < 2) return false;
    const idx = t.header.findIndex((h) => CRITERION_COL.test(h));
    if (idx < 0) return false;
    const column = t.rows.map((r) => r[idx] ?? "");
    // An exit-CODE table. Guarded on length so an empty column cannot pass
    // `every` vacuously and disqualify a table nothing was read from.
    if (column.length > 0 && column.every((c) => EXIT_CODE_CELL.test(c))) return false;
    if (PHASE_HEADER.test(t.header[0] ?? "")) return true;
    return t.rows.filter((r) => PHASE_CELL.test(r[0] ?? "")).length >= 2;
  });
}

/** Distinct skill paths a body names. Context for the remedy, never a condition. */
export function skillPathsNamed(body: string): string[] {
  return [...new Set(body.match(SKILL_PATH) ?? [])].sort();
}

export interface Restatement {
  id: string;
  /** The header row of the contract table, verbatim. */
  table: string;
  line: number;
  /** Skill paths the bean names, or `[]` — which is the worse case. */
  skills: string[];
}

export interface RestatesSkillReport {
  /** False when this instance has no bean store at all. Legitimate. */
  store: boolean;
  /** Open beans read. Zero is `could not check`, never a pass. */
  examined: number;
  findings: Restatement[];
}

export function checkBeanRestatesSkill(root: string): RestatesSkillReport {
  const store = readBeanStore(root);
  if (store.state === "absent") return { store: false, examined: 0, findings: [] };
  if (store.state === "declared-but-absent") {
    // `dh4f`: a declaration naming a directory that is not there is a defect,
    // not an empty corpus. Reporting it clean is the very shape this file's
    // vacuity guard exists for.
    throw new Error(`the bean graph declares ${store.dir} and it is not there`);
  }
  const open: BeanFile[] = store.beans.filter((b) => !b.archived && OPEN_STATUSES.has(b.status));
  const findings: Restatement[] = [];
  for (const b of open) {
    for (const t of contractTables(b.body)) {
      findings.push({ id: b.id, table: t.raw, line: t.line, skills: skillPathsNamed(b.body) });
    }
  }
  return { store: true, examined: open.length, findings };
}

export function formatReport(r: RestatesSkillReport): string {
  if (!r.store) return "Bean restates skill\n  · no bean store — nothing to check";
  const out = [`Bean restates skill (${r.examined} open bean(s) examined)`];
  if (r.findings.length === 0) {
    out.push("  ✓ no open bean carries a phase-contract table");
    return out.join("\n");
  }
  for (const f of r.findings) {
    out.push(`  ✗ ${f.id} line ${f.line}: ${f.table}`);
    out.push(
      f.skills.length
        ? `      the contract has a home — ${f.skills.join(", ")}. Delete the copy; keep the link.`
        : "      the bean names NO skill. The contract belongs in one; the bean keeps a pointer to it.",
    );
  }
  out.push("");
  out.push("  A bean is a WORK PLAN: what is outstanding, and what constrains it. A skill carries the");
  out.push("  CONTRACT. Where the two disagree the skill wins and the copy is wrong (AGENTS.md).");
  out.push("  `kn0t` is the worked example, before and after PR #1185.");
  out.push("  Repaired by the bean's OWNER, not by this check and not by whoever ran it.");
  return out.join("\n");
}

if (import.meta.main) {
  let report: RestatesSkillReport;
  try {
    // The REPOSITORY root, not the cwd: `beans/` is repository-scoped, and a
    // run from anywhere else reads "no store" — a clean-looking answer to a
    // question asked in the wrong place. Same note as `check-bean-bodies`.
    report = checkBeanRestatesSkill(repoRootFor(resolve(import.meta.dir, "..")));
    // THE VACUITY GUARD. A store that exists and holds no open bean is not a
    // clean sweep, it is a sweep of nothing — the `xom7` shape, and the one
    // `gates.ts` fails its own extraction over. A filter over nothing passes.
    if (report.store && report.examined === 0) {
      console.error("Bean store read, but it holds no OPEN bean. Nothing was examined.");
      console.error("This is NOT a pass. Treat it as unknown.");
      process.exit(2);
    }
  } catch (e) {
    console.error(`Could not check whether a bean restates a skill: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.findings.length ? 1 : 0);
}
