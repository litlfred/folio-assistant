---
name: bib-photo-ingestion-watcher
description: >-
  Integration-watcher for bib physical-review issues. When a page photo is
  uploaded to a `bib-physical-review` issue (or an in-repo source passage is
  agent-identified), OCR/read it, formalise the cited result (if the project has
  a formal-proof pipeline), confirm the project's usage matches the source, run
  machine + agent bib validation, then set the reference status to `validated`
  and refresh references.review.json. Use when processing a bib-physical-review
  issue that has an attached photo, or when ingesting an uploaded paper.
roles: [collaborator]
---

# bib-photo-ingestion-watcher

The automation half of the [`bib-human-review`](bib-human-review.md) workflow.
Companion to the status sidecar `content/schema/references.review.json`.

## Trigger

- A **photo is attached** to a `bib-physical-review` GitHub issue (subscribe via
  `mcp__github__subscribe_pr_activity` / issue events), **or**
- the `bib-human-review` skill has marked a reference `source-in-repo` (agent
  identifies the cited passage in `uploads/` — no human photo needed).

## Pipeline (on a photo / identified passage)

1. **Read the source.** OCR the photo (or read the `uploads/` passage); extract
   the specific cited theorem/section/equation.
2. **Source-match.** Confirm the project's usage matches the source statement —
   the `.md` claim, the `\cite{}`/`uses[]` sites, any formal-proof `-- Ref:`.
   Flag any mismatch back on the issue (do not auto-`validate`).
3. **Formalise (if applicable).** If the project has a formal-proof pipeline,
   place the formalised result in a **per-paper package / namespace**; if the
   project overlaps the paper's result, **wrap** it (thin specialisation) rather
   than re-prove; where the paper is unformalised, state an axiom/class with a
   `-- Ref:` comment. Build against the restored proof cache (do not iterate
   blind; establish editor/LSP feedback first).
4. **Bib-validate.** DOI/metadata cross-check, `validate-references`, `-- Ref:`
   resolution, `entryHash` recompute.
5. **Set status.** On success set the ref `validated`, record
   `{ by, date, source, page, entryHash }` in `references.review.json`, refresh
   the sidecar, and post the outcome on the issue. On failure, post the specific
   blocker (mismatch / unresolved DOI / formalisation gap) and leave status
   `issue-open`.

## Guardrails

- Never `validated` without a recorded human reviewer (`by`) — the photo upload
  *is* the human act; record the uploader.
- Acquisition must be legal; never fetch paywalled PDFs by scraping.
- One reference per issue; reply only with the outcome or a blocker (keep noise
  low).
