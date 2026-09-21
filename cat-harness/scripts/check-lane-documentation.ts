#!/usr/bin/env bun
/**
 * A task's containing swimlane must DEFINE itself — `name` is not a definition.
 *
 * @module scripts/check-lane-documentation
 *
 * ## Why this exists, and why it is a glossary problem
 *
 * The owner asked (issue #596) for a glossary built from terms extracted out of
 * KG assets, naming *"a bpmn diagram swimlane has title/description"* as a
 * source. Measured 2026-09-21 across the whole corpus: **61 diagrams, 164
 * lanes, ZERO carrying `<bpmn:documentation>`.** A lane has a `name` and
 * nothing else.
 *
 * Extracting on that basis would have produced 164 glossary entries with a
 * label and no definition — an index wearing a glossary's name. So the
 * documentation is a DEFECT TO FIX rather than a gap to report and live with,
 * and this check is what makes the fix measurable. `name` + `documentation`
 * together are what the glossary reads.
 *
 * ## The subject is the TASK's lane, not every lane
 *
 * A lane nothing happens in is a drawing decision. A lane that CONTAINS A TASK
 * is a swimlane in the sense `AGENTS.md` means — *"a persona an actor takes on
 * because of the lane it is acting in"* — so a reader meeting that task has to
 * know what the lane is, and the diagram is the only place that can say.
 *
 * Measured on the same corpus: 433 activities, 432 of them inside a lane.
 * Scoping to task-containing lanes takes the subject from 164 to **157** and
 * makes every finding one a reader would actually hit.
 *
 * ## The one task in no lane is UNDETERMINED, never a pass
 *
 * Exactly one activity sits outside any lane. It has no containing lane, so
 * the question this check asks cannot be answered about it — and "cannot be
 * answered" is not "fine". It is reported in its own family and counted, the
 * house rule every other check here follows (`ci-health`, `health`,
 * `kg:audit`): an unknown rendered as a pass is indistinguishable from a real
 * pass, while an unknown rendered as a finding costs somebody a minute.
 *
 ## THREE AXES, because a glossary term needs all three
 *
 * The owner, 2026-09-21: *"does a swimlane have name, have documentation? and
 * translations of course"*. Each is a separate family, because each fails
 * differently and only one of them is currently broken:
 *
 * | axis | measured 2026-09-21 | who can fix it |
 * |---|---|---|
 * | `name` — the term's LABEL | 162 of 162 have one | — |
 * | `documentation` — its DEFINITION | **0 of 157** | an author |
 * | extracted for translation | 137 of 137 names reach every `.pot` | — |
 *
 * **The translation axis asks about EXTRACTION, not about a translation
 * existing.** This repository ships catalogues whose `msgstr` is deliberately
 * empty, awaiting a person — a machine translation nobody here reads is an
 * artefact whose correctness cannot be checked here. Extraction is the
 * platform's job and can be gated; translating is a person's and can only be
 * reported. Demanding a non-empty `msgstr` would be a gate on somebody else's
 * unfinished work.
 *
 * It is measured anyway, and it is the axis that proves the other two matter:
 * `extractBpmn` already handles `<documentation>`, so every definition written
 * to fix the family above reaches all five locales' catalogues on the next
 * extract with nothing further to wire. The pipeline is not the gap. The
 * source text is.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-lane-documentation.ts
 *   bun run cat-harness/scripts/check-lane-documentation.ts --json
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { buildQaResult, writeQaResult } from "./qa-results.js";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const REPO = resolve(INSTANCE_ROOT, "..");

/**
 * `decodeLabel` and the extractor's own filter, DUPLICATED on purpose.
 *
 * The originals are `content/pipeline/bpmn-translate.ts`, which is
 * `folio-assist-core`; this module is `agentic-harness`, and
 * `check:partition` refuses the edge because core depends on the harness
 * rather than the other way round. That refusal is right — the alternative
 * to a duplicate here is a cycle between two layers.
 *
 * **An unchecked duplicate would be the worse bug**, because the question this
 * check asks is precisely "would the REAL extractor see this string": a copy
 * that drifts answers a question nobody asked and reports green while a
 * translator sees nothing. So `lane-extraction-parity.test.ts` asserts these
 * two produce the same msgid set as `extractBpmn` over every diagram in the
 * corpus, and fails the day either side moves.
 *
 * `AGENTS.md`: an unavoidable duplicate is fine while an unchecked one is not.
 */
function decodeLabel(raw: string): string {
  return raw
    .replace(/&#10;|&#xA;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const NAMED_COPY = new RegExp(
  "<(?:bpmn:)?(?:process|lane|task|serviceTask|userTask|manualTask|scriptTask|" +
    "sendTask|receiveTask|businessRuleTask|callActivity|subProcess|" +
    "startEvent|endEvent|intermediateCatchEvent|intermediateThrowEvent|boundaryEvent|" +
    "exclusiveGateway|parallelGateway|inclusiveGateway|eventBasedGateway|" +
    "sequenceFlow|participant|collaboration)\\b[^>]*?\\sname=\"([^\"]*)\"",
  "g",
);

const DOCUMENTATION_COPY = /<(?:bpmn:)?documentation>([\s\S]*?)<\/(?:bpmn:)?documentation>/g;

/** The extractor's own guard: empty is not a string, and a bare id is not prose. */
function isExtractable(msgid: string): boolean {
  if (!msgid) return false;
  return !(/^[A-Za-z_][A-Za-z0-9_]*$/.test(msgid) && /_/.test(msgid));
}

/** Activity elements whose containing lane a reader must be able to read. */
const ACTIVITY =
  "task|userTask|serviceTask|scriptTask|manualTask|sendTask|receiveTask|businessRuleTask|callActivity|subProcess";

export interface LaneFinding {
  /** Repo-relative diagram. */
  readonly file: string;
  /** The lane's id — stable across a rename, which is what a fix is tracked by. */
  readonly lane: string;
  /** The lane's `name`, which is the HALF that exists. */
  readonly name: string | null;
  /** How many activities sit in it — a lane with more is worth documenting first. */
  readonly activities: number;
}

/** An activity in no lane at all: the question cannot be asked about it. */
export interface OrphanActivity {
  readonly file: string;
  readonly activity: string;
}

export interface LaneReport {
  readonly diagrams: number;
  readonly activities: number;
  /** Lanes containing at least one activity — the subject set. */
  readonly lanes: number;
  /** ...of those, carrying `<bpmn:documentation>`. */
  readonly documented: number;
  /** ...of those, not. The finding. */
  readonly undocumented: LaneFinding[];
  /** ...of those, carrying no usable `name`. A term with no label. */
  readonly unnamed: LaneFinding[];
  /**
   * Lane strings absent from their diagram's translation template.
   *
   * EXTRACTION, not translation — see the header. A string nobody extracted
   * cannot be translated by anybody, which is a platform defect; an extracted
   * string with an empty `msgstr` is a person's outstanding work.
   */
  readonly unextracted: { file: string; lane: string; text: string; kind: "name" | "documentation" }[];
  /** Activities outside any lane. UNDETERMINED, never a pass. */
  readonly orphans: OrphanActivity[];
}

function bpmnFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".bpmn")) out.push(p);
    }
  };
  walk(root);
  return out.sort();
}

/**
 * Read every diagram and answer the lane question for each activity.
 *
 * Regex rather than an XML parse, matching `check-workflow-refs` and
 * `translate-bpmn` beside it: the corpus is this repository's own diagrams,
 * written by one generator and one set of agents, and adding a parser
 * dependency for three element names is a cost with no finding behind it.
 */
export function checkLanes(root = REPO): LaneReport {
  const files = bpmnFiles(root);
  let activities = 0;
  const documented: string[] = [];
  const undocumented: LaneFinding[] = [];
  const unnamed: LaneFinding[] = [];
  const unextracted: LaneReport["unextracted"][number][] = [];
  const orphans: OrphanActivity[] = [];

  /**
   * The msgids the EXTRACTOR produces for a diagram — not the bytes of a
   * `.pot`.
   *
   * This asked `pot.includes(text)` until 2026-09-21, and it was wrong in the
   * way a check must never be wrong: it reported 13 correctly-extracted lanes
   * as missing. gettext wraps a long msgid across several quoted lines and
   * escapes every `"` as `\"`, so a substring search for prose of any length,
   * or prose containing a quotation mark, cannot match a template that
   * contains it. A false finding is worse than no check — it fails CI on
   * work that is right, and the next agent learns to disbelieve the report.
   *
   * Asking `extractBpmn` instead answers the question this family actually
   * poses: would a translator ever SEE this string. That is independent of
   * how a `.pot` is formatted, and it stays out of `translate-bpmn --check`'s
   * territory, which owns whether the template on disk is current.
   */
  const msgidsFor = (xml: string, rel: string): Set<string> => {
    void rel;
    const out = new Set<string>();
    for (const m of xml.matchAll(DOCUMENTATION_COPY)) {
      const id = decodeLabel(m[1] ?? "");
      if (isExtractable(id)) out.add(id);
    }
    for (const m of xml.matchAll(NAMED_COPY)) {
      const id = decodeLabel(m[1] ?? "");
      if (isExtractable(id)) out.add(id);
    }
    return out;
  };

  for (const f of files) {
    const rel = relative(root, f);
    const s = readFileSync(f, "utf-8");
    const msgids = msgidsFor(s, rel);

    // lane id -> { name, hasDoc, members }
    const lanes = new Map<string, { name: string | null; hasDoc: boolean; doc: string | null; members: Set<string> }>();
    const laneRe = new RegExp(`<bpmn:lane\\b([^>]*?)(?:/>|>([\\s\\S]*?)</bpmn:lane>)`, "g");
    for (let m = laneRe.exec(s); m !== null; m = laneRe.exec(s)) {
      const attrs = m[1] ?? "";
      const body = m[2] ?? "";
      const id = /id="([^"]+)"/.exec(attrs)?.[1];
      if (id === undefined) continue;
      const members = new Set<string>();
      const refRe = /<bpmn:flowNodeRef>([^<]+)<\/bpmn:flowNodeRef>/g;
      for (let r = refRe.exec(body); r !== null; r = refRe.exec(body)) members.add(r[1]!.trim());
      lanes.set(id, {
        name: /name="([^"]+)"/.exec(attrs)?.[1] ?? null,
        // A `<documentation/>` with no text is NOT documentation. An empty
        // element would otherwise let this check be satisfied by a keystroke,
        // which is the shape of every gate that stops meaning anything.
        hasDoc: /<bpmn:documentation[^>]*>\s*\S[\s\S]*?<\/bpmn:documentation>/.test(body),
        doc: /<bpmn:documentation[^>]*>([\s\S]*?)<\/bpmn:documentation>/.exec(body)?.[1]?.trim() ?? null,
        members,
      });
    }

    const actRe = new RegExp(`<bpmn:(?:${ACTIVITY})\\b[^>]*id="([^"]+)"`, "g");
    for (let a = actRe.exec(s); a !== null; a = actRe.exec(s)) {
      activities += 1;
      const id = a[1]!;
      const owner = [...lanes.entries()].find(([, l]) => l.members.has(id));
      if (owner === undefined) {
        orphans.push({ file: rel, activity: id });
        continue;
      }
      const [lid, lane] = owner;
      const key = `${rel}#${lid}`;
      if (lane.hasDoc) {
        if (!documented.includes(key)) documented.push(key);
      } else if (!undocumented.some((u) => u.file === rel && u.lane === lid)) {
        undocumented.push({ file: rel, lane: lid, name: lane.name, activities: 0 });
      }

      // A lane with no usable `name` is a term with no LABEL — a separate
      // failure from having no definition, and reported separately so a fix
      // for one is not read as a fix for the other.
      const named = typeof lane.name === "string" && lane.name.trim().length > 0;
      if (!named && !unnamed.some((u) => u.file === rel && u.lane === lid)) {
        unnamed.push({ file: rel, lane: lid, name: lane.name, activities: 0 });
      }

      // EXTRACTION, not translation. A template that does not exist is not a
      // finding about this lane — `translate-bpmn --check` owns "a diagram was
      // never extracted", and reporting it here too would make one defect
      // look like two.
      const tpl = msgids;
      if (named && !tpl.has(decodeLabel(lane.name!))) {
        if (!unextracted.some((u) => u.file === rel && u.lane === lid && u.kind === "name")) {
          unextracted.push({ file: rel, lane: lid, text: lane.name!, kind: "name" });
        }
      }
      if (lane.hasDoc && lane.doc !== null && !tpl.has(decodeLabel(lane.doc))) {
        if (!unextracted.some((u) => u.file === rel && u.lane === lid && u.kind === "documentation")) {
          unextracted.push({ file: rel, lane: lid, text: lane.doc.slice(0, 60), kind: "documentation" });
        }
      }
    }

    // Count members per finding, so the fix can be ordered by reach.
    for (const u of undocumented.filter((x) => x.file === rel)) {
      const lane = lanes.get(u.lane);
      if (lane === undefined) continue;
      let n = 0;
      const actRe2 = new RegExp(`<bpmn:(?:${ACTIVITY})\\b[^>]*id="([^"]+)"`, "g");
      for (let a = actRe2.exec(s); a !== null; a = actRe2.exec(s)) {
        if (lane.members.has(a[1]!)) n += 1;
      }
      (u as { activities: number }).activities = n;
    }
  }

  return {
    diagrams: files.length,
    activities,
    lanes: documented.length + undocumented.length,
    documented: documented.length,
    undocumented: undocumented.sort((a, b) => b.activities - a.activities || a.file.localeCompare(b.file)),
    unnamed: unnamed.sort((a, b) => a.file.localeCompare(b.file)),
    unextracted: unextracted.sort((a, b) => a.file.localeCompare(b.file) || a.kind.localeCompare(b.kind)),
    orphans: orphans.sort((a, b) => a.file.localeCompare(b.file)),
  };
}

if (import.meta.main) {
  const r = checkLanes();

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`\nLane documentation — ${r.diagrams} diagram(s), ${r.activities} activit(ies)\n`);
    console.log(`  lanes containing an activity   ${r.lanes}`);
    console.log(`    with a name                  ${r.lanes - r.unnamed.length}`);
    console.log(`    UNNAMED                      ${r.unnamed.length}`);
    console.log(`    documented                   ${r.documented}`);
    console.log(`    UNDOCUMENTED                 ${r.undocumented.length}`);
    console.log(`    strings NOT extracted        ${r.unextracted.length}`);
    if (r.orphans.length > 0) console.log(`  activities in NO lane           ${r.orphans.length}  (undetermined)`);
  }

  // ZERO DIAGRAMS IS A FINDING. Every number above is a count over the corpus,
  // and a corpus of nothing makes each of them zero — which reads as a clean
  // run. `6tkl`, and the one failure this check must not have.
  if (r.diagrams === 0) {
    console.error("\n::error::check-lane-documentation: no .bpmn diagrams found — every count above is vacuous");
    process.exit(1);
  }

  writeQaResult(
    INSTANCE_ROOT,
    "lane-documentation",
    buildQaResult({
      script: "cat-harness/scripts/check-lane-documentation.ts",
      scriptAbsPath: resolve(import.meta.dir, "check-lane-documentation.ts"),
      subject: { kind: "corpus", id: "bpmn-lanes" },
      families: {
        "undocumented-lane": {
          summary:
            "A lane containing at least one activity, carrying a `name` but no `<bpmn:documentation>`. " +
            "A reader meeting the task cannot learn what the lane is, and the glossary has a label with no definition.",
          entries: r.undocumented,
        },
        "lane-without-name": {
          summary:
            "A lane containing an activity, with no usable `name`. The glossary term has no LABEL — a " +
            "separate failure from having no definition, so a fix for one is not read as a fix for the other.",
          entries: r.unnamed,
        },
        "lane-string-not-extracted": {
          summary:
            "A lane `name` or `<documentation>` the extractor does not produce a msgid for — so no translator " +
            "could ever see it, in any locale. This asks about EXTRACTION, never about a translation existing: " +
            "catalogues here ship with an empty `msgstr` awaiting a person, and gating on that would be a gate " +
            "on somebody else's unfinished work. It asks `extractBpmn` rather than searching a `.pot`'s bytes, " +
            "because gettext wraps a long msgid across quoted lines and escapes every `\"` — a substring search " +
            "reported 13 correctly-extracted lanes as missing on 2026-09-21, and a false finding is worse than " +
            "no check. WHETHER A TEMPLATE ON DISK CARRIES IT is a different question, owned by " +
            "`translate-bpmn --check`; for the three `bootstrap/` diagrams that check does not scan, it is " +
            "bean `j28g` and awaits a ruling.",
          entries: r.unextracted,
        },
        "activity-outside-any-lane": {
          summary:
            "An activity in no lane. The containing-lane question cannot be asked about it, so it is reported " +
            "as UNDETERMINED rather than counted as passing.",
          entries: r.orphans,
        },
      },
    }),
  );

  if (!process.argv.includes("--json")) {
    for (const u of r.undocumented.slice(0, 12)) {
      console.log(`  ✗ ${u.file}#${u.lane}  ${u.name ?? "(unnamed)"}  — ${u.activities} activit(ies)`);
    }
    if (r.undocumented.length > 12) console.log(`  … and ${r.undocumented.length - 12} more (see the QA result)`);
  }

  if (r.undocumented.length > 0 || r.unnamed.length > 0 || r.unextracted.length > 0 || r.orphans.length > 0) {
    process.exit(1);
  }
  console.log("\n✓ every task-containing lane has a name, a definition, and both are extractable");
  console.log("  (whether a template on disk is CURRENT is `translate-bpmn --check`'s question, not this one's)");
}
