---
# folio-assistant-p7mb
$schema: bean/1.0.0
title: 'Whole-repo-derived artefacts still committed go stale on main after concurrent merges: build them at publish (owner option 1, 2026-10-23)'
status: todo
type: task
priority: normal
created_at: 2026-10-23T07:55:00Z
updated_at: 2026-10-23T07:55:00Z
parent: folio-assistant-hfag
---

## Why

A file generated from the WHOLE repository goes stale on `main` when two PRs merge one after the other. Each PR regenerated it for its own branch, and neither copy includes the other PR's change. A direct push or web upload has the same effect. Post-merge regen (bean `ey1c`) repairs this after the fact, but it cannot open its repair PR here: `GitHub Actions is not permitted to create or approve pull requests`, and `HARNESS_BOT_ID` is unset.

The owner, 2026-10-23, asked "why are we getting into repair on a post-merge process? sounds like upstream process failure", then chose **option 1: build these at publish**. The alternatives were not taken: requiring up-to-date branches, an agent-side repair stopgap, and leaving it.

This extends the `builtAtPublish` ruling of 2026-10-14 ("B1", bean `34cm`; `cat-harness/schemas/built-at-publish.ts`) to the derived files that are still committed.

## Measured: what went stale on cat-harness main

cat-harness's post-merge regen run 39786173033 (2026-10-22, main `9b38225`) found these stale and repaired them. The repairs never landed:
`library:viz`, `uploads:viz`, `voices:viz`, `folio:viz`, `document-kinds:viz`, `bpmn:checklist`, `check:glossary`, `skill:register`, `lsi:skills`, `slice:sqlite`, `kg:detangle`, plus 13 directory READMEs (`readme:subgraphs`).

## Done when

- [ ] Each writer above is classified, with its reason: a RENDERING that can be `builtAtPublish` (`because: checkout` or `state`), or an input something gated reads from the checkout and so must stay committed.
- [ ] Every rendering is declared `builtAtPublish` in its owning instance, gitignored and untracked, and the `:check` that read it is satisfied by `isBuiltAtPublish` or retired with its reason.
- [ ] Whatever must stay committed is listed with why, and with how it is kept current without a post-merge repair PR.
- [ ] A post-merge regen run on a layer's `main` reports `clean` twice in a row after unrelated merges (negative control).
