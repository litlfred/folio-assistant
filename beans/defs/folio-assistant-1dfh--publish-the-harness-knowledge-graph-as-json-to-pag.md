---
# folio-assistant-1dfh
title: Publish the harness knowledge graph as JSON to Pages, and a viewer over it
status: todo
type: task
created_at: 2026-09-18T19:00:01Z
updated_at: 2026-09-18T19:00:01Z
---


Opened 2026-09-18 at the owner's direction: "while the justthedocs is a tool in
folio asst, we still need a way to visualize the kg in agent harness ... start a
dump of the full KG as json into ghpages ... skill is to render the json of the
kg. the tool is to post to ghpages."

**Opened after the fact.** The export was built and pushed (PR #273) before this
bean existed, which is the unclaimed-work failure `todo-manager` exists to catch.
Recorded rather than quietly backfilled.

## Done in #273

- `scripts/kg-export.ts` → one JSON document, 539 nodes: 136 Skill, 20 Process,
  328 ProcessNode, 22 Capability, 18 Actor, 6 SkillPackage, 5 Requirement,
  3 Directory, 1 Role.
- `skills/folio-core/kg-export.md` — the skill (serialize, host-agnostic).
- `pages-publish` recorded as the fourth Tool node in the harness analysis.
- Both publish paths wired: `docs-site.yml` → `_site/kg/kg.json`;
  `feature-staging.yml` → `STAGING/<slug>/kg/kg.json`, stamped with
  branch/sha/run because the banner injection only touches HTML.
- `scripts/tests/kg-export.test.ts` — 6 tests, including the partial-graph
  invariant asserted against BPMN refs rather than the exporter's own view.

## Outstanding

1. **No viewer.** This is the dump only, as asked. `kg.json` is the input a
   viewer would take. Unblocked now.
2. **Neither publish path has run at the time of writing.** #273's own staging
   build is the first test of it; if `_site/kg/kg.json` does not appear under
   `STAGING/claude-kg-export/`, the wiring is wrong.
3. **`schemas/skills/<name>/` is under-used and the export now shows by how
   much.** Of 136 skills, **11** have both an instruction body and an I/O
   contract, **113** are prose with no declared I/O, **11** are an I/O contract
   with no prose. That gap is what `mcp-contract` says a served tool must be
   checked against, so it is not cosmetic — it is the missing half of the
   skill→Tool contract. Deciding whether every skill should declare I/O is a
   separate question worth its own bean.
4. **Beans are deliberately out of the graph.** `beans/` is its own graph kind
   with its own nodes; folding the work plan in re-merges what #266 separated.
   If the work plan should be visualizable too, that is a second export with a
   link between them, not a widening of this one.

## The mistake worth keeping

The first exporter read six instruction-body directories, did not know about
`schemas/skills/`, and reported 11 BPMN skill refs as dangling. They are not.
A partial graph had been built and would have been published as a complete one —
in the module whose own doc comment warns against that.

It is unfalsifiable from inside: a consumer cannot tell a skill that is absent
from one that was never collected, both are simply missing from `@graph`, counts
look plausible, nothing errors. So the guard asserts against something outside
the exporter's view (every skill a diagram names must appear), and
`check:workflow-refs` independently guarantees those refs resolve. Verified by
reverting the fix: that test fails and only that test.

Any future node type added to this export inherits the same requirement.
