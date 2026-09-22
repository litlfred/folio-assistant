---
# folio-assistant-ovkk
title: The @context declares 19 terms; the graph uses 53 — 3461 property occurrences are dropped by any JSON-LD processor
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T00:07:39Z
updated_at: 2026-09-19T05:53:12Z
parent: folio-assistant-zzmr
---


_2026-09-19T00:07:53Z_ — Found 2026-09-19 while building the kg-viewer (bean 1dfh) — the viewer is the first real consumer of the document, and a consumer is what makes this visible. MEASURED: bun run kg:export now reports it. 34 property names, 3461 occurrences, used in @graph and absent from @context. A term that is neither in the context nor an absolute IRI is not a property at all: a JSON-LD processor DROPS it. So the document is published as JSON-LD, is labelled JSON-LD, and loses nearly all of its property data the moment anything processes it as JSON-LD. Reading it as plain JSON shows everything, which is exactly why it went unnoticed. This is the same defect as inputSchema in PR #297, which was written, published and invisible for the same reason — that was one instance; there are 34. Worst offenders: bpmnType, implementsSkillNames, kind, laneName, relaxable, touchesWorkPlan (374x each, on ProcessNode); hasInstructions, hasIOContract, instructions, lines, packagePaths (143x each, on Skill); enforcement, nodeCount, flowCount (29x, on Process). NOT fixed in the viewer PR, deliberately: declaring a term means choosing a predicate IRI and deciding link-vs-literal, which is modelling work per property, and several of these (implementsSkillNames, satisfiesSkillNames, graphKinds, roles, permissions, capabilities) are DENORMALISED copies of link data whose right treatment is a design question rather than a mechanical one — they may want removing rather than declaring. What the viewer PR did do is make the gap impossible to miss: kg-export reports undeclaredTerms in the document and on stderr, and the viewer marks every affected property in its detail panel. SEPARATELY FIXED in that PR because it was fatal rather than lossy: 71 nodes carried both a JSON-LD keyword and its alias (Actor.id and Capability.id against @id, Actor.type against @type), from collectRegistryNodes spreading a registry file's own fields verbatim. A colliding keyword offers a processor two answers for a node's own identity. Renamed to localId and actorKind, with a keywordCollisions() guard that now fails the export.


---

*2026-09-19* — **PR [#330](https://github.com/litlfred/folio-assistant/pull/330)**
(branch `claude/ovkk-context-terms`), **not merged**, bean left open for the
owner's call.

**MEASURED against this tree** with `bun run kg:export`, not carried from the
text above: BEFORE **34** undeclared property names / **3583** occurrences, on 8
of 11 node types. AFTER **0**. `danglingLinks` 0 and `problems` 0 both before
and after; 1148 nodes either way. The 3461 recorded above is older than the
tree — the graph grew — which is the reason the brief says to re-measure.

**The decisions, so the next agent does not relitigate them:**

- **REMOVED as denormalised**, each only after its link form was shown to
  resolve for every node: `implementsSkillNames` (387), `laneName` (387),
  `packagePaths` (149), `satisfiesSkillNames` (27), `graphKinds` (7).
  `ambiguous` became the boolean flag it always meant rather than a second copy
  of the package list.
- **LINKS, with the VALUES minted** through `makeIri` — a bare name under
  `{"@type": "@id"}` resolves against the document base and invents an IRI:
  `hasCapability` (actor → capability, 20/20 resolve), `requiresCapability`
  (capability → capability, 12/12).
- **LITERALS because the referent is not a node here**: `roleName`,
  `permissionName` (`scenarios/roles.json` and
  `skills/permissions/permissions.json` are never collected, and the Role nodes
  that do exist are BPMN **lanes** under other names — 65 IRIs would have
  dangled), and `decisionRef` (no Decision nodes).
- **SPLIT where one name carried two relations**: `source` → `sourcePath` (a
  `.bpmn` path) + `sourceKind` (`bpmn-lane`); `requires` → `requiresCapability`
  + `requirements`. `install` stays ONE term (`@json`): heterogeneous *shape*,
  same relation.
- **`@json`** for `io`, `invoke`, `install`, `detection`, `meta`, `assignments`,
  `requirements`. Declaring a container term alone keeps the outer key and drops
  every inner one, which is worse than leaving it undeclared.

**The gate is on.** `kg-export` exits non-zero on an undeclared term, verified
by injecting one. That binds `docs-site.yml` and `feature-staging.yml`: both run
the exporter inside a `bash -e` `run` block and neither deploy step carries
`if: always()`, so a new undeclared term **fails the publish** rather than
shipping a lossy graph. The same rule `problems[]` has always followed.

**Residue, each wanting its own bean:**

1. The **role registry and permission vocabulary are not exported at all**.
   Fixing it is not mechanical: `#role/<lane>` already exists for 63 BPMN lanes,
   so the same role would acquire two identities unless `roleForLane` resolution
   is applied at export time.
2. **`#role/role-assignments` is not a Role** — `collectRegistryNodes` types
   every `.claude/scenarios/*.json` as one, and that directory holds only the
   identity → actor mapping table.
3. **The document's own report fields are undeclared too** — `repository`,
   `counts`, `problems`, `danglingLinks`, `undeclaredTerms`, and staging's
   `staging` — because `undeclaredTerms()` scans `@graph` nodes only. They are
   dropped on expansion exactly as the node properties were. Whether the
   export's self-report belongs in RDF is a different question from this bean's,
   but it should be asked rather than inherited.
