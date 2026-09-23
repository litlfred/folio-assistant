#!/usr/bin/env bun
/**
 * The swimlane glossary — the personas a corpus's diagrams put in lanes, as SKOS.
 *
 * @module scripts/glossary-export
 *
 * Issue #596, bean `lqo9` slice 2. The owner named the source in their own
 * words: *"a bpmn diagram swimlane has title/description"*, and *"name,
 * documentation → glossary"*. Bean `sqtq` (PR #782) wrote the 157
 * `<bpmn:documentation>` elements that make that input exist, and
 * `check:lane-documentation` keeps it that way. This is what reads them.
 *
 * ## The owner's ruling, and what it settled
 *
 * 2026-09-21: **a separate glossary document, in the same instance
 * namespace.** Not folded into `ns-export`'s vocabulary document, because a
 * persona like `Board renderer` is a `skos:Concept` and *not* an
 * `rdfs:Class` — one document answering both "what can the code mint" and
 * "what does this word mean to a reader" would falsify its own docstring.
 * The stated cost was a second generator and a second staleness check. This
 * is the second generator; `--check` is the second staleness check.
 *
 * ## A concept is a ROLE, not a lane — and that is a correction
 *
 * The bean recorded a mapping of `prefLabel` ← the lane's `name`. Measuring
 * the corpus before writing showed that is wrong, and wrong in the direction
 * that matters:
 *
 * | measured 2026-09-21 | |
 * |---|---|
 * | task-containing lanes | 157 |
 * | distinct lane names | 85 |
 * | distinct roles those names resolve to | 36 |
 * | roles reached by MORE THAN ONE distinct lane name | 17 |
 *
 * `build-pipeline` is named ten different ways across the corpus — *"CI/CD
 * Pipeline"*, *"Build pipeline — validate · render · publish"*, *"Scheduled
 * log sweep"*, *"Graph audit (system)"* and six more. `reviewer` is named
 * nine. A concept per lane name would have minted 85 terms for 36 meanings
 * and copied `build-pipeline`'s definition onto ten of them — the exact
 * duplication of `roles.json` the bean set out to avoid, avoided per lane
 * OCCURRENCE (157 → 85) and not per lane NAME.
 *
 * So one concept per declared role, and the ten names become `skos:altLabel`
 * — which is what `altLabel` is for, and what makes *"Reviewer / SME"*
 * findable as the same term as *"Reviewer"* instead of a rival entry.
 *
 * **Both of the owner's halves still reach the glossary.** `name` arrives as
 * `prefLabel`/`altLabel`; `documentation` arrives as `skos:scopeNote`.
 *
 * ## `scopeNote` sits on the USAGE, and never on the concept
 *
 * Measured: of the 26 lane names appearing in more than one diagram, **26 of
 * 26 carry different `<bpmn:documentation>` per occurrence** — zero
 * counter-examples. That is the text doing its job: a scope note answers
 * *"what is this lane accountable for IN THIS PROCESS"*, which is a fact
 * about the appearance, not about the term.
 *
 * Hanging all ten of `build-pipeline`'s notes off the concept would assert
 * ten unattributed and apparently contradictory things about one word. So
 * each appearance is its own `LaneUsage` node carrying the process it is in,
 * the label the lane used there, and the note verbatim.
 *
 * **Verbatim matters and is not a style preference.** The lane documentation
 * is extracted to `.pot` as its own msgid, so a note stored exactly as the
 * diagram wrote it has a translation waiting for it in all five locales.
 * Wrapping it — `In "<process>": <note>` — would have read well in English
 * and produced a string no catalogue contains, breaking bean `jmpb` (the
 * per-locale rendering) before it is built.
 *
 * ## No second name for one thing
 *
 * A concept's `@id` is the IRI `kg-export` ALREADY mints for that role —
 * `makeIri(docIri, "role", id)`, imported rather than re-spelled. `kg-export`
 * has emitted registry-derived `Role` nodes since 2026-09-19. Minting a
 * parallel `cat:reviewer` here would be two names for one resource, which is
 * the drift this repository keeps paying for; and the glossary would then be
 * unjoinable with the graph that carries `performedBy` links to exactly those
 * IRIs.
 *
 * Checked rather than assumed: **0 of 47 role ids collide with any of the 111
 * vocabulary term names**, exactly and case/hyphen-insensitively.
 *
 * ## `laneBinding`, so a definition-less term can be TRUE rather than missing
 *
 * Bean `ug4r` (PR #800) gives five answers where `roleForLane` gave two. The
 * one lane in the corpus whose performer varies by design —
 * `bootstrap/workflows/log-message.bpmn`'s `Actor`, whose performer is
 * whoever called the sub-process — emits a concept with a scope note and **no
 * definition**, which is true, instead of being indistinguishable from a lane
 * nobody got round to binding. Without that distinction the extractor would
 * have had to guess, and a guessed definition-less term reads as a defect.
 *
 * ## Retirement needs a LEDGER, because a derived document has no memory
 *
 * The ruling: a term whose defining lane is gone becomes `deprecated`,
 * **reported and never deleted** — `deletion-requires-confirmation`, and the
 * same reason a scrapped bean is not a deleted one: retirement and accident
 * must not look alike.
 *
 * A regenerated document cannot do that. Delete a role from `roles.json` and
 * its concept simply stops appearing, which is what "never existed" also
 * looks like. So the small non-derivable fact — *this term was once minted* —
 * is committed, and the document is rebuilt from the corpus UNION the ledger.
 *
 * The ledger keys on the IRI's local part (`role/<id>`), never the absolute
 * IRI: the publication base is a deploy-time variable (`--base-url`,
 * `KG_BASE_URL`), so a committed absolute IRI would rot the day the base
 * moves and take every retirement record with it.
 *
 * **Usages are not ledgered, and that is deliberate.** A usage is an
 * occurrence, regenerated wholesale; a concept is a TERM somebody may have
 * cited. `deletion-requires-confirmation` is about the durable artefact, and
 * ledgering 157 occurrences would bury the 36 records that matter.
 *
 * Usage:
 *   bun run cat-harness/scripts/glossary-export.ts [--instance ROOT] [--out FILE]
 *   bun run cat-harness/scripts/glossary-export.ts --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { NS_PREFIXES, termIri } from "../schemas/namespaces.js";
import { laneBinding, readRoleGraph, type LaneBinding, type RoleDef, type RoleGraph } from "../schemas/role-graph.js";
import { repoRootFor } from "../schemas/cat-harness.js";
import { kgRoots } from "./known-skills.js";
import { exportIdentity, makeIri } from "./kg-export.js";
import { codeListDirs, loadCodeLists } from "../schemas/code-list.js";
import { buildCodeListsDoc } from "./code-lists.js";

const ROOT = resolve(import.meta.dir, "..");
const SKOS = "http://www.w3.org/2004/02/skos/core#";
const DCTERMS = "http://purl.org/dc/terms/";
const OWL = "http://www.w3.org/2002/07/owl#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";

/** The committed directory, relative to an instance root. */
export const GLOSSARY_DIR = "glossary";
/** The ledger's filename — the one non-derivable fact this module stores. */
export const LEDGER_FILENAME = "glossary-ledger.json";
/** Tagged so the file declares what it is, per the directory conventions. */
export const LEDGER_SCHEMA = "folio-glossary-ledger/v1";

// ── The corpus ──────────────────────────────────────────────────

/** Activity elements — the same list `check-lane-documentation` scopes by. */
const ACTIVITY =
  "task|userTask|serviceTask|scriptTask|manualTask|sendTask|receiveTask|businessRuleTask|callActivity|subProcess";

/** One swimlane, in one process, in one diagram. */
export interface LaneOccurrence {
  /** Repo-relative diagram path — provenance a reader can open. */
  readonly file: string;
  /** The BPMN process the lane's laneSet belongs to. */
  readonly processId: string;
  readonly processName: string | null;
  readonly laneId: string;
  readonly laneName: string | null;
  /** `<bpmn:documentation>`, verbatim — see the header on why verbatim. */
  readonly documentation: string | null;
  readonly roleRef?: string;
  readonly performerVaries: boolean;
  /** Activities in the lane. Zero means it is not a swimlane in this sense. */
  readonly activities: number;
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
 * Read every lane in an instance's diagrams, scoped to its own process.
 *
 * Regex rather than a parse, matching `check-lane-documentation`,
 * `check-workflow-refs` and `translate-bpmn` beside it — one generator and
 * one set of agents write this corpus, and a parser dependency for four
 * element names is a cost with no finding behind it.
 *
 * **Lanes are read INSIDE their `<bpmn:process>`** rather than from the file,
 * which the sibling checks do not need and this does: a usage node names the
 * process it is in, and a collaboration diagram holds several. Reading lanes
 * flat would attribute every lane to whichever process matched first.
 */
export function readLanes(instanceRoot: string, repoRoot: string): LaneOccurrence[] {
  const out: LaneOccurrence[] = [];
  for (const f of bpmnFiles(instanceRoot)) {
    const rel = relative(repoRoot, f);
    const xml = readFileSync(f, "utf-8");
    const procRe = /<(?:bpmn:)?process\b([^>]*)>([\s\S]*?)<\/(?:bpmn:)?process>/g;
    for (let p = procRe.exec(xml); p !== null; p = procRe.exec(xml)) {
      const pAttrs = p[1] ?? "";
      const pBody = p[2] ?? "";
      const processId = /id="([^"]+)"/.exec(pAttrs)?.[1];
      if (processId === undefined) continue;
      const processName = /name="([^"]+)"/.exec(pAttrs)?.[1] ?? null;

      const acts = new Set<string>();
      const actRe = new RegExp(`<(?:bpmn:)?(?:${ACTIVITY})\\b[^>]*id="([^"]+)"`, "g");
      for (let a = actRe.exec(pBody); a !== null; a = actRe.exec(pBody)) acts.add(a[1]!);

      const laneRe = /<(?:bpmn:)?lane\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:bpmn:)?lane>)/g;
      for (let m = laneRe.exec(pBody); m !== null; m = laneRe.exec(pBody)) {
        const attrs = m[1] ?? "";
        const body = m[2] ?? "";
        const laneId = /id="([^"]+)"/.exec(attrs)?.[1];
        if (laneId === undefined) continue;
        const members = new Set<string>();
        const refRe = /<(?:bpmn:)?flowNodeRef>([^<]+)<\/(?:bpmn:)?flowNodeRef>/g;
        for (let r = refRe.exec(body); r !== null; r = refRe.exec(body)) members.add(r[1]!.trim());
        // An EMPTY `<documentation/>` is not documentation — the same guard
        // `check-lane-documentation` applies, and for the same reason: a gate
        // satisfiable by a keystroke stops meaning anything.
        const doc = /<(?:bpmn:)?documentation[^>]*>([\s\S]*?)<\/(?:bpmn:)?documentation>/.exec(body)?.[1]?.trim();
        out.push({
          file: rel,
          processId,
          processName,
          laneId,
          laneName: /name="([^"]+)"/.exec(attrs)?.[1] ?? null,
          documentation: doc !== undefined && doc.length > 0 ? doc : null,
          roleRef: /<folio:role[^>]*\bref="([^"]+)"/.exec(body)?.[1],
          performerVaries: /<folio:role[^>]*\bvariable="true"/.test(body),
          activities: [...members].filter((x) => acts.has(x)).length,
        });
      }
    }
  }
  return out;
}

// ── The ledger ──────────────────────────────────────────────────

export interface LedgerEntry {
  /** The label at the time of minting — what a retired concept is shown as. */
  readonly prefLabel: string;
  /** ISO date this key was first written. */
  readonly firstSeen: string;
  /** ISO date it stopped being derivable, or `null` while it still is. */
  readonly retiredOn: string | null;
}

export interface Ledger {
  readonly $schema: string;
  /** Which instance's glossary this is — the stub, never a path. */
  readonly instance: string;
  /** Keyed by the IRI's LOCAL PART, never the absolute IRI. See the header. */
  readonly concepts: Record<string, LedgerEntry>;
}

export function ledgerPath(instanceRoot: string): string {
  return join(instanceRoot, GLOSSARY_DIR, LEDGER_FILENAME);
}

export function readLedger(instanceRoot: string, stub: string): Ledger {
  const p = ledgerPath(instanceRoot);
  if (!existsSync(p)) return { $schema: LEDGER_SCHEMA, instance: stub, concepts: {} };
  const raw = JSON.parse(readFileSync(p, "utf-8")) as Ledger;
  // A ledger that is not one is REFUSED rather than replaced. Overwriting it
  // would delete every retirement record in the file — the one thing this
  // module exists to keep — on the strength of a parse this code got wrong.
  if (raw.$schema !== LEDGER_SCHEMA) {
    throw new Error(`${p}: expected "$schema": "${LEDGER_SCHEMA}", found ${JSON.stringify(raw.$schema)}`);
  }
  return raw;
}

// ── The document ────────────────────────────────────────────────

export interface GlossaryReport {
  /** Concepts emitted, live and retired together. */
  readonly concepts: number;
  /** ...of those, deprecated. */
  readonly retired: string[];
  /** Newly retired by THIS run — the finding a reader acts on. */
  readonly newlyRetired: string[];
  /** Retired keys that became derivable again, so the flag was cleared. */
  readonly restored: string[];
  /** Lane occurrences that became usage nodes. */
  readonly usages: number;
  /** Declared roles no task-containing lane in this instance draws. */
  readonly undrawn: string[];
  /** ...of those, whose `lanes[]` names a lane no diagram contains at all. */
  readonly danglingLaneBindings: { role: string; lane: string }[];
  /** Lanes whose binding is dangling or contradictory — reported, not gated. */
  readonly problems: string[];
  /** True when the ledger on disk differs from the one this run computed. */
  readonly ledgerStale: boolean;
}

export interface GlossaryBuild {
  readonly doc: Record<string, unknown>;
  readonly ledger: Ledger;
  readonly report: GlossaryReport;
}

/** Today, as an ISO date — injectable so a test is not a clock. */
export type Today = () => string;
const isoToday: Today = () => new Date().toISOString().slice(0, 10);

/**
 * The glossary document's own IRI, derived from the graph document's PATH.
 *
 * `docPath` rather than `<stub>.jsonld` recomposed from the stub: the host
 * instance publishes at `<stub>.jsonld` and a foreign one at
 * `<stub>/<stub>.jsonld` (bean `dyd3`), and a caller that rebuilds the path
 * gets the host's answer for every instance.
 */
export function glossaryIri(base: string, docPath: string): string {
  return `${base.replace(/\/$/, "")}/${docPath.replace(/\.jsonld$/, "-glossary.jsonld")}`;
}

/**
 * Build the glossary for one instance.
 *
 * `laneBinding` is asked once per occurrence and its answer is the only route
 * from a lane to a concept, so a `variable` lane cannot accidentally be read
 * as `unbound` — the distinction bean `ug4r` exists to preserve.
 */
export function buildGlossary(opts: {
  instanceRoot?: string;
  baseUrl?: string;
  today?: Today;
} = {}): GlossaryBuild {
  const instanceRoot = resolve(opts.instanceRoot ?? ROOT);
  const repoRoot = repoRootFor(ROOT);
  const id = exportIdentity({ baseUrl: opts.baseUrl, instanceRoot: opts.instanceRoot });
  const now = (opts.today ?? isoToday)();

  // EVERY declared `kg` root of this instance, not the literal `skills/`.
  // `kgRoots` is explicit that taking the first is `dh4f` arriving through the
  // helper written to prevent it — and bootstrap's roles live under its own.
  const graphs: RoleGraph[] = [];
  for (const kgRoot of kgRoots(instanceRoot)) {
    const g = readRoleGraph(kgRoot);
    if (g) graphs.push(g);
  }
  const roles: RoleDef[] = [];
  const byId = new Map<string, RoleDef>();
  for (const g of graphs) {
    for (const r of g.roles) {
      if (byId.has(r.id)) continue;
      byId.set(r.id, r);
      roles.push(r);
    }
  }
  const merged: RoleGraph | undefined = graphs.length > 0 ? { name: id.stub, roles } : undefined;

  const lanes = readLanes(instanceRoot, repoRoot);
  const swimlanes = lanes.filter((l) => l.activities > 0);

  // role id -> occurrences; plus the lanes that resolve to no role.
  const occurrences = new Map<string, LaneOccurrence[]>();
  const varying: LaneOccurrence[] = [];
  const problems: string[] = [];
  // ONE problem, not one per lane. Bean `7go7`: `laneBinding` used to take an
  // undefined graph and answer `dangling` for every lane carrying a ref, so an
  // instance with swimlanes and no role registry failed this gate with N false
  // symptoms instead of its one real cause — and `problems` is fatal here
  // (`exit(1)`), so that wall was a red gate, not a report. The graph is now a
  // required parameter and the question is not asked.
  if (merged === undefined && swimlanes.length > 0) {
    problems.push(
      `${id.stub}: ${swimlanes.length} swimlane(s) but no role graph declared, so no lane's binding can be judged`,
    );
  }
  for (const l of swimlanes) {
    // `break` rather than a cast: it narrows `merged` for the rest of the body.
    if (merged === undefined) break;
    const b: LaneBinding = laneBinding(merged, {
      name: l.laneName ?? undefined,
      roleRef: l.roleRef,
      performerVaries: l.performerVaries,
    });
    switch (b.kind) {
      case "bound": {
        const list = occurrences.get(b.role.id) ?? [];
        list.push(l);
        occurrences.set(b.role.id, list);
        break;
      }
      case "variable":
        varying.push(l);
        break;
      case "dangling":
        problems.push(`${l.file}#${l.laneId}: <folio:role ref="${b.ref}"/> names no declared role`);
        break;
      case "contradictory":
        problems.push(`${l.file}#${l.laneId}: declares both ref="${b.ref}" and variable="true"`);
        break;
      case "unbound":
        problems.push(`${l.file}#${l.laneId}: lane ${JSON.stringify(l.laneName ?? "")} binds no role`);
        break;
    }
  }

  const nodes: Record<string, unknown>[] = [];
  const schemeIri = glossaryIri(id.base, id.docPath);
  const live = new Map<string, string>(); // local part -> prefLabel

  // ONE token for the kind, with the structure in the id — the shape
  // `makeIri(doc, "process", `${m.id}/node/${n.id}`)` already uses. A
  // `"glossary/usage"` kind also reads as a directory path to
  // `check:declared-paths`, which flagged it: a literal that looks like a path
  // and names nothing that resolves is exactly what that gate is for.
  const usageIri = (l: LaneOccurrence): string =>
    makeIri(id.docIri, "glossary-usage", `${l.processId}/${l.laneId}`);

  const emitUsages = (conceptIri: string, ls: readonly LaneOccurrence[]): number => {
    let n = 0;
    for (const l of ls) {
      nodes.push({
        "@id": usageIri(l),
        "@type": termIri("LaneUsage"),
        ofConcept: conceptIri,
        inProcess: makeIri(id.docIri, "process", l.processId),
        // The lane's OWN label here, which is the half that varies per
        // diagram. `rdfs:label` rather than `skos:prefLabel`: a usage is not
        // a concept, and the preferred label of the TERM is on the concept.
        // Omitted rather than `null` when the lane is unnamed: in JSON-LD a
        // null VALUE means "remove this", so emitting one says something
        // about the property instead of declining to.
        ...(l.laneName === null ? {} : { label: l.laneName }),
        // Verbatim. See the header: a wrapped note has no msgid.
        ...(l.documentation === null ? {} : { scopeNote: l.documentation }),
        source: l.file,
      });
      n += 1;
    }
    return n;
  };

  let usages = 0;
  for (const r of roles) {
    const ls = occurrences.get(r.id) ?? [];
    const localPart = `role/${r.id}`;
    const iri = makeIri(id.docIri, "role", r.id);
    // A declared role with no lane in THIS instance is still a declared term
    // — omitting it would be `dh4f`, a glossary silently short of the
    // vocabulary it claims to index. It is reported in `undrawn` instead.
    const altLabels = [...new Set(ls.map((l) => l.laneName).filter((n): n is string => typeof n === "string" && n !== r.title))].sort();
    live.set(localPart, r.title);
    nodes.push({
      "@id": iri,
      "@type": "skos:Concept",
      prefLabel: r.title,
      ...(r.description ? { definition: r.description } : {}),
      ...(altLabels.length > 0 ? { altLabel: altLabels } : {}),
      notation: r.id,
      inScheme: schemeIri,
      // `actedUpon` is not decoration: `Work plan — beans`, `Corpus` and
      // `Publish — GitHub Pages` are lanes because tasks act ON them, not
      // because anybody performs them (`audienceProblem` in `role-graph.ts`).
      // A reader looking up "Corpus" must not be told it is a persona.
      ...(r.actedUpon ? { actedUpon: true } : {}),
      ...(ls.length > 0 ? { usage: ls.map(usageIri) } : {}),
    });
    usages += emitUsages(iri, ls);
  }

  // The lanes whose performer VARIES: a concept with a scope note and no
  // definition, which is TRUE. Keyed by lane name because there is no role to
  // key by — that is the whole content of the `variable` answer.
  const varyingByName = new Map<string, LaneOccurrence[]>();
  for (const l of varying) {
    const k = l.laneName ?? l.laneId;
    varyingByName.set(k, [...(varyingByName.get(k) ?? []), l]);
  }
  for (const [name, ls] of [...varyingByName].sort(([a], [b]) => a.localeCompare(b))) {
    const localPart = `lane/${name}`;
    const iri = makeIri(id.docIri, "lane", name);
    live.set(localPart, name);
    nodes.push({
      "@id": iri,
      "@type": "skos:Concept",
      prefLabel: name,
      // NO `definition`, and its absence is an assertion rather than a gap —
      // `performerVaries` says the diagram declined to name a persona because
      // the performer is whoever called the sub-process.
      performerVaries: true,
      notation: name,
      inScheme: schemeIri,
      usage: ls.map(usageIri),
    });
    usages += emitUsages(iri, ls);
  }

  // ── Retirement ────────────────────────────────────────────────
  const prior = readLedger(instanceRoot, id.stub);
  const concepts: Record<string, LedgerEntry> = {};
  const retired: string[] = [];
  const newlyRetired: string[] = [];
  const restored: string[] = [];
  for (const [key, label] of [...live].sort(([a], [b]) => a.localeCompare(b))) {
    const was = prior.concepts[key];
    if (was === undefined) {
      concepts[key] = { prefLabel: label, firstSeen: now, retiredOn: null };
    } else {
      // A term that comes BACK is un-retired and said so. Leaving the flag on
      // would report a live term as gone for ever, which is the mirror of the
      // defect this ledger exists to prevent.
      if (was.retiredOn !== null) restored.push(key);
      concepts[key] = { prefLabel: label, firstSeen: was.firstSeen, retiredOn: null };
    }
  }
  for (const [key, was] of Object.entries(prior.concepts).sort(([a], [b]) => a.localeCompare(b))) {
    if (live.has(key)) continue;
    const retiredOn = was.retiredOn ?? now;
    if (was.retiredOn === null) newlyRetired.push(key);
    retired.push(key);
    concepts[key] = { ...was, retiredOn };
    const [kind, ...rest] = key.split("/");
    nodes.push({
      "@id": makeIri(id.docIri, kind!, rest.join("/")),
      "@type": "skos:Concept",
      prefLabel: was.prefLabel,
      notation: rest.join("/"),
      inScheme: schemeIri,
      // REPORTED, NEVER DELETED. `owl:deprecated` is the machine-readable
      // half; the change note is the half a person reads.
      deprecated: true,
      changeNote: `Retired ${retiredOn}: no swimlane in this instance derives this term.`,
    });
  }

  const ledger: Ledger = { $schema: LEDGER_SCHEMA, instance: id.stub, concepts };
  const ledgerStale = JSON.stringify(prior.concepts) !== JSON.stringify(concepts) || prior.instance !== id.stub;

  // Declared but undrawn, split by CAUSE — the two need different fixes.
  const drawnNames = new Set(swimlanes.map((l) => l.laneName).filter((n): n is string => n !== null));
  const allLaneNames = new Set(lanes.map((l) => l.laneName).filter((n): n is string => n !== null));
  const undrawn: string[] = [];
  const danglingLaneBindings: { role: string; lane: string }[] = [];
  for (const r of roles) {
    if (occurrences.has(r.id)) continue;
    undrawn.push(r.id);
    for (const l of r.lanes ?? []) {
      // A role naming a lane that appears in NO diagram is `fd6i` — declared
      // and never used. A role whose lane exists but holds no task is not:
      // `check-lane-documentation` scopes to task-containing lanes for the
      // same reason, and an `actedUpon` lane holds none BY CONSTRUCTION.
      if (!drawnNames.has(l) && !allLaneNames.has(l)) danglingLaneBindings.push({ role: r.id, lane: l });
    }
  }

  const doc = {
    "@context": {
      skos: SKOS,
      dcterms: DCTERMS,
      owl: OWL,
      rdfs: RDFS,
      ...NS_PREFIXES,
      label: "rdfs:label",
      prefLabel: "skos:prefLabel",
      altLabel: "skos:altLabel",
      definition: "skos:definition",
      scopeNote: "skos:scopeNote",
      changeNote: "skos:changeNote",
      notation: "skos:notation",
      title: "dcterms:title",
      source: "dcterms:source",
      deprecated: "owl:deprecated",
      inScheme: { "@id": "skos:inScheme", "@type": "@id" },
      usage: { "@id": termIri("hasLaneUsage"), "@type": "@id" },
      ofConcept: { "@id": termIri("ofConcept"), "@type": "@id" },
      inProcess: { "@id": termIri("inProcess"), "@type": "@id" },
      actedUpon: termIri("actedUpon"),
      performerVaries: termIri("performerVaries"),
    },
    "@id": schemeIri,
    // The DOCUMENT is the scheme — the same decision `ns-export` makes in
    // `--exact` mode, and for the same reason: a separate `…#scheme` IRI
    // would name a set that already has a name and would not dereference
    // (`blv9`).
    "@type": "skos:ConceptScheme",
    prefLabel: `${id.stub} swimlane glossary`,
    title: `${id.stub} swimlane glossary`,
    definition:
      "Every persona this instance's BPMN diagrams place in a swimlane, one concept each. " +
      "Labels come from the lanes, definitions from the role registry, and scope notes " +
      "from each lane's own <bpmn:documentation>. Generated by scripts/glossary-export.ts.",
    "@graph": nodes,
  };

  return {
    doc,
    ledger,
    report: {
      concepts: live.size + retired.length,
      retired,
      newlyRetired,
      restored,
      usages,
      undrawn,
      danglingLaneBindings,
      problems,
      ledgerStale,
    },
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  const check = argv.includes("--check");
  const instanceRoot = arg("--instance");
  const baseUrl = arg("--base-url") ?? process.env.KG_BASE_URL;

  const { doc, ledger, report } = buildGlossary({ instanceRoot, baseUrl });
  const instanceDir = resolve(instanceRoot ?? ROOT);
  const out = arg("--out") ?? join(repoRootFor(ROOT), "_kg", `${ledger.instance}-glossary.jsonld`);

  console.log(`${ledger.instance} swimlane glossary`);
  console.log(`  ${report.concepts} concept(s), ${report.usages} lane usage(s)`);
  if (report.restored.length > 0) console.log(`  ${report.restored.length} restored: ${report.restored.join(", ")}`);
  if (report.retired.length > 0) console.log(`  ${report.retired.length} retired (kept, never deleted)`);
  for (const k of report.newlyRetired) console.log(`    NEWLY RETIRED: ${k}`);
  if (report.undrawn.length > 0) {
    console.log(`  ${report.undrawn.length} declared role(s) no swimlane draws: ${report.undrawn.join(", ")}`);
  }
  for (const d of report.danglingLaneBindings) {
    console.log(`    DANGLING: role "${d.role}" binds lane ${JSON.stringify(d.lane)}, which no diagram contains`);
  }
  for (const p of report.problems) console.log(`  PROBLEM: ${p}`);

  // An EMPTY corpus is `6tkl`: every assertion below is vacuously satisfied
  // over nothing, and a glossary of no terms would report a clean run.
  if (report.concepts === 0) {
    console.error(`\nNo concepts derived from ${relative(repoRootFor(ROOT), instanceDir)} — refusing to call that clean.`);
    process.exit(2);
  }

  if (check) {
    if (report.ledgerStale) {
      console.error(`\n${relative(repoRootFor(ROOT), ledgerPath(instanceDir))} is stale — run the generator and commit it.`);
      process.exit(1);
    }
    console.log(`\nglossary ledger is current`);
    process.exit(report.problems.length === 0 ? 0 : 1);
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);

  // The instance's CODE LISTS, as SKOS, beside the glossary — the same run and
  // the same predicates (owner, 2026-09-23: use the existing SKOS tooling).
  // A separate document because this one IS the swimlane scheme; code lists
  // are schemes of their own. Written only when the instance can see a list.
  const lists = [...loadCodeLists(await codeListDirs(instanceDir)).values()];
  if (lists.length > 0) {
    // Named and addressed BESIDE the glossary — derived from its path and
    // `@id`, so wherever a workflow's `--out` puts one, the other follows.
    const sibling = (s: string) => s.replace(/-glossary\.jsonld$/, "-code-lists.jsonld");
    const clOut = out.endsWith("-glossary.jsonld") ? sibling(out) : join(dirname(out), `${ledger.instance}-code-lists.jsonld`);
    const clIri = sibling(doc["@id"] as string);
    writeFileSync(clOut, `${JSON.stringify(buildCodeListsDoc(lists, clIri), null, 2)}\n`);
    console.log(`  code lists → ${relative(repoRootFor(ROOT), clOut)} (${lists.length})`);
  }
  const lp = ledgerPath(instanceDir);
  mkdirSync(dirname(lp), { recursive: true });
  writeFileSync(lp, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`\n  document → ${relative(repoRootFor(ROOT), out)}`);
  console.log(`  ledger   → ${relative(repoRootFor(ROOT), lp)}`);
  console.log(`  @id      ${doc["@id"] as string}`);
}
