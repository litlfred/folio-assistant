---
# folio-assistant-v8gh
title: Nothing checks AGENTS.md's own links — five broke silently in a directory move
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:51:22Z
updated_at: 2026-09-20T12:03:16Z
parent: folio-assistant-1xhc
---


_2026-09-19T10:51:35Z_ — Measured 2026-09-19 on branch claude/wonderful-bohr-6kxh7b (bean 1hsf): AGENTS.md carried seven dead links. Five broke when docs/ moved under docs/folio-assistant/ — including docs/guides/agent-onboarding.md, which AGENTS.md's own banner calls the place to start, so a cold agent following the banner hit a 404. Two more (llm-authoring-tool-integration, workflow-orchestration) pointed at proposals deleted in e9754a7b and exported to issues #198 and #200. All seven are fixed in that branch. THE GAP IS THAT NOTHING CHECKED THEM: readme:audit (content/pipeline/readme-links.ts) verifies README.md only, and check:agents-xref verifies SECTION CITATIONS INTO AgENTS.md, not links OUT of it. So a directory move can silently break the one file every agent reads first. Cheapest fix is probably to point the existing readme-links checker at AGENTS.md too — it already does relative-path-against-working-tree, ref-aware and Pages-aware checking, and already reports a third state for what it cannot check. Worth confirming it generalises before assuming it does.

_2026-09-20T12:20Z_ — Done, and the bean's own guess was right in a way worth
recording.

## "Worth confirming it generalises before assuming it does" — it does, entirely

`runReadmeAudit` ALREADY takes a `file`, and the CLI already has `--file`. Run
against `AGENTS.md` unmodified, before any change:

```
43 link(s) checked, 43 resolved, 0 dead; 6 not checked
    5 × external URL (not fetched)
    1 × in-page anchor
```

So no new checker was needed. The gap was never the tool — it was that nothing
RAN it. `check:agent-entry-links` now does, in the gates.

## The second gap, found while closing the first

`CLAUDE.md` and `GEMINI.md` are four-line stubs whose entire content is
`@AGENTS.md` — a CLI **import directive**, not a markdown link. The auditor saw
zero links and reported **"0 links checked, 0 resolved, 0 dead"**.

That is a clean result over a file it had not checked at all. Rename
`AGENTS.md` and both stubs point at nothing while the gate stays green — a
determined empty and a could-not-determine wearing the same face, in the check
built to stop exactly that.

`parseLinks` now recognises a whole-line `@path` with an extension. Narrow on
purpose: `foo@bar.com`, a mid-line `@handle` and `@AGENTS` with no extension
are all NOT links, each pinned by a test. A checker that reported those would
be switched off within a day.

## Discovery, not a list

Four entry files found, not three — `bootstrap/AGENTS.md` was not obvious, and
a hardcoded list would go stale exactly the way the links did. Zero files found
is exit 2, because a green run over nothing is not coverage.

## What it cost elsewhere, and what that exposed

The new script imports `readme-links.ts`, which is core, from `scripts/`, which
is harness — a wrong-direction edge, and `main` now asserts zero of those. The
edge is real and is not this script's: a GENERIC markdown-link auditor lives
wholly in core, so any harness-level link check inherits it. Classified into
core beside the module it wraps, with the reason at the rule, and the real
finding recorded as bean `cp3l` rather than re-layering somebody else's module
on the way past.

## Done when — met

- [x] links out of every agent entry file are checked, in the gates
- [x] the stubs' `@import` counts as a link
- [x] discovery rather than a list, with zero-files as exit 2
- 16 tests. Gates 53/53 fast.
