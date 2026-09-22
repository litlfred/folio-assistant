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
import { join, dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { NS_PREFIXES, namespaceForLayer, termIri } from "../schemas/namespaces.js";
import { termLayer } from "../schemas/vocabulary.js";
import { BASE_GRAPH_KINDS, KG_CONTENT_GRAPH_KINDS, declaredAssets, declaredGraphs, declaredKinds, repoRootFor, resolveDirectories, declarationPathIn } from "../schemas/cat-harness.js";
import { type RoleDef, readRoleGraph } from "../schemas/role-graph.js";
import { REGISTRY_GROUPS } from "../schemas/kg-node.js";
import {
  artefactStub,
  defaultGraphKinds,
  isPublishedDirectory,
  isPublishedGraphKind,
  isPublishedSchemaModule,
  isPublishedSkill,
  instanceRootsIn,
  readDeclaration,
  renderingPath,
} from "../schemas/cat-harness.js";
import { firstHeading, frontMatter } from "./front-matter.js";
import {
  isSkillMd,
  kgDirectories,
  kgRoots,
  knownSkills,
  skillMdDirs as knownSkillDirs,
  workflowDirs,
  unpublishedSkills,
} from "./known-skills.js";
import { auditSchemaNodes } from "./schema-nodes.js";
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
function skillMdDirs(root: string = ROOT): string[] {
  return knownSkillDirs(root).map((p) => p.join("/"));
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


/**
 * Directories holding BPMN processes, DISCOVERED.
 *
 * This was the literal `docs/workflows`, and a sibling PR moved the diagrams
 * to `processes/` while this branch was open. A hardcoded path does not
 * fail when its target moves — it finds nothing and reports a clean run over
 * zero processes, which is bean `dh4f` exactly. That is the FOURTH hardcoded
 * path in this module to be wrong; the pattern is now a rule: this exporter
 * locates corpora, it does not remember where they were.
 */
/**
 * Directories holding this instance's `.bpmn`, read from its DECLARATION.
 *
 * ## Measured: the walk this replaces was leaking, in `main`, today
 *
 * It walked the filesystem — every directory under the root to depth 4, minus
 * a skip list of *names*. That was right while this repository was the only
 * instance in the tree. `bootstrap/` is now a second one, with its own
 * declaration, and the walk does not know that: measured 2026-09-19 on `main`,
 * `_kg/folio-assistant.jsonld` contained **88** references to
 * `Process_CatBootstrap`. CatBootstrap's process was being published as part of
 * folio-assistant's graph.
 *
 * The repair that suggests itself is `skip.add("bootstrap")` — a directory
 * name written in code, which is the defect `check:declared-paths` exists to
 * refuse, and which would need another line for every instance ever added.
 * Reading the declaration needs none: an instance's diagrams are the ones it
 * DECLARES, and a directory it does not declare is not its graph.
 */
function findBpmnDirs(root: string = ROOT): string[] {
  return workflowDirs(root).map((abs) => relative(root, abs));
}


// ── JSON-LD context ─────────────────────────────────────────────

/** The namespace a declared graph kind's nodes belong in. */
function graphKindNamespace(kindName: string): string {
  const def = BASE_GRAPH_KINDS[kindName];
  const local = def?.type.split("#")[1];
  return local ? namespaceForLayer(termLayer(local)) : namespaceForLayer("harness");
}

/** A type IRI with whichever folio namespace it carries removed. */
export function stripNamespace(iri: string): string {
  for (const ns of Object.values(NS_PREFIXES)) if (iri.startsWith(ns)) return iri.slice(ns.length);
  return iri;
}

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
export function buildContext(): Record<string, unknown> {
  const link = { "@type": "@id" } as const;
  return {
    "@version": 1.1,
    ...NS_PREFIXES,
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
    sourceCommitSha: termIri("sourceCommitSha"),
    sourceCommitAt: { "@id": termIri("sourceCommitAt"), "@type": `${XSD}dateTime` },
    sourceTreeDirty: { "@id": termIri("sourceTreeDirty"), "@type": `${XSD}boolean` },
    sourceCommitUnavailable: termIri("sourceCommitUnavailable"),

    // Edges. Each of these is a LINK, not a string — see above.
    partOf: { "@id": termIri("partOf"), ...link },
    // A LINK, not a literal, and the gate was right to demand the decision:
    // the declared Directory nodes are already in this graph (they are what
    // `collectDeclaration` emits), so a bare id would have been a second,
    // unresolvable way of naming a node that is right there. As a link the
    // viewer's subgraph facet and the declaration hierarchy are the same edge.
    inSubgraph: { "@id": termIri("inSubgraph"), ...link },
    implementedBy: { "@id": termIri("implementedBy"), ...link },
    performedBy: { "@id": termIri("performedBy"), ...link },
    declaresSkill: { "@id": termIri("declaresSkill"), ...link },
    inPackage: { "@id": termIri("inPackage"), ...link },
    providesCapability: { "@id": termIri("providesCapability"), ...link },
    requiresCapability: { "@id": termIri("requiresCapability"), ...link },
    // `CapabilityDefinition.fallbackTo` — the capability that stands in for
    // this one. A LINK for the same reason `requiresCapability` is: the
    // value is a capability id and every Capability is a node in this
    // document, so it resolves. Bean `folio-assistant-sym3`, which moved it
    // off five skill modules onto the one capability it describes.
    fallbackToCapability: { "@id": termIri("fallbackToCapability"), ...link },
    satisfies: { "@id": termIri("satisfies"), ...link },
    // The role REGISTRY's own two edges, as against the lane-derived view.
    // `hasSkill` is what the role knows; `bindsLane` is where it is bound.
    //
    // REUSED, not coined. `schemas/role-graph.ts`'s own JSON-LD projection
    // already publishes exactly these two relations under these two IRIs, so
    // a second spelling here would put one concept in the vocabulary twice --
    // the drift this repo keeps paying for. `ns:check` is what caught it, by
    // naming two minted terms as undefined; the reflex is to write the two
    // glosses rather than to go looking for what they duplicate.
    //
    // Links for `partOf`'s reason: a bare name leaves a consumer to re-derive
    // the IRI this document already minted.
    hasSkill: { "@id": termIri("hasSkill"), ...link },
    bindsLane: { "@id": termIri("bindsLane"), ...link },
    // A LINK: the artefact's published URL, which dereferences. Undeclared it
    // would be dropped by any JSON-LD processor — the `ovkk` defect, where 34
    // property names were used in `@graph` and absent from `@context`, so the
    // document lost nearly all its property data the moment anything treated
    // it as JSON-LD rather than as plain JSON.
    maintains: { "@id": termIri("maintains"), ...link },
    // A LITERAL, deliberately: a repo-relative module path is not
    // dereferenceable, and coercing it to `@id` would resolve it against the
    // document IRI and mint a URL that nothing serves.
    maintainsFrom: termIri("maintainsFrom"),
    // The inverse of `maintains`, on a Schema node. A LINK: it names a Tool
    // node in this same document.
    maintainedBy: { "@id": termIri("maintainedBy"), ...link },
    // A LITERAL: a repo-relative module path, for the same reason
    // `maintainsFrom` is one.
    module: termIri("module"),
    holdsGraph: { "@id": termIri("holdsGraph"), ...link },
    startNode: { "@id": termIri("startNode"), ...link },
    incoming: { "@id": termIri("incoming"), ...link },
    outgoing: { "@id": termIri("outgoing"), ...link },
    from: { "@id": termIri("from"), ...link },
    to: { "@id": termIri("to"), ...link },
    // The preview → canonical link. `prov:alternateOf`, NOT `owl:sameAs`:
    // sameAs entails identity, so a reasoner would merge every statement about
    // both nodes and a changed description in a preview would make the merged
    // graph assert two conflicting descriptions of one thing. alternateOf says
    // "same underlying thing, different presentation" and merges nothing.
    alternateOf: { "@id": `${PROV}alternateOf`, ...link },
    canonicalDocument: { "@id": termIri("canonicalDocument"), ...link },
    typeIri: { "@id": termIri("typeIri"), "@type": "@id" },

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
    inputSchema: { "@id": termIri("inputSchema"), ...link },
    outputSchema: { "@id": termIri("outputSchema"), ...link },

    // The registry's own fields, renamed on the way in — see
    // `collectRegistryNodes`. Literals, not links: `localId` is a name within
    // a kind, not an IRI.
    localId: termIri("localId"),
    // TWO terms, and the distinction is load-bearing rather than clumsy: an
    // actor IS one kind of thing, a role ADMITS several. Collapsing them into
    // one name would assert that a lane open to a person and an agent is
    // itself some third kind of actor.
    actorKind: termIri("actorKind"),
    actorKinds: termIri("actorKinds"),
    // A LITERAL, not a link. It is a value from a closed vocabulary
    // (`NETWORK_REACHES`), not a node — minting `#reach/air-gapped` would
    // create an IRI nobody declared and invite a consumer to dereference it.
    // It is also NOT the deployment's `network`, although the vocabulary is
    // shared: that one describes a population, this one a participant.
    reach: termIri("reach"),
    // The two declared exemptions, and they are NOT one flag with two names.
    // `actedUpon` says the role never acts, so `role-has-actor` is `n/a`;
    // `judgementOnly` says it acts but no procedure yields its answer, so
    // `activity-names-skill` is. A consumer that collapsed them would give a
    // store an actor or a stakeholder a skill.
    actedUpon: { "@id": termIri("actedUpon"), "@type": `${XSD}boolean` },
    judgementOnly: { "@id": termIri("judgementOnly"), "@type": `${XSD}boolean` },

    // ---- BPMN, as it comes off a diagram -----------------------------------
    //
    // Literals, all of them. `bpmnType` is a QName in the BPMN namespace
    // (`bpmn:UserTask`), NOT an IRI: coercing it to `@id` would resolve it
    // against this document and mint `<base>/bpmn:UserTask`, which nothing
    // serves. `nodeKind` was emitted as the bare term `kind`, which this
    // document already uses in another sense -- a GraphKind is a "kind" too --
    // so the term now says which one it is.
    bpmnType: termIri("bpmnType"),
    // Convention terms (bean `3190`). All LITERALS — none is a link, so none
    // gets `{"@type": "@id"}`: a bare name under `@id` resolves against the
    // document base and mints an IRI nobody chose.
    //
    // `statement` is NOT a synonym of `rdfs:comment`. The comment is prose
    // ABOUT the node; the statement is the rule ITSELF, and a consumer
    // filtering for enforceable text needs them apart. `rationale` is
    // separate again for a reason worth stating: a rule and its justification
    // collapsed into one field is a rule nobody can retire, because there is
    // nothing left that says what would falsify it.
    statement: termIri("statement"),
    rationale: termIri("rationale"),
    applies: termIri("applies"),
    nodeKind: termIri("nodeKind"),
    enforcement: termIri("enforcement"),
    workPlanOp: termIri("workPlanOp"),
    touchesWorkPlan: { "@id": termIri("touchesWorkPlan"), "@type": `${XSD}boolean` },
    relaxable: { "@id": termIri("relaxable"), "@type": `${XSD}boolean` },
    nodeCount: { "@id": termIri("nodeCount"), "@type": `${XSD}integer` },
    flowCount: { "@id": termIri("flowCount"), "@type": `${XSD}integer` },
    // A LITERAL, and the one term here whose call is expected to change. The
    // value is a repo-relative DMN path plus the decision's own id
    // (`decisions/draft-qa-gate.dmn#Decision_DraftQaGate`) and this graph emits
    // no Decision nodes at all, so coercing it would mint four IRIs that
    // resolve to nothing -- `makeIri`'s rule applied to a value rather than to
    // an `@id`. It becomes a link on the day decision tables are nodes.
    decisionRef: termIri("decisionRef"),
    // WHERE A NODE CAME FROM, and the two senses are not one term. A Process
    // carries the `.bpmn` path it was loaded from; a lane-derived Role carries
    // the string `bpmn-lane`, which is a provenance KIND and not a path. Both
    // were emitted as `source`, so a single declaration would have asserted
    // that `bpmn-lane` is a file. Literals, for `maintainsFrom`'s reason: a
    // repo-relative path is not dereferenceable.
    sourcePath: termIri("sourcePath"),
    sourceKind: termIri("sourceKind"),

    // ---- Skills, packages, directories -------------------------------------
    //
    // `instructionsPath` is a repo-relative path, so a LITERAL for exactly
    // `maintainsFrom`'s reason. It was `instructions`, a name that promises the
    // text itself and delivers a path.
    instructionsPath: termIri("instructionsPath"),
    instructionLines: { "@id": termIri("instructionLines"), "@type": `${XSD}integer` },
    hasInstructions: { "@id": termIri("hasInstructions"), "@type": `${XSD}boolean` },
    hasIOContract: { "@id": termIri("hasIOContract"), "@type": `${XSD}boolean` },
    ambiguous: { "@id": termIri("ambiguous"), "@type": `${XSD}boolean` },
    hasManifest: { "@id": termIri("hasManifest"), "@type": `${XSD}boolean` },
    renderable: { "@id": termIri("renderable"), "@type": `${XSD}boolean` },
    // A repo-relative directory, on a Directory and on a SkillPackage. ONE term
    // because it is one relation in both places -- unlike `source` above, which
    // was one name over two relations.
    path: termIri("path"),
    // A declared ASSET's role, and a LITERAL rather than a link.
    //
    // `assetRole` and not `role`, which is the one decision in this term. An
    // asset's role is a free string naming what the FILE is for —
    // `agent-instructions`, `instance-readme`, `landing-operations` — and it is
    // a different vocabulary from the actor/swimlane Role, which is a node
    // with an id, skills and `actedUpon`. Spelling both `role` would make a
    // consumer that resolves the term get a bare string where it expects a
    // Role node, and the two would be indistinguishable in the graph.
    //
    // A literal because `KgAssetSchema.role` is `z.string().min(1)` with no
    // enum behind it, so there is no node set for a value to name. Coercing it
    // to `@id` would resolve each bare name against the document base and mint
    // an IRI nobody chose — which is the failure the export's own undeclared
    // -term report warns about by name.
    assetRole: termIri("assetRole"),
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
    hasCapability: { "@id": termIri("hasCapability"), ...link },
    // Roles and permissions stay LITERALS, deliberately and provisionally. The
    // role registry (`scenarios/roles.json`) and the permission vocabulary
    // (`skills/permissions/permissions.json`) are NOT exported, so this graph
    // holds no node for any of them -- the Role nodes it does hold are BPMN
    // LANES, a different identity scheme with different names. Coercing would
    // mint 44 role and 21 permission IRIs resolving to nothing. They are names
    // until those registries are nodes, and `roleName`/`permissionName` say so
    // instead of implying an edge the graph cannot honour.
    roleName: termIri("roleName"),
    permissionName: termIri("permissionName"),

    // ---- Structured values whose own vocabulary this graph does not model ---
    //
    // `{"@type": "@json"}` (JSON-LD 1.1, `rdf:JSON`) keeps the value verbatim.
    // The alternative -- declaring the container term alone -- is WORSE than
    // leaving it undeclared: the outer key survives, every inner key is
    // dropped, and a consumer gets a well-formed EMPTY node where a Tool's I/O
    // contract used to be, with nothing to say anything was lost. Modelling
    // `io.inputs[].schema` as real edges is worth doing and is not this change.
    io: { "@id": termIri("io"), "@type": "@json" },
    invoke: { "@id": termIri("invoke"), "@type": "@json" },
    // Heterogeneous by source, and that is the point: a Capability's `install`
    // is a command string, a Tool's is a dispatch object. The RELATION is the
    // same -- how do I get this -- so one term, with a range `@json` tolerates.
    // Contrast `sourcePath`/`sourceKind`, where the two senses were different
    // relations sharing a name and had to be split.
    install: { "@id": termIri("install"), "@type": "@json" },
    detection: { "@id": termIri("detection"), "@type": "@json" },
    meta: { "@id": termIri("meta"), "@type": "@json" },
    assignments: { "@id": termIri("assignments"), "@type": "@json" },
    // A Tool's environment requirements -- `{ runtime: ["go"], network: true }`.
    // NOT `requiresCapability`: `go` is not a capability id (0 of 1 runtime
    // names match a Capability node), so these are two relations wearing one
    // name. It was `requires`, which a Capability also carried in the other
    // sense -- see `collectRegistryNodes`.
    requirements: { "@id": termIri("requirements"), "@type": "@json" },

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
      "@id": termIri("staging"),
      "@context": {
        branch: termIri("stagingBranch"),
        sha: termIri("stagingSha"),
        pr: termIri("stagingRef"),
        run: termIri("stagingRun"),
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
    counts: { "@id": termIri("counts"), "@type": "@json" },
    // `omitted` — the instance-bound collectors that were NOT run, present
    // only on a foreign instance's document. A plain list of collector names,
    // so a declared container is enough; there is no open key set as there is
    // for `counts`.
    //
    // It is a root field carrying real data, and `dyd3` is why it is here: it
    // came over from `gen-bootstrap-graph.ts` when that generator's publish
    // step was retired, because it was the one thing that document had which
    // this one did not. Adding it WITHOUT this line made `undeclaredRootTerms`
    // fatal on the first run — which is the guard working, and the reason the
    // field is not silently dropped by a JSON-LD processor instead.
    omitted: { "@id": termIri("omitted"), "@container": "@set" },
    //
    // `problems`, `undeclaredTerms`, `undeclaredSchemaModules` and
    // `danglingLinks` were declared here and are NOT any more — the document
    // no longer carries them. They are a QA reviewer's findings about the
    // graph this run produced, so they are written to `test/results/` as a
    // `qa-results/v1` document instead. See `publishedDocument`.
    //
    // The terms went WITH the fields, deliberately. A `@context` describes what
    // its document carries; a term for a field nothing emits is a promise to a
    // consumer that this document will answer a question it has stopped
    // answering, which is a worse kind of wrong than an undeclared term —
    // undeclared at least fails loudly against `undeclaredRootTerms`.
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
/**
 * The document as PUBLISHED — the computation minus its QA findings.
 *
 * ## Why the findings left the document
 *
 * `undeclaredTerms`, `undeclaredSchemaModules`, `danglingLinks` and `problems`
 * are what a QA reviewer found about the graph this run produced. The owner's
 * rule, 2026-09-19: an artefact generated primarily as a QA reviewer belongs
 * under `test/results/` as part of a QA process. They are written there, as a
 * `qa-results/v1` document, by the CLI below.
 *
 * They are **not** dropped — they are relocated, and the relocation is checked:
 * a test asserts the result's families equal what this function strips out, so
 * nothing can leave the document without arriving in the result.
 *
 * ## What STAYS, and why the line is not "everything diagnostic"
 *
 * `counts` and `repository` stay. Neither is a finding: `counts` is what the
 * graph CONTAINS, which is how a consumer spots a truncated document, and
 * `repository` is provenance sitting beside `sourceCommit`. A reviewer's
 * verdict moves; a fact about the artefact does not.
 *
 * `sourceCommitUnavailable` stays for the same reason, and it is the sharpest
 * case: it reads like a problem and is not one. A tarball exports a complete
 * graph and simply cannot say which commit it came from.
 */
export function publishedDocument(data: Export): Omit<Export, "undeclaredTerms" | "undeclaredSchemaModules" | "danglingLinks" | "problems"> {
  const {
    undeclaredTerms: _ut,
    undeclaredSchemaModules: _usm,
    danglingLinks: _dl,
    problems: _p,
    ...doc
  } = data;
  return doc;
}

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
  /**
   * Instance-bound collectors that were NOT run, for a foreign instance.
   *
   * Carried so a reader can tell *"this instance has no tools"* from *"tools
   * were never looked for"* — the `dh4f` defect, a clean run reported over a
   * corpus the tool could not read. It came here from
   * `gen-bootstrap-graph.ts` when `dyd3` retired that generator's publish
   * step: the field was the one thing that document had which this one did
   * not, so dropping the generator without it would have lost the guard.
   *
   * Absent for the host instance, where every collector runs and "omitted" is
   * not a question.
   */
  omitted?: readonly string[];
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

function collectSkills(doc: string, base: string, problems: string[], root: string = ROOT): Node[] {
  const byName = new Map<string, SkillFacts>();
  const get = (n: string): SkillFacts =>
    byName.get(n) ?? (byName.set(n, { packages: [] }), byName.get(n)!);

  for (const dir of skillMdDirs(root)) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue; // A package this instance does not carry.
    for (const f of readdirSync(abs)) {
      // `isSkillMd`, not a bare `.md` test. This carried its OWN copy of the
      // predicate — a third definition of "is this a skill" in a module whose
      // own header is about two definitions disagreeing — and it admitted
      // `bootstrap/README.md` as a skill named `README` the moment a second
      // knowledge-graph root existed. `skill-coverage.test.ts` caught it,
      // which is the only reason this is a comment rather than a published
      // graph node nobody could explain.
      if (!f.endsWith(".md") || !isSkillMd(join(abs, f))) continue;
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

  const ioRoot = join(root, SKILL_IO_DIR);
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

  // The skill documenting an unpublished kind is itself unpublished — it
  // carries that kind's name, and its subject is where SDLC churn goes, so
  // publishing it advertises the trashcan. Bean `folio-assistant-uv09`.
  //
  // TWO inputs, deliberately. `isPublishedSkill` matches the NAME against
  // `UNPUBLISHED_GRAPH_KINDS`; `unpublishedSkills` reads a skill's own
  // `published: false`. Its own note asked for the second — *"if that ever
  // stops being true this needs its own list, not a cleverer derivation"* —
  // and the declaration is that list, kept with the file rather than in
  // code. They answer different questions ("is it NAMED after the trashcan",
  // "did it SAY not to publish it"), and the blanket test asserts the
  // OUTCOME over the built document at any depth, so neither can quietly
  // stop working.
  const declared = unpublishedSkills(ROOT);
  const publishable = (name: string): boolean => isPublishedSkill(name) && !declared.has(name);
  return [...byName.entries()]
    .filter(([name]) => publishable(name))
    .map(([name, s]) => ({
    "@id": makeIri(doc, "skill", name),
    "@type": termIri("Skill"),
    name,
    declaredName: s.fmName !== name ? s.fmName : undefined,
    title: s.title,
    description: s.description,
    // A link per package, not a bare string: the skill's package is an edge.
    // Through `packageIdFor`, so a skill's edge lands on the node its package
    // actually emits. Composing the id here independently is what let the two
    // sides agree on a name neither package had declared (bean `r1vw`).
    inPackage: s.packages.map((d) => makeIri(doc, "package", packageIdFor(d))),
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
 *   Neither registry is in this graph: `scenarios/roles.json` and
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
    const { requires, fallbackTo, ...other } = rest;
    return {
      ...other,
      ...(requires === undefined
        ? {}
        : { requiresCapability: names(requires).map((c) => makeIri(doc, "capability", c)) }),
      // Renamed on the way out, like `requires` above: `fallbackTo` is a
      // fine field name on a Capability and an ambiguous TERM in a shared
      // vocabulary, where a Tool and a Role could each want one.
      ...(typeof fallbackTo === "string"
        ? { fallbackToCapability: makeIri(doc, "capability", fallbackTo) }
        : {}),
    };
  }
  return rest;
}

function collectRegistryNodes(doc: string, problems: string[]): Node[] {
  const nodes: Node[] = [];
  for (const [group, type] of Object.entries(REGISTRY_GROUPS)) {
    const abs = join(repoRootFor(ROOT), ".claude", "skills", group);
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
          "@type": termIri(type),
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

/**
 * A package's id — from its MANIFEST's `name`, not from its directory.
 *
 * ## The collision this replaces, measured 2026-09-20 (bean `r1vw`)
 *
 * The id was `dir.split("/").pop()`, and eleven of the twelve packages here
 * hid that, because their directory is named after the package. The twelfth
 * is `bootstrap/skills/`, whose manifest declares `"name": "bootstrap"`
 * and whose node was `package/skills`, **named `skills`** — the manifest's own
 * name was never read.
 *
 * `cat-harness/src/skills/` has the same basename. Both wanted `package/skills`,
 * and the `seen` set below silently dropped whichever came second while its
 * skills kept emitting `inPackage -> package/skills`. So `corpus-grep`, a
 * cat-harness skill in a directory with no manifest at all, was published as a
 * member of bootstrap's package. Nothing reported it: both sides resolved,
 * no link dangled, and the audit's `skill-servable` criterion was SATISFIED by
 * the collision — a skill served by a package it was never listed in.
 *
 * An id derived from a path is an id two paths can agree on by accident. Read
 * from the declaration and the accident needs two authors to choose one name.
 *
 * The basename remains the fallback, and that is not a hedge: `src/skills/` and
 * `.claude/skills/local` carry no manifest, and a package with no declared name
 * has nothing else to be called. What changes is that the name is only INFERRED
 * where nothing was declared.
 */
function packageIdFor(dirRelToRoot: string): string {
  const leaf = dirRelToRoot.split("/").pop()!;
  const mf = join(ROOT, dirRelToRoot, "package-manifest.json");
  if (!existsSync(mf)) return leaf;
  try {
    const name = (JSON.parse(readFileSync(mf, "utf-8")) as { name?: unknown }).name;
    return typeof name === "string" && name.length > 0 ? name : leaf;
  } catch {
    // An unparseable manifest is reported by `collectPackages` below, which
    // reads the same file. Falling back here keeps one defect from becoming
    // two: the package still gets a node, under the only name left.
    return leaf;
  }
}

function collectPackages(doc: string, problems: string[]): Node[] {
  const nodes: Node[] = [];

  // Every directory that holds skills is a package node, manifest or not.
  // `src/skills` and `.claude/skills/local` carry no `package-manifest.json`,
  // and skipping them left 9 `inPackage` links pointing at nodes that were
  // never emitted — a dangling link in a published graph, which is the defect
  // this export exists to make visible rather than to commit.
  // Which directory claimed each id, so a second claimant can be NAMED rather
  // than dropped. `seen` was a bare Set of basenames and its `continue` was
  // the whole bug: two directories wanting one id was indistinguishable from
  // the same directory seen twice.
  const claimedBy = new Map<string, string>();
  for (const dir of skillMdDirs()) {
    if (!existsSync(join(ROOT, dir))) continue;
    const id = packageIdFor(dir);
    const prior = claimedBy.get(id);
    if (prior !== undefined) {
      // NOT a silent skip. One node is still emitted — dropping it would
      // dangle every `inPackage` edge pointing at it — but the graph no
      // longer pretends the second directory does not exist.
      if (prior !== dir) {
        problems.push(
          `two skill directories claim package id "${id}": ${prior} and ${dir}. ` +
            `A package's id comes from its manifest's \`name\`, or from its directory ` +
            `basename when it declares none — so give one of them a manifest that ` +
            `names it, rather than letting both resolve to the same node.`,
        );
      }
      continue;
    }
    claimedBy.set(id, dir);
    nodes.push({
      "@id": makeIri(doc, "package", id),
      "@type": termIri("SkillPackage"),
      name: id,
      path: dir,
      hasManifest: existsSync(join(ROOT, dir, "package-manifest.json")),
    });
  }

  const skillsRoot = join(ROOT, "skills");
  // Hoisted: `unpublishedSkills` walks every declared skill directory, so
  // calling it inside the filter below would re-read the corpus once per
  // package entry.
  const declaredUnpublished = unpublishedSkills(ROOT);
  if (!existsSync(skillsRoot)) return nodes;
  for (const d of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const mf = join(skillsRoot, d.name, "package-manifest.json");
    if (!existsSync(mf)) continue;
    try {
      const m = JSON.parse(readFileSync(mf, "utf-8")) as Record<string, unknown>;
      // The SAME id the stub loop minted — from the manifest's `name`, via the
      // one resolver. Composing `d.name` here was harmless only because every
      // package under `skills/` happens to sit in a directory of its own name;
      // the moment one does not, this pushed a second node beside the stub
      // instead of replacing it (bean `r1vw`).
      const id = packageIdFor(`skills/${d.name}`);
      const iri = makeIri(doc, "package", id);
      // Replace the stub emitted above with the manifest-backed node.
      const stubAt = nodes.findIndex((n) => n["@id"] === iri);
      if (stubAt !== -1) nodes.splice(stubAt, 1);
      nodes.push({
        "@id": iri,
        "@type": termIri("SkillPackage"),
        name: m.name ?? d.name,
        version: m.version,
        description: m.description,
        path: `skills/${d.name}`,
        hasManifest: true,
        // Links, so a consumer can walk package → skill without string surgery.
        // Filtered too: an edge to a stripped node is a dangling reference
        // that still spells the name it was meant to remove.
        declaresSkill: ((m.skills as string[]) ?? [])
          .filter((n) => isPublishedSkill(n) && !declaredUnpublished.has(n))
          .map((n) => makeIri(doc, "skill", n)),
        providesCapability: ((m.providesCapabilities as string[]) ?? []).map((c) => makeIri(doc, "capability", c)),
        requiresCapability: ((m.requiresCapabilities as string[]) ?? []).map((c) => makeIri(doc, "capability", c)),
      });
    } catch (e) {
      problems.push(`unparseable manifest skills/${d.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return nodes;
}


/**
 * Stamp every node with the DECLARED DIRECTORY it came from.
 *
 * The owner, 2026-09-20, on the KG viewer: *"should show hierarchy of named
 * subgraphs in the harness instance(s) ... I should see ability to filter by
 * bootstrap/ cat-harness/ f-a-core/ f-a/ etc."* A reader cannot filter by
 * something no node says, and until now no node said it: a skill carried
 * `instructionsPath`, a schema carried `module`, and which *declared graph*
 * either belonged to had to be re-derived by whoever looked.
 *
 * ## Derived from the declaration, in one pass, rather than threaded
 *
 * Every emitter could have been given the id. That is nine call sites to keep
 * in step, and the tenth emitter added next week is the one that forgets —
 * which is the shape this repository keeps paying for. Here the mapping is
 * computed ONCE from `declaredGraphs()`, so a directory that moves takes its
 * stamp with it and a directory that is added is covered without touching this
 * function.
 *
 * ## Longest prefix wins, and that is load-bearing
 *
 * `src/skills/` sits inside `src/`, and `processes/` inside `skills/`.
 * Matching the first declaration that fits would file a workflow under the
 * skills graph. Sorting by descending path length makes the most specific
 * declaration win, which is the same rule a router uses and the same one
 * `resolveDirectories` relies on for overrides.
 *
 * A node whose path matches no declared directory is left UNSTAMPED rather
 * than bucketed into a default — "could not determine" is a distinct answer
 * from "belongs to the root graph", and the viewer shows it as its own facet
 * so the gap is visible instead of absorbed.
 */
function stampSubgraph(graph: Node[], doc: string, instanceRoot: string = ROOT): void {
  // THE INSTANCE BEING EXPORTED, not the module-level `ROOT`.
  //
  // It read `ROOT` on both lines until 2026-09-21, so exporting ANOTHER
  // instance stamped its nodes with THIS instance's directory ids wherever the
  // two share a relative path. `bootstrap/scenarios/` and
  // `cat-harness/scenarios/` are both `scenarios`, so bootstrap's
  // own directory node came out carrying `inSubgraph ->
  // bootstrap.jsonld#directory/cat-harness-roles` — an id from the other
  // instance, in a document that does not define it, which the dangling-link
  // check caught as soon as the second `scenarios/` was declared.
  //
  // One instance's graph must not carry another's nodes
  // (`instance-graph-isolation.test.ts`, guarding a live leak of 88
  // references). This is that rule in the facet that says WHICH SUBGRAPH a
  // node came from — the one place where getting the root wrong produces a
  // plausible id rather than a missing one.
  const dirs = declaredGraphs(instanceRoot)
    .filter((d) => d.absPath !== undefined)
    .map((d) => ({ id: d.id, rel: relative(instanceRoot, d.absPath!).replace(/\\/g, "/").replace(/\/$/, "") }))
    // `..` is KEPT, and dropping it is what made this facet useless.
    //
    // Every repository-scoped entry — `who-iris/`, `folio-assistant-core/`,
    // `bootstrap/`, `detangle/`, `large-datasets/`, `who-style-guide/` —
    // resolves to `../<instance>/…` relative to this instance, so
    // `!startsWith("..")` excluded the entire set the facet exists to offer.
    //
    // MEASURED after the fact, which is the part worth recording: the facet
    // rendered, was screenshotted, and was reported as working, while its
    // values were `cat-harness` (1,267 nodes) and a handful of this instance's
    // own directories. Not one sibling instance appeared. The owner had asked
    // to "filter by bootstrap/ cat-harness/ f-a-core/ etc"; the thing shipped
    // could not.
    //
    // A path that leaves the instance is still a path this graph carries —
    // `schema-nodes.ts` mints `../folio-assistant-core/schemas/…` — so the
    // comparison below matches in the same space rather than excluding it.
    .filter((d) => d.rel.length > 0)
    .sort((a, b) => b.rel.length - a.rel.length);

  const PATH_KEYS = ["instructionsPath", "module", "sourcePath", "path"] as const;
  for (const n of graph) {
    let p: string | undefined;
    for (const k of PATH_KEYS) {
      const v = n[k];
      if (typeof v === "string" && v.length > 0) { p = v.replace(/\\/g, "/"); break; }
    }
    if (p === undefined) continue;
    const hit = dirs.find((d) => p === d.rel || p!.startsWith(d.rel + "/"));
    if (hit) n.inSubgraph = makeIri(doc, "directory", hit.id);
  }

  // INHERIT through `partOf`, for the nodes that have no path of their own.
  //
  // A Process carries `sourcePath`; the 1,092 ProcessNodes and SequenceFlows
  // inside it do not — they are parts of a diagram, not files. Measured before
  // this loop: 301 of 1,642 nodes stamped, and the 1,341 left were almost all
  // process internals whose subgraph is simply their parent's.
  //
  // Iterated to a fixed point rather than done once, because `partOf` nests
  // (a flow belongs to a process which belongs to a package), and a single
  // pass would stamp only the first level. It terminates: every pass either
  // stamps at least one node or stops.
  const byIri = new Map(graph.map((n) => [String(n["@id"]), n]));
  for (;;) {
    let stamped = 0;
    for (const n of graph) {
      if (n.inSubgraph !== undefined) continue;
      const parent = n.partOf;
      const parentIri = Array.isArray(parent) ? parent[0] : parent;
      if (typeof parentIri !== "string") continue;
      const sub = byIri.get(parentIri)?.inSubgraph;
      if (typeof sub === "string") { n.inSubgraph = sub; stamped += 1; }
    }
    if (stamped === 0) break;
  }
}

async function collectProcesses(
  doc: string,
  problems: string[],
  root: string = ROOT,
  /**
   * Determined empties. SEPARATE from `problems` because they are different
   * facts with different consequences: a problem means this instance's graph
   * could not be exported correctly, a note means it was exported correctly
   * and something it might have had, it has none of.
   *
   * Optional so the two existing callers keep compiling; a caller that does
   * not pass one still gets the finding, in `problems`, which is the old
   * behaviour and the safe default for a sink nobody is reading.
   */
  notes?: string[],
): Promise<Node[]> {
  const nodes: Node[] = [];
  const lanes = new Set<string>();
  const dirs = findBpmnDirs(root);
  // Zero diagrams is a determined empty ONLY if we looked. Say which.
  //
  // AND AN INSTANCE THAT DECLARES NO `kg` DIRECTORY HAS NOTHING TO LOOK IN.
  // `workflowDirs` searches the instance's declared `kg` directories, so for
  // an instance declaring none it returns `[]` for a reason that is not
  // "nothing was found" but "there was nowhere to look, by the instance's own
  // declaration". Reporting the first as the second turned a determined empty
  // into a FAILURE: measured 2026-09-20, the repository root — which declares
  // `uploads/` and nothing else — failed `check:instance-render` on this
  // message alone, with 1 node of its own rendered and published and no other
  // complaint. A gate that fails an instance for not having a kind of graph it
  // never claimed is asking it to declare something to stay green, which is
  // how a declaration stops meaning anything.
  //
  // REPO-RELATIVE, not absolute: this string is written into a PUBLISHED
  // artefact, and an absolute path differs between a developer's machine and
  // CI — so it would leak a runner's filesystem layout into a public document
  // and change on every build.
  //
  // It said "a COMMITTED artefact (`bootstrap/bootstrap.jsonld`) ... so its
  // staleness gate would fail on a tree nobody touched". **That file is not
  // committed and has no staleness gate.** `.gitignore:108` ignores it
  // deliberately — it was committed once, on a rationale citing a README step
  // that no prose file under `bootstrap/` actually contains, and it was 52 %
  // of `bootstrap/` by line count. `docs-site.yml:274` builds it into
  // `_site/bootstrap/bootstrap.jsonld` at render time instead.
  //
  // The CHOICE was right and its stated reason was not, which is the worse
  // failure of the two: a reader checking the claim finds no gate, concludes
  // the constraint is imaginary, and makes the path absolute. The real reason
  // is above, and it does not depend on where the file is stored.
  //
  // A DECLARED DIRECTORY HOLDING NO DIAGRAMS IS A NOTE, NOT A PROBLEM, and
  // until 2026-09-20 it was a problem. It has to be SAID either way —
  // `instance-graph-isolation.test.ts` puts it exactly right, "it says it
  // found none, rather than passing over in silence" — but saying it and
  // FAILING the instance for it are different things, and only the first was
  // ever wanted. Three instances arrived at once (`kg-navigation`,
  // `large-datasets`, `who-iris`), each holding one skill and no workflow,
  // each rendering its nodes, each failed on this message alone. A skills
  // package with no process is an ordinary thing; requiring a diagram to stay
  // green is asking an instance to carry something it never claimed.
  //
  // AND THE SAME DISTINCTION ONE LEVEL DOWN, which is what this asked for
  // until 2026-09-20: a declared `kg` directory that HOLDS NO DIAGRAMS is a
  // determined empty, not a failure. The condition above read
  // `dirs.length === 0 && kgDirectories(root).length > 0` — "declares a
  // knowledge graph and no .bpmn was found" — which is only a defect if
  // declaring a knowledge graph meant declaring PROCESSES. It does not. An
  // instance declaring `skills/` claims skills; a skills package with no
  // workflow is an ordinary thing and three arrived at once
  // (`kg-navigation`, `large-datasets`, `who-iris`), each holding one skill,
  // each rendering its nodes, each failed on this message alone.
  //
  // That is the same shape the paragraph above rejects, one level in: asking
  // an instance to carry a diagram it never claimed in order to stay green.
  // The `dh4f` case it was reaching for — a declared directory nothing scans
  // — is real and is caught by the ABSENCE check, which now runs over the
  // DECLARED directories rather than only over the ones already known to hold
  // a diagram. Before this it could not fire for a diagramless directory at
  // all: `findBpmnDirs` never returned one, so the loop below never saw it.
  // NOT `kgDirectories`, and that distinction is the whole check.
  //
  // `kgDirectories` ends with `.filter((d) => existsSync(d.absPath))`, so an
  // absent directory is gone from its result and an absence check written
  // over it can never fire. I wrote exactly that first, and it reported a
  // clean run while `kg-navigation/skills/` was moved out from under it —
  // a vacuous guard offered as the replacement for the one being removed,
  // which is worse than removing it with nothing in its place.
  //
  // Reading the DECLARATION is the only way to compare what was claimed
  // against what is there, because the filtered view has already thrown the
  // discrepancy away.
  if (dirs.length === 0 && kgDirectories(root).length > 0) {
    (notes ?? problems).push(
      `no directory containing .bpmn files was found under ${relative(ROOT, root) || "."}`,
    );
  }

  // NOT `kgDirectories`, and that distinction is the whole check.
  //
  // `kgDirectories` ends with `.filter((d) => existsSync(d.absPath))`, so an
  // absent directory is gone from its result and an absence check written
  // over it can never fire. I wrote exactly that first, and it reported a
  // clean run while `kg-navigation/skills/` was moved out from under it —
  // a vacuous guard offered as the replacement for the one being softened,
  // which is worse than softening it with nothing in its place.
  //
  // Reading the DECLARATION is the only way to compare what was claimed
  // against what is there, because the filtered view has already thrown the
  // discrepancy away. This is the `dh4f` case the old condition was reaching
  // for and could not reach: before this, a declared-but-absent directory and
  // a declared-but-diagramless one produced the SAME message, so the test
  // named "a declared-but-ABSENT directory is reported" passed while its
  // fixture created the directory.
  for (const d of resolveDirectories([{ name: "(local)", root, own: true }])) {
    // All four spellings of "this is harness knowledge-graph content": the
    // umbrella, plus the three kinds split out of it on 2026-09-21. Testing
    // only the umbrella here would have quietly narrowed this sweep to the
    // mixed `["schemas","cat-harness"]` entries the moment the split landed —
    // a declared-but-absent skills directory would have stopped being
    // reported, which is the `dh4f` shape this very loop exists to catch.
    if (!d.graphKinds.some((k) => KG_CONTENT_GRAPH_KINDS.includes(k))) continue;
    if (!existsSync(d.absPath)) {
      problems.push(`declared knowledge-graph directory is absent: ${d.path}`);
    }
  }
  for (const rel of dirs) {
  const dir = join(root, rel);
  // A directory that was found and then vanished, or one a declaration names
  // and the tree does not carry, is a FINDING rather than a crash — and
  // rather than a silent skip, which is the `dh4f` shape.
  if (!existsSync(dir)) {
    problems.push(`declared workflow directory is absent: ${rel}`);
    continue;
  }
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".bpmn")) continue;
    const path = join(dir, f);
    try {
      const m = await loadProcessModel(path);
      nodes.push({
        "@id": makeIri(doc, "process", m.id),
        "@type": termIri("Process"),
        name: m.name,
        enforcement: m.enforcement,
        sourcePath: relative(root, m.source),
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
          "@type": termIri("SequenceFlow"),
          name: f.name,
          partOf: makeIri(doc, "process", m.id),
          from: makeIri(doc, "process", `${m.id}/node/${f.from}`),
          to: makeIri(doc, "process", `${m.id}/node/${f.to}`),
        });
      }
      // A lane IS a role, and `performedBy` points at it. Minting the link
      // without emitting the node left all 328 of them dangling.
      //
      // Read from the DECLARED lane set, not from the lanes flow nodes happen
      // to name. An `actedUpon` lane holds no activities by construction — it
      // is written to and never acts — so deriving lanes from node references
      // drops exactly the lanes whose emptiness is the point. Measured: the
      // `log` role's `bindsLane` was the one dangling link in the graph.
      for (const lane of m.lanes) {
        const name = lane.name ?? lane.id;
        if (lanes.has(name)) continue;
        lanes.add(name);
        nodes.push({
          "@id": makeIri(doc, "role", name),
          "@type": termIri("Role"),
          name,
          // NOT `source`: a Process's `source` is the file it was read from,
          // and this is a provenance KIND. One term over both would assert
          // that `bpmn-lane` is a path.
          sourceKind: "bpmn-lane",
        });
      }
      for (const n of m.nodes.values()) {
        nodes.push({
          "@id": makeIri(doc, "process", `${m.id}/node/${n.id}`),
          "@type": termIri("ProcessNode"),
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
/**
 * The document IRI a skill's node lives in — this one, or a sibling's.
 *
 * ## Why a Tool may name a skill this document does not contain
 *
 * `gn4l`: the Tool nodes for `discussion` and `log-message` live in
 * cat-harness because a Tool is cat-harness's vocabulary and bootstrap may
 * not import it — recorded there as *a limitation rather than a decision*,
 * with the nodes moving unchanged once tool collection stops being
 * import-bound. The SKILLS live in bootstrap so an Initiator can read them
 * with nothing installed. So the edge crosses instances by construction.
 *
 * While cat-harness declared `bootstrap/skills/` the crossing was hidden:
 * both ends landed in one document. The owner's `pve3` ruling of 2026-09-21
 * ("neither") removed that declaration, and a link minted into THIS document
 * then pointed at a node no document contains.
 *
 * ## An unknown skill still gets THIS document's IRI
 *
 * Deliberately. A skill nothing declares is a genuine dangling link and must
 * keep reading as one — inventing a plausible foreign IRI for it would turn a
 * reported defect into a link that merely 404s later, which is the harder
 * failure to find. Only a skill some instance DOES declare is re-homed.
 */
function skillHome(base: string, ownDoc: string, skillId: string): string {
  // THIS DOCUMENT WINS WHENEVER IT HAS THE SKILL, and that check has to come
  // first rather than fall out of iteration order.
  //
  // Without it, a skill declared by BOTH this instance and a sibling is
  // exiled to the sibling's document — the node is right here and the link
  // points elsewhere. Measured when this was written the other way round:
  // `agent-skills.jsonld` and `kg-navigation.jsonld` appeared as link targets
  // because those instances declare ids cat-harness also declares, and the
  // published-paths walk in `kg-export.test.ts` caught it as two documents
  // the deploy does not write.
  if (knownSkills(ROOT).has(skillId)) return ownDoc;
  for (const instance of instanceRootsIn(repoRootFor(ROOT))) {
    if (resolve(instance) === resolve(ROOT)) continue;
    if (!knownSkills(instance).has(skillId)) continue;
    return exportIdentity({ baseUrl: base, instanceRoot: instance }).docIri;
  }
  return ownDoc;
}

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
    "@type": termIri("Tool"),
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
    satisfies: t.satisfies.map((k) => makeIri(skillHome(base, doc, k), "skill", k)),
    // `satisfiesSkillNames` was here. REMOVED as denormalised: every
    // `satisfies` link lands on a Skill node carrying that same name, and none
    // of them dangles — see {@link skillHome} for the ones that land in
    // ANOTHER instance's document, which is still a resolvable node rather
    // than a dangling link.
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
 * `harness.json` has declared `schemas/` with `graphKinds: ["schemas", "kg"]`
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

  return audit.nodes
    .filter((m) => isPublishedSchemaModule(m.name))
    .map((m) => ({
    "@id": makeIri(doc, "schema", m.name),
    "@type": termIri("Schema"),
    name: m.name,
    title: m.summary,
    module: m.module,
    maintainedBy: keeper.get(m.module),
  }));
}

/**
 * The DECLARED roles, from `scenarios/roles.json`.
 *
 * **Role nodes used to come only from BPMN lane names**, and that left the
 * role model itself out of the graph. Measured 2026-09-19: 65 of 66 Role
 * nodes carried `sourceKind: "bpmn-lane"`, so what a role IS — which actor
 * kinds may fill it, which skills it carries, whether it is `actedUpon` —
 * was nowhere in the published KG. `roles.json` is the declaration and was
 * not a source at all.
 *
 * The gap bites hardest on exactly the roles the lane heuristic cannot see.
 * An `actedUpon` role is written to and never acts, so its lane carries no
 * flow node, so no node names it, so it was never emitted: `corpus` and
 * `log` were both absent while `work-plan` happened to be present only
 * because some other diagram gave its lane an activity.
 *
 * Lane-derived nodes are kept as they were — they are keyed by lane name and
 * other links point at them — and a declared role that claims a lane links
 * to it with `bindsLane`, so the two views join rather than compete.
 */
function collectDeclaredRoles(doc: string, root: string = ROOT): Node[] {
  // EVERY declared `kg` root, not the literal `skills/` and not the first one
  // that answers. `kgRoots` is explicit that taking the first is the `dh4f`
  // defect arriving through the helper written to prevent it: a topical
  // layout (`bootstrap/`, `crdm/`) would report a clean run over the roots
  // this never visited. First declaration of a role id wins, so a later root
  // cannot silently redefine one.
  const roles: RoleDef[] = [];
  const seen = new Set<string>();
  for (const kgRoot of kgRoots(root)) {
    for (const r of readRoleGraph(kgRoot)?.roles ?? []) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      roles.push(r);
    }
  }
  return roles.map((r) => ({
    "@id": makeIri(doc, "role", r.id),
    "@type": termIri("Role"),
    name: r.id,
    title: r.title,
    description: r.description,
    sourceKind: "role-registry",
    actorKinds: r.actorKinds,
    actedUpon: r.actedUpon,
    judgementOnly: r.judgementOnly,
    // Links, so a consumer can walk role -> skill without string surgery.
    hasSkill: (r.skills ?? []).map((n) => makeIri(doc, "skill", n)),
    bindsLane: (r.lanes ?? []).map((l) => makeIri(doc, "role", l)),
  }));
}

function collectGraphKinds(root: string = ROOT): Node[] {
  // `fsh-guts` and anything else in UNPUBLISHED_GRAPH_KINDS never reaches a
  // published graph. Filtered HERE, where the document is built, rather than
  // at upload: a strip that runs only on the happy path leaves a graph that
  // LOOKS clean and is not. Bean `folio-assistant-uv09`.
  const published = defaultGraphKinds.names().filter(isPublishedGraphKind);

  // ── EMIT ONLY WHAT THIS INSTANCE DECLARES.
  //
  // `defaultGraphKinds` is the UNIVERSAL registry — every kind any layer
  // defines. Emitting all of it into every instance's graph made `bootstrap`,
  // whose whole premise is that it knows nothing yet, publish 16 GraphKind
  // nodes when its declaration names exactly ONE (`cat-harness`, across both
  // its directories). It advertised `folio`, `voices` and `library` — core's —
  // and `beans` and `todos` — cat-harness's — none of which it can reach.
  //
  // The comment below already recorded the layering ("`voices` and `library`
  // are core's") without acting on it; this is the missing half. A bootstrap
  // that names a vocabulary it cannot resolve is the same defect as a `@type`
  // that does not dereference (`blv9`), one level up: the node is there, and
  // nothing behind it is.
  //
  // Reuses `declaredKinds` rather than re-deriving: it already follows the
  // NESTED declarations (`beans/beans.json` naming `bean-defs` and
  // `workflow-state`), which a plain read of `directories[].graphKinds` misses —
  // and missing them here would drop kinds the instance really does own.
  //
  // Falls back to the full set when there is no declaration, because an
  // undeclared instance has said nothing about what it owns, and reporting
  // that as "owns nothing" would be a clean run over an empty set.
  const decl = readDeclaration(root);
  const owned = decl ? declaredKinds(root, decl) : undefined;
  const emitted = owned ? published.filter((n) => owned.has(n)) : published;

  return emitted.map((name) => {
    const def = defaultGraphKinds.get(name)!;
    return {
      // The instance sits in the SAME namespace as the class it instantiates,
      // which is not always the harness's: `cat-harness` and `schemas` are
      // bootstrap's kinds, `voices` and `library` are core's. Derived from the
      // kind's own `type` rather than chosen here, so the two cannot drift.
      "@id": `${graphKindNamespace(name)}graphKind/${name}`,
      "@type": termIri("GraphKind"),
      name,
      typeIri: def.type,
      renderable: def.renderable,
      summary: def.summary,
    };
  });
}

/**
 * An instance's DECLARED ASSETS, as nodes.
 *
 * ## They were declared and then dropped
 *
 * `harness.json` gives each asset an id, a `src`, a `role`, a title and a
 * description, and `declaredAssets` reads and validates them — but no
 * collector emitted them, so that data reached `check-declared-assets` and
 * nothing else. An instance could declare what its files ARE and have none of
 * it appear in its own graph.
 *
 * ## Measured: it was the difference between rendering and failing
 *
 * 2026-09-20, `folio-assist-core` is a stub — a `README.md` and a declaration
 * naming it, `directories: []`. It rendered **zero** nodes and
 * `check:instance-render` failed it on "an empty graph is a failure, not an
 * empty success". That verdict was right about the graph and wrong about the
 * instance: core had declared exactly one thing about itself, and the exporter
 * discarded it. The empty graph was manufactured here.
 *
 * This is also what makes the harness layer's floor checkable. CatBootstrap owes
 * its `.json`/`.jsonld` — *"that is its existence"* — and an existence claim
 * whose declared assets are dropped is thinner than the declaration that
 * produced it.
 *
 * `exists` is carried through rather than filtered on: a declared asset whose
 * file is absent is a FINDING that `check-declared-assets` already raises, and
 * silently omitting it here would hide the node whose absence is the point.
 */
function collectDeclaredAssets(doc: string, problems: string[], root: string = ROOT): Node[] {
  let assets: ReturnType<typeof declaredAssets>;
  try {
    assets = declaredAssets(root);
  } catch (e) {
    problems.push(`unreadable declaration for assets: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
  return assets.map((a) => ({
    "@id": makeIri(doc, "asset", a.id),
    "@type": termIri("Asset"),
    name: a.id,
    path: a.src,
    assetRole: a.role,
    title: a.title,
    description: a.description,
  }));
}

function collectDeclaration(doc: string, problems: string[], root: string = ROOT): Node[] {
  const f = declarationPathIn(root)!;
  if (!existsSync(f)) return [];
  try {
    const d = JSON.parse(readFileSync(f, "utf-8")) as {
      title?: string;
      description?: string;
      directories?: Array<{
        id: string;
        path: string;
        graphKinds?: string[];
        title?: string;
        description?: string;
      }>;
    };
    // Same exclusion on the other emitter: a declared directory holding an
    // unpublished kind would otherwise put the trashcan's id, path and
    // description into the graph, plus a `holdsGraph` edge pointing at it.
    return (d.directories ?? []).filter(isPublishedDirectory).map((x) => {
      // `graph` became `graphs[]` — a directory may hold more than one graph,
      // and `schemas/` is the first real use of that. Both spellings are read
      // so this does not break on a declaration written before the change.
      const kinds = x.graphKinds ?? [];
      return {
        "@id": makeIri(doc, "directory", x.id),
        "@type": termIri("Directory"),
        name: x.id,
        path: x.path,
        holdsGraph: kinds.map((k) => `${graphKindNamespace(k)}graphKind/${k}`),
        // `graphKinds: kinds` was here. REMOVED as denormalised: `holdsGraph`
        // lands on a GraphKind node whose `name` is the kind, and the export's
        // own test already asserts every one of those links resolves.
        title: x.title,
        description: x.description,
      };
    });
  } catch (e) {
    problems.push(`unparseable declaration: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

/** Every term in the context that is declared `{"@type": "@id"}`. */
const LINK_TERMS = [
  "partOf", "implementedBy", "performedBy", "declaresSkill", "inPackage", "inSubgraph",
  "providesCapability", "requiresCapability", "holdsGraph", "startNode",
  "incoming", "outgoing", "from", "to", "satisfies", "hasCapability",
  "hasSkill", "bindsLane",
] as const;

/**
 * Links pointing at nodes this document does not contain.
 *
 * Only *internal* fragments are checked — a link to another document's IRI is
 * not this graph's business and reporting it would be noise. `holdsGraph`
 * points at a graph-kind IRI in the namespace, which is a vocabulary term
 * rather than a node here, so it is excluded by the same rule.
 */
/**
 * What a collector reads, and therefore which instances it can serve.
 *
 * Measured 2026-09-19 (bean `gn4l`) by reading each collector rather than
 * trusting its name. The distinction is NOT "does it mention `ROOT`" — two of
 * the instance-bound ones do not.
 */
export const COLLECTOR_SCOPE = {
  /** Reads only DECLARED directories, so any instance with a declaration works. */
  generic: ["skills", "processes", "declaredRoles", "declaration"],
  /** Reads nothing instance-specific at all — the global graph-kind registry. */
  universal: ["graphKinds"],
  /**
   * Bound to THIS repository, and each for a different reason:
   *
   * - `registry` — `.claude/skills/<group>` as a path literal.
   * - `packages` — `package-manifest.json` plus directories named in code.
   * - `schemas` — `auditSchemaNodes`, which audits this repo's `schemas/`.
   * - `tools` — **compile-time `import`** of `tools/index.ts`. This one is the
   *   sharpest: it is not root-hardcoded, it is IMPORT-BOUND, so threading a
   *   root through it reaches nothing. It would need the tool set passed in.
   */
  instanceBound: ["registry", "packages", "schemas", "tools"],
} as const;

/**
 * The nodes ANY declared instance contributes — bootstrap included.
 *
 * ## Why this exists rather than a `--root` flag
 *
 * A flag reads like the fix and is not. `kg-export` was never merely rooted at
 * this repository; it is **written for its shape**. Adding `--root` and
 * calling the whole pipeline would make it export a minimal instance *as if
 * that instance were folio-assistant* — walking `.claude/skills/`, demanding a
 * `package.json`, auditing schema nodes it does not have, and serving
 * folio-assistant's own compiled-in tools as though they were its.
 *
 * So the seam is drawn by **what a collector reads**, per
 * {@link COLLECTOR_SCOPE}, and this function is the generic side of it.
 *
 * ## An absent section is NOT an audited-empty one
 *
 * `omitted` names every instance-bound collector that was not run, so a
 * consumer can tell "this instance has no tools" from "tools were never
 * looked for". Rendering the second as the first is the `dh4f` defect — a
 * consumer scanning nothing and reporting a clean run over it — and it is the
 * specific risk of exporting a minimal instance through machinery built for a
 * maximal one.
 */
export async function collectInstanceNodes(
  root: string,
  doc: string,
  base: string,
  problems: string[],
): Promise<{ nodes: Node[]; omitted: readonly string[]; notes: string[] }> {
  const notes: string[] = [];
  const nodes = [
    ...collectSkills(doc, base, problems, root),
    ...(await collectProcesses(doc, problems, root, notes)),
    ...collectGraphKinds(root),
    ...collectDeclaredRoles(doc, root),
    ...collectDeclaration(doc, problems, root),
    ...collectDeclaredAssets(doc, problems, root),
  ];
  // A LINK TO AN OMITTED COLLECTOR'S NODES MUST NOT BE EMITTED.
  //
  // `collectSkills` puts `inPackage` on every skill, and the package nodes are
  // minted by `collectPackages` — which is instance-bound and therefore NOT
  // run here. Left in place that is 7 dangling links in bootstrap's
  // export, measured: every skill pointing at `#package/skills` or
  // `#package/render`, neither of which this document can contain.
  //
  // Stripped rather than faked: emitting a package node the generic path did
  // not collect would assert membership of something nobody enumerated. The
  // omission is already reported through `omitted`, so a reader can tell
  // "this instance has no packages" from "packages were never looked for" —
  // which is the distinction that would be lost by silently keeping a link
  // that happens to resolve in a different document.
  //
  // Found because the FIRST reading of this was vacuous: `danglingLinks` is
  // computed but not written into the published document, so reading the file
  // and defaulting an absent key to `[]` reported zero. The in-memory export
  // says seven. A default that stands in for an absent field is not an
  // answer.
  for (const n of nodes) if ("inPackage" in n) delete (n as Record<string, unknown>).inPackage;

  return { nodes, omitted: COLLECTOR_SCOPE.instanceBound, notes };
}

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
export function compact(n: Node): Node {
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
  /**
   * The instance whose identity this is — defaults to the one this module
   * lives in.
   *
   * `collectInstanceNodes` has taken a root since `gn4l` separated the generic
   * collectors from the instance-bound ones, but IDENTITY did not follow it:
   * `exportIdentity` read `ROOT` unconditionally, so every instance's nodes
   * were minted into THIS instance's document IRI. That was invisible while
   * only one document was ever built.
   *
   * It stops being invisible the moment one graph must REFERENCE another —
   * bean `pve3`, where a Tool in cat-harness satisfies a skill published in
   * bootstrap's graph and the link has to name bootstrap's document.
   */
  instanceRoot?: string;
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
  /**
   * The document's path under the publication base — and under `_site/`,
   * which is the same thing because `_site/` is served at the base.
   *
   * Returned rather than recomposed from `stub`, for the reason `base` is:
   * `<stub>.jsonld` is right for the host instance and WRONG for a foreign
   * one, which sits at `<stub>/<stub>.jsonld` (bean `dyd3`). A caller that
   * rebuilds it from the stub gets the host's answer for every instance, and
   * the QA sidecar did exactly that — naming its findings' subject as a
   * document at a path nothing writes.
   */
  docPath: string;
  /** The canonical document's IRI, when one is declared. */
  canonicalIri?: string;
  /** True when this export is published somewhere other than canonical. */
  isPreview: boolean;
  /**
   * The instance directory this export is OF — `opts.instanceRoot` resolved,
   * or this one.
   *
   * Returned for the same reason `base` is: a caller that needs to say which
   * declaration was consulted would otherwise repeat the `?? ROOT` default,
   * and a second copy of a default is a second chance to disagree with it.
   */
  instanceDir: string;
  /** Is this an instance other than the one the exporter lives in? */
  foreignInstance: boolean;
  /**
   * Is that instance one THIS repository publishes?
   *
   * Returned rather than recomputed because the caller's diagnostic turns on
   * it, and a second path-boundary comparison is a second chance to write
   * `startsWith` and call `/repo-other` a child of `/repo`.
   */
  publishedHere: boolean;
} {
  const instance = opts.instanceRoot ?? ROOT;
  // Foreign = an instance other than the one this exporter lives in. The same
  // test `buildExport` uses to pick the generic collectors, so the identity
  // and the content cannot disagree about which instance this is.
  const foreignInstance = opts.instanceRoot !== undefined && resolve(opts.instanceRoot) !== resolve(ROOT);
  const decl = readDeclaration(instance);
  // `package.json` is the REPOSITORY's and is the fallback stub for an
  // instance that declares nothing, so it is read from the repo root rather
  // than from `instance` — a nested instance has none, and reading one from
  // there would throw on exactly the instances this parameter exists for.
  const pkg = JSON.parse(readFileSync(join(repoRootFor(ROOT), "package.json"), "utf-8")) as { name?: string };
  const stub = decl ? artefactStub(decl) : (pkg.name ?? "instance");
  // The publication base belongs to the SITE DOING THE PUBLISHING, not to the
  // instance whose graph is being exported — so a foreign instance that
  // declares no `canonicalUrl` of its own falls back to this one's.
  //
  // This is the same argument the `stub` line above already makes about
  // `package.json`, and not applying it here is what took `docs-site.yml` red
  // on `main` for every push between 11:31 and 14:0x on 2026-09-21 (bean
  // `40fl`). `bootstrap` declares no `canonicalUrl` DELIBERATELY — it has
  // no site of its own, as its own declaration says at length — but its graph
  // is published into THIS site, at `<base>/bootstrap.jsonld`, by the very
  // step that was failing. So "the exported instance declares no base" was
  // never the same question as "this document has no base".
  //
  // Fallback, never override: an instance that declares its own canonical URL
  // keeps it, because then the document really does belong somewhere else.
  //
  // AND ONLY FOR AN INSTANCE THIS REPOSITORY ACTUALLY PUBLISHES. The first
  // version of this fallback (mine, #718) had no such condition, and that was
  // wrong in the quiet direction: an instance root outside this checkout got
  // THIS site's base, so exporting `/tmp/outside` minted
  // `https://litlfred.github.io/folio-assistant/outside.jsonld` — a URL that
  // will never resolve, claiming a document this repository does not publish,
  // and reported as no problem at all. Measured, not reasoned: that is what
  // the command printed before this line existed.
  //
  // `bootstrap` inherits because it IS published here, by the deploy step
  // one function away. `/tmp/outside` is not, so the honest answer there is
  // the third state the next block already implements — a document-relative
  // `@id` plus a reported problem — because a base for it would be a guess
  // wearing the clothes of a fact. Same rule `makeIri` follows.
  //
  // A path-boundary comparison, never `startsWith`: `/repo-other` begins with
  // `/repo` and is not inside it.
  const repoRoot = resolve(repoRootFor(ROOT));
  const here = resolve(instance);
  const publishedHere = here === repoRoot || here.startsWith(repoRoot + sep);
  const ownCanonical = decl?.canonicalUrl ?? "";
  const publisherCanonical = ownCanonical || !publishedHere ? "" : (readDeclaration(ROOT)?.canonicalUrl ?? "");
  const canonicalBase = (ownCanonical || publisherCanonical).replace(/\/+$/, "");
  const base = (opts.baseUrl ?? canonicalBase).replace(/\/+$/, "");
  // No base declared → a document-relative IRI. Deliberately NOT a fabricated
  // absolute one: see makeIri's note on links that look dereferenceable.
  // `renderingPath` rather than a template literal: the `kg/` segment that used
  // to be here was written out in seven places, five of them minting an `$id`.
  // An empty base still yields a document-RELATIVE IRI, deliberately — see
  // `makeIri`'s note on links that look dereferenceable.
  // ── WHERE A FOREIGN INSTANCE'S DOCUMENT LIVES — `<base>/<stub>/<stub>.jsonld`
  //
  // The owner's URL-space rule (bean `x0hj`): the base IS one instance's
  // rendering, and **everything else is
  // `<baseurl>/<instantiated harness>/<path to rendered content>`** — with
  // `<baseurl>/bootstrap/bootstrap.jsonld` named as the worked example.
  //
  // So the host publishes at the root and a foreign instance publishes under
  // its own segment. This was `<base>/<stub>.jsonld` for both until `dyd3`,
  // which is how bootstrap's graph came to exist at TWO paths under TWO
  // `@id`s — 88 subjects with two identities no consumer would ever merge.
  // Measured 2026-09-21: the site-root path had the 2 links and violated the
  // rule; the `bootstrap/` path conformed and had none.
  const docPath = foreignInstance ? `${stub}/${stub}.jsonld` : `${stub}.jsonld`;
  const docIri = renderingPath(base, docPath);
  const canonicalIri = canonicalBase ? renderingPath(canonicalBase, docPath) : undefined;
  return {
    stub,
    docIri,
    base,
    docPath,
    canonicalIri,
    isPreview: canonicalIri !== undefined && docIri !== canonicalIri,
    instanceDir: instance,
    publishedHere,
    foreignInstance,
  };
}

export async function buildExport(opts: ExportOptions = {}): Promise<Export> {
  const problems: string[] = [];
  const {
    stub,
    docIri,
    base,
    canonicalIri,
    isPreview,
    instanceDir: exportedInstance,
    publishedHere: exportedInstancePublishedHere,
  } = exportIdentity(opts);

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
    //
    // NAMES THE FILE IT ACTUALLY LOOKED IN, resolved rather than spelled. This
    // message said `harness.json` until bean `40fl` — a filename excised by
    // #695 — so the one reader it exists for was sent to a file that is not
    // there, while the real declaration sat one rename away. A diagnostic that
    // names a retired path is worse than a bare one: it reads as specific.
    //
    // AND IT SAYS WHICH OF THE TWO REASONS APPLIES. "none declared by the
    // publishing instance" was true when the fallback was unconditional and
    // became false the moment it gained a boundary: for an instance outside
    // this checkout the host DOES declare a base, it simply does not extend
    // there. A diagnostic that names the wrong reason sends its reader to add
    // a `canonicalUrl` that is already present.
    const looked = declarationPathIn(exportedInstance);
    const where = looked
      ? relative(repoRootFor(ROOT), looked)
      : `${relative(repoRootFor(ROOT), exportedInstance)} (no declaration found)`;
    const why = exportedInstancePublishedHere
      ? ", and none declared by the publishing instance"
      : ", and it resolves outside this repository, so the publishing instance's base does not extend to it";
    problems.push(
      `no canonicalUrl in ${where}` +
        why +
        ", and no --base-url given: " +
        "@id values are document-relative and will not dereference",
    );
  }

  // ANOTHER instance's document is built from the GENERIC collectors only.
  //
  // `opts.instanceRoot` already gave this export bootstrap's identity —
  // its stub, its docIri. Running the list below unchanged would then fill
  // that document with THIS instance's content: cat-harness's 222 skills and
  // 55 processes published as `bootstrap.jsonld`. A graph that is wrong
  // about whose it is, under a name a consumer trusts.
  //
  // `COLLECTOR_SCOPE` already states which collectors are instance-bound and
  // why (`gn4l`, 2026-09-19), and `collectInstanceNodes` is the generic side
  // of that seam. So the branch is not a special case bolted on here — it is
  // the seam being used for the first time by something other than a test.
  const foreign = opts.instanceRoot !== undefined && resolve(opts.instanceRoot) !== resolve(ROOT);
  // Audited over the instance being exported, not over this one. For a
  // foreign instance that is honestly empty (bootstrap declares no
  // `schemas/`), where a hand-built empty object would be asserting the same
  // thing without having looked.
  const schemaAudit = auditSchemaNodes(foreign ? opts.instanceRoot! : ROOT);
  const instanceOnly = foreign
    ? await collectInstanceNodes(opts.instanceRoot!, docIri, base, problems)
    : undefined;
  const graph = (
    instanceOnly
      ? instanceOnly.nodes
      : [
          ...collectSkills(docIri, base, problems),
          ...collectRegistryNodes(docIri, problems),
          ...collectPackages(docIri, problems),
          ...(await collectProcesses(docIri, problems)),
          ...collectTools(docIri, base, problems),
          ...collectSchemas(docIri, base),
          ...collectGraphKinds(),
          ...collectDeclaredRoles(docIri),
          ...collectDeclaration(docIri, problems),
          ...collectDeclaredAssets(docIri, problems),
        ]
  ).map(compact);

  stampSubgraph(graph, docIri, exportedInstance);

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
    // Strip WHICHEVER namespace applies. A single `.replace(FOLIO_NS, "")`
    // silently left the full IRI as the key once the namespaces split, which
    // reads as a plausible-looking count under a very long label rather than
    // as an error.
    const t = stripNamespace(String(n["@type"]));
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
    "@type": isPreview ? [`${PROV}Entity`, termIri("PreviewGraph")] : `${PROV}Entity`,
    ...(isPreview && canonicalIri !== undefined ? { canonicalDocument: canonicalIri } : {}),
    repository: stub,
    ...(instanceOnly ? { omitted: instanceOnly.omitted } : {}),
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
  // `--instance <root>` exports ANOTHER declared instance's graph — its
  // identity and its generic collectors, never this one's content under its
  // name. Added because `pve3`'s "neither" ruling makes a sibling's graph a
  // document the root's own graph LINKS TO, and a link that names a document
  // nothing publishes is a 404 with a `@id` in front of it.
  const instanceRoot = arg("--instance");
  const { stub, docPath } = exportIdentity({ baseUrl, instanceRoot });
  // Named after the repository, per the stub convention — `<stub>.jsonld`,
  // never a generic `kg.json`. `.jsonld` because it IS JSON-LD; the extension
  // is what tells a fetcher to treat it as one.
  // `_kg/` is a REPOSITORY build output — gitignored at the repository root,
  // beside `node_modules/`, `_site/` and `test-results/`, and read from there
  // by the e2e specs and `test-server.mjs`, both of which run at that root.
  // `ROOT` became the INSTANCE root with the move (bean `wggr`), so this
  // default started writing `cat-harness/_kg/` while every reader still looked
  // one level up — and the stale pre-move copy at the old path made it look
  // fine locally.
const out = arg("--out") ?? join(repoRootFor(ROOT), "_kg", `${stub}.jsonld`);
  const data = await buildExport({ baseUrl, instanceRoot });

  mkdirSync(dirname(out), { recursive: true });
  // The staging stamp, from the same function `harness-schema-export` uses, so
  // the two documents a build publishes side by side cannot disagree about
  // which build they came from. It was an inline `bun -e` in
  // `feature-staging.yml` that reached this document and nothing else.
  // The PROJECTION, not the computation — the QA findings are written to
  // `test/results/` below instead. See `publishedDocument`.
  const published = { ...publishedDocument(data), ...stagingFields() };
  writeFileSync(out, JSON.stringify(published, null, 2) + "\n");

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
  const rootUndeclared = undeclaredRootTerms(published as unknown as Record<string, unknown>, data["@context"]);
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
  // ── ONE SIDECAR PER SUBJECT, because the stem is the only thing keeping
  //    two instances' findings apart ─────────────────────────────────────
  //
  // The stem was the constant `"kg-export"`, so EVERY instance's export wrote
  // the same committed file and the last writer won. Measured 2026-09-21: one
  // `--instance ./bootstrap` run replaced this instance's committed result
  // wholesale — `subject.id` flipped from `cat-harness.jsonld` to
  // `bootstrap.jsonld` and the findings with it, in a file whose whole
  // purpose is saying what was found about WHICH graph.
  //
  // Invisible while one document was ever built, and it stayed invisible in CI
  // because the deploy does not commit the sidecar. It surfaced the moment a
  // gate ran the deploy's own commands from a checkout.
  //
  // Same rule the `kg-qa` tree already follows — a sidecar mirrors its
  // subject's path "because flat would collide". The HOST keeps the bare stem
  // so its committed path is unchanged; a foreign instance is qualified by its
  // own stub.
  const hostStub = artefactStub(readDeclaration(ROOT)!);
  const qaStem = stub === hostStub ? "kg-export" : `kg-export.${stub}`;
  const resultPath = writeQaResult(ROOT, qaStem, buildQaResult({
    script: "scripts/kg-export.ts",
    scriptAbsPath: join(ROOT, "scripts", "kg-export.ts"),
    // `docPath`, not `${stub}.jsonld`: a foreign instance's document sits at
    // `<stub>/<stub>.jsonld` (bean `dyd3`), so composing it here named a
    // document nothing writes — in the file whose whole purpose is saying
    // what was found about WHICH graph.
    subject: { kind: "graph", id: docPath },
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
