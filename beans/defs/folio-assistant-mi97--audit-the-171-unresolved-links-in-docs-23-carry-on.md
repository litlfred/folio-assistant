---
# folio-assistant-mi97
title: Audit the 171 unresolved links in docs/ — 23 carry one ../ too many from the cat-harness move
status: todo
type: task
priority: normal
created_at: 2026-09-20T17:06:16Z
updated_at: 2026-09-20T17:06:37Z
parent: folio-assistant-zzmr
---


Surfaced 2026-09-20 by declaring `docs/` as a graph directory — 241 markdown
files that were, until then, invisible to every declaration-driven consumer.
`check:subgraphs` walked them for the first time and found 171 links that do
not resolve in the source tree.

They are NOT one problem. Measured, by trying each repair against disk:

| shape | count | example |
|---|---|---|
| one `../` too many | **23** | `docs/agentic-harness.md -> ../../processes/authoring-a-paper.bpmn`, where the file is at `cat-harness/processes/` |
| resolves only in the PUBLISHED tree | the rest | `docs/architecture.md -> api/` (the docs build generates it); `docs/skills.md -> ...migration.html` |
| points at the bean store | several | `docs/translation-support.md -> beans/folio-assistant-ktt2--....md`, where beans live at the REPOSITORY root, not under `docs/` |

**The 23 are rot with a known cause.** They were written while `docs/` sat at
the repository root; the move of the instance under `cat-harness/` (bean
`wggr`) left every relative path one level too deep. Nothing reported them for
a day because the directory was undeclared — which is precisely the `dh4f`
shape, and the reason declaring it was worth doing.

## Why `check:subgraphs` does not assert on them

A renderable graph addresses the PUBLISHED tree. `api/` is a directory the
docs build generates and `*.html` is what Jekyll renders; neither is a file in
this tree and neither is broken. Asserting zero would have meant either 171
false findings or a silent skip, and that module's own rule says which is
worse — *"Skipping retired content is defensible; skipping it SILENTLY is
not."* So they are counted and printed under `siteResolved`, with this bean
named in the output.

## Done when

- [ ] The 23 source-tree links are repaired. Mechanical: drop one `../`, and
      each repair is verifiable against disk before it is made.
- [ ] The bean-store links resolve — they cross an instance boundary
      (`docs/` is cat-harness's, `beans/` is the repository's), so they need
      the same treatment as any other cross-instance reference, not a deeper
      relative path.
- [ ] The rest are checked against the BUILT site, where they actually live.
      `docs-site.yml` already runs `check:maintained-artefacts ./_site` and
      `check:escaped-markup ./_site`; a link audit belongs beside them, not
      in a source-tree scanner.
- [ ] Once the 23 are gone, `siteResolved` for `docs` should be only the
      published-tree kind — and if the count does not drop by 23, the repair
      was wrong.

## Not urgent, and say why

The published site has been serving these for some time and nobody reported
them, so they are cosmetic on the reader's side. What makes them worth fixing
is the 23: those name real files in this repository, and a reader following
one gets nothing while the file sits two directories away.
