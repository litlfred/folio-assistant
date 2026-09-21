---
# folio-assistant-3jhq
title: 'TWO PATHS FOR ONE BOOTSTRAP GRAPH: docs-site publishes cat-bootstrap.jsonld at the site root, feature-staging at cat-bootstrap/cat-bootstrap.jsonld'
status: todo
type: task
created_at: 2026-09-21T14:16:21Z
updated_at: 2026-09-21T14:16:21Z
parent: folio-assistant-vke6
---

Noticed while measuring issue #720, and deliberately kept out of that fix.

## What was measured, 2026-09-21

| workflow | command | published at |
|---|---|---|
| `docs-site.yml` | `kg-export.ts --instance ./cat-bootstrap` | `<base>/cat-bootstrap.jsonld` |
| `feature-staging.yml` | `gen-cat-bootstrap-graph.ts --base-url "$BASE"` | `<base>/cat-bootstrap/cat-bootstrap.jsonld` |

Two DIFFERENT scripts, two DIFFERENT paths, for a document that names itself
by `@id`. The `docs-site` path is the one cat-harness's own graph links to —
verified by building the export and reading the link targets out of it:

    https://litlfred.github.io/folio-assistant/cat-bootstrap.jsonld#skill/discussion
    https://litlfred.github.io/folio-assistant/cat-bootstrap.jsonld#skill/log-message

So on a STAGED preview those two links point at a document the staging build
does not write at that path — the `blv9` shape ("the `@id` resolved to
nothing"), one workflow over from where it was fixed.

## Why this is not obviously a bug yet, and what to measure first

NOT ASSUMED TO BE ONE. Three things have to be checked before deciding:

- [ ] does `feature-staging.yml` publish the `--instance` export at all, or
      only `gen-cat-bootstrap-graph.ts`? They may be different documents with
      different jobs, in which case the paths are correct and the finding is
      that nothing says so
- [ ] what does a staged cat-harness graph mint as its link target — the
      staged base plus `cat-bootstrap.jsonld`, or something else?
- [ ] is `gen-cat-bootstrap-graph.ts` the same graph as
      `kg-export --instance ./cat-bootstrap`, or a different projection of it?

Answer those before proposing a path change. Two scripts and two paths may be
two answers to one question — or it may be one answer each to two questions,
and collapsing them would lose a document.

## Done when

- [ ] the three questions above are answered by measurement, not by reading
- [ ] either the paths agree, or a comment in BOTH workflows says why they do
      not and which document is which
- [ ] whichever it is, a check covers it — `check:published-instance-exports`
      (added for #720) reads the deploy workflow only, so the staging workflow
      is still a place a break hides
