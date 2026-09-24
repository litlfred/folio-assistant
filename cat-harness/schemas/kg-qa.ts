/**
 * Knowledge-graph QA sidecars — what is dangling in the process/role/skill graph.
 *
 * The content pipeline already audits two subject kinds with sidecars:
 * `<block>.qa.json` beside a content block (`schemas/block-qa.ts`) and
 * `<script>.script-qa.json` beside a computation (`schemas/script-qa.ts`).
 * This is the third subject kind — the **knowledge graph itself**: the BPMN
 * processes, the DMN decisions, the roles that own their lanes and the skills
 * their activities name.
 *
 * ## What goes wrong here, and why a report was not enough
 *
 * The joins in "an actor performs a task in a process as a role, using that
 * role's skills" were, until this module, checked at exactly one point:
 * `scripts/check-workflow-refs.ts` verified that a `<folio:skill ref>` names a
 * skill that exists. Everything else was unjoined, and the numbers say so —
 * measured 2026-09-18 across twenty diagrams: **60 distinct lane names**, bound
 * to nothing, for roughly two dozen actual positions; four `.dmn` files whose
 * decision ids nothing cross-checked from the BPMN side; and no direction of
 * check at all from a skill back to the role that is supposed to carry it.
 *
 * A sidecar rather than a console report, for the same reason the block sweep
 * writes one: the audit's **previous** answer has to be durable. Without it,
 * "this lane has been unbound since it was added" and "this lane broke in the
 * commit under review" look identical, and a reviewer cannot tell a new defect
 * from inherited debt. The sidecar is committed, so a diff shows exactly which
 * findings the change introduced.
 *
 * ## Three states, and `unknown` is never rendered as a pass
 *
 * A criterion returns `pass`, `fail`, `n/a` (it does not apply to this
 * subject) or `unknown` (it could not be evaluated — the file would not parse,
 * a dependency was absent). `unknown` is not `pass` and not `fail`: a diagram
 * the loader choked on has not been audited, and reporting it clean is how a
 * whole file silently leaves the gate. Same rule as `check-ci-health.ts` and
 * `pages-bootstrap.ts`.
 *
 * ## Severity decides the gate, not the finding count
 *
 * `critical` is a broken reference — something names a thing that does not
 * exist, and a consumer following it gets nothing. `major` is a missing join —
 * the graph is intact but a question cannot be answered, e.g. a lane bound to
 * no role, so "who performs this" has no answer. `minor` is coverage: a real
 * gap, but one with legitimate instances (a human signing something off is not
 * implemented by a markdown file), so failing on it would force a fake ref
 * onto a real step. `kg:audit --check` fails on `critical` only; `--strict`
 * adds `major`.
 *
 * @module schemas/kg-qa
 * @graphNode schema
 */

import { existsSync, readdirSync, readFileSync, type Dirent } from "node:fs";
import { join, relative, resolve } from "node:path";

import { z } from "zod";

import { KG_GRAPH_KIND } from "./cat-harness";
import { portableSegment } from "./portable-path";

/** Marker value carried by every sidecar written by `scripts/kg-audit.ts`. */
export const KG_QA_SCHEMA = "kg-qa/v1";

/**
 * The auditor's identity, recorded ONCE for the whole corpus.
 *
 * It used to live in every sidecar. That was not 214 facts — `kg-audit.ts`
 * hashes itself once per run and threads the SAME value into every report, and
 * it has no subset mode, so the per-file copies could not differ from each
 * other in any run that has ever happened. What they could do is change
 * together: measured 2026-09-19, adding a single comment line to the auditor
 * rewrote **218 files**, none of whose verdicts had changed.
 *
 * That is what made two concurrent branches conflict by construction — both
 * regenerate the same 218 files, and git has no way to know the diff carries
 * no information. Recording the fact once costs one file per auditor change
 * and loses nothing, because there was never per-file precision to lose.
 *
 * Freshness is unaffected and still has two independent halves: this hash says
 * whether the AUDITOR is the one in the tree, and each sidecar's own
 * `source_hash` says whether its SUBJECT has moved since it was judged.
 */
export const KG_QA_MANIFEST_SCHEMA = "kg-qa-manifest/v1";

/** Repo-relative location of that manifest, so every reader agrees on it. */
export const KG_QA_MANIFEST_PATH = "skills/kg-qa.manifest.json";

/**
 * The directory name sidecars used to sit in, beside their subject.
 *
 * Kept because the audit still has to SKIP such a directory when walking a
 * corpus that has not migrated, and because a folio consuming this platform
 * may still carry the old layout. Nothing in this repository writes one any
 * more — see {@link kgQaSidecarPath}.
 */
export const KG_QA_DIRNAME = "kg-qa";

/** Where KG verdicts live now, relative to the instance root. */
export const KG_QA_RESULTS_DIR = join("test", "results", "kg-qa");

/**
 * Where one subject's verdict lives — the ONE answer, for writer and reader.
 *
 * ## Why it is a function and not two path expressions
 *
 * It was two. `kg-audit.ts` composed the write path from the subject's own
 * directory and `content/pipeline/qa-witness.ts` composed the read path the
 * same way, independently — two spellings of one concept, which is the drift
 * this repository keeps paying for. They agreed only because neither had
 * changed. Moving the corpus is exactly the change that would have made them
 * disagree, and a reader that looks in the wrong place finds nothing and
 * reports a subject as unaudited, which is a false pass rather than an error.
 *
 * ## Why the tree MIRRORS the subject's path
 *
 * A flat directory keyed by stem collides, and not hypothetically: measured
 * 2026-09-19, four sidecar basenames already occur twice across packages —
 * `editor`, `getting-started`, `idle-backlog` and `l2-dak-authoring`. Flat,
 * four verdicts would silently overwrite four others. `kg-audit.ts` had
 * recorded the risk in a comment ("one shared directory would collide two
 * packages' skills of the same name") and kept the sidecars beside their
 * subjects because of it; mirroring keeps that guarantee while moving the
 * files, and keeps the package legible in the path.
 *
 * ## A subject OUTSIDE the instance keeps its own segment, not `..`
 *
 * A repository-scoped directory can sit above the instance root — this
 * repository declares `bootstrap/skills/` and `bootstrap/processes/` that way,
 * from `cat-harness/`. `relative` then answers `../bootstrap/processes`, and
 * joining that CLIMBS BACK OUT: the sidecars landed in
 * `test/results/bootstrap/`, a sibling of `kg-qa/` rather than a subtree of
 * it. Measured 2026-09-20 on bean `7u3g`, the moment those diagrams became
 * visible at all.
 *
 * The damage is not cosmetic. `sweepOrphans` walks `KG_QA_RESULTS_DIR`, so an
 * escaped sidecar is outside the only tree that would notice it going stale —
 * the one mechanism written to stop a verdict outliving its subject, blind to
 * the verdicts most likely to. And `kg:audit:check`'s staleness comparison
 * reads the same tree.
 *
 * So an outside subject is re-rooted under `_external/` rather than allowed
 * its `..`: still a mirror, still collision-free, and INSIDE the tree the
 * sweep walks. `..` is dropped rather than encoded, because the segment that
 * matters for collisions is the path below the escape.
 *
 * ## The stem is a COMPOSED name, so it is encoded
 *
 * For a subject that carries no path the stem is its **id**, and an id never
 * had to be a legal filename. Requirement ids are `req:<slug>`, so this
 * function composed seven paths containing a colon — which NTFS reserves, so
 * `git clone` fetched every object and then refused to check out, aborting on
 * the first one. Measured 2026-09-21, from a user's terminal.
 *
 * {@link portableSegment} encodes it reversibly rather than substituting,
 * because substitution would collide — the one guarantee this whole tree
 * exists to provide. See `schemas/portable-path.ts`.
 *
 * @param repoRoot   absolute instance root
 * @param subjectDir absolute directory the subject itself lives in
 * @param stem       the subject's filename without extension, or its id
 */
export function kgQaSidecarPath(repoRoot: string, subjectDir: string, stem: string): string {
  // `relative` rather than string surgery: a subject reached by a different
  // spelling of the same directory must land on the same results path, or the
  // writer and the reader disagree again by another route.
  const rel = relative(repoRoot, subjectDir);
  const inside = rel.split(/[\\/]/).filter((seg) => seg !== "" && seg !== "..");
  const escaped = rel.startsWith("..");
  // The STEM is encoded; the directory segments are not. They mirror a path
  // that is already on disk, so encoding them would make the mirror stop
  // matching the subject it mirrors — and a subject directory that is itself
  // unportable is a defect in that path, which `check:portable-paths` reports
  // at its source rather than papering over here.
  //
  // The stem has no such guarantee: it is a filename this function COMPOSES,
  // from an id that never had to be a legal filename. `req:agent-workflow` is
  // what made this repository unclonable on Windows — see `portable-path.ts`.
  return join(
    repoRoot,
    KG_QA_RESULTS_DIR,
    ...(escaped ? ["_external", ...inside] : inside),
    `${portableSegment(stem)}.kg-qa.json`,
  );
}

/** An orphan sidecar, and what its own `subject.path` says about why. */
export interface OrphanSidecar {
  /** Repo-relative path of the sidecar itself. */
  sidecar: string;
  /** `subject.path` as the sidecar records it, or `undefined` if it records none. */
  subject?: string;
  /**
   * `subject.kind` and `subject.id`, when the sidecar records them.
   *
   * The PATH is what changes when a subject moves; these two do not. Carried
   * so a relocation can be told from a deletion — see `relocateSidecars` in
   * `scripts/kg-audit.ts`. Optional for the same reason `subjectExists` is:
   * a sidecar that could not be read has no identity to offer, and guessing
   * one would move a verdict onto a subject it never audited.
   */
  kind?: string;
  id?: string;
  /**
   * Whether that subject is on disk. `undefined` means the sidecar could not
   * be read or names no path — a THIRD state, kept because "could not tell"
   * rendered as either answer is how the eight fragment sidecars below got
   * the wrong diagnosis in the first place.
   */
  subjectExists?: boolean;
}

/**
 * Sidecars under the results tree that this run did not write.
 *
 * ## Why it reads each sidecar rather than only its filename
 *
 * The first version asked one question — is this path in `written`? — and then
 * handed the reader a GUESS between two causes: *"Either the subject moved and
 * the sidecar should go, or it is no longer discovered from this root and the
 * DECLARATION is what is wrong."*
 *
 * Both branches were wrong for eight of the twelve it found, and the guess was
 * written into bean `3jj9` as a finding: *"their verdicts are real and the
 * cause is discovery, not staleness."* It is neither. Those eight declare
 * `part-of:` and are excluded by {@link isPartOfASkill}, deliberately and
 * correctly — a fragment measured against thresholds meant for a whole skill
 * produces findings about nothing, which is the defect that predicate was
 * added to remove. They are sidecars written BEFORE the exclusion existed.
 *
 * The sidecar already records `subject.path`. Reading it splits "the file is
 * gone" from "the file is there and was not audited" mechanically, which is
 * the difference between a dead verdict and a stale one — and the two want
 * opposite responses. One `existsSync` would have prevented the misdiagnosis.
 *
 * ## Still reports, still never deletes
 *
 * `deletion-requires-confirmation`: the agent reports what would go, with the
 * reason; a person decides. Splitting the report makes that decision possible
 * rather than making it automatic.
 */
export function sweepOrphans(root: string, written: ReadonlySet<string>): OrphanSidecar[] {
  const found: OrphanSidecar[] = [];
  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // No sidecar tree yet is not a finding.
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      if (!e.name.endsWith(".kg-qa.json")) continue;
      if (written.has(resolve(full))) continue;
      const row: OrphanSidecar = { sidecar: relative(root, full) };
      try {
        const doc = JSON.parse(readFileSync(full, "utf-8")) as {
          subject?: { path?: unknown; kind?: unknown; id?: unknown };
        };
        const sp = doc.subject?.path;
        if (typeof sp === "string" && sp.length > 0) {
          row.subject = sp;
          row.subjectExists = existsSync(join(root, sp));
        }
        // Read whether or not a path was recorded: the identity is what a
        // relocation matches on, and it is independent of the path that moved.
        if (typeof doc.subject?.kind === "string") row.kind = doc.subject.kind;
        if (typeof doc.subject?.id === "string") row.id = doc.subject.id;
      } catch {
        // Leave `subjectExists` undefined: unreadable is its own answer.
      }
      found.push(row);
    }
  };
  // KG_QA_RESULTS_DIR, not KG_QA_DIRNAME. The first draft of this sweep used
  // the dirname ("kg-qa") and so walked `cat-harness/kg-qa`, which does not
  // exist — `readdirSync` threw, the catch returned, and the guard reported a
  // clean sweep over nothing on every run. It was caught only because the
  // orphan it was written for was put back and the guard stayed silent.
  // A guard that cannot fire is the defect it was written to prevent.
  walk(join(root, KG_QA_RESULTS_DIR));
  return found;
}


/** What kind of node a sidecar audits. */
/**
 * The subject kinds this audit reports on.
 *
 * `tool` arrived last (issue #853, requirement 1) and is a different KIND of
 * member from the rest, which is worth saying because it changes what its
 * criteria are allowed to be. Every other kind's criteria DECIDE something
 * here. A Tool node's properties were already decided, by `check-tools.ts`,
 * `tools.test.ts` and `check-maintained-artefacts.ts` — measured 2026-09-22,
 * after a first attempt to add a `maintains` criterion turned out to be a
 * second answer to a question one of those already answers.
 *
 * So the `tool-*` criteria below PROJECT those verdicts rather than re-derive
 * them. What that buys is the thing a script cannot: a **committed sidecar per
 * Tool**, so "unbound since it was drawn" and "broken in the commit under
 * review" stop looking identical — the argument `AGENTS.md` makes for sidecars
 * over a printed verdict. It buys no new judgement, and a criterion here that
 * decided something `check-tools` does not would be the drift this note exists
 * to prevent.
 */
export const KG_SUBJECT_KINDS = ["process", "decision", "role", "requirement", "skill", "graph", "tool"] as const;
export type KgSubjectKind = (typeof KG_SUBJECT_KINDS)[number];

/**
 * Which declared GRAPH KIND a subject of each kind lives in.
 *
 * Two vocabularies meet here and they are not the same axis. `KG_SUBJECT_KINDS`
 * above says what this audit judges — a process, a role, a skill. The graph-kind
 * registry (`BASE_GRAPH_KINDS`) says what an instance DECLARES a directory of.
 * A `skill` subject inhabits a `skills` graph; a `tool` subject inhabits a
 * `tools` graph; nothing named `skill` or `tool` is a graph kind.
 *
 * ## Why this is declared and not derived
 *
 * `audit-coverage.ts` has to answer "how many criteria reach this KIND of
 * directory", and the only bridge between the two vocabularies was the
 * directory constants inside `kg-audit.ts` — resolved there, per subject, with
 * no exported statement of the correspondence. Reading it back out of those
 * constants means re-deriving a mapping from the shape of the code that uses
 * it, which is a guess dressed as a lookup: `DECISION_DIR` is
 * `join(WORKFLOW_DIR, "decisions")`, so a deriver sees a path and has to decide
 * whether that is its own kind. It is not — there is no `decisions` graph kind,
 * and a DMN file sits inside the `processes` graph.
 *
 * So the subject kind states which graph it inhabits, once, here. Every entry
 * must name a registered graph kind, and `kg-qa.test.ts` checks that against
 * the registry — a name that stops being a kind fails at the keyboard rather
 * than becoming a coverage row about a graph that does not exist.
 *
 * `Record<KgSubjectKind, string>` and not a partial map, so adding a subject
 * kind without saying where it lives does not compile. That is the
 * `GraphKindDef.holds` discipline: a required field makes "did not say"
 * impossible, where an optional one makes it indistinguishable from a default.
 */
export const KG_SUBJECT_GRAPH_KINDS: Readonly<Record<KgSubjectKind, string>> = {
  // A `.bpmn` file in the `processes` graph.
  process: "processes",
  // A `.dmn` file in `processes/decisions/` — INSIDE the processes graph, and
  // not a kind of its own. See the note above.
  decision: "processes",
  // `scenarios/roles.json`. Roles moved out of the skills tree 2026-09-21.
  role: "scenarios",
  // `skills/requirements/` — a requirement is authored beside the skills that
  // satisfy it, and the skills tree is the `skills` graph.
  requirement: "skills",
  skill: "skills",
  // The knowledge graph AS A WHOLE — the `graph` subject's findings are about
  // the joins between nodes rather than about any one node, so its home is the
  // kg graph itself rather than the directory its sidecar happens to sit in.
  graph: KG_GRAPH_KIND,
  tool: "tools",
};

/** Outcome of one criterion. `unknown` is never a pass. */
export const KG_RESULTS = ["pass", "fail", "n/a", "unknown"] as const;
export type KgResult = (typeof KG_RESULTS)[number];

export const KG_SEVERITIES = ["critical", "major", "minor"] as const;
export type KgSeverity = (typeof KG_SEVERITIES)[number];

/** A criterion in the registry below. */
export interface KgCriterionDefinition {
  id: string;
  /** Subject kinds it applies to. Anything else records `n/a`. */
  applies: KgSubjectKind[];
  severity: KgSeverity;
  /** One line, in the form of what a FAILURE means. */
  summary: string;
}

/**
 * The criteria, one per join in the actor→role→skill→task sentence.
 *
 * Ordered by where the join sits, not by severity: a reader walking a sidecar
 * should be walking the model.
 */
export const KG_CRITERIA: readonly KgCriterionDefinition[] = [
  {
    id: "tool-invoke-path-resolves",
    applies: ["tool"],
    severity: "critical",
    summary:
      "A Tool names a command or module that does not exist, so it is unreachable through its own " +
      "declaration. Projects `unresolvedPaths()`; nine of forty-four checkable values were stale once.",
  },
  {
    id: "tool-satisfies-resolves",
    applies: ["tool"],
    severity: "critical",
    summary:
      "A `satisfies` names a skill that does not exist — an edge to nothing, so the Tool claims to " +
      "implement something an agent cannot open. A skill declared by ANOTHER instance is neither " +
      "covered nor dangling, and is not a finding here.",
  },
  {
    id: "tool-satisfies-contract-met",
    applies: ["tool"],
    severity: "major",
    summary:
      "A Tool claims to satisfy a skill whose input contract it has no port for, so it cannot actually " +
      "exercise the skill. A contract that is present but UNREADABLE records `unknown`, never a pass — " +
      "the rule `check-tools` already states as \"never counted as agreement\".",
  },
  {
    id: "tool-io-types-declared",
    applies: ["tool"],
    severity: "major",
    summary: "An `io` port references a type the shared vocabulary does not declare.",
  },
  {
    id: "tool-args-shell-safe",
    applies: ["tool"],
    severity: "critical",
    summary:
      "A command-line input has a type that can express a shell payload. `critical` because this is the " +
      "one projected criterion about what a Tool can be made to DO rather than whether it is wired up.",
  },
  {
    id: "tool-alternative-resolves",
    applies: ["tool"],
    severity: "major",
    summary:
      "An `alternativeTo` names a Tool that does not exist, or the relation is not symmetric — a choice " +
      "the agent cannot find, or can find from only one side. `n/a` for a Tool declaring no alternative, " +
      "which is most of them.",
  },
  {
    id: "tool-maintains-in-tree",
    applies: ["tool"],
    // `minor`, and NOT because a rotted artefact is a small thing — it is a
    // 404 a reader follows. It is minor because from here this criterion can
    // only ever be `unknown`, and `unknown` counts toward `worstSeverity`.
    //
    // At `major` the seven Tools declaring `maintains` would put
    // `kg:audit:strict` permanently beyond reach, with no change to the
    // repository able to clear it. That is the failure mode this file already
    // names on `skill-in-role-or-process` — "a wall of false findings is how a
    // check gets switched off" — and `nested-instance-audited` is the exact
    // precedent: `minor` precisely BECAUSE the silence is correct and only its
    // invisibility was the defect.
    //
    // The real verdict is not softened by this. It is reached by
    // `check:maintained-artefacts` against the assembled tree, where a genuine
    // absence exits 1 and fails the docs-site workflow.
    severity: "minor",
    // THE THIRD STATE, and the reason this criterion is worth having at all.
    //
    // `maintains` asserts a Tool is authoritative for a PUBLISHED artefact, and
    // whether that artefact is in the tree is a question with no answer until
    // `_site/` is assembled. `check-maintained-artefacts.ts` asks it in the
    // `docs-site` workflow, after assembly, and exits 2 rather than 0 when
    // there is no tree.
    //
    // `kg:audit` runs on a checkout, where there is no tree. So this records
    // `unknown` with that reason — NOT `pass`. A sidecar claiming a green
    // `maintains` from a checkout would be green in exactly the place nobody
    // built the site, which is how the `docs-site` workflow failed 30 times
    // over two months without anybody noticing (`xom7`).
    //
    // It is not dropped instead, because "asked and unanswerable here" and
    // "never asked" are different facts and only the first tells a reader where
    // the answer lives.
    summary:
      "A Tool's `maintains` artefact is missing from the published tree. Answerable only against an " +
      "assembled `_site/`, so from a checkout this records `unknown` naming `check:maintained-artefacts` " +
      "as where the answer lives — never `pass`. `n/a` for a Tool that maintains nothing.",
  },
  {
    id: "skill-ref-resolves",
    applies: ["process"],
    severity: "critical",
    summary: "An activity names a skill that does not exist, so an agent handed the step cannot open it.",
  },
  {
    id: "decision-ref-resolves",
    applies: ["process"],
    severity: "critical",
    summary: "A gateway names a DMN file or decision id that does not exist, so the branch cannot be computed.",
  },
  {
    id: "variable-performer-declared-alone",
    applies: ["process"],
    severity: "major",
    summary:
      "A lane declares <folio:role variable=\"true\"/> AND a `ref`. It cannot be both: a lane that names " +
      "a role has not got a varying performer, and reading either one first would make the other silently " +
      "have no effect. `n/a` when no lane in the diagram declares a varying performer, which is also how a " +
      "reader tells a lane that binds no role BY DESIGN from one nobody got round to.",
  },
  {
    id: "role-ref-resolves",
    applies: ["process"],
    severity: "critical",
    summary: "A lane's explicit <folio:role ref> names a role that is not declared.",
  },
  {
    id: "activity-in-lane",
    applies: ["process"],
    severity: "major",
    summary: "An activity sits in no lane, so it has no role, so no actor can be said to perform it.",
  },
  {
    id: "lane-binds-role",
    applies: ["process"],
    severity: "major",
    summary: "A lane matches no declared role, so 'which skills does this task's performer have' has no answer.",
  },
  {
    id: "role-carries-activity-skill",
    applies: ["process"],
    severity: "major",
    summary:
      "An activity names a skill its lane's role does not carry — the task demands something the performer was never given.",
  },
  {
    id: "skill-servable",
    applies: ["process"],
    severity: "major",
    summary:
      "An activity names a skill that exists on disk but that `skill_fetch` cannot serve — its directory is " +
      "in no local package. `workflow_next` hands the agent a name, and fetching it returns \"package not found\".",
  },
  {
    id: "convention-ref-resolves",
    applies: ["process"],
    // `critical`, and the severity is the whole point of this one.
    //
    // It is the DANGLING direction, not the absence direction. A diagram
    // naming a convention nobody wrote hands an agent a rule it cannot read —
    // the `blv9` shape, a link-shaped value that does not dereference.
    //
    // THERE IS DELIBERATELY NO CRITERION FOR ABSENCE. Bean `3190`: "absent
    // binding means no conventions, not all of them". Most steps legitimately
    // carry none, so a criterion that fired on an unbound activity would be
    // red across every diagram on the day it shipped and would train a reader
    // to ignore it — and worse, the only way to clear it would be to bind
    // conventions everywhere, which is the unconditional prose the bean
    // exists to replace. The check is that what IS bound resolves.
    severity: "critical",
    summary:
      "A `<folio:convention ref>` on a process, lane or activity names a convention that is not in " +
      "`.claude/skills/conventions/`. The agent is told a rule applies and cannot read it.",
  },
  {
    id: "activity-names-skill",
    applies: ["process"],
    // `major`, not `minor`, SINCE the exemptions became declarations.
    //
    // It was `minor` because it had legitimate instances it could not tell
    // from real gaps — a stakeholder's sign-off and an unwritten skill both
    // showed up as "names no skill", so gating would have forced a fake ref
    // onto a real step. That is no longer true: an `actedUpon` lane, a
    // `judgementOnly` lane and `<folio:no-skill reason>` each SAY SO, and are
    // recorded `n/a`. What remains is an activity whose performer is handed
    // nothing and which has not said why — a missing join, which is `major`.
    //
    // Not `critical`: nothing dangles. Every reference that exists resolves;
    // the defect is one that is absent, which is what the scale calls major.
    severity: "major",
    summary:
      "An activity names no skill and declares no reason for having none. Exempt: a call activity (implemented " +
      "by the process it calls), a lane whose role is `actedUpon` (written to, never acts) or `judgementOnly` " +
      "(acts, but no procedure yields the answer), and an activity carrying `<folio:no-skill reason=\"…\"/>`.",
  },
  {
    id: "raci-role-resolves",
    applies: ["process"],
    // `critical`, and the severity is argued rather than picked. Every
    // `critical` in this registry is a DANGLING REFERENCE and every `major`
    // is a gap between things that exist — and this is `role-ref-resolves`
    // on a different edge: a name in a RACI column that dereferences to no
    // declared role. Grading it lower would say the same defect matters less
    // depending on which attribute carries it.
    severity: "critical",
    summary:
      "A `<folio:raci ref>` names a role that is in no role registry, so 'who is accountable' " +
      "dereferences to nothing.",
  },
  {
    id: "raci-single-accountable",
    applies: ["process"],
    // `major`: structural, not dangling. Every role named exists; what is
    // wrong is how many of them carry the decision.
    severity: "major",
    summary:
      "An activity declaring RACI does not have exactly one `accountable`. Zero is a breach too — a " +
      "half-annotated activity is worse than an unannotated one, because the chart looks complete.",
  },
  {
    id: "raci-accountable-not-consulted",
    applies: ["process"],
    // `major` for the same reason, and not `minor`. `minor` here grades
    // INTENDED states (a stub, reference material nobody performs); this is a
    // modelling error that makes the chart read as complete while one of its
    // four letters is decorative.
    severity: "major",
    summary:
      "A role is both `accountable` and `consulted` on one activity — asking yourself is not " +
      "consultation, and it is how `consulted` quietly becomes a formality.",
  },
  {
    id: "raci-involvement-vocabulary",
    applies: ["process"],
    // `major`, matching its two neighbours above, and the reasoning is the
    // same: every role named exists, so this is not a dangling reference. It
    // is a modelling error — a letter the process's chosen vocabulary does
    // not admit, which until 2026-09-23 was discarded during parsing with
    // nothing reporting it, so the chart read as complete while an
    // involvement somebody wrote had simply evaporated.
    severity: "major",
    summary:
      "A `<folio:raci involvement>` is not in the vocabulary its process declares — a typo, or " +
      "`supportive` where only RACI's four letters are in force. The value is neither coerced to a " +
      "neighbouring letter nor silently dropped; a process opts in to the fifth letter with " +
      "`<folio:involvement vocabulary=\"rasci\"/>`.",
  },
  {
    id: "activity-fulfilment-kind",
    applies: ["process"],
    // `major`. Nothing dangles — both ends of this join resolve — so it is not
    // `critical`; and it is not coverage, so it is not `minor`. It is TWO
    // DECLARATIONS THAT CONTRADICT EACH OTHER: the diagram says this step runs
    // without a person, and the role graph says a person is who stands in that
    // lane. One of the two is wrong and the diagram cannot say which.
    severity: "major",
    summary:
      "An activity's lane is filled by an actor kind that cannot perform it. A `userTask` is performed by a " +
      "human (BPMN: \"by a human being with the assistance of a software application\"); a `serviceTask` runs " +
      "without one, so an agentic or mechanical actor performs it. `bpmn:Task` and a call activity assert " +
      "nothing and are `n/a`, as is a lane whose role is `actedUpon` — a store is written to, never asked to " +
      "perform. Override the derived answer with `<folio:fulfilment kinds=\"…\" reason=\"…\"/>`; the reason is " +
      "required at load time, because widening `kinds` is the cheapest way to make this criterion pass.",
  },
  {
    id: "call-activity-resolves",
    applies: ["process"],
    severity: "major",
    // `major`, and an unresolved target records `unknown` rather than `fail`,
    // because this audit **cannot tell a typo from a legitimate outward call.**
    // PR #282 states the rule from the interpreter's side: a call activity
    // naming a process no file declares stays opaque, since a folio may call
    // out to a process it does not host. Rendering that as a `critical` failure
    // would break the build of the first downstream instance that does so —
    // the same mistake `readme-links.ts` avoids by reporting an external host
    // as NOT CHECKED rather than as dead.
    summary:
      "A call activity's `calledElement` names a process this instance can load. It is the join that makes a call " +
      "activity's skill exemption safe — without it, a typo in `calledElement` would satisfy both criteria and " +
      "implement the step with nothing at all. A target this instance cannot load is `unknown`, not `fail`: it may " +
      "be hosted elsewhere, and an audit that cannot tell must not claim it can.",
  },
  // ── Documentation completeness (bean `ooq3`, issue #1007) ─────────────
  //
  // The three criteria below ask whether a diagram can be READ, not whether it
  // runs. Every join above can pass over a process nobody can find: on
  // 2026-09-23 every one of 62 diagrams had a fresh SVG and `render:bpmn:check`
  // was green, while 45 of them were shown on no page. `adjudication.bpmn` was
  // one — drawn, rendered, merged, and reachable only by typing its URL.
  {
    id: "process-diagram-published",
    applies: ["process"],
    // `major`: the diagram exists and is correct, so nothing dangles — what is
    // absent is the page a reader would meet it on, which the scale calls major.
    severity: "major",
    summary:
      "The rendered diagram is shown on no docs page. A fresh SVG proves `render:bpmn` ran, not that anybody can " +
      "reach the picture; the per-process pages `gen-processes-viz.ts` writes are what make this pass. `unknown` when " +
      "no docs layer is declared — an audit that could not look must not report a clean page.",
  },
  {
    id: "activity-documented",
    applies: ["process"],
    // `minor`, and deliberately not gated. A step's NAME is often enough; the
    // measurement (95 of 456 undocumented) is the backlog, not a verdict that
    // each one is wrong.
    severity: "minor",
    summary:
      "An activity carries no `<bpmn:documentation>`, so its page can show a name and nothing about what the step " +
      "is for. The process-level documentation is not a substitute: it says why the diagram exists, not what one " +
      "step asks of its performer.",
  },
  {
    id: "activity-calls-skill-process",
    applies: ["process"],
    // `minor` because the rule is a heuristic and says so. It fires only when
    // exactly ONE step in a diagram names a skill that owns a same-named
    // process: several steps naming one skill are using its know-how as steps
    // (five in `refresh-materialized` name `materialize-remote`), which a call
    // activity would get wrong. The raw match was 24; the rule leaves 9.
    severity: "minor",
    summary:
      "A single step names a skill that has its own process of the same name, but is a plain task rather than a " +
      "call activity — so the diagram re-describes the procedure instead of descending into it, and the called " +
      "process's page cannot say who calls it. Exempt: a step carrying `<folio:no-call reason=\"…\"/>`, which " +
      "records that it uses the skill for one slice rather than running its whole process.",
  },
  // ── Documentation completeness past activities (bean `6hq4`, issue #1044) ─
  //
  // Measured 2026-09-23 over all 62 diagrams: 123 gateways — 102 diverging
  // exclusive (DECISIONS), 9 converging exclusive, 6 parallel forks, 6 joins,
  // no inclusive (the model refuses them). 104 of 123 had no documentation, 83
  // of them decisions. Of 220 branches out of a decision, 0 were unnamed and 0
  // repeated a sibling's label; of 174 start/end events, 0 were unnamed — so
  // there is no event criterion, and lanes are `check:lane-documentation`'s.
  {
    id: "gateway-documented",
    applies: ["process"],
    // `minor` and not gated, like `activity-documented`: 83 is a backlog, and
    // a well-named question with well-named branches often reads without
    // prose. Only DECISIONS are asked — a merge, fork or join decides nothing,
    // and its BPMN symbol already says everything true of it.
    severity: "minor",
    summary:
      "A decision (an exclusive gateway with more than one way out) carries no `<bpmn:documentation>`, so its page " +
      "shows the question and not what answers it: who decides, from what evidence, and what each branch commits " +
      "the process to. A DMN table or a `<folio:judgement reason>` is not a substitute — it says how the answer is " +
      "reached, not what is being asked.",
  },
  {
    id: "gateway-branches-named",
    applies: ["process"],
    // `minor`, and it reads 0 on the day it was added: it holds a line the
    // corpus already meets rather than opening a backlog. Not `major`, because
    // an engine routes an unnamed branch correctly — what is lost is the
    // READER's ability to say which answer leads where.
    severity: "minor",
    summary:
      "A branch out of a decision has no name, or repeats a sibling's label, so a reader cannot tell which answer " +
      "takes it. Every branch of a decision needs a label distinct from the others on the same gateway.",
  },
  {
    id: "node-reachable",
    applies: ["process"],
    // `major`: a node nothing can reach is not run, and a diagram is the
    // normative statement of what runs. Not `critical`, because the engine
    // does not fault on it — the step is simply never offered, which is the
    // quiet kind of wrong.
    severity: "major",
    summary:
      "A flow node no path from any start event reaches, and which reaches no start event either. A node that flows " +
      "INTO a start event is a PRE-START GATE and passes — `feature-staging`'s H_Confirm is one, and reporting it " +
      "would make a correct modelling decision a permanent finding.",
  },
  {
    id: "node-has-exit",
    applies: ["process"],
    // `major` for the same reason, from the other end: control arrives and
    // the process neither continues nor ends.
    severity: "major",
    summary:
      "A node that is not an end event and has no outgoing flow, so control arrives and the process neither " +
      "continues nor terminates.",
  },
  {
    id: "prose-reviewed-since-code-changed",
    applies: ["process", "skill"],
    // `minor` and not gated (R7, issue #1042): it asserts nothing about
    // whether the prose is TRUE, only that the code moved while the prose
    // describing it stood still. Gating waits for a clean run to show it does
    // not cry wolf — the lesson of bean `77ex`.
    severity: "minor",
    summary:
      "A declared prose ↔ code pair — a diagram and the workflow whose `# bpmn:` line names it, or a skill .md beside its same-stem .ts — " +
      "had its CODE change since the prose was last seen or attested, and the prose did not. Re-read it, then " +
      "`pairs:attest` with a reason. A prose edit never raises this; a missing side of a declared pair is `unknown`.",
  },
  {
    id: "prose-claims-resolve",
    applies: ["process", "skill"],
    // `minor`, advisory (R7). Stage A of #1042: what the prose side of a
    // declared pair says about the code side, checked where it names a
    // resolvable thing. Measured before it shipped: 1 false, 23 holding and
    // 10 undetermined claims over 32 pairs — the undetermined are a folio's
    // files and scripts, which is why they are never counted as false.
    severity: "minor",
    summary:
      "The prose of a declared prose ↔ code pair names something that does not exist: a symbol not declared in the module " +
      "it cites, a module missing from a directory that exists here, a `bun run` file that is not there, or a " +
      "`# bpmn-node:` in the workflow naming an element the diagram does not have. `unknown` when every parsed claim pointed outside this repository.",
  },
  {
    id: "role-skills-resolve",
    applies: ["role"],
    severity: "critical",
    summary: "A role carries a skill name that does not exist.",
  },
  {
    id: "role-inherits-resolves",
    applies: ["role"],
    severity: "critical",
    summary: "A role inherits a role that is not declared.",
  },
  {
    id: "role-binds-a-lane",
    applies: ["role"],
    severity: "minor",
    summary: "A declared role binds no lane in any diagram — a dangling role nothing can enter.",
  },
  {
    id: "role-has-actor",
    applies: ["role"],
    severity: "minor",
    summary: "No declared actor is eligible for this role. Advisory: the actor registry is not a permission system.",
  },
  {
    // Unwritable until a role could admit a SET of kinds, because with one
    // kind per role every finding had two readings and the criterion could not
    // say which: is the role too narrow, or is the actor claiming a role it
    // cannot take on? `ce65` measured the mismatches and deliberately left
    // them rather than pick. Now that widening a role is sayable, a surviving
    // mismatch means the actor's `roles` list is wrong — one reading, so a
    // finding somebody can act on.
    //
    // `major`, not `critical`: nothing dangles. Both sides exist and are
    // readable; they contradict each other about what may fill a lane.
    id: "actor-kind-fits-role",
    applies: ["role"],
    severity: "major",
    summary:
      "An actor declares this role, but its kind is not among the kinds the role admits — so either the " +
      "role is too narrow or the actor cannot take it on.",
  },
  {
    id: "requirement-statement-satisfied",
    applies: ["requirement"],
    severity: "minor",
    summary:
      "A statement that no skill or capability claims — nothing declares `satisfies: req:<id>#<key>`, so " +
      "nothing is recorded as discharging it. Coverage: the satisfier names the statement (#1168), so an " +
      "unclaimed statement is visible only from here.",
  },
  {
    id: "requirement-actors-resolve",
    applies: ["requirement"],
    severity: "critical",
    summary: "A requirement or statement binds an actor id the registry does not declare.",
  },
  {
    id: "requirement-derived-from-resolves",
    applies: ["requirement"],
    severity: "critical",
    summary:
      "A requirement derives from a parent requirement that does not exist, so the conformance lattice has a " +
      "hole where a reader expects the broader obligation.",
  },
  {
    id: "requirement-statements-graded",
    applies: ["requirement"],
    severity: "major",
    summary:
      "A statement carries no `conformance` grade. SHALL and SHOULD are the whole point of writing a " +
      "requirement rather than a note; an ungraded statement cannot be conformance-tested.",
  },
  // ── Is this role WRITABLE FOR? ────────────────────────────────
  //
  // A lane is the audience: a block sits in a lane, the lane is a role, and
  // the role is who the prose is for. That only works if the role says enough
  // to write for and to review against. `summary` says what the role DOES,
  // which is enough to draw a swimlane and not enough to author against.
  //
  // Both are `n/a` for an `actedUpon` role — the corpus and the work plan
  // are lanes because tasks act ON them, and asking who the corpus is or what
  // it came to do is not a question.
  {
    id: "role-has-persona",
    applies: ["role"],
    severity: "major",
    summary:
      "A role an author writes for carries no `persona` — nothing says what this reader already knows, " +
      "what they came to find out, or what would make the page useless to them.",
  },
  // No `role-declares-voice` (#1168, B2): a voice points at the role it
  // addresses, from a dependent instance this audit cannot see, so the
  // coverage is `check:voices`'s — reported from the side that can see both.
  {
    id: "role-has-story",
    applies: ["role"],
    severity: "minor",
    summary:
      "No user story is told as this role — nothing says what this reader is trying to do. 'Is this well " +
      "written' is unanswerable; 'does this let them do the thing they came for' is not. Stories point at " +
      "their role from `scenarios/stories.json`; the role names none.",
  },
  {
    id: "decision-outcomes-used",
    applies: ["decision"],
    severity: "major",
    summary: "A decision table is referenced by no gateway, or returns an outcome no branch is named for.",
  },
  // ── Is this skill short enough to be READ? ────────────────────
  //
  // A skill is read before acting, every time, by an agent with a finite
  // context. Length is a cost paid on every invocation, so it is a property of
  // the artefact and belongs in a sidecar — not an exhortation in the skill
  // files themselves, which is advice nothing measures and nothing enforces.
  //
  // Thresholds are MEASURED, not chosen. Across 123 skill files on
  // 2026-09-18 (`find skills -name "*.md" -not -path "*/kg-qa/*" -exec wc -l`):
  // 26,532 lines total, median 178, p75 279, p90 391, max 1280.
  //
  // `major` at 400 is roughly p90 — the tenth of files that are documents
  // rather than instructions. `minor` at 280 is roughly p75. Neither is a
  // style opinion; both say "this is longer than three quarters of its peers".
  {
    id: "nested-instance-audited",
    applies: ["graph"],
    // `minor`, because the SILENCE is correct and only its invisibility is the
    // defect. One instance's graph must not carry another's nodes — that is
    // `instance-graph-isolation.test.ts`, guarding a live 2026-09-19 leak of 88
    // references. So this audit rightly does not read a nested instance, and
    // rightly must not be made to.
    //
    // What was wrong is that nothing said so. On 2026-09-20 a session read
    // "named by no activity" as absolute, concluded the audit had a blind spot,
    // declared the nested directory at the root and re-introduced the leak the
    // test exists to prevent. Scoping the wording stopped that MISreading; this
    // criterion is the other half — it names the unread instance outright, so
    // the gap is a reported number rather than something to be deduced and
    // mis-deduced. Bean `sa8y`.
    severity: "minor",
    summary:
      "This tree holds a nested instance whose graph this audit does not read — correctly, but the unread corpus should be counted rather than silent.",
  },
  {
    id: "skill-is-a-stub",
    applies: ["skill"],
    // `minor`, and the severity is the whole point. A stub is INTENDED
    // work-in-progress, not a defect: it exists so the graph traverses and
    // `skill_fetch` answers instead of failing mid-task. It must be VISIBLE —
    // otherwise stubbing a gap hides it, which is strictly worse than leaving the
    // gap open — and it must not gate, or the act of stubbing would turn CI red.
    //
    // `minor` gives exactly that: `kg:audit` prints it, `kg:audit:check` passes,
    // and `kg:audit:strict` does not promote it either. The owner's principle,
    // 2026-09-20: "stub things out knowing its not working. make sure QA checks
    // pickup so we can fix later. principle: KG is always a work in progress. QA
    // helps show where to work on it next, close gaps."
    severity: "minor",
    summary:
      "A skill is a declared stub: it exists so the graph traverses and skill_fetch answers, and its content is not here yet.",
  },
  {
    id: "skill-is-brief",
    applies: ["skill"],
    severity: "minor",
    summary:
      "A skill is longer than 280 lines (p75 of the corpus) — an agent reads it before acting, " +
      "every time, and length is a cost paid on every invocation.",
  },
  {
    id: "skill-not-a-document",
    applies: ["skill"],
    severity: "major",
    summary:
      "A skill is longer than 400 lines (p90) — at that length it is a document, and an agent that " +
      "skims it follows the part it happened to read.",
  },
  {
    id: "skill-no-repeated-heading",
    applies: ["skill"],
    severity: "minor",
    summary:
      "A skill repeats a heading. The same section said twice is the redundancy that makes a long " +
      "skill long, and it leaves an agent no way to tell which copy governs.",
  },
  {
    id: "skill-has-entry-point",
    applies: ["graph"],
    severity: "minor",
    // Renamed from `skill-reachable`, which was the honest check under a name
    // that promised more than it delivered. "Reachable" reads as "something in
    // the knowledge graph points at it"; what it means is "there is SOME way in
    // at all", and the servable clause alone covers nearly the whole corpus —
    // so it passes near-trivially and a reader took its green for an answer to
    // the graph question. Measured 2026-09-18: 143 known skills, this criterion
    // 0 findings, while 96 of those 143 are carried by no role and named by no
    // activity. Both numbers are true; only one was visible.
    //
    // `skill-in-role-or-process` below is the other question, asked separately
    // instead of folded in here, because the answers differ by two orders of
    // magnitude and one check cannot report both.
    summary:
      "A skill exists on disk but there is no way in at all — `skill_fetch` cannot serve it, no package " +
      "manifest lists it, no role carries it, no activity names it. The union is deliberate and the " +
      "SERVING registry is its load-bearing member: a skill nothing can fetch is unreachable however many " +
      "manifests name it. It does NOT mean the process model reaches the skill — that is " +
      "`skill-in-role-or-process`, which is a much larger number and not a defect list.",
  },
  {
    id: "skill-in-role-or-process",
    applies: ["graph"],
    severity: "minor",
    // NEVER gate on this, and it is `minor` so that it cannot.
    //
    // A skill invoked directly by name — `corpus-grep`, `diff`, `kg-export`,
    // `mcp-contract`, the watcher family — is doing its job without appearing
    // in any diagram, and `skill_fetch` by name is a first-class entry point.
    // Requiring a role or an activity would report ~two thirds of the corpus as
    // orphaned, and a wall of false findings is how a check gets switched off.
    //
    // It is reported rather than enforced because the question is real and was
    // unanswerable without re-deriving it by hand: "what does the actor → role
    // → task model actually reach?" The count moving is the signal, not its
    // absolute value.
    summary:
      "COVERAGE, not a defect: no role carries this skill and no activity names it, so nothing in the " +
      "actor/role/process model reaches it. Legitimate for a skill invoked directly by name, which most " +
      "are. Expect this to be large and to stay large; watch it move, do not drive it to zero. Skills " +
      "declaring `consulted: true` are EXCLUDED — reference material belongs in no lane by its nature, " +
      "so counting it measured this criterion rather than the corpus (bean `y1w9`).",
  },
  {
    id: "consulted-skill-not-performed",
    applies: ["graph"],
    severity: "major",
    // The guard that makes `consulted: true` falsifiable, and the reason
    // the exemption above is safe to grant.
    //
    // A skill cannot be reference material AND a step somebody performs. If
    // a lane or a role claims one, either the annotation is wrong or the
    // binding is — and which it is takes a person, so this reports both
    // rather than choosing.
    //
    // `major` rather than `minor`, unlike the criterion it guards, because
    // the failure mode is different in kind. That one is coverage and
    // expected to be large; this is a CONTRADICTION between two
    // declarations, and there should never be any. Without it,
    // `consulted: true` would be an unfalsifiable opt-out — a worse field
    // than the one `qif9` removed, because that one at least did nothing.
    summary:
      "A skill declares `consulted: true` — reference material nobody performs — while a role carries it " +
      "or a BPMN activity names it. The two declarations contradict each other; a person decides which " +
      "is wrong. Guards the `consulted` exemption in `skill-in-role-or-process` from being an " +
      "unfalsifiable opt-out.",
  },
  {
    id: "manifest-skill-exists",
    applies: ["graph"],
    severity: "critical",
    summary:
      "A `package-manifest.json` entry names a skill the instance cannot resolve anywhere. Checked against " +
      "the INSTANCE, never against the package's own directory listing: three manifests here are bundle " +
      "definitions whose bodies live elsewhere, and measuring them against their own folder reported 19 " +
      "false dangling entries (bean `nup0`).",
  },
  {
    id: "remote-skill-is-servable",
    applies: ["graph"],
    // `major`, not `critical`: the reference is not broken, it points outside
    // this repository on purpose. What is missing is the JOIN — nothing fetches
    // the package, so a declared name has no body here. `critical` is reserved
    // for a reference that resolves nowhere at all.
    //
    // **It still gates**, via `scripts/tests/remote-skill-servable.test.ts`,
    // following the `activity-skill-coverage` precedent: switching CI to
    // `kg:audit:strict` would promote every `major` criterion at once, which is
    // a far larger commitment than the change that earned it.
    severity: "major",
    summary:
      "A file under `skills/remote-packages/` declares a skill this instance cannot serve. Both wrappers " +
      "carry `sync: { strategy: \"shallow-clone\", frequency: \"weekly\" }` and NOTHING performs it — " +
      "`skill_fetch` does not read the directory and the generated registry does not carry it — so five " +
      "names are published that a reader will try and cannot fetch (bean `wlqd`). The owner asked for this " +
      "to be a todo that FAILS rather than prose explaining itself, because the previous fix made the " +
      "documentation honest and left nothing that trips. Remedy: implement the sync (a platform capability " +
      "change, so a GitHub issue and the CRDM workflow first), or drop the declaration.",
  },
  {
    id: "actor-roles-resolve",
    applies: ["graph"],
    severity: "critical",
    summary:
      "An actor lists a role that is not declared — the reverse of role-has-actor, and the direction " +
      "nothing checked: a typo in an actor's `roles[]` is silently ignored rather than reported.",
  },
  {
    id: "actor-capabilities-resolve",
    applies: ["graph"],
    severity: "critical",
    summary:
      "An actor claims an environment capability the registry does not declare. `critical` since 2026-09: " +
      "it was `major` only while `capabilities[]` was overloaded, carrying permissions and skills that no " +
      "vocabulary could ever resolve. Bean `ind9` split the field, so every remaining entry is a genuine " +
      "probe and a dangling one is a real broken reference.",
  },
  {
    id: "actor-permissions-resolve",
    applies: ["graph"],
    severity: "critical",
    summary:
      "An actor claims a permission `skills/permissions/permissions.json` does not declare. A permission " +
      "cross-cuts roles and travels with the participant, so it cannot be checked against the role graph.",
  },
  {
    id: "actor-is-not-a-role",
    applies: ["graph"],
    severity: "minor",
    summary:
      "An entry in the actor registry carries `inherits` — it is modelling a role lattice, not an actor. Migration debt.",
  },
  {
    id: "satisfies-resolves",
    applies: ["graph"],
    severity: "critical",
    summary:
      "A skill's front matter or a capability names a requirement statement in `satisfies` that is not " +
      "declared, so the thing it claims to discharge cannot be opened.",
  },
  {
    id: "skill-graph-kinds-resolve",
    applies: ["graph"],
    severity: "major",
    summary:
      "A skill's front matter names, under `graph-kinds:`, a graph kind the registry does not declare — it " +
      "claims to say how to read a kind of graph that does not exist.",
  },
  {
    id: "skill-contract-resolves",
    applies: ["graph"],
    severity: "critical",
    summary:
      "A skill's front matter names an `input:` or `output:` contract that is malformed or not in the " +
      "instance, so what the skill is specified to take or produce cannot be opened.",
  },
  {
    id: "skill-contract-claimed",
    applies: ["graph"],
    severity: "minor",
    summary:
      "A contract under `schemas/skills/` that no skill names as its `input:` or `output:` — specified " +
      "for nobody. The skill points at its contract, so this is visible only from the contract's side.",
  },
  {
    id: "test-run-skill-resolves",
    applies: ["graph"],
    severity: "critical",
    summary:
      "A recorded test run does not parse, or names a skill that does not exist — a result attributed to " +
      "nothing. The run points at the skill it tests; the skill names no test.",
  },
  {
    id: "test-run-conforms",
    applies: ["graph"],
    severity: "major",
    summary:
      "A recorded test run's cases violate the input or output contract of the skill it names, so it " +
      "measured something other than that skill as specified.",
  },
  {
    id: "test-run-checkable",
    applies: ["graph"],
    severity: "minor",
    summary:
      "A recorded test run that cannot be checked against its skill's contract: the skill declares none, " +
      "the contract is external, or the run records only aggregates. Could-not-check, never a pass.",
  },
  {
    id: "arrow-direction",
    applies: ["graph"],
    severity: "major",
    summary:
      "A general node names one of its dependents: a `@general` schema `@ref`s a declaration that is not " +
      "general, or a BPMN process points at something that implements or documents it. The dependent " +
      "should hold the pointer (data-modelling step 8).",
  },
  {
    id: "story-role-resolves",
    applies: ["graph"],
    severity: "major",
    summary:
      "A user story in `scenarios/stories.json` is told as a role the role graph does not declare — a story " +
      "told as nobody, which no author can write for and no reviewer can check against.",
  },
] as const;

export const KG_CRITERIA_BY_ID: Readonly<Record<string, KgCriterionDefinition>> = Object.fromEntries(
  KG_CRITERIA.map((c) => [c.id, c]),
);

/** One thing wrong, named specifically enough to fix without re-running. */
export interface KgFinding {
  /** The node inside the subject — a BPMN element id, a lane name, a skill. */
  where: string;
  /** What is wrong, in one sentence, naming both ends of the broken join. */
  detail: string;
}

export interface KgCriterionEntry {
  result: KgResult;
  /** Empty on `pass`; on `unknown` it carries why it could not be evaluated. */
  findings: KgFinding[];
}

/** The audited node. */
export interface KgSubject {
  kind: KgSubjectKind;
  /** Stable id — the BPMN process id, the role id, `kg` for the roll-up. */
  id: string;
  /** Repo-relative path, or `null` for the roll-up, which has no one file. */
  path: string | null;
}

/** What produced the sidecar — the same provenance block the block sweep keeps. */
export interface KgAuditor {
  script: string;
  script_hash: string;
  engine_version: string;
}

/**
 * The corpus-wide auditor record. See {@link KG_QA_MANIFEST_SCHEMA} for why
 * this is one file rather than a block in each sidecar.
 */
export interface KgQaManifest {
  $schema: typeof KG_QA_MANIFEST_SCHEMA;
  auditor: KgAuditor;
}

export interface KgQaReport {
  $schema: typeof KG_QA_SCHEMA;
  subject: KgSubject;
  /** sha256 of the audited file, or `null` for the roll-up. */
  source_hash: string | null;
  /** Criterion id → entry. Criteria not applying to this kind are omitted. */
  criteria: Record<string, KgCriterionEntry>;
  totals: Record<KgResult, number>;
  /**
   * Declared prose ↔ code pairs and the state each was last accepted in —
   * carried ACROSS runs, unlike everything above, because it is the baseline
   * `prose-reviewed-since-code-changed` compares against. Written by
   * `kg-audit` and by `pairs:attest`; see `scripts/prose-code-pairs.ts`.
   */
  pair_attestations?: KgPairAttestation[];
}

/** One declared pair's accepted state. Paths are repo-relative. */
export interface KgPairAttestation {
  kind: "implements" | "co-located";
  prose: string;
  code: string;
  prose_hash: string;
  code_hash: string;
  by: "baseline" | "agent" | "human";
  reason?: string;
}

export const KgFindingSchema = z.object({
  where: z.string(),
  detail: z.string(),
});

export const KgCriterionEntrySchema = z.object({
  result: z.enum(KG_RESULTS),
  findings: z.array(KgFindingSchema).default([]),
});

export const KgQaReportSchema = z.object({
  $schema: z.literal(KG_QA_SCHEMA),
  subject: z.object({
    kind: z.enum(KG_SUBJECT_KINDS),
    id: z.string().min(1),
    path: z.string().nullable(),
  }),
  source_hash: z.string().nullable(),
  criteria: z.record(z.string(), KgCriterionEntrySchema),
  totals: z.record(z.enum(KG_RESULTS), z.number()),
  pair_attestations: z
    .array(
      z.object({
        kind: z.enum(["implements", "co-located"]),
        prose: z.string().min(1),
        code: z.string().min(1),
        prose_hash: z.string().min(1),
        code_hash: z.string().min(1),
        by: z.enum(["baseline", "agent", "human"]),
        reason: z.string().min(1).optional(),
      }),
    )
    .optional(),
});

export const KgQaManifestSchema = z.object({
  $schema: z.literal(KG_QA_MANIFEST_SCHEMA),
  auditor: z.object({
    script: z.string(),
    script_hash: z.string(),
    engine_version: z.string(),
  }),
});

/** Criteria applying to a subject kind, in registry order. */
export function criteriaFor(kind: KgSubjectKind): KgCriterionDefinition[] {
  return KG_CRITERIA.filter((c) => c.applies.includes(kind));
}

/**
 * Count outcomes. Written as a function rather than inline at each call site so
 * that a totals block can never disagree with the criteria block above it.
 */
export function tally(criteria: Record<string, KgCriterionEntry>): Record<KgResult, number> {
  const t: Record<KgResult, number> = { pass: 0, fail: 0, "n/a": 0, unknown: 0 };
  for (const e of Object.values(criteria)) t[e.result] += 1;
  return t;
}

/**
 * The worst severity among a report's failures — what a gate reads.
 *
 * **`unknown` counts, at the criterion's own severity.** A criterion that could
 * not be evaluated is a hole in the audit, not an absence of a problem, so it
 * is never quietly dropped. But it is not *promoted* either: promoting every
 * unknown to `major` would make an unevaluable `minor` criterion gate the
 * build, and a gate that fires on things nobody agreed were blocking is a gate
 * that gets switched off. A diagram that will not load records `unknown`
 * against its `critical` criteria too, so it still fails — which is the case
 * the promotion was reaching for.
 */
export function worstSeverity(report: KgQaReport): KgSeverity | undefined {
  let worst: KgSeverity | undefined;
  const rank: Record<KgSeverity, number> = { minor: 1, major: 2, critical: 3 };
  for (const [id, entry] of Object.entries(report.criteria)) {
    if (entry.result !== "fail" && entry.result !== "unknown") continue;
    const def = KG_CRITERIA_BY_ID[id];
    if (!def) continue;
    if (!worst || rank[def.severity] > rank[worst]) worst = def.severity;
  }
  return worst;
}
