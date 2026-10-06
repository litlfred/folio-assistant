/**
 * `qa-reporting` gets its first consumer.
 *
 * The permission has been declared in `skills/permissions/permissions.json`
 * from the start — *"Emit QA reports"* — and until this gate existed **nothing
 * outside a comment and a test read it**. Five actors hold it; zero also hold
 * `content-authoring`, so the separation the owner asked for was already true
 * in the declaration and enforced at no point where a verdict is written.
 *
 * That is bean `dh4f`'s shape with the stakes raised: a declaration that reads
 * as a control, consulted by nobody. A reader who finds `qa-reporting` in the
 * permission graph reasonably concludes something checks it.
 *
 * ## What this found, and why the gate is shaped the way it is
 *
 * **0 of 5,896 reviewer entries resolve to a declared actor.** Not a single
 * one, and not because any were denied: `QaReviewer.id` is a script path or an
 * ad-hoc agent name, while an actor id is a persona. The two sides never
 * shared a vocabulary, so the permission was unevaluable rather than unmet.
 *
 * A gate that failed on "unresolved" would therefore fail on everything, and
 * one that ignored it would do nothing at all. So there are three outcomes and
 * they are counted apart:
 *
 * | outcome | meaning | gate |
 * |---|---|---|
 * | **permitted** | `actor` resolves and holds `qa-reporting` | pass |
 * | **forbidden** | `actor` resolves and does NOT hold it | **FAIL, always** |
 * | **unresolved** | no `actor`, or one naming no declared actor | baseline; fails on a NEW one |
 *
 * `forbidden` is the defect this exists to catch and is never baselined — a
 * producer writing its own verdict is the thing the whole discipline forbids.
 * `unresolved` is the backlog, and the baseline can only shrink: an entry that
 * stops matching is reported **stale** so the file cannot quietly grow.
 *
 * ## The one exception, and it is deliberate
 *
 * A **"could not dispatch"** record may be written by anyone, including the
 * producer. That is the owner's ruling of 2026-09-21 and the reason the
 * discipline can gate at all — a producer forbidden from writing a verdict has
 * nothing to write where no dispatch exists, leaving the gate reading an
 * absence it cannot tell from negligence.
 *
 * Those records are identified structurally (`metrics.dispatch:
 * "unavailable"`, per `isCouldNotDispatch`), never by reviewer name, so the
 * exemption cannot be claimed by asserting it.
 *
 * ## An absent corpus is "could not determine", never a stale baseline
 *
 * Bean `c8uq` (reader audit row R28). With `test/results/` moved aside this
 * gate used to exit 1 only through its stale-baseline rule, printing *"stale
 * baseline entry, remove it"* five times — and an agent obeying that empties
 * the baseline, after which the next run passes over **0 entries**. The
 * derived corpus now lives on the `qa-reports` branch, so an unfetched
 * checkout is the normal case, not an accident.
 *
 * So the gate reports its POPULATION. It reads two places — the derived
 * results tree and the declared `attestations` tree (`test/attestations/`,
 * where agent and human judgements stay on `main`, bean `2gst`) — and:
 *
 * - a `forbidden` entry still fails (exit 1): that is determined wherever it
 *   was found;
 * - an ABSENT results tree is exit 2, *could not determine*, and the baseline
 *   is NOT judged — no entry is called stale over a corpus nobody looked at;
 * - zero verdict-bearing entries examined is exit 2 through `vacuityRefusal`.
 *
 * @module scripts/check-qa-reviewer-permission
 * @covers policies, scenarios
 */

import { readPolicyGrants } from "../../cat-harness/schemas/odrl.js";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import type { QaCriterionEntry, QaReviewer } from "../../cat-harness/schemas/block-qa.ts";
import { isCheckerWitness, isCouldNotDispatch } from "../../cat-harness/content/pipeline/untainted-verification.ts";
import { actorsDir } from "../../cat-harness/schemas/role-graph.ts";
import { directoryForGraph } from "../../cat-harness/schemas/cat-harness.ts";
import { vacuityRefusal, type Source } from "../../cat-harness/scripts/vacuity-refusal.ts";
import { HARNESS_ROOT } from "./lib/roots.ts";

const ROOT = join(import.meta.dir, "..", "..");
const ACTOR_DIR = actorsDir(ROOT) ?? (() => { throw new Error("the platform declares no `scenarios` graph, so the actor registry (bean rqao) has no home to read"); })();
// declared-path-literal: the convention home of cat-harness's ODRL policies
// (issue #1180), beside the actor registry this gate already reads by path.
const POLICY_DIR = join(ROOT, "cat-harness", "policies");
const RESULTS = join(ROOT, "cat-harness", "test", "results");
/**
 * The judgement half (bean `2gst`), read from the DECLARATION. Agent and human
 * entries are what this gate exists to judge, and they stay on `main` when the
 * derived results leave it — so this is the half that is never "not fetched".
 */
function attestationsDir(): string | undefined {
  return directoryForGraph(join(ROOT, "cat-harness"), "attestations");
}
const BASELINE = join(HARNESS_ROOT, "scripts", "qa-reviewer-permission-baseline.json");
const PERMISSION = "qa-reporting";

export type Outcome = "permitted" | "forbidden" | "unresolved";

/** Every declared actor's permission set, keyed by id. */
export function readActors(
  dir: string = ACTOR_DIR,
  grants: ReadonlyMap<string, readonly string[]> = readPolicyGrants(POLICY_DIR),
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try {
      const d = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        id?: string;
        permissions?: string[];
      };
      // The ODRL policies hold what an actor may do (issue #1180); a file that
      // still lists its own `permissions` is an unmigrated registry, and wins.
      if (d.id) out.set(d.id, new Set(d.permissions ?? grants.get(d.id) ?? []));
    } catch {
      // A malformed actor file is not this gate's finding to make — the role
      // audit owns it. Skipping here would be wrong if it hid a defect, but an
      // actor nobody can parse resolves nothing, which the `unresolved` count
      // already says.
    }
  }
  return out;
}

/**
 * May this reviewer emit a verdict?
 *
 * Three outcomes, never two. Collapsing `unresolved` into either of the others
 * is the whole failure mode: into `permitted` and the gate is decorative; into
 * `forbidden` and it fails on a corpus nobody has migrated yet.
 */
export function reviewerOutcome(reviewer: QaReviewer | undefined, actors: Map<string, Set<string>>): Outcome {
  const id = reviewer?.actor;
  if (!id) return "unresolved";
  const perms = actors.get(id);
  if (!perms) return "unresolved";
  return perms.has(PERMISSION) ? "permitted" : "forbidden";
}

export interface Finding {
  file: string;
  criterion: string;
  reviewer: string;
  actor?: string;
  outcome: Outcome;
}

function walkJson(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkJson(p, out);
    else if (e.endsWith(".json")) out.push(p);
  }
  return out;
}

/** Scan every QA sidecar and classify each verdict-bearing entry. */
export function scan(resultsDir: string = RESULTS, actors = readActors()): Finding[] {
  return scanCounted(resultsDir, actors).findings;
}

/**
 * {@link scan}, plus the population: how many verdict-bearing entries were
 * EXAMINED (permitted ones included), and whether the directory was there.
 * Zero examined must not read as "no defect" (bean `c8uq`).
 */
export function scanCounted(
  resultsDir: string,
  actors = readActors(),
): { findings: Finding[]; examined: number; present: boolean } {
  const findings: Finding[] = [];
  let examined = 0;
  for (const file of walkJson(resultsDir)) {
    let doc: unknown;
    try {
      doc = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      continue;
    }
    const criteria = (doc as { criteria?: Record<string, QaCriterionEntry[]> }).criteria;
    if (!criteria || typeof criteria !== "object") continue;
    for (const [criterion, entries] of Object.entries(criteria)) {
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        // Two exemptions, both identified STRUCTURALLY so neither can be
        // claimed by asserting it.
        //
        // 1. A "could not dispatch" record — the producer may write this one,
        //    and only this one. The owner's ruling of 2026-09-21.
        // 2. A CHECKER's witness. `untainted-checker` deliberately holds no
        //    `qa-reporting`, because it rules on nothing; its `n/a` carries
        //    the intermediate a reader needs, not a finding. Without this the
        //    honest half of the mechanism would fail the gate built to protect
        //    it — while a checker entry carrying a REAL verdict still lands in
        //    `forbidden`, which is the defect worth catching.
        //
        // Rejected: exempting every `n/a`. It is the tempting simplification
        // and it is wrong — 3,173 of 5,896 entries are `n/a` (54%), and "this
        // criterion does not apply here" is precisely the claim that produces
        // a false pass when it is wrong. Exempting it would blind the gate to
        // the `dh4f` shape this whole epic is about.
        examined++;
        if (isCouldNotDispatch(entry) || isCheckerWitness(entry)) continue;
        const outcome = reviewerOutcome(entry.reviewer, actors);
        if (outcome === "permitted") continue;
        findings.push({
          file: relative(ROOT, file),
          criterion,
          reviewer: entry.reviewer?.id ?? "(none)",
          actor: entry.reviewer?.actor,
          outcome,
        });
      }
    }
  }
  return { findings, examined, present: existsSync(resultsDir) };
}

/** The backlog key: a reviewer id, not a file — the corpus has thousands of files and nine ids. */
export function baselineKey(f: Finding): string {
  return `${f.outcome}:${f.reviewer}`;
}

interface Baseline {
  _comment: string;
  known: string[];
}

function readBaseline(): Baseline {
  if (!existsSync(BASELINE)) return { _comment: "", known: [] };
  return JSON.parse(readFileSync(BASELINE, "utf-8")) as Baseline;
}

export function report(findings: Finding[], known: Set<string>) {
  const forbidden = findings.filter((f) => f.outcome === "forbidden");
  const unresolved = findings.filter((f) => f.outcome === "unresolved");
  const keys = new Set(findings.map(baselineKey));
  const novel = [...keys].filter((k) => !known.has(k) && !k.startsWith("forbidden:"));
  const stale = [...known].filter((k) => !keys.has(k));
  return { forbidden, unresolved, novel, stale };
}

if (import.meta.main) {
  const write = process.argv.includes("--write-baseline");
  const actors = readActors();
  const ATTESTATIONS = attestationsDir();
  const derived = scanCounted(RESULTS, actors);
  const judged = ATTESTATIONS
    ? scanCounted(ATTESTATIONS, actors)
    : { findings: [] as Finding[], examined: 0, present: false };
  const findings = [...derived.findings, ...judged.findings];
  const base = readBaseline();
  const looked: Source[] = [
    { label: "derived results", dir: RESULTS, present: derived.present, found: derived.examined },
    {
      label: "attestations",
      dir: ATTESTATIONS ?? "(no `attestations` directory declared)",
      present: judged.present,
      found: judged.examined,
    },
  ];

  if (write) {
    // Writing a baseline from a corpus that is not here would record "nothing
    // unresolved" — the vacuous pass, made permanent.
    if (!derived.present) {
      console.error(
        `  ✗ refusing --write-baseline: ${relative(ROOT, RESULTS)} is absent, so the baseline would be written ` +
          `over a corpus nobody looked at. Run \`bun run qa:fetch --ref main\` first.`,
      );
      process.exit(2);
    }
    const keys = [...new Set(findings.filter((f) => f.outcome !== "forbidden").map(baselineKey))].sort();
    writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          _comment:
            "Reviewer ids whose ACTOR does not resolve, so `qa-reporting` cannot be evaluated for them. " +
            "One key per reviewer id, not per file: the corpus has thousands of sidecars and nine ids. " +
            "A `forbidden` outcome is NEVER baselined — a producer writing its own verdict is the defect " +
            "the discipline exists to forbid. This list may only SHRINK: an entry that stops matching is " +
            "reported stale so it cannot quietly grow. Refresh with --write-baseline.",
          known: keys,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`  ✓ baseline written — ${keys.length} unresolved reviewer id(s)`);
    process.exit(0);
  }

  const { forbidden, unresolved, novel, stale: staleIfJudged } = report(findings, new Set(base.known));
  // The baseline describes the DERIVED corpus. With that corpus absent every
  // entry would read stale, and "remove it" is the instruction that turns the
  // next run into a pass over nothing. So it is not judged at all.
  const stale = derived.present ? staleIfJudged : [];
  const total = findings.length;
  console.log(
    `QA reviewer permission (${actors.size} declared actor(s), ` +
      `${[...actors.values()].filter((p) => p.has(PERMISSION)).length} holding \`${PERMISSION}\`; ` +
      `${derived.examined} derived + ${judged.examined} attested entr(y/ies) examined)`,
  );

  let bad = false;
  for (const f of forbidden) {
    console.log(
      `  ✗ ${f.file} [${f.criterion}]: reviewer \`${f.reviewer}\` acts as \`${f.actor}\`, ` +
        `which does NOT hold \`${PERMISSION}\` — the producer is writing its own verdict`,
    );
    bad = true;
  }
  for (const k of novel) {
    console.log(`  ✗ NEW unresolved reviewer: ${k.replace(/^unresolved:/, "")} — name its \`actor\``);
    bad = true;
  }
  for (const k of stale) {
    console.log(`  ✗ stale baseline entry, remove it: ${k}`);
    bad = true;
  }

  // A determined defect outranks an unknown: a `forbidden` entry found in the
  // attestations is a failure whether or not the derived half was fetched.
  if (bad) {
    console.log(
      `  · ${total} entr(y/ies) not yet permitted; a "could not dispatch" record is exempt by design`,
    );
    process.exit(1);
  }

  const refusal = vacuityRefusal({ script: "check:qa-reviewer-permission", covers: "policies, scenarios" }, looked);
  if (!derived.present || refusal) {
    console.log(
      refusal ??
        `  ? could not determine — ${relative(ROOT, RESULTS)} is ABSENT from this checkout, so ` +
          `${base.known.length} baselined reviewer id(s) were not evaluated and NONE of them is stale.\n` +
          `    ${judged.examined} attested entr(y/ies) were examined and none is forbidden; that is not a ` +
          `verdict on the derived corpus.`,
    );
    console.log(
      `\n  The derived QA corpus lives on the \`qa-reports\` branch. Materialise it with\n` +
        `  \`bun run qa:fetch --ref main\` (or \`--ref pr/<n>\`) and re-run. Do NOT edit the baseline.`,
    );
    process.exit(2);
  }

  console.log(
    `  ✓ no NEW defect — 0 forbidden; ${unresolved.length} entr(y/ies) across ` +
      `${new Set(unresolved.map((f) => f.reviewer)).size} reviewer id(s) still name no actor (baselined)`,
  );
  console.log(
    `  · ${total} entr(y/ies) not yet permitted; a "could not dispatch" record is exempt by design`,
  );
  process.exit(0);
}
