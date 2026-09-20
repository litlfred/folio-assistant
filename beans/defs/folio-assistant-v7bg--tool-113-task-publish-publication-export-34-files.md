---
# folio-assistant-v7bg
title: 'TOOL 1/13: Task_Publish — publication & export (34 files, 19 entry points)'
status: todo
type: task
priority: high
created_at: 2026-09-20T04:34:11Z
updated_at: 2026-09-20T04:34:11Z
parent: folio-assistant-d308
---

Group 1 of 13 in `d308`. **34 files, 19 entry points** — the largest loose surface in the repo.

`kg-export`, `pages-bootstrap`, `gen-*-jsonld`, `gen-site-jsonld`, `site-links`,
`serve-rendering`, `strip-preview-seo`, `staging-*`, `readme-sections`,
`readme-links`, `gen-schema-docs`, `gen-skill-docs`, `harness-schema-export`.

**BPMN:** `authoring-a-paper · Task_Publish` and `authoring-a-document ·
Task_Publish`, both `serviceTask`, both already ref `content-publish`.

**Target repo (#223):** splits — the site half is `folio-assist-core`, `kg-export`
and `pages-bootstrap` are `agentic-harness`. That split is a finding, not a
problem: it is the one group whose files do not all go to one repo, so it is also
the one most likely to be two Tools rather than one.

## Done when
- [ ] a Tool node whose `invoke` names one entry point
- [ ] `satisfies` includes `content-publish`
- [ ] `selection` filled — `when` / `limits` / `cost`, per the schema `main` added
- [ ] `tool-coverage` no longer lists `content-publish` as uncovered
- [ ] the other 15 files in the group reachable only through it

---

## 2026-09-20: first node landed, and it was not the one this bean expected

**`kg-graph-export` is in the graph.** `bun run kg:export`, satisfies
`kg-export`, verified: typecheck, eslint, 43 tool tests, `check:tools`, the
command actually running, and 38 gates in the fast set.

It exists because of a gap `check:tools` could not report. `kg-export` was
already `satisfies`-covered **five times** — `pages-publish`, `serve-rendering`
and the three schema carriers — and **none of them runs an export.** The command
that builds the graph rendering was reachable from no node.

`check:tools` was right throughout. Coverage relates a Tool to a **skill**, and a
skill can be satisfied by the *neighbours* of its mechanism while the mechanism
stays invisible. That is this epic's premise, found in the graph rather than
argued from a bean — and on the skill `shzs` had just been corrected to call
covered. So **both readings were needed**: covered-by-skill and
reachable-by-mechanism are different questions, and `d308` is the second one.

## This bean is really two, and the split is the table's own

`d308`'s table already said the target repo splits — *"folio-assist-core (site) /
agentic-harness (kg-export)"*. That was written and then not acted on. Acting on
it:

1. **The graph half** — `kg-export` ✅ done; `ns-export`, `gen:jsonld`
   (context + block + library), `kg-viewer`. `agentic-harness`.
2. **The site half** — `pages-bootstrap`, `site-links`, `sync-docs-harness`,
   `gen-themes-css`, `gen-avatars-css`, `gen-bootstrap-graph`,
   `strip-preview-seo`, `staging-*`, `restore-staging`, `feature-build`.

**And the site half's skill needs checking before a node, not after.** The
obvious candidate is `content-publish` (tier A, uncovered) — but
`content-publish` is about a **folio** publishing its content, and these files
publish the **platform's own docs site**. The nearer skills, `docs-generation`
and `build-docs`, are both already in the covered list. So the site half may be
the same covered-by-skill / uncovered-by-mechanism shape as the graph half was.
Measure it; do not assume it, which is the mistake this bean already made once.

## Done when — REPLACES the list above

- [x] `kg-graph-export` node, verified, with its finding recorded
- [ ] `ns-export`, `gen:jsonld`, `kg-viewer` reachable — one node or shown to be
      behind `kg-graph-export`
- [ ] which skill the site half actually serves, established from the diagrams
      and the covered list rather than assumed
- [ ] a node for the site half once that is known
- [ ] the 15 can't-tell files confirmed as folio-invoked, not unused
