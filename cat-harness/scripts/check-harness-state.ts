#!/usr/bin/env bun
/**
 * The four harness graphs that a schema TYPES and nothing JUDGED — one criterion each.
 *
 * @module scripts/check-harness-state
 * @covers health, todos, interaction, issue-marks
 *
 * Bean `h1wq`, from `audit-coverage`'s `typed-only` finding: `health`, `todos`,
 * `interaction` and `issue-marks` each declare a validator that parses their
 * nodes, and no criterion and no gate had an opinion about what those nodes
 * SAY. The owner asked for all four (2026-09-24).
 *
 * ## Why one script and not four, and not `kg-audit`
 *
 * Four scripts would be four CI steps and four annotation rounds over 13 files
 * between them. `check-asset-roles` is the shape followed here: two findings
 * that are two halves of one rule, in one gate.
 *
 * **Not `kg-audit`**, and the reason is in that file's own header: its subject
 * is *one criterion per join in the actor→role→skill→task sentence*. These are
 * `state` and `context` graphs — a record of where something got to, and a
 * record a process reads — not joins in the role model. Adding subject kinds
 * for them would stretch a scope that file states deliberately, and the
 * `audit-coverage` `gates` column is exactly where a gate's coverage belongs.
 *
 * ## The risk the owner was told about, and how it is answered
 *
 * `health` and `todos` already have machinery — `bun run health` writes the one,
 * and the todo pipeline the other — so a criterion here could be a **second
 * answer** to a question something already settles, which is the drift
 * `kg-audit`'s `tool-*` criteria exist to prevent. Each family below therefore
 * asks something no existing gate asks, and that was checked by reading rather
 * than assumed: no gate declares `@covers health` or `@covers todos` at all.
 *
 * ## Three of the four are DETERMINED EMPTIES, and that is reported as such
 *
 * Measured 2026-09-24 over 13 files. Only `health-result-is-from-the-current-producer`
 * fires. A check over a two-node corpus that prints "clean" has said almost
 * nothing, so **every family prints what it examined** — §1.2a of
 * `generalise-the-fix`: a sweep that cannot tell an empty walk from a clean one
 * is not a check.
 *
 * Exit codes: 0 clean · 1 a finding (under `--check`) · 2 a graph could not be read.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { directoriesForGraph, instanceRootsIn, repoRootFor } from "../schemas/cat-harness.js";
// The producer's OWN hash, not a re-derivation. See `healthProducerCurrent`.
import { checkerHash } from "../test/health/run.js";
import { buildQaResult, writeQaResult } from "./qa-results.js";

const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);

/** One family's verdict. `examined` is the denominator, and it is never optional. */
export interface Family {
  id: string;
  /** What a FAILURE means, in one line. */
  summary: string;
  /** How many subjects were looked at. `0` is could-not-determine, not clean. */
  examined: number;
  findings: { where: string; detail: string }[];
  /** Set when the graph could not be read at all. */
  unreadable?: string;
}

/**
 * Every file of a kind, across every instance that declares a directory for it.
 *
 * ## DEDUPED, and the duplicate is not hypothetical
 *
 * Two instance roots can resolve one kind to the SAME directory: measured
 * 2026-09-24, the repository root and `cat-harness` both resolve `todos` to
 * `./todos`, so a naive walk listed three todo items as six and reported one
 * planted defect twice. That is worse than a cosmetic double-count — it inflates
 * the denominator §1.2a exists to make trustworthy, and a doubled finding reads
 * as two subjects needing two repairs.
 *
 * Deduped on both levels because they fail independently: the directory set, so
 * one tree is walked once, and the file set, since two declared directories may
 * still overlap by nesting.
 */
function nodesOf(kind: string, ext: string): string[] {
  const dirs = new Set<string>();
  for (const inst of instanceRootsIn(REPO)) for (const dir of directoriesForGraph(inst, kind)) dirs.add(resolve(dir));
  const out = new Set<string>();
  for (const dir of dirs) {
    const walk = (d: string): void => {
      let entries: string[];
      try {
        entries = readdirSync(d);
      } catch {
        return;
      }
      for (const e of entries) {
        if (e.startsWith(".")) continue;
        const p = join(d, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(ext)) out.add(resolve(p));
      }
    };
    walk(dir);
  }
  return [...out].sort();
}

/**
 * `health` — a committed result must come from the producer that exists NOW.
 *
 * ## The defect, measured rather than imagined
 *
 * 2026-09-24. `repository.health-report.json` recorded
 * `producer.script_hash: 760c506fd051`; `test/health/run.ts` hashed
 * `f04884b20163`. So the committed result was written by a version of the
 * producer that no longer exists — and the consequence is not abstract. That
 * result's staging finding still told a reader to *"have the owner add
 * `staging:cleanup` to the PRs whose previews are finished with"*, which bean
 * `7umv` had already PROVED cannot reach an orphaned preview: the cleanup job
 * fires on `pull_request: closed`, and being findable as an orphan requires the
 * pull request to be closed already.
 *
 * So a person reading the committed health report was being told to do
 * something this repository had established was impossible. **Not a staleness
 * nit: an action that cannot work, presented as the remedy.**
 *
 * ## Why the HASH and not the timestamp
 *
 * A result is allowed to be old — `bun run health` runs daily and a quiet day
 * changes nothing, which is the whole reason `writeQaResult` does not rewrite
 * an unchanged sidecar. What is not allowed is a result whose PRODUCER moved,
 * because then the advice inside it is the old code's advice. Age is a proxy;
 * the hash is the fact. Same discipline as bean `nytj`.
 *
 * ## It calls the producer's OWN hash function, and the first version did not
 *
 * This asks `checkerHash()` rather than hashing `producer.script`. The first
 * version recomputed `sha256(run.ts)` and could **never** have passed: that
 * field records `checkerHash`, which hashes THREE modules — `checks.ts`,
 * `probes.ts` and `run.ts` — because any of them changing can alter a verdict.
 * Re-running `bun run health` moved the recorded hash and the check stayed red,
 * which is how the mistake surfaced.
 *
 * So the general rule, and it is the one this file exists to obey rather than
 * to restate: **a staleness check calls the producer's own hash function; it
 * never re-derives one.** A re-derived hash makes a check that cannot pass, and
 * a check that cannot pass is indistinguishable from a corpus that cannot be
 * fixed — which is worse than no check, because somebody eventually deletes it.
 */
export function healthProducerCurrent(): Family {
  const f: Family = {
    id: "health-result-is-from-the-current-producer",
    summary:
      "A committed health result was written by a version of its producer that no longer exists, so " +
      "the remedies it states are the old code's remedies — which is how a reader is told to do " +
      "something the repository has since established cannot work (bean `7umv`).",
    examined: 0,
    findings: [],
  };
  const results = nodesOf("health", ".json");
  f.examined = results.length;
  const current = checkerHash();
  if (results.length === 0) {
    f.unreadable = "no instance declares a `health` directory holding a result — could not determine";
    return f;
  }
  for (const p of results) {
    let node: { producer?: { script?: string; script_hash?: string } };
    try {
      node = JSON.parse(readFileSync(p, "utf-8")) as typeof node;
    } catch (e) {
      f.findings.push({ where: relative(REPO, p), detail: `does not parse as JSON: ${String(e)}` });
      continue;
    }
    const script = node.producer?.script;
    const recorded = node.producer?.script_hash;
    if (!script || !recorded) {
      f.findings.push({ where: relative(REPO, p), detail: "records no producer, so it cannot be told from a result nobody produced" });
      continue;
    }
    if (recorded !== current) {
      f.findings.push({
        where: relative(REPO, p),
        detail: `written by \`${script}\` at ${recorded}; the checker is now ${current}. Re-run \`bun run health\` and commit, or the remedies in it are the old producer's.`,
      });
    }
  }
  return f;
}

/**
 * `todos` — a `processes:` entry must name a BPMN process that exists.
 *
 * The `dh4f` shape at a different subject: a todo that routes a reader to a
 * process id nothing declares sends them looking for a diagram that is not
 * there, and the front matter still validates, because the schema's job is to
 * say what a valid value LOOKS like and `Process_Whatever` looks fine.
 *
 * A determined empty as of 2026-09-24 — two references across three items,
 * both resolving against 68 declared processes — and that is exactly why the
 * denominator is printed.
 */
export function todoProcessRefs(): Family {
  const f: Family = {
    id: "todo-process-references-resolve",
    summary:
      "A todo item's `processes:` entry names a BPMN process id that no diagram declares, so a reader " +
      "following it looks for a process that is not there. The schema cannot catch it: an id that " +
      "resolves to nothing is still a well-formed string.",
    examined: 0,
    findings: [],
  };
  const ids = new Set<string>();
  for (const p of nodesOf("processes", ".bpmn")) {
    try {
      for (const m of readFileSync(p, "utf-8").matchAll(/<bpmn:process[^>]*\bid="([^"]+)"/g)) ids.add(m[1]!);
    } catch {
      /* a malformed diagram is `xml-comment-check`'s finding, not this one */
    }
  }
  if (ids.size === 0) {
    f.unreadable = "no BPMN process ids were found, so every reference would fail — could not determine";
    return f;
  }
  const items = nodesOf("todos", ".md");
  f.examined = items.length;
  for (const p of items) {
    const text = readFileSync(p, "utf-8");
    const block = text.match(/^processes:\n((?:[ \t]+-[ \t]+.*\n)+)/m);
    if (!block) continue;
    for (const m of block[1]!.matchAll(/-[ \t]+(.+)/g)) {
      const ref = m[1]!.trim().replace(/^["']|["']$/g, "");
      if (!ids.has(ref)) {
        f.findings.push({ where: relative(REPO, p), detail: `names process \`${ref}\`, which no diagram declares` });
      }
    }
  }
  return f;
}

/**
 * `issue-marks` — a mark must account for EDITS, not just for ids.
 *
 * This is the hazard the kind was split to carry, in `issue-working`'s words: a
 * comment edited after being read **keeps its id**, so `lastCommentId` alone
 * would call it seen, and an edited requirement is a changed requirement. Two
 * ways a mark fails that:
 *
 * - it records an id and no `lastUpdatedAt`, so edits are unaccounted for;
 * - its `checkedAt` is EARLIER than its `lastUpdatedAt`, which claims the agent
 *   looked before the last edit it says it accounted for. That is not a
 *   tolerance question: it is internally inconsistent, and the mark is
 *   reporting more than it knows.
 *
 * A determined empty as of 2026-09-24 over two marks.
 */
export function issueMarkEdits(): Family {
  const f: Family = {
    id: "issue-mark-accounts-for-edits",
    summary:
      "A mark records how far an agent has read an issue. A comment EDITED after being read keeps its " +
      "id, so a mark with no `lastUpdatedAt` calls an edited requirement seen — and one whose " +
      "`checkedAt` precedes its `lastUpdatedAt` claims to have looked before the edit it accounts for.",
    examined: 0,
    findings: [],
  };
  const marks = nodesOf("issue-marks", ".json");
  f.examined = marks.length;
  if (marks.length === 0) {
    f.unreadable = "no instance declares an `issue-marks` directory holding a mark — could not determine";
    return f;
  }
  for (const p of marks) {
    let n: { lastCommentId?: number; lastUpdatedAt?: string; checkedAt?: string };
    try {
      n = JSON.parse(readFileSync(p, "utf-8")) as typeof n;
    } catch (e) {
      f.findings.push({ where: relative(REPO, p), detail: `does not parse as JSON: ${String(e)}` });
      continue;
    }
    const where = relative(REPO, p);
    if (n.lastCommentId !== undefined && n.lastUpdatedAt === undefined) {
      f.findings.push({ where, detail: "records `lastCommentId` and no `lastUpdatedAt`, so an edited comment reads as seen" });
    }
    if (n.lastUpdatedAt && n.checkedAt) {
      const edited = Date.parse(n.lastUpdatedAt);
      const checked = Date.parse(n.checkedAt);
      if (Number.isNaN(edited) || Number.isNaN(checked)) {
        f.findings.push({ where, detail: "carries a timestamp that does not parse, so the mark cannot be read at all" });
      } else if (checked < edited) {
        f.findings.push({
          where,
          detail: `checkedAt ${n.checkedAt} is BEFORE lastUpdatedAt ${n.lastUpdatedAt} — the mark claims to have looked before the edit it accounts for`,
        });
      }
    }
  }
  return f;
}

/**
 * `interaction` — a declared profile must be read by something.
 *
 * Straight `dh4f`: declared and read by nothing. A profile nobody consumes is
 * an accommodation the person has stated and no agent will honour, which is
 * the most expensive version of that defect in this repository — it fails
 * silently, at the one person it is about.
 *
 * A determined empty as of 2026-09-24: `low-dexterity` is named by 36 files.
 * The search is over PROSE AND CODE on purpose, because a profile is honoured
 * by an agent reading a skill at least as often as by a branch in a script.
 */
export function interactionProfilesRead(): Family {
  const f: Family = {
    id: "interaction-profile-is-read",
    summary:
      "A profile declared in the interaction graph that nothing in the corpus names. The person has " +
      "stated an accommodation and no skill or script will honour it — `dh4f` at the subject where " +
      "it costs the most, because it fails silently and at one person.",
    examined: 0,
    findings: [],
  };
  const nodes = nodesOf("interaction", ".json");
  if (nodes.length === 0) {
    f.unreadable = "no instance declares an `interaction` directory — could not determine";
    return f;
  }
  const profiles = new Map<string, string>();
  for (const p of nodes) {
    let n: { users?: Record<string, { profiles?: string[] }>; default?: { profiles?: string[] } };
    try {
      n = JSON.parse(readFileSync(p, "utf-8")) as typeof n;
    } catch (e) {
      f.findings.push({ where: relative(REPO, p), detail: `does not parse as JSON: ${String(e)}` });
      continue;
    }
    for (const u of Object.values(n.users ?? {})) for (const prof of u.profiles ?? []) profiles.set(prof, relative(REPO, p));
    for (const prof of n.default?.profiles ?? []) profiles.set(prof, relative(REPO, p));
  }
  f.examined = profiles.size;
  if (profiles.size === 0) return f;

  // Read the corpus once and test every profile against it, rather than
  // shelling out per profile: the answer is the same and one walk is honest
  // about what it covered.
  const haystack: string[] = [];
  const walk = (d: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(d, { withFileTypes: true }).map((e) => e.name + (e.isDirectory() ? "/" : ""));
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith(".") || e.startsWith("node_modules")) continue;
      const p = join(d, e.replace(/\/$/, ""));
      if (e.endsWith("/")) walk(p);
      else if (/\.(ts|tsx|md|sh|json|ya?ml)$/.test(p) && !p.includes("/interaction/")) {
        try {
          haystack.push(readFileSync(p, "utf-8"));
        } catch {
          /* unreadable file: not this check's finding */
        }
      }
    }
  };
  walk(join(ROOT, "skills"));
  walk(join(ROOT, "scripts"));
  walk(join(ROOT, "schemas"));
  walk(join(ROOT, "src"));
  walk(join(REPO, ".claude"));

  for (const [prof, where] of profiles) {
    if (!haystack.some((t) => t.includes(prof))) {
      f.findings.push({ where, detail: `declares profile \`${prof}\`, which nothing in skills/, scripts/, schemas/, src/ or .claude/ names` });
    }
  }
  return f;
}

function main(): number {
  const check = process.argv.includes("--check");
  const families = [healthProducerCurrent(), todoProcessRefs(), issueMarkEdits(), interactionProfilesRead()];

  const unreadable = families.filter((f) => f.unreadable);
  const total = families.reduce((a, f) => a + f.findings.length, 0);

  console.log(`Harness state graphs  (${families.length} famil(ies) over health, todos, interaction, issue-marks)`);
  for (const f of families) {
    if (f.unreadable) {
      console.log(`  ⚠ ${f.id}: ${f.unreadable}`);
      continue;
    }
    // The denominator, always — a family that examined nothing has not passed.
    console.log(
      f.findings.length === 0
        ? `  ✓ ${f.id}: ${f.examined} examined, 0 findings`
        : `  ✗ ${f.id}: ${f.examined} examined, ${f.findings.length} finding(s)`,
    );
    for (const x of f.findings) console.log(`      · ${x.where} — ${x.detail}`);
  }

  writeQaResult(
    ROOT,
    "harness-state",
    buildQaResult({
      script: relative(REPO, join(ROOT, "scripts", "check-harness-state.ts")),
      scriptAbsPath: join(ROOT, "scripts", "check-harness-state.ts"),
      subject: { kind: "harness-state", id: "health+todos+interaction+issue-marks" },
      families: Object.fromEntries(
        families.map((f) => [
          f.id,
          {
            summary: f.unreadable ? `${f.summary} COULD NOT DETERMINE: ${f.unreadable}` : `${f.summary} Examined ${f.examined}.`,
            entries: f.findings,
          },
        ]),
      ),
    }),
  );

  if (unreadable.length > 0) {
    // Could-not-determine outranks a finding: a sweep blind on one family has
    // not cleared the others. Same rule `bun run health` states for itself.
    console.log(`\n⚠ ${unreadable.length} famil(ies) could not be determined — this is NOT a clean run`);
    return 2;
  }
  if (total === 0) {
    console.log("\n✓ every family examined its corpus and found nothing");
    return 0;
  }
  console.log(`\n${check ? "✗" : "·"} ${total} finding(s) across ${families.filter((f) => f.findings.length).length} famil(ies)`);
  return check ? 1 : 0;
}

if (import.meta.main) process.exit(main());
