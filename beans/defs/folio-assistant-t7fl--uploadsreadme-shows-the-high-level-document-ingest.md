---
# folio-assistant-t7fl
title: uploads/README shows the high-level document-ingestion BPMN, via a DECLARED coverage.process
status: in-progress
type: feature
priority: normal
created_at: 2026-09-29T23:47:39Z
updated_at: 2026-09-30T00:10:51Z
parent: folio-assistant-slw1
---

Owner, 2026-09-29: *"show highlevel (sub)process bpmn on the uploads page."*

The uploads page is `uploads/README.md`, the generated subgraph README written
by `cat-harness/scripts/subgraph-readmes.ts` through the `subgraph` Liquid
template in the tools graph.

## What is being added

A new optional declared field on `SubgraphCoverageSchema` naming the BPMN
process that GOVERNS a directory, declared on `uploads/` as
`document-ingestion`. The generator resolves the name to its `.bpmn` source and
its rendered SVG and the template embeds it, with links to the source and to
the five subprocesses the diagram calls.

## Why DECLARED and not inferred

`document-ingestion.bpmn`'s start event is named "A file lands in uploads/",
so the directory could be inferred from the prose. It is not: inferring a
declared relation from a name is the failure this repository keeps paying for,
and the name is editorial text free to change without anything noticing.

## The third state

Absent means NOT DECLARED, never "no process" — the `readOnly` pattern in the
same file. A directory that declares nothing gets no section and that is not a
finding. A directory that declares a process whose SVG is missing gets a
*could not determine* line rather than a silently omitted section.

## Also stated on the page

The diagram's first element is an EVENT, not a Task: the process begins AFTER
arrival and models nothing about HOW a file gets into `uploads/` — a git
commit, a file handed to an agent in chat, or the GitHub web UI. That gap is
real: a web-UI commit on 2026-09-29 (`c8349950fa5`, direct to `main`, no PR)
added three PDFs and reddened the blocking `readme:subgraphs:check`, because a
web-UI commit runs no generator. The page states the routes are ungoverned; it
does NOT document procedures for them, because no skill governs them yet.

## Done when

- `SubgraphCoverageSchema` carries the optional declared field, documented.
- `uploads/` declares it in `folio-assistant.json`.
- `uploads/README.md` shows the diagram, the source link, the five
  subprocesses, and the stated boundary.
- `readme:subgraphs:check`, `render:bpmn:check` and `gates` are green.
- Synthetic-tree tests cover: declares-a-process embeds it; declares none gets
  no section; declared-but-missing yields *could not determine*.

## Out of scope, awaiting the owner's sign-off

An upload Task in the BPMN, a skill for the three routes, Tool nodes for them,
or a page generated from Tool documentation. The upload is modelled as a start
event, so there is no Task and no Tool documentation to generate from; creating
them is an authoring act.



## Tracking

GitHub issue: https://github.com/litlfred/folio-assistant/issues/1526
Branch: `claude/uploads-page-shows-process`
