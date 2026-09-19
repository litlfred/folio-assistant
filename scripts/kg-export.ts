#!/usr/bin/env bun
/**
 * Dump the instance's knowledge graph to one JSON file, for publication.
 *
 * `agentic-harness` has no renderer. `folio` is the only `renderable` graph
 * kind and it belongs to `folio-assist-core`, so the harness cannot put its own
 * knowledge graph on a page the way a folio puts a chapter on one. That is the
 * right boundary and this does not move it: the export is **data**, not a
 * rendered document. Something else may draw it.
 *
 * ## Why not `generate-registry.ts`
 *
 * That script exists and writes `.claude/skills/registry.json`. Measured on
 * `main` 2026-09-18: 69 KB, uncommitted, not gitignored, and published
 * nowhere — a build artifact with no consumer. It is also **partial in a way
 * the numbers hide**: `registry.skills` was 23 because it reads only
 * `.claude/skills/local/*.json`, while the tree holds 126 skill `.md` files.
 * Package skills appear in it as bare name lists inside `registry.packages`,
 * so the thing an agent actually reads — the instruction body's front matter —
 * is absent. BPMN processes, DMN tables, the graph-kind registry and the
 * directory declaration are absent entirely.
 *
 * This exports the graph; the registry stays what it is, a runtime manifest.
 *
 * ## The edges are the point
 *
 * A list of skills is not a graph. What makes this worth publishing is that
 * BPMN activities carry `<folio:skill ref="…"/>` and sit in a lane, so the
 * export can say **which process step is implemented by which skill, performed
 * by which role** — a relation that exists on disk today and that no tool
 * surfaces. `check:workflow-refs` already guarantees those refs resolve, so
 * this does not re-validate them.
 *
 * ## Three states
 *
 * A source that cannot be read is **reported in `problems[]` and counted**,
 * never silently dropped. An export that quietly omits half a corpus is worse
 * than no export: a consumer sees a well-formed graph and cannot tell it is
 * looking at part of one. Bean `dh4f` is the local precedent.
 *
 * @module scripts/kg-export
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { FOLIO_NS } from "../schemas/namespaces.js";
import { artefactStub, defaultGraphKinds, readDeclaration, renderingPath } from "../schemas/cat-harness.js";
import { skillMdDirs as knownSkillDirs } from "./known-skills.js";
import { auditSchemaNodes } from "./schema-nodes.js";
import "../schemas/folio-graph-kind.js"; // registers `folio` — see directory-conventions
import { tools } from "../tools/index.js";
import { skillIoIri } from "./harness-schema-export.js";
import { stagingFields } from "./staging-stamp.js";
import { buildQaResult, writeQaResult } from "./qa-results.js";
import { loadProcessModel } from "../src/workflow/process-model.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Directories holding a skill's **instruction body** (`<name>.md`), DISCOVERED
 * rather than listed.
 *
 * Three times now a hardcoded list has been the bug. First this module listed
 * six directories and missed `schemas/skills/`, reporting 11 BPMN refs as
 * dangling. Then, with that fixed, the same list still omitted
 * `skills/authoring-who-smart-guidelines/` and its siblings, so
 * `smart-base-tools` — a file that plainly exists — came out as a dangling
 * `declaresSkill` link. `knownSkills()` in `scripts/check-workflow-refs.ts`
 * carries a fourth, differently-wrong copy of the same list.
 *
 * A list of locations is a fact about the tree, and facts about the tree
 * belong to the tree. So: every subdirectory of `skills/` plus the two
 * out-of-tree homes. Adding a package now requires changing nothing here,
 * which is the only version of this that stops being wrong.
 */
/**
 * Every directory holding skill instruction bodies, from the ONE function that
 * decides — `scripts/known-skills.ts`.
 *
 * This had its own copy, and the copies disagreed in both directions. It
 * scanned every `skills/*` subdirectory (so it saw packages the hardcoded
 * `SKILL_MD_DIRS` missed) and hardcoded `.claude/skills/local` alone (so it
 * missed groups the deny-list there admits). Measured 2026-09-19 by creating
 * `.claude/skills/probegroup/probe-skill.md`: `knownSkills()` resolved it and
 * this export did not — a skill by the repository's own definition, absent
 * from the graph it publishes.
 *
 * Two readers with two copies of "where skills live" is the exact failure
 * `known-skills.ts` was extracted to prevent, restated one module along.
 */
function skillMdDirs(): string[] {
  return knownSkillDirs(ROOT).map((p) => p.join("/"));
}

/**
 * A directory per skill holding its **I/O contract** — `input.schema.json` and
 * `output.schema.json`.
 *
 * This is the other facet of a skill, not another kind of skill: a name may
 * have an instruction body, an I/O contract, or both. Keying the graph by name
 * rather than by file is what lets the two meet, and what makes "declared
 * somewhere, written nowhere" visible.
 */
const SKILL_IO_DIR = "schemas/skills";

/** `.claude/skills/<group>/*.json` — the typed nodes beside the skills. */
const REGISTRY_GROUPS: Record<string, string> = {
  actors: "Actor",
  capabilities: "Capability",
  roles: "Role",
  requirements: "Requirement",
};

/**
 * Directories holding BPMN processes, DISCOVERED.
 *
 * This was the literal `docs/workflows`, and a sibling PR moved the diagrams
 * to `skills/workflows/` while this branch was open. A hardcoded path does not
 * fail when its target moves — it finds nothing and reports a clean run over
 * zero processes, which is bean `dh4f` exactly. That is the FOURTH hardcoded
 * path in this module to be wrong; the pattern is now a rule: this exporter
 * locates corpora, it does not remember where they were.
 */
function findBpmnDirs(): string[] {
  const out = new Set<string>();
  const skip = new Set(["node_modules", ".git", "_site", "_kg", ".beans"]);
  const walk = (rel: string, depth: number): void => {
    if (depth > 4) return;
    let entries;
    try {
      entries = readdirSync(join(ROOT, rel), { withFileTypes: true });
    } catch {
      return;
    }
    if (entries.some((e) => e.isFile() && e.name.endsWith(".bpmn"))) out.add(rel);
    for (const e of entries) {
      if (e.isDirectory() && !skip.has(e.name) && !e.name.startsWith(".")) {
        walk(rel === "." ? e.name : `${rel}/${e.name}`, depth + 1);
      }
    }
  };
  walk(".", 0);
  return [...out];
}


// ── JSON-LD context ─────────────────────────────────────────────

const PROV = "http://www.w3.org/ns/prov#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
const SCHEMA = "https://schema.org/";
const XSD = "http://www.w3.org/2001/XMLSchema#";

/**
 * The active context, following `WorldHealthOrganization/smart-base`'s
 * `generate_jsonld_vocabularies.py`.
 *
 * Four things here are load-bearing rather than decorative:
 *
 * **`{"@type": "@id"}` is what makes this a graph.** Without it every edge —
 * `implementedBy`, `performedBy`, `partOf` — is a *string literal* to any
 * JSON-LD processor, and the document is a list of records that merely looks
 * linked to a human reading the JSON. Declaring those terms `@id`-typed is the
 * difference between 500 records and a traversable graph, and it costs one
 * line each.
 *
 * **No `@vocab`.** Every term is declared with its full namespace IRI, so an
 * undeclared key stays undeclared rather than silently resolving against a
 * default namespace and minting an IRI nobody chose. smart-base's type-usage
 * document calls this out explicitly and it is the right call.
 *
 * **`id` and `type` are aliased** to `@id` and `@type`, so the published JSON
 * reads as ordinary records while remaining RDF. A reader who does not know
 * JSON-LD is not taxed for it.
 *
 * **`@version: 1.1`** because aliasing and scoped type-coercion are 1.1
 * features; a 1.0 processor must fail loudly rather than half-read the file.
 */
function buildContext(): Record<string, unknown> {
  const link = { "@type": "@id" } as const;
  return {
    "@version": 1.1,
    folio: FOLIO_NS,
    prov: PROV,
    rdfs: RDFS,
    schema: SCHEMA,
    xsd: XSD,

    id: "@id",
    type: "@type",
    graph: "@graph",

    name: "rdfs:label",
    title: "rdfs:label",
    description: "rdfs:comment",
    summary: "rdfs:comment",
    generatedAt: { "@id": `${PROV}generatedAtTime`, "@type": `${XSD}dateTime` },
    // Provenance of the SOURCE, as against provenance of the run above.
    sourceCommit: { "@id": `${PROV}wasDerivedFrom`, "@type": "@id" },
    sourceCommitSha: `${FOLIO_NS}sourceCommitSha`,
    sourceCommitAt: { "@id": `${FOLIO_NS}sourceCommitAt`, "@type": `${XSD}dateTime` },
    sourceTreeDirty: { "@id": `${FOLIO_NS}sourceTreeDirty`, "@type": `${XSD}boolean` },
    sourceCommitUnavailable: `${FOLIO_NS}sourceCommitUnavailable`,

    // Edges. Each of these is a LINK, not a string — see above.
    partOf: { "@id": `${FOLIO_NS}partOf`, ...link },
    implementedBy: { "@id": `${FOLIO_NS}implementedBy`, ...link },
    performedBy: { "@id": `${FOLIO_NS}performedBy`, ...link },
    declaresSkill: { "@id": `${FOLIO_NS}declaresSkill`, ...link },
    inPackage: { "@id": `${FOLIO_NS}inPackage`, ...link },
    providesCapability: { "@id": `${FOLIO_NS}providesCapability`, ...link },
    requiresCapability: { "@id": `${FOLIO_NS}requiresCapability`, ...link },
    satisfies: { "@id": `${FOLIO_NS}satisfies`, ...link },
    // A LINK: the artefact's published URL, which dereferences. Undeclared it
    // would be dropped by any JSON-LD processor — the `ovkk` defect, where 34
    // property names were used in `@graph` and absent from `@context`, so the
    // document lost nearly all its property data the moment anything treated
    // it as JSON-LD rather than as plain JSON.
    maintains: { "@id": `${FOLIO_NS}maintains`, ...link },
    // A LITERAL, deliberately: a repo-relative module path is not
    // dereferenceable, and coercing it to `@id` would resolve it against the
    // document IRI and mint a URL that nothing serves.
    maintainsFrom: `${FOLIO_NS}maintainsFrom`,
    // The inverse of `maintains`, on a Schema node. A LINK: it names a Tool
    // node in this same document.
    maintainedBy: { "@id": `${FOLIO_NS}maintainedBy`, ...link },
    // A LITERAL: a repo-relative module path, for the same reason
    // `maintainsFrom` is one.
    module: `${FOLIO_NS}module`,
    holdsGraph: { "@id": `${FOLIO_NS}holdsGraph`, ...link },
    startNode: { "@id": `${FOLIO_NS}startNode`, ...link },
    incoming: { "@id": `${FOLIO_NS}incoming`, ...link },
    outgoing: { "@id": `${FOLIO_NS}outgoing`, ...link },
    from: { "@id": `${FOLIO_NS}from`, ...link },
    to: { "@id": `${FOLIO_NS}to`, ...link },
    // The preview → canonical link. `prov:alternateOf`, NOT `owl:sameAs`:
    // sameAs entails identity, so a reasoner would merge every statement about
    // both nodes and a changed description in a preview would make the merged
    // graph assert two conflicting descriptions of one thing. alternateOf says
    // "same underlying thing, different presentation" and merges nothing.
    alternateOf: { "@id": `${PROV}alternateOf`, ...link },
    canonicalDocument: { "@id": `${FOLIO_NS}canonicalDocument`, ...link },
    typeIri: { "@id": `${FOLIO_NS}typeIri`, "@type": "@id" },

    // A skill's I/O contract, as a LINK to the published schema document.
    //
    // These were missing, and their absence was invisible in a way worth
    // recording. `collectSkills` has always set `inputSchema`/`outputSchema`
    // on the 22 skills that have a contract, and the values appeared in the
    // emitted file — so reading the export as plain JSON showed the edge and
    // everything looked correct. But a term that is neither in the `@context`
    // nor an absolute IRI is **dropped** by JSON-LD processing, so the
    // association evaporated on the one consumer path this export exists to
    // serve. It was written, published, and not there.
    //
    // Both halves had to be fixed together: a term here with a relative value
    // would resolve against the document IRI and give
    // `<base>/schemas/skills/…`, which nothing serves. The values are now
    // the published `$id` of each contract — see `skillIoIri`.
    inputSchema: { "@id": `${FOLIO_NS}inputSchema`, ...link },
    outputSchema: { "@id": `${FOLIO_NS}outputSchema`, ...link },

    // The registry's own fields, renamed on the way in — see
    // `collectRegistryNodes`. Literals, not links: `localId` is a name within
    // a kind, not an IRI.
    localId: `${FOLIO_NS}localId`,
    actorKind: `${FOLIO_NS}actorKind`,

    // ---- BPMN, as it comes off a diagram -----------------------------------
    //
    // Literals, all of them. `bpmnType` is a QName in the BPMN namespace
    // (`bpmn:UserTask`), NOT an IRI: coercing it to `@id` would resolve it
    // against this document and mint `<base>/bpmn:UserTask`, which nothing
    // serves. `nodeKind` was emitted as the bare term `kind`, which this
    // document already uses in another sense -- a GraphKind is a "kind" too --
    // so the term now says which one it is.
    bpmnType: `${FOLIO_NS}bpmnType`,
    nodeKind: `${FOLIO_NS}nodeKind`,
    enforcement: `${FOLIO_NS}enforcement`,
    workPlanOp: `${FOLIO_NS}workPlanOp`,
    touchesWorkPlan: { "@id": `${FOLIO_NS}touchesWorkPlan`, "@type": `${XSD}boolean` },
    relaxable: { "@id": `${FOLIO_NS}relaxable`, "@type": `${XSD}boolean` },
    nodeCount: { "@id": `${FOLIO_NS}nodeCount`, "@type": `${XSD}integer` },
    flowCount: { "@id": `${FOLIO_NS}flowCount`, "@type": `${XSD}integer` },
    // A LITERAL, and the one term here whose call is expected to change. The
    // value is a repo-relative DMN path plus the decision's own id
    // (`decisions/draft-qa-gate.dmn#Decision_DraftQaGate`) and this graph emits
    // no Decision nodes at all, so coercing it would mint four IRIs that
    // resolve to nothing -- `makeIri`'s rule applied to a value rather than to
    // an `@id`. It becomes a link on the day decision tables are nodes.
    decisionRef: `${FOLIO_NS}decisionRef`,
    // WHERE A NODE CAME FROM, and the two senses are not one term. A Process
    // carries the `.bpmn` path it was loaded from; a lane-derived Role carries
    // the string `bpmn-lane`, which is a provenance KIND and not a path. Both
    // were emitted as `source`, so a single declaration would have asserted
    // that `bpmn-lane` is a file. Literals, for `maintainsFrom`'s reason: a
    // repo-relative path is not dereferenceable.
    sourcePath: `${FOLIO_NS}sourcePath`,
    sourceKind: `${FOLIO_NS}sourceKind`,

    // ---- Skills, packages, directories -------------------------------------
    //
    // `instructionsPath` is a repo-relative path, so a LITERAL for exactly
    // `maintainsFrom`'s reason. It was `instructions`, a name that promises the
    // text itself and delivers a path.
    instructionsPath: `${FOLIO_NS}instructionsPath`,
    instructionLines: { "@id": `${FOLIO_NS}instructionLines`, "@type": `${XSD}integer` },
    hasInstructions: { "@id": `${FOLIO_NS}hasInstructions`, "@type": `${XSD}boolean` },
    hasIOContract: { "@id": `${FOLIO_NS}hasIOContract`, "@type": `${XSD}boolean` },
    ambiguous: { "@id": `${FOLIO_NS}ambiguous`, "@type": `${XSD}boolean` },
    hasManifest: { "@id": `${FOLIO_NS}hasManifest`, "@type": `${XSD}boolean` },
    renderable: { "@id": `${FOLIO_NS}renderable`, "@type": `${XSD}boolean` },
    // A repo-relative directory, on a Directory and on a SkillPackage. ONE term
    // because it is one relation in both places -- unlike `source` above, which
    // was one name over two relations.
    path: `${FOLIO_NS}path`,
    // `schema:` is declared as a prefix above and this is its first use: a
    // package version is a software version and schema.org already has the
    // predicate. Minting `folio:version` beside it would be a second name for
    // a term the wider web already agrees on.
    version: `${SCHEMA}softwareVersion`,

    // ---- An actor's three lists, which answer three different questions ----
    //
    // `capabilities` becomes a LINK, because every value names a Capability
    // node this document contains -- 20 of 20, measured 2026-09-19. The VALUES
    // are minted as node IRIs in `collectRegistryNodes` rather than left as
    // bare names: a bare name under `{"@type": "@id"}` resolves against the
    // document base and yields `<base>/git-push`, which is the confidently
    // wrong coercion this bean warns about, not an edge.
    hasCapability: { "@id": `${FOLIO_NS}hasCapability`, ...link },
    // Roles and permissions stay LITERALS, deliberately and provisionally. The
    // role registry (`skills/roles/roles.json`) and the permission vocabulary
    // (`skills/permissions/permissions.json`) are NOT exported, so this graph
    // holds no node for any of them -- the Role nodes it does hold are BPMN
    // LANES, a different identity scheme with different names. Coercing would
    // mint 44 role and 21 permission IRIs resolving to nothing. They are names
    // until those registries are nodes, and `roleName`/`permissionName` say so
    // instead of implying an edge the graph cannot honour.
    roleName: `${FOLIO_NS}roleName`,
    permissionName: `${FOLIO_NS}permissionName`,

    // ---- Structured values whose own vocabulary this graph does not model ---
    //
    // `{"@type": "@json"}` (JSON-LD 1.1, `rdf:JSON`) keeps the value verbatim.
    // The alternative -- declaring the container term alone -- is WORSE than
    // leaving it undeclared: the outer key survives, every inner key is
    // dropped, and a consumer gets a well-formed EMPTY node where a Tool's I/O
    // contract used to be, with nothing to say anything was lost. Modelling
    // `io.inputs[].schema` as real edges is worth doing and is not this change.
    io: { "@id": `${FOLIO_NS}io`, "@type": "@json" },
    invoke: { "@id": `${FOLIO_NS}invoke`, "@type": "@json" },
    // Heterogeneous by source, and that is the point: a Capability's `install`
    // is a command string, a Tool's is a dispatch object. The RELATION is the
    // same -- how do I get this -- so one term, with a range `@json` tolerates.
    // Contrast `sourcePath`/`sourceKind`, where the two senses were different
    // relations sharing a name and had to be split.
    install: { "@id": `${FOLIO_NS}install`, "@type": "@json" },
    detection: { "@id": `${FOLIO_NS}detection`, "@type": "@json" },
    meta: { "@id": `${FOLIO_NS}meta`, "@type": "@json" },
    assignments: { "@id": `${FOLIO_NS}assignments`, "@type": "@json" },
    // A Tool's environment requirements -- `{ runtime: ["go"], network: true }`.
    // NOT `requiresCapability`: `go` is not a capability id (0 of 1 runtime
    // names match a Capability node), so these are two relations wearing one
    // name. It was `requires`, which a Capability also carried in the other
    // sense -- see `collectRegistryNodes`.
    requirements: { "@id": `${FOLIO_NS}requirements`, "@type": "@json" },

    // Which build produced this document — see `scripts/staging-stamp.ts`.
    //
    // **Declared, because the stamp was being dropped.** Until 2026-09-19 the
    // staging workflow appended `staging` to the document root with an inline
    // `bun -e`, and no term declared it: a JSON-LD processor discards a
    // property that is neither in the `@context` nor an absolute IRI, so the
    // one artefact this build stamped carried its stamp in the one form the
    // consumer this export exists to serve cannot read. Exactly the `ovkk`
    // defect recorded on `inputSchema`/`outputSchema` above, one level up on
    // the document root — where `undeclaredTerms` does not look, because it
    // walks `@graph`.
    //
    // A SCOPED context (JSON-LD 1.1 §4.1.8), not four global terms. `branch`,
    // `sha`, `pr` and `run` are words a graph node could plausibly use for
    // something else, and a global term would silently give that other use
    // this meaning. Scoped, they mean this only inside `staging`.
    staging: {
      "@id": `${FOLIO_NS}staging`,
      "@context": {
        branch: `${FOLIO_NS}stagingBranch`,
        sha: `${FOLIO_NS}stagingSha`,
        pr: `${FOLIO_NS}stagingRef`,
        run: `${FOLIO_NS}stagingRun`,
      },
    },

    // ---- The DOCUMENT ROOT's own fields ------------------------------------
    //
    // `ovkk` drove `@graph`'s undeclared count to zero. These six were the
    // same defect one level up, and they survived it for a structural reason:
    // `undeclaredTerms` walks `@graph`, so the root is the one place it cannot
    // look. Half the root WAS declared — `generatedAt`, `sourceCommit` and the
    // three `sourceCommit*` fields — which is what made the other half
    // invisible.
    //
    // `undeclaredRootTerms` now checks it, and is fatal for `undeclaredTerms`'
    // reason: with the count at zero, a new entry can only mean somebody added
    // a root field and did not decide what it means.
    //
    // A LINK, and `schema:codeRepository` rather than a minted `folio:` term —
    // the wider web already agrees on this one, exactly as `version` uses
    // `schema:softwareVersion`. It sits beside `sourceCommit`, which has been
    // declared all along; this was a gap, not a judgement.
    repository: { "@id": `${SCHEMA}codeRepository`, "@type": "@id" },
    // `{"@type": "@json"}`, for the reason `io` and `install` carry it: the
    // value is `{"Actor": 25, "Skill": 149, …}`, keyed by TYPE NAME, so there
    // is no fixed set of terms to declare. Declaring the container alone would
    // keep `counts` and drop all twelve numbers — a well-formed empty object
    // where the truncation check used to be, which is worse than leaving it
    // undeclared, because undeclared at least loses the whole thing visibly.
    counts: { "@id": `${FOLIO_NS}counts`, "@type": "@json" },
    // A LITERAL and deliberately NOT `@json`, unlike its three neighbours
    // below. `problems` is an array of plain strings, and a bare term expands
    // an array of literals to one value each — which is what they are. `@json`
    // would collapse three independent problems into a single opaque blob.
    problems: `${FOLIO_NS}problems`,
    // `@json` for the three that hold OBJECTS. Their inner keys — `term`,
    // `onTypes`, `occurrences`, `module`, `why`, `from`, `edge`, `to` — are a
    // vocabulary this graph does not model, and modelling a build report as
    // RDF is not what this change is for. Verbatim is honest; a declared
    // container over undeclared members is not.
    undeclaredTerms: { "@id": `${FOLIO_NS}undeclaredTerms`, "@type": "@json" },
    undeclaredSchemaModules: { "@id": `${FOLIO_NS}undeclaredSchemaModules`, "@type": "@json" },
    danglingLinks: { "@id": `${FOLIO_NS}danglingLinks`, "@type": "@json" },
  };
}

/**
 * Root-level property names the `@context` does not declare.
 *
 * ## The blind spot this closes
 *
 * {@link undeclaredTerms} walks `@graph`, so the DOCUMENT ROOT is the one
 * place it structurally cannot look — and the root carries real data:
 * provenance, node counts, and every diagnostic this export produces. Half of
 * it was declared (`generatedAt`, the four `sourceCommit*` fields) and half
 * was not, which is precisely what kept the gap invisible: a spot check on any
 * declared field said the root was covered.
 *
 * It is not hypothetical. `staging` shipped through this gap in #340 — written
 * into the root by the staging workflow, declared nowhere, and therefore
 * dropped by the only consumer the export exists to serve — while this file's
 * own comments stated the rule it was breaking. Six more were found the moment
 * anyone looked: `repository`, `counts`, `problems`, `undeclaredTerms`,
 * `undeclaredSchemaModules`, `danglingLinks`.
 *
 * ## Why this is not a field on the document
 *
 * Same call {@link keywordCollisions} makes, for the same reason. A field
 * reporting undeclared root terms would itself be a root term needing
 * declaration, and would have to be computed before it existed. It is a
 * DOCUMENT-VALIDITY check, run against the assembled document at the point of
 * writing, and fatal there.
 *
 * Fatal for `undeclaredTerms`' reason, now that the count is zero: the only
 * thing a new entry can mean is that somebody added a root field and did not
 * decide what it means. Deciding costs one line in {@link buildContext}.
 */
export function undeclaredRootTerms(
  doc: Record<string, unknown>,
  context: Record<string, unknown>,
): string[] {
  const declared = new Set(Object.keys(context).filter((k) => !k.startsWith("@")));
  return Object.keys(doc)
    // `@`-prefixed keys are JSON-LD keywords, which need no declaration — and
    // an ALIAS of one is handled by `keywordCollisions`, not here.
    .filter((k) => !k.startsWith("@") && !declared.has(k))
    .sort();
}

/**
 * Terms in the context that ALIAS a JSON-LD keyword.
 *
 * A node object carrying both a keyword and an alias of it is a
 * `colliding keywords` error (JSON-LD 1.1 §4.1.3), and the practical effect is
 * worse than an error: `{"@id": "<abs>", "id": "programme-manager"}` offers a
 * processor an absolute IRI and a relative one for the same node.
 *
 * Derived from `buildContext` rather than written out, so adding an alias
 * there cannot leave this list behind.
 */
function keywordAliases(): Set<string> {
  return new Set(
    Object.entries(buildContext())
      .filter(([, v]) => typeof v === "string" && v.startsWith("@"))
      .map(([k]) => k),
  );
}

/**
 * How a node's IRI is formed: a **fragment of the published document**.
 *
 * `<base>/kg/<stub>.jsonld#skill/todo-manager` — fetching it retrieves this
 * document and the fragment selects the node, which is true. The tempting
 * alternative, `<base>/kg/skill/todo-manager`, reads better and is a **lie**:
 * nothing serves that path. AGENTS.md records the same defect in the README
 * generator, which composed PDF links by convention and shipped twenty-three
 * 404s. An `@id` that looks dereferenceable and is not is worse than one that
 * is obviously local.
 */
function makeIri(docIri: string, kind: string, id: string): string {
  // `/` is legal in a fragment and is the separator this scheme uses, so it is
  // deliberately NOT escaped — `encodeURIComponent` would turn every process
  // node into `…#process/P%2Fnode%2FT`, which is both unreadable and a
  // different IRI from the one a reader would type. Only the characters that
  // genuinely terminate or re-delimit a fragment are escaped.
  const safe = id.replace(/[%#?\s]/g, (c) => encodeURIComponent(c));
  return `${docIri}#${kind}/${safe}`;
}

interface Node {
  "@id": string;
  "@type": string;
  [k: string]: unknown;
}

interface Export {
  "@context": Record<string, unknown>;
  /** This document's own IRI — the URL it is served from. */
  "@id": string;
  /**
   * `prov:Entity`, plus `folio:PreviewGraph` when this is not the canonical
   * publication — so "is this the real one?" is answerable from the type.
   */
  "@type": string | string[];
  /** On a preview: the canonical document this one is an alternate of. */
  canonicalDocument?: string;
  repository: string;
  generatedAt: string;
  /**
   * The commit the graph was generated from, as a dereferenceable IRI when the
   * repository's web host is known. `prov:wasDerivedFrom`, which is exactly
   * what it is.
   */
  sourceCommit?: string;
  /** That commit's SHA, unabbreviated. */
  sourceCommitSha?: string;
  /** When that commit was made — distinct from when this export ran. */
  sourceCommitAt?: string;
  /**
   * True when the working tree had uncommitted or untracked changes, so the
   * SHA above does NOT reproduce this graph. Absent means the question was not
   * answerable, which is not the same as `false`.
   */
  sourceTreeDirty?: boolean;
  /**
   * Why there is no source commit, when there is none.
   *
   * Carried here rather than in `problems` because it is not an unread source:
   * a tarball or an export-stripped checkout exports a complete graph, it just
   * cannot say which commit it came from. Present exactly when
   * `sourceCommitSha` is absent, so a consumer never has to infer the reason
   * for a missing field.
   */
  sourceCommitUnavailable?: string;
  /** Node counts by `@type`, so a consumer can spot a truncated graph. */
  counts: Record<string, number>;
  /**
   * Property names used in `@graph` that the `@context` does not declare.
   *
   * **Every one of these is DROPPED when the document is processed as the
   * JSON-LD it says it is.** A term that is neither in the context nor an
   * absolute IRI is not a property; it simply disappears. Reading the file as
   * plain JSON shows it, which is why this goes unnoticed — `inputSchema` was
   * published and invisible for exactly this reason until #297.
   *
   * **Empty, and FATAL when it is not** — since bean `ovkk`, which closed the
   * backlog this field was opened to report. It was reported-not-fatal while
   * 34 names and 3583 occurrences were outstanding, because declaring a term
   * is modelling work per property and blocking publication on a backlog holds
   * the graph hostage to it. That backlog is gone, so the same reasoning now
   * points the other way: with the count at zero, the only thing a new entry
   * can mean is that somebody added a property and did not decide what it
   * means. Deciding costs one line in `buildContext`; shipping it undecided
   * costs a published graph that silently drops the property.
   *
   * This is NOT the call made for `danglingLinks`, and the difference is who
   * can fix it. A dangling link is a DATA defect — a manifest naming a skill
   * nobody wrote — which the exporter cannot resolve and must not hide. An
   * undeclared term is an EXPORTER defect, fixable in the same change that
   * introduced it.
   */
  undeclaredTerms: Array<{ term: string; onTypes: string[]; occurrences: number }>;
  /**
   * Modules in the declared `schemas/` directory that say nothing about
   * themselves, and `@graphNode none` entries with no reason.
   *
   * **Its own field rather than `problems`.** That field's contract is
   * "sources that could not be read", and an undeclared module is not an
   * unreadable one — the export saw it perfectly well. Widening `problems` is
   * the mistake `buildExport` already refuses to make for provenance, and it
   * would make `problems: []` meaningless as a signal.
   *
   * Reported and non-fatal, like `undeclaredTerms`: what is at stake is a node
   * missing from the graph, not a graph published as whole while partial.
   */
  undeclaredSchemaModules: Array<{ module: string; why: "no-tag" | "none-without-reason" }>;
  /** Sources that could not be read. NEVER empty-by-omission — see module doc. */
  problems: string[];
  /**
   * Internal links whose target node is not in `@graph`.
   *
   * Reported in the document rather than thrown, because these are **data**
   * defects, not export failures: a manifest naming a skill nobody wrote is
   * bean `nup0`'s subject and predates this tool. Blocking publication on them
   * would hold the graph hostage to a backlog. Reporting them makes the graph
   * its own referential-integrity check, which is most of what publishing a
   * real JSON-LD graph buys over a list of records.
   */
  danglingLinks: Array<{ from: string; edge: string; to: string }>;
  "@graph": Node[];
}

/** Parse the `name:` and `description:` out of a skill's YAML front matter. */
function frontMatter(text: string): { name?: string; description?: string } {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(3, end);
  const out: { name?: string; description?: string } = {};
  const name = block.match(/^name:\s*(.+)$/m);
  if (name) out.name = name[1].trim();
  // `description: >` folds onto following indented lines.
  const desc = block.match(/^description:\s*(?:>[-+]?\s*\n((?:[ \t]+.*\n?)+)|(.+))$/m);
  if (desc) out.description = (desc[1] ?? desc[2] ?? "").split("\n").map((l) => l.trim()).join(" ").trim();
  return out;
}

/** First `# heading` — the fallback title when there is no front matter. */
function firstHeading(text: string): string | undefined {
  return text.match(/^#\s+(.+)$/m)?.[1].trim();
}

interface SkillFacts {
  instructions?: string;
  title?: string;
  description?: string;
  fmName?: string;
  lines?: number;
  packages: string[];
  inputSchema?: string;
  outputSchema?: string;
}

function collectSkills(doc: string, base: string, problems: string[]): Node[] {
  const byName = new Map<string, SkillFacts>();
  const get = (n: string): SkillFacts =>
    byName.get(n) ?? (byName.set(n, { packages: [] }), byName.get(n)!);

  for (const dir of skillMdDirs()) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue; // A package this instance does not carry.
    for (const f of readdirSync(abs)) {
      if (!f.endsWith(".md")) continue;
      let text: string;
      try {
        text = readFileSync(join(abs, f), "utf-8");
      } catch (e) {
        problems.push(`unreadable skill ${dir}/${f}: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      const name = f.slice(0, -3);
      const s = get(name);
      const fm = frontMatter(text);
      // A name defined in two packages is recorded, not silently overwritten:
      // bare name is the identifier a BPMN ref uses, so a duplicate is a real
      // ambiguity somebody has to resolve.
      s.packages.push(dir);
      s.instructions ??= `${dir}/${f}`;
      s.fmName ??= fm.name;
      s.description ??= fm.description;
      s.title ??= firstHeading(text);
      s.lines ??= text.split("\n").length;
    }
  }

  const ioRoot = join(ROOT, SKILL_IO_DIR);
  if (existsSync(ioRoot)) {
    for (const e of readdirSync(ioRoot, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const s = get(e.name);
      const inp = join(ioRoot, e.name, "input.schema.json");
      const out = join(ioRoot, e.name, "output.schema.json");
      // The PUBLISHED IRI, minted by the one function that owns it — not the
      // repo-relative path. A relative value here resolves against this
      // document's own IRI and names something nothing serves; and since the
      // context now coerces these to `@id`, a relative value would silently
      // become a wrong absolute one rather than an obviously local string.
      if (existsSync(inp)) s.inputSchema = skillIoIri(base, e.name, "input");
      if (existsSync(out)) s.outputSchema = skillIoIri(base, e.name, "output");
    }
  }

  return [...byName.entries()].map(([name, s]) => ({
    "@id": makeIri(doc, "skill", name),
    "@type": `${FOLIO_NS}Skill`,
    name,
    declaredName: s.fmName !== name ? s.fmName : undefined,
    title: s.title,
    description: s.description,
    // A link per package, not a bare string: the skill's package is an edge.
    inPackage: s.packages.map((d) => makeIri(doc, "package", d.split("/").pop()!)),
    // `packagePaths` was here, repeating each package's directory beside the
    // link that already reaches it. REMOVED as denormalised: `inPackage` lands
    // on a SkillPackage node carrying `path`, every one of those links resolves
    // (0 dangling, measured 2026-09-19), and every value `packagePaths` held
    // was one of those nodes' `path`. Reading a property off a link target is
    // graph traversal; recovering a fact by SPLITTING AN IRI is the string
    // surgery this document refuses to ask of a consumer, and neither was
    // needed here.
    instructionsPath: s.instructions,
    instructionLines: s.lines,
    inputSchema: s.inputSchema,
    outputSchema: s.outputSchema,
    // The two facets, stated rather than left to be inferred from absence.
    hasInstructions: s.instructions !== undefined,
    hasIOContract: s.inputSchema !== undefined || s.outputSchema !== undefined,
    // A FLAG now, not a second copy of the package list: which packages define
    // the name is `inPackage`, and this says only that somebody has to resolve
    // it. Emitted on every skill rather than only when true, for the reason
    // `hasInstructions` is -- absence must not be the carrier of a fact.
    ambiguous: s.packages.length > 1,
  }));
}

/**
 * Registry fields that are REFERENCES, and what each one may honestly become.
 *
 * The rest of a registry file is spread verbatim, which is right for prose and
 * wrong for a name that points at another node: a bare name is dropped by a
 * JSON-LD processor when undeclared, and -- worse -- becomes a WRONG absolute
 * IRI if the term is declared `{"@type": "@id"}` without minting the value,
 * since `"git-push"` resolves against the document base. So the decision is
 * made here, per field, against what this graph actually contains:
 *
 * - **`capabilities` -> `hasCapability`, a LINK.** All 20 references resolve to
 *   a Capability node in this document (measured 2026-09-19), so the edge is
 *   real and the value is minted as that node's IRI.
 * - **`requires` on a Capability -> `requiresCapability`, a LINK.** Same test,
 *   12 of 12. It reuses the term already declared for a package's requirements
 *   rather than minting a second name for one relation. Note a TOOL's
 *   `requires` is a different relation entirely -- see `collectTools`.
 * - **`roles` and `permissions` -> `roleName`/`permissionName`, LITERALS.**
 *   Neither registry is in this graph: `skills/roles/roles.json` and
 *   `skills/permissions/permissions.json` are never collected, and the Role
 *   nodes that do exist are BPMN lanes under different names. All 44 role and
 *   21 permission references would dangle. A name is what these are until the
 *   registries are nodes, and the term says so.
 *
 * Keyed by group, so a field a future registry adds is not silently caught by
 * a rule written for another one.
 */
function registryFields(
  group: string,
  rest: Record<string, unknown>,
  doc: string,
): Record<string, unknown> {
  const names = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  if (group === "actors") {
    const { capabilities, roles, permissions, ...other } = rest;
    return {
      ...other,
      ...(capabilities === undefined
        ? {}
        : { hasCapability: names(capabilities).map((c) => makeIri(doc, "capability", c)) }),
      ...(roles === undefined ? {} : { roleName: names(roles) }),
      ...(permissions === undefined ? {} : { permissionName: names(permissions) }),
    };
  }
  if (group === "capabilities") {
    const { requires, ...other } = rest;
    return {
      ...other,
      ...(requires === undefined
        ? {}
        : { requiresCapability: names(requires).map((c) => makeIri(doc, "capability", c)) }),
    };
  }
  return rest;
}

function collectRegistryNodes(doc: string, problems: string[]): Node[] {
  const nodes: Node[] = [];
  for (const [group, type] of Object.entries(REGISTRY_GROUPS)) {
    const abs = join(ROOT, ".claude", "skills", group);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (!f.endsWith(".json")) continue;
      try {
        const d = JSON.parse(readFileSync(join(abs, f), "utf-8")) as Record<string, unknown>;
        const id = String(d.id ?? d.name ?? f.slice(0, -5));

        // The registry files carry `id` and `type` of their own, and spreading
        // them verbatim put BOTH a keyword and its alias on 71 nodes: `id`
        // against `@id`, `type` against `@type`. It read correctly as plain
        // JSON, which is why it survived — the document is only wrong when
        // something processes it as the JSON-LD it claims to be.
        //
        // Renamed rather than dropped. The local name and the human / agentic
        // / mechanical distinction are both real data a consumer wants, and
        // recovering `localId` by splitting the `@id` fragment is exactly the
        // string manipulation a consumer should never have to do.
        //
        // `kind` is the field since 2026-09-19; `type` is the legacy two-valued
        // one, still read so an unmigrated registry exports. Both are stripped
        // from `rest` whichever supplied the value, because leaving either in
        // reinstates the keyword collision this rename exists to fix.
        const { id: localId, kind, type: legacyType, ...rest } = d;
        const actorKind = kind ?? legacyType;
        nodes.push({
          "@id": makeIri(doc, type.toLowerCase(), id),
          "@type": `${FOLIO_NS}${type}`,
          ...(localId === undefined ? {} : { localId: String(localId) }),
          ...(actorKind === undefined ? {} : { actorKind: String(actorKind) }),
          ...registryFields(group, rest, doc),
        });
      } catch (e) {
        problems.push(`unparseable ${group}/${f}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return nodes;
}

function collectPackages(doc: string, problems: string[]): Node[] {
  const nodes: Node[] = [];
  const seen = new Set<string>();

  // Every directory that holds skills is a package node, manifest or not.
  // `src/skills` and `.claude/skills/local` carry no `package-manifest.json`,
  // and skipping them left 9 `inPackage` links pointing at nodes that were
  // never emitted — a dangling link in a published graph, which is the defect
  // this export exists to make visible rather than to commit.
  for (const dir of skillMdDirs()) {
    const leaf = dir.split("/").pop()!;
    if (!existsSync(join(ROOT, dir)) || seen.has(leaf)) continue;
    seen.add(leaf);
    nodes.push({
      "@id": makeIri(doc, "package", leaf),
      "@type": `${FOLIO_NS}SkillPackage`,
      name: leaf,
      path: dir,
      hasManifest: existsSync(join(ROOT, dir, "package-manifest.json")),
    });
  }

  const skillsRoot = join(ROOT, "skills");
  if (!existsSync(skillsRoot)) return nodes;
  for (const d of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const mf = join(skillsRoot, d.name, "package-manifest.json");
    if (!existsSync(mf)) continue;
    try {
      const m = JSON.parse(readFileSync(mf, "utf-8")) as Record<string, unknown>;
      // Replace the stub emitted above with the manifest-backed node.
      const stubAt = nodes.findIndex((n) => n["@id"] === makeIri(doc, "package", d.name));
      if (stubAt !== -1) nodes.splice(stubAt, 1);
      nodes.push({
        "@id": makeIri(doc, "package", d.name),
        "@type": `${FOLIO_NS}SkillPackage`,
        name: m.name ?? d.name,
        version: m.version,
        description: m.description,
        path: `skills/${d.name}`,
        hasManifest: true,
        // Links, so a consumer can walk package → skill without string surgery.
        declaresSkill: ((m.skills as string[]) ?? []).map((n) => makeIri(doc, "skill", n)),
        providesCapability: ((m.providesCapabilities as string[]) ?? []).map((c) => makeIri(doc, "capability", c)),
        requiresCapability: ((m.requiresCapabilities as string[]) ?? []).map((c) => makeIri(doc, "capability", c)),
      });
    } catch (e) {
      problems.push(`unparseable manifest skills/${d.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return nodes;
}

async function collectProcesses(doc: string, problems: string[]): Promise<Node[]> {
  const nodes: Node[] = [];
  const lanes = new Set<string>();
  const dirs = findBpmnDirs();
  if (dirs.length === 0) {
    // Zero diagrams is a determined empty ONLY if we looked. Say which.
    problems.push("no directory containing .bpmn files was found under the repository root");
  }
  for (const rel of dirs) {
  const dir = join(ROOT, rel);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".bpmn")) continue;
    const path = join(dir, f);
    try {
      const m = await loadProcessModel(path);
      nodes.push({
        "@id": makeIri(doc, "process", m.id),
        "@type": `${FOLIO_NS}Process`,
        name: m.name,
        enforcement: m.enforcement,
        sourcePath: relative(ROOT, m.source),
        startNode: m.startNodes.map((n) => makeIri(doc, "process", `${m.id}/node/${n}`)),
        nodeCount: m.nodes.size,
        flowCount: m.flows.size,
      });
      for (const f of m.flows.values()) {
        // Sequence flows are nodes too. `incoming`/`outgoing` already pointed
        // at them, so omitting them left 60-odd links dangling — a link minted
        // for an element the exporter declined to emit.
        nodes.push({
          "@id": makeIri(doc, "process", `${m.id}/flow/${f.id}`),
          "@type": `${FOLIO_NS}SequenceFlow`,
          name: f.name,
          partOf: makeIri(doc, "process", m.id),
          from: makeIri(doc, "process", `${m.id}/node/${f.from}`),
          to: makeIri(doc, "process", `${m.id}/node/${f.to}`),
        });
      }
      for (const n of m.nodes.values()) {
        // A lane IS a role, and `performedBy` points at it. Minting the link
        // without emitting the node left all 328 of them dangling.
        if (n.lane !== undefined && !lanes.has(n.lane)) {
          lanes.add(n.lane);
          nodes.push({
            "@id": makeIri(doc, "role", n.lane),
            "@type": `${FOLIO_NS}Role`,
            name: n.lane,
            // NOT `source`: a Process's `source` is the file it was read from,
            // and this is a provenance KIND. One term over both would assert
            // that `bpmn-lane` is a path.
            sourceKind: "bpmn-lane",
          });
        }
        nodes.push({
          "@id": makeIri(doc, "process", `${m.id}/node/${n.id}`),
          "@type": `${FOLIO_NS}ProcessNode`,
          name: n.name,
          nodeKind: n.kind,
          bpmnType: n.type,
          partOf: makeIri(doc, "process", m.id),
          // The edges nothing else surfaces — now genuine links.
          //
          // `laneName` and `implementsSkillNames` sat beside these two,
          // repeating each target's name as a string. REMOVED as denormalised:
          // the lane's Role node carries the lane name as its `name`, every
          // named skill has a Skill node carrying its own, and neither link
          // dangles (0 of 415 ProcessNode links, measured 2026-09-19). A name
          // duplicated beside a link is a second answer that can go stale.
          performedBy: n.lane === undefined ? undefined : makeIri(doc, "role", n.lane),
          implementedBy: n.skills.map((k) => makeIri(doc, "skill", k)),
          touchesWorkPlan: n.touchesWorkPlan,
          workPlanOp: n.workPlanOp,
          relaxable: n.relaxable,
          decisionRef: n.decisionRef,
          incoming: n.incoming.map((f) => makeIri(doc, "process", `${m.id}/flow/${f}`)),
          outgoing: n.outgoing.map((f) => makeIri(doc, "process", `${m.id}/flow/${f}`)),
        });
      }
    } catch (e) {
      problems.push(`unloadable process ${rel}/${f}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  }
  return nodes;
}

/**
 * The graph kinds themselves, as nodes.
 *
 * This is the self-describing half. `holdsGraph` on a directory points at a
 * kind, and without these the vocabulary a reader needs in order to interpret
 * the document lives only in TypeScript they cannot fetch. With them, the
 * published graph carries its own terms: follow `holdsGraph` and you arrive at
 * a node saying what that kind holds and whether it renders.
 *
 * Note this imports `folio-graph-kind`, so the export sees the kind
 * `folio-assist-core` registers and not just the harness's four. It takes no
 * document IRI because these nodes are minted under the NAMESPACE: a graph
 * kind means the same thing in a preview and in the canonical graph, so its
 * IRI must not vary with where the document is published.
 */
/**
 * Tool nodes — the `tools` graph.
 *
 * `satisfies` is emitted as LINKS to skill nodes, which is the edge the whole
 * skill/Tool separation exists to express: a reader can now walk from "claim
 * the item before you work" to the two mechanisms that do it, without knowing
 * that a bare string was meant to be a skill name.
 */
function collectTools(doc: string, base: string, problems: string[]): Node[] {
  let defs;
  try {
    // The SAME base the document is published against — see tools/index.ts.
    defs = tools(base);
  } catch (e) {
    problems.push(`tools/ did not load: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
  return defs.map((t) => ({
    "@id": makeIri(doc, "tool", t.id),
    "@type": `${FOLIO_NS}Tool`,
    name: t.id,
    title: t.title,
    description: t.description,
    install: t.install,
    invoke: t.invoke,
    io: t.io,
    // `requirements`, not `requires`: a Capability's `requires` names other
    // CAPABILITIES and is emitted as `requiresCapability` links, while this is
    // an environment descriptor (`{ runtime: ["go"], network: true }`) whose
    // values are not capability ids. Two relations, two terms.
    requirements: t.requires,
    satisfies: t.satisfies.map((k) => makeIri(doc, "skill", k)),
    // `satisfiesSkillNames` was here. REMOVED as denormalised: every
    // `satisfies` link lands on a Skill node carrying that same name, and none
    // of them dangles.
    // The artefacts this Tool is authoritative for, as the URLs they are
    // actually served at — `renderingPath`, not a composed string, so the
    // edge dereferences from the published document rather than looking as
    // though it might. A Tool that maintains nothing has the field absent,
    // not an empty array: `compact` drops undefined, and "maintains nothing"
    // is the normal case rather than a degenerate one worth recording.
    maintains: t.maintains?.map((m) => renderingPath(base, m.artefact)),
    // The SOURCE side of the same relation, repo-relative. Carried next to the
    // artefact because the owner's split is directional — internally the zod
    // module is definitional and the JSON-LD is downstream — and a consumer
    // that only has the graph cannot get back to the module otherwise.
    maintainsFrom: t.maintains?.map((m) => m.source),
  }));
}

/**
 * The `schemas` graph: one node per module that declares itself a schema.
 *
 * ## Why this did not exist until 2026-09-19
 *
 * `cat-harness.json` has declared `schemas/` with `graphs: ["schemas", "kg"]`
 * since Phase 0.3, and the export produced **zero** nodes of that kind —
 * measured on `814b693e`, 11 node types and none a schema. So the instance's
 * own declaration promised a graph nothing backed: a consumer resolving the
 * `schemas` kind scanned, found nothing, and had no way to tell that from an
 * instance that genuinely holds none.
 *
 * ## The membership test is the file's own declaration
 *
 * `@graphNode schema` in the leading docblock — see `scripts/schema-nodes.ts`
 * for why a JSDoc tag and not an exported constant, and why an untagged file
 * is `undeclared` rather than excluded. Nothing here infers membership from a
 * filename, which is the coincidence-not-contract defect the bean graph was
 * restructured to avoid.
 *
 * ## `maintainedBy` is the inverse of `Tool.maintains`
 *
 * Written out rather than left for a consumer to derive, on the owner's
 * standing rule that a downstream consumer must never have to string-
 * manipulate or infer a rule to follow a link. The forward direction says a
 * Tool keeps an artefact true; this says which Tool keeps THIS module's
 * artefact true, which is the question a reader of a schema node actually has.
 */
function collectSchemas(doc: string, base: string): Node[] {
  const audit = auditSchemaNodes(ROOT);

  // Tool → artefact, inverted once so each schema node can name its keeper.
  const keeper = new Map<string, string[]>();
  try {
    for (const t of tools(base)) {
      for (const m of t.maintains ?? []) {
        keeper.set(m.source, (keeper.get(m.source) ?? []).concat(makeIri(doc, "tool", t.id)));
      }
    }
  } catch {
    // `collectTools` already records why the graph did not load; a second
    // identical problem entry would read as two failures.
  }

  return audit.nodes.map((m) => ({
    "@id": makeIri(doc, "schema", m.name),
    "@type": `${FOLIO_NS}Schema`,
    name: m.name,
    title: m.summary,
    module: m.module,
    maintainedBy: keeper.get(m.module),
  }));
}

function collectGraphKinds(): Node[] {
  return defaultGraphKinds.names().map((name) => {
    const def = defaultGraphKinds.get(name)!;
    return {
      "@id": `${FOLIO_NS}graphKind/${name}`,
      "@type": `${FOLIO_NS}GraphKind`,
      name,
      typeIri: def.type,
      renderable: def.renderable,
      summary: def.summary,
    };
  });
}

function collectDeclaration(doc: string, problems: string[]): Node[] {
  const f = join(ROOT, "cat-harness.json");
  if (!existsSync(f)) return [];
  try {
    const d = JSON.parse(readFileSync(f, "utf-8")) as {
      title?: string;
      description?: string;
      directories?: Array<{
        id: string;
        path: string;
        graphs?: string[];
        title?: string;
        description?: string;
      }>;
    };
    return (d.directories ?? []).map((x) => {
      // `graph` became `graphs[]` — a directory may hold more than one graph,
      // and `schemas/` is the first real use of that. Both spellings are read
      // so this does not break on a declaration written before the change.
      const kinds = x.graphs ?? [];
      return {
        "@id": makeIri(doc, "directory", x.id),
        "@type": `${FOLIO_NS}Directory`,
        name: x.id,
        path: x.path,
        holdsGraph: kinds.map((k) => `${FOLIO_NS}graphKind/${k}`),
        // `graphKinds: kinds` was here. REMOVED as denormalised: `holdsGraph`
        // lands on a GraphKind node whose `name` is the kind, and the export's
        // own test already asserts every one of those links resolves.
        title: x.title,
        description: x.description,
      };
    });
  } catch (e) {
    problems.push(`unparseable cat-harness.json: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

/** Every term in the context that is declared `{"@type": "@id"}`. */
const LINK_TERMS = [
  "partOf", "implementedBy", "performedBy", "declaresSkill", "inPackage",
  "providesCapability", "requiresCapability", "holdsGraph", "startNode",
  "incoming", "outgoing", "from", "to", "satisfies", "hasCapability",
] as const;

/**
 * Links pointing at nodes this document does not contain.
 *
 * Only *internal* fragments are checked — a link to another document's IRI is
 * not this graph's business and reporting it would be noise. `holdsGraph`
 * points at a graph-kind IRI in the namespace, which is a vocabulary term
 * rather than a node here, so it is excluded by the same rule.
 */
function undeclaredTerms(
  graph: Node[],
  context: Record<string, unknown>,
): Array<{ term: string; onTypes: string[]; occurrences: number }> {
  const declared = new Set(Object.keys(context).filter((k) => !k.startsWith("@")));
  const seen = new Map<string, { types: Set<string>; n: number }>();
  for (const node of graph) {
    const type = String(node["@type"] ?? "").split("#").pop() ?? "?";
    for (const key of Object.keys(node)) {
      if (key.startsWith("@") || declared.has(key)) continue;
      const e = seen.get(key) ?? { types: new Set<string>(), n: 0 };
      e.types.add(type);
      e.n += 1;
      seen.set(key, e);
    }
  }
  return [...seen.entries()]
    .map(([term, e]) => ({ term, onTypes: [...e.types].sort(), occurrences: e.n }))
    .sort((a, b) => b.occurrences - a.occurrences || a.term.localeCompare(b.term));
}

/**
 * A node carrying both a JSON-LD keyword and an alias of it.
 *
 * **Fatal, unlike `undeclaredTerms`**, and the difference is what is at stake.
 * An undeclared term loses one property; a collision on `id` or `type` offers
 * a processor two different answers for the node's own IDENTITY or CLASS, and
 * a graph whose nodes cannot be identified is not a graph. Publishing that as
 * a complete export is the failure this module's doc comment is about.
 *
 * Measured before the fix: 71 nodes — `Actor.id` (24), `Actor.type` (24),
 * `Capability.id` (23) — all from `collectRegistryNodes` spreading a registry
 * file's own fields into the node object verbatim.
 */
function keywordCollisions(graph: Node[]): string[] {
  const aliases = keywordAliases();
  const out: string[] = [];
  for (const node of graph) {
    for (const key of Object.keys(node)) {
      if (!aliases.has(key)) continue;
      const kw = `@${key === "graph" ? "graph" : key}`;
      if (kw in node) out.push(`${String(node["@id"])} carries both \`${kw}\` and its alias \`${key}\``);
    }
  }
  return out;
}

function findDanglingLinks(graph: Node[], docIri: string): Array<{ from: string; edge: string; to: string }> {
  const ids = new Set(graph.map((n) => String(n["@id"])));
  const out: Array<{ from: string; edge: string; to: string }> = [];
  for (const n of graph) {
    for (const edge of LINK_TERMS) {
      const v = n[edge];
      if (v === undefined) continue;
      for (const to of Array.isArray(v) ? v : [v]) {
        const t = String(to);
        // "Internal" means a fragment of THIS document. Testing for a bare `#`
        // was wrong: FOLIO_NS itself ends in `#`, so every vocabulary IRI read
        // as a broken node reference.
        if (!t.startsWith(`${docIri}#`) && !ids.has(t)) continue;
        if (!ids.has(t)) out.push({ from: String(n["@id"]), edge, to: t });
      }
    }
  }
  return out;
}

/** Strip `undefined` so the published JSON has no empty keys. */
function compact(n: Node): Node {
  return Object.fromEntries(Object.entries(n).filter(([, v]) => v !== undefined)) as Node;
}

/**
 * Where the export is published, and therefore what its `@id`s are.
 *
 * `baseUrl` overrides the declaration's `canonicalUrl` — CI passes the staging
 * base so a branch preview's graph identifies itself as the preview rather
 * than claiming to be the canonical one. Without that override every staged
 * export would mint `@id`s pointing at `main`'s published document, and two
 * different graphs would assert the same IRIs.
 */
export interface ExportOptions {
  baseUrl?: string;
}

/** Filename stem and document IRI for this instance's published graph. */
/**
 * The commit this graph was generated from, or why that could not be
 * determined.
 *
 * ## Why the timestamp alone was not enough
 *
 * `generatedAt` says WHEN the export ran. It does not say what it ran over,
 * so two graphs differing in content are indistinguishable from two runs of
 * the same content, and a consumer holding a published `.jsonld` has no way
 * back to the tree that produced it. The commit is the missing half: with it,
 * the graph is reproducible and every node in it is traceable to a diff.
 *
 * ## Dirty is a THIRD state, not a detail
 *
 * A SHA reported from a tree with uncommitted changes is a false provenance
 * claim — it names a commit that does not contain what was exported, which is
 * strictly worse than reporting nothing, because it invites a consumer to
 * check out that commit and find a different graph. So `dirty` is carried
 * beside the SHA rather than suppressing it: the commit is still the best
 * available anchor, and the flag says not to trust it as exact.
 *
 * ## And unavailable is a fourth
 *
 * A tarball, a shallow or export-stripped checkout, or a machine with no
 * `git` produces no SHA at all. That is reported in `problems` — the same
 * channel as an unreadable source — and the fields are simply absent, never
 * filled with a placeholder that would parse as a commit.
 */
interface SourceProvenance {
  sha?: string;
  /** The commit's web URL, when the remote names a forge we can address. */
  iri?: string;
  committedAt?: string;
  dirty?: boolean;
  /** Why there is no SHA, when there is none. */
  unavailable?: string;
}

function readSourceProvenance(): SourceProvenance {
  const git = (args: string[]): string | undefined => {
    const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf-8" });
    if (r.status !== 0 || r.error) return undefined;
    return r.stdout.trim();
  };

  const sha = git(["rev-parse", "HEAD"]);
  if (!sha) {
    return {
      unavailable:
        "git reported no HEAD here (a tarball, an export-stripped checkout, " +
        "or no git on PATH), so the graph names no source commit",
    };
  }

  // `--porcelain` is empty exactly when the tree matches HEAD. Untracked files
  // count: an export walks the tree, so a file git does not know about is
  // still a file that could have contributed a node.
  const status = git(["status", "--porcelain"]);
  return {
    sha,
    iri: commitIri(git(["remote", "get-url", "origin"]), sha),
    committedAt: git(["show", "-s", "--format=%cI", sha]) || undefined,
    // `undefined` rather than `false` when status itself failed: "the tree is
    // clean" is a claim, and an unanswered question is not that claim.
    dirty: status === undefined ? undefined : status.length > 0,
  };
}

/**
 * A dereferenceable commit URL from a git remote, or `undefined`.
 *
 * Only forge URLs whose commit-page layout is known are turned into an IRI —
 * `undefined` for anything else, never a guessed path. Same rule as
 * `makeIri`'s: a link that looks dereferenceable and 404s is worse than an
 * absent one, because a consumer treats the first as a fact about the graph
 * and the second as a fact about this export.
 */
function commitIri(remote: string | undefined, sha: string): string | undefined {
  if (!remote) return undefined;
  const m =
    remote.match(/^https?:\/\/(github\.com|gitlab\.com)\/(.+?)(?:\.git)?\/?$/) ??
    remote.match(/^git@(github\.com|gitlab\.com):(.+?)(?:\.git)?\/?$/);
  if (!m) return undefined;
  const [, host, path] = m;
  // GitHub and GitLab both serve a commit at /<owner>/<repo>/commit/<sha>.
  return `https://${host}/${path}/commit/${sha}`;
}

export function exportIdentity(opts: ExportOptions = {}): {
  stub: string;
  docIri: string;
  /**
   * The publication base every IRI in this export is minted against.
   *
   * Returned rather than re-derived by each caller. `collectTools` used to
   * recover it by stripping `/kg/<file>` off `docIri` with a regular
   * expression — which works, and is exactly the "process the string to get
   * back a fact you already had" that this project keeps removing. Two callers
   * doing it is two chances to disagree about what the base is.
   */
  base: string;
  /** The canonical document's IRI, when one is declared. */
  canonicalIri?: string;
  /** True when this export is published somewhere other than canonical. */
  isPreview: boolean;
} {
  const decl = readDeclaration(ROOT);
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { name?: string };
  const stub = decl ? artefactStub(decl) : (pkg.name ?? "instance");
  const canonicalBase = (decl?.canonicalUrl ?? "").replace(/\/+$/, "");
  const base = (opts.baseUrl ?? canonicalBase).replace(/\/+$/, "");
  // No base declared → a document-relative IRI. Deliberately NOT a fabricated
  // absolute one: see makeIri's note on links that look dereferenceable.
  // `renderingPath` rather than a template literal: the `kg/` segment that used
  // to be here was written out in seven places, five of them minting an `$id`.
  // An empty base still yields a document-RELATIVE IRI, deliberately — see
  // `makeIri`'s note on links that look dereferenceable.
  const docIri = renderingPath(base, `${stub}.jsonld`);
  const canonicalIri = canonicalBase ? renderingPath(canonicalBase, `${stub}.jsonld`) : undefined;
  return { stub, docIri, base, canonicalIri, isPreview: canonicalIri !== undefined && docIri !== canonicalIri };
}

export async function buildExport(opts: ExportOptions = {}): Promise<Export> {
  const problems: string[] = [];
  const { stub, docIri, base, canonicalIri, isPreview } = exportIdentity(opts);

  // Provenance of the SOURCE. Absent fields are absent, never placeholders:
  // a consumer must be able to tell "this export did not know" from "this
  // export knew the tree was clean".
  // NOT folded into `problems`, whose contract is "sources that could not be
  // read". A dirty tree is not an unread source — the export saw everything —
  // it is a caveat on the SHA, and a dirty checkout is the normal state of a
  // developer's machine. Putting it there would make `problems: []` fail on
  // every local run and train the reader to ignore the field that exists to
  // report real failures.
  const src = readSourceProvenance();
  const commitFields = {
    ...(src.unavailable ? { sourceCommitUnavailable: src.unavailable } : {}),
    ...(src.iri ? { sourceCommit: src.iri } : {}),
    ...(src.sha ? { sourceCommitSha: src.sha } : {}),
    ...(src.committedAt ? { sourceCommitAt: src.committedAt } : {}),
    ...(src.dirty === undefined ? {} : { sourceTreeDirty: src.dirty }),
  };
  if (!docIri.startsWith("http")) {
    // Reported, not silently tolerated: a graph whose nodes have no absolute
    // identity cannot be merged with anyone else's, which is most of the point.
    problems.push(
      "no canonicalUrl in cat-harness.json and no --base-url given: " +
        "@id values are document-relative and will not dereference",
    );
  }

  const schemaAudit = auditSchemaNodes(ROOT);
  const graph = [
    ...collectSkills(docIri, base, problems),
    ...collectRegistryNodes(docIri, problems),
    ...collectPackages(docIri, problems),
    ...(await collectProcesses(docIri, problems)),
    ...collectTools(docIri, base, problems),
    ...collectSchemas(docIri, base),
    ...collectGraphKinds(),
    ...collectDeclaration(docIri, problems),
  ].map(compact);

  // A preview's nodes say, explicitly and per node, which canonical node they
  // are an alternate presentation of.
  //
  // This IS derivable — `makeIri` produces the same fragment whatever the base,
  // so a consumer could swap one for the other. It is written out anyway, on
  // the owner's standing instruction that a downstream consumer must never have
  // to string-manipulate or infer a rule to follow a link. A rule a consumer
  // has to know is a rule a consumer can get wrong, and the cost here is one
  // field per node in an artefact that is regenerated on every build.
  if (isPreview && canonicalIri !== undefined) {
    for (const n of graph) {
      const id = String(n["@id"]);
      // Only nodes that are fragments of THIS document have an alternate.
      // Vocabulary nodes (graph kinds) are minted under the namespace, not the
      // document, so they are byte-identical in both graphs — giving them an
      // `alternateOf` pointing at a canonical fragment that does not exist was
      // a broken link generated by a blanket loop.
      if (!id.startsWith(`${docIri}#`)) continue;
      n.alternateOf = `${canonicalIri}#${id.slice(docIri.length + 1)}`;
    }
  }

  const counts: Record<string, number> = {};
  for (const n of graph) {
    const t = String(n["@type"]).replace(FOLIO_NS, "");
    counts[t] = (counts[t] ?? 0) + 1;
  }

  return {
    "@context": buildContext(),
    danglingLinks: findDanglingLinks(graph, docIri),
    "@id": docIri,
    // A preview says so in its TYPE, not only in a side-car field: "is this
    // the canonical graph?" must be answerable from the document's own type
    // without reading a convention. This is where the `#STAGING` marker idea
    // belongs — as a type, not as a fragment on a URL the document is not
    // served from.
    "@type": isPreview ? [`${PROV}Entity`, `${FOLIO_NS}PreviewGraph`] : `${PROV}Entity`,
    ...(isPreview && canonicalIri !== undefined ? { canonicalDocument: canonicalIri } : {}),
    repository: stub,
    generatedAt: new Date().toISOString(),
    ...commitFields,
    counts,
    problems,
    undeclaredTerms: undeclaredTerms(graph, buildContext()),
    undeclaredSchemaModules: [
      ...schemaAudit.undeclared.map((m) => ({ module: m.module, why: "no-tag" as const })),
      ...schemaAudit.reasonless.map((m) => ({ module: m.module, why: "none-without-reason" as const })),
    ],
    "@graph": graph,
  };
}

if (import.meta.main) {
  const arg = (flag: string): string | undefined => {
    const i = process.argv.indexOf(flag);
    return i !== -1 ? process.argv[i + 1] : undefined;
  };
  const baseUrl = arg("--base-url") ?? process.env.KG_BASE_URL;
  const { stub } = exportIdentity({ baseUrl });
  // Named after the repository, per the stub convention — `<stub>.jsonld`,
  // never a generic `kg.json`. `.jsonld` because it IS JSON-LD; the extension
  // is what tells a fetcher to treat it as one.
  const out = arg("--out") ?? join(ROOT, "_kg", `${stub}.jsonld`);
  const data = await buildExport({ baseUrl });

  mkdirSync(dirname(out), { recursive: true });
  // The staging stamp, from the same function `harness-schema-export` uses, so
  // the two documents a build publishes side by side cannot disagree about
  // which build they came from. It was an inline `bun -e` in
  // `feature-staging.yml` that reached this document and nothing else.
  writeFileSync(out, JSON.stringify({ ...data, ...stagingFields() }, null, 2) + "\n");

  console.log(`KG export → ${relative(ROOT, out)}\n  @id  ${data["@id"]}`);
  for (const [t, n] of Object.entries(data.counts).sort()) console.log(`  ${String(n).padStart(5)}  ${t}`);
  console.log(`  ${String(data["@graph"].length).padStart(5)}  total`);

  // A keyword collision is a DOCUMENT-VALIDITY failure, not an unread source,
  // so it is not in `problems` — but it is fatal for the same reason they are:
  // a graph whose nodes offer two answers for their own identity must not be
  // published as a whole one. Checked here against the assembled graph rather
  // than trusted from the collectors.
  // The DOCUMENT ROOT, which `undeclaredTerms` below cannot see — see
  // `undeclaredRootTerms`. Checked before the graph-level report because a
  // root field that vanishes takes the provenance and the counts with it.
  const rootUndeclared = undeclaredRootTerms(data as unknown as Record<string, unknown>, data["@context"]);
  if (rootUndeclared.length > 0) {
    console.error(`\n${rootUndeclared.length} root-level field(s) are NOT in the @context, so a JSON-LD processor drops them:`);
    for (const t of rootUndeclared) console.error(`  \u2717 ${t}`);
    console.error("  Declare each in `buildContext` — see the DOCUMENT ROOT section there.");
    process.exit(1);
  }

  // The QA RESULT, under the declared `test/results/`.
  //
  // The owner's rule, 2026-09-19: an artefact generated primarily as a QA
  // reviewer belongs there as part of a QA process — placement follows
  // PROVENANCE, not file family. These four findings are exactly that: a
  // review of the graph this run just produced.
  //
  // Written from the SAME values the document carries, not recomputed. Two
  // renderings of one computation cannot disagree; two computations can. It is
  // the rule `feature-staging.yml` already follows when it copies the `.json`
  // alias AFTER the staging stamp, and the reason `stagingStamp` is one
  // function rather than one per exporter.
  //
  // The document still carries these fields. Moving them out is a SEPARATE
  // change, because `scripts/kg-viewer.ts:573` reads `doc.undeclaredTerms` off
  // the published document and renders it — so removing them needs the viewer
  // pointed at the published result first, and a half-moved field would take
  // the viewer's panel with it.
  const resultPath = writeQaResult(ROOT, "kg-export", buildQaResult({
    script: "scripts/kg-export.ts",
    scriptAbsPath: join(ROOT, "scripts", "kg-export.ts"),
    subject: { kind: "graph", id: `${stub}.jsonld` },
    families: {
      undeclaredTerms: {
        summary:
          "Property names used in `@graph` that the `@context` does not declare. " +
          "Dropped outright by a JSON-LD processor.",
        entries: data.undeclaredTerms,
      },
      undeclaredSchemaModules: {
        summary:
          "Modules in the declared schemas/ directory that do not say what they are, " +
          "so they are absent from the graph.",
        entries: data.undeclaredSchemaModules,
      },
      danglingLinks: {
        summary: "Internal links whose target node is not in `@graph`. A DATA defect, not an export failure.",
        entries: data.danglingLinks,
      },
      problems: {
        summary: "Sources that could not be read. Never empty-by-omission.",
        entries: data.problems,
      },
    },
  }));
  console.log(`QA result → ${relative(ROOT, resultPath)}`);

  const collisions = keywordCollisions(data["@graph"]);
  if (collisions.length > 0) {
    console.error(`\n${collisions.length} node(s) carry a JSON-LD keyword AND its alias:`);
    for (const c of collisions.slice(0, 10)) console.error(`  \u2717 ${c}`);
    if (collisions.length > 10) console.error(`  \u2026 and ${collisions.length - 10} more`);
    process.exit(1);
  }

  if (data.undeclaredSchemaModules.length > 0) {
    console.warn(
      `\n${data.undeclaredSchemaModules.length} module(s) in the declared schemas/ directory ` +
        `do not declare what they are — they are absent from the graph:`,
    );
    for (const m of data.undeclaredSchemaModules) console.warn(`  · ${m.module}  (${m.why})`);
    console.warn("  Add `@graphNode schema` or `@graphNode none — <reason>` to the leading docblock.");
  }

  // FATAL since bean `ovkk` drove the count to zero — see `undeclaredTerms`.
  // Not reported-and-continued like `danglingLinks`, which are data defects
  // this tool cannot fix; an undeclared term is a defect in this tool, and the
  // decision it demands is one line away.
  //
  // Reported here but exited on BELOW, so a run that is also missing sources
  // prints both rather than stopping at the first.
  let undeclaredFatal = false;
  if (data.undeclaredTerms.length > 0) {
    undeclaredFatal = true;
    const n = data.undeclaredTerms.reduce((a, t) => a + t.occurrences, 0);
    console.error(
      `\n${data.undeclaredTerms.length} property name(s), ${n} occurrence(s), are NOT in the @context ` +
        `\u2014 a JSON-LD processor drops every one:`,
    );
    for (const t of data.undeclaredTerms.slice(0, 8)) {
      console.error(`  \u2717 ${t.term.padEnd(22)} ${String(t.occurrences).padStart(4)}\u00d7  on ${t.onTypes.join(", ")}`);
    }
    if (data.undeclaredTerms.length > 8) console.error(`  \u2717 \u2026 and ${data.undeclaredTerms.length - 8} more`);
    console.error(
      "\nEach one needs a DECISION, not a line: does it deserve a predicate IRI,\n" +
        "and is it a LINK (`{\"@type\": \"@id\"}`, value minted with `makeIri`) or a\n" +
        "literal? A wrong coercion is worse than the gap -- a bare name under\n" +
        "`@id` resolves against the document base and mints an IRI nobody chose.\n" +
        "If a link already in the graph carries the same fact, REMOVE the property\n" +
        "instead of declaring it. Add it to `buildContext()` when it stays.",
    );
  }

  if (data.danglingLinks.length > 0) {
    console.warn(`\n${data.danglingLinks.length} dangling internal link(s) — reported, not fatal:`);
    for (const d of data.danglingLinks) console.warn(`  · ${d.edge} → ${d.to.split("#")[1]}`);
  }

  if (data.problems.length > 0) {
    console.error(`\n${data.problems.length} source(s) could not be read:`);
    for (const p of data.problems) console.error(`  ✗ ${p}`);
    // Reported, and non-zero: a partial graph must not pass for a whole one.
    process.exit(1);
  }

  if (undeclaredFatal) process.exit(1);
}
