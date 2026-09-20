---
# folio-assistant-5mg5
title: 'RENDER LOG: the publish branch keeps its own history of what was published and removed'
status: in-progress
type: task
parent: folio-assistant-5a3l
created_at: 2026-09-20T07:19:52Z
updated_at: 2026-09-20T07:19:52Z
---


## The question it exists to answer

> **What happened to `STAGING/<slug>`, and why?**

Nothing could. A preview appears, a bot comments a URL, and some time later the
link 404s. Cleaned up because its PR closed, removed by a confirmed dispatch,
or **deleted by an unrelated merge to `main`** were indistinguishable — and the
third really happened, on every deploy, for months: bean `plj1`, three
`docs(gh-pages)` commits, 1/3/1 previews on their parents and zero after.

The defect was silent precisely because **the publish branch kept no record of
its own changes.**

Owner, 2026-09-20: *"that should be a specialied Logger skill for the gh-pages
rendering context … log all staging rendering (when added, when deleted) to a
logging directory/file on gh-pages. skill + tool."*

## What was built — PR #473

| | |
|---|---|
| schema | `cat-harness/schemas/render-log.ts` — `folio-render-log/v1` |
| tool | `cat-harness/scripts/render-log.ts` |
| skill | `cat-harness/skills/folio-core/render-logging.md` |
| process | `cat-harness/skills/workflows/staging-render-log.bpmn` |
| the carry | `CARRIED_PREFIXES` in `cat-harness/scripts/restore-staging.ts` |
| the wiring | `.github/workflows/feature-staging.yml`, three jobs |

## The four decisions, and what would falsify each

1. **A specialisation of `folio-log/v1`, not a rival.** Same `id`/`at`/
   `summary`/`detail`/`references`/`capture` spellings. Falsified if a second
   vocabulary appears for one concept — it did not; the store, the subject and
   the published/unpublished decision are the only three differences.
2. **Append-only as a SHAPE.** No `--remove`, no `--edit`, no id to overwrite,
   so no caller can be written wrongly. Falsified by any verb that can lose an
   entry.
3. **The store is OUTSIDE `STAGING/`.** Verified rather than assumed: git
   permits a ref whose slug collides with a directory under `STAGING/`, so a
   guard would have had to be remembered; a location cannot be forgotten.
4. **A path is checked by VALUE, never trusted by provenance** — bean `fuzm`.
   The slug sanitiser can emit `..`; it is safe only because git rejects such a
   ref, and `cleanup-dispatch` takes a slug as a **dispatch input**, where that
   invariant does not hold.

## What `retained` is for

A removal **considered and refused**, with its reason. It is the one that makes
the log worth reading: a preview still standing because a liveness signal fired
leaves no trace otherwise, and the next person asking *"why is this still up"*
has nothing to consult. Bean `w2g5` — a branch reused across five successive
pull requests — is how that gap looks from the far side.

## Done when

- [x] schema, tool, skill, BPMN diagram, 26 tests
- [x] `restore-staging.ts` carries `_render-log/` **unconditionally**, before
      the preview check, with a determined-absence report and exit 2 on a carry
      it cannot determine
- [x] `feature-staging.yml` wired: `stage` → `rendered`, `cleanup` →
      `removed` / `retained`, `cleanup-dispatch` → `removed`
- [x] a removal and its record are ONE commit, in both removal paths
- [x] `workflow-yaml.test.ts` asserts the wiring by job, so a future edit
      cannot silently drop a call
- [x] **a real deploy observed writing an entry** — run 35497542549,
      2026-09-20T07:43:17Z, `_render-log/2026-09-20.jsonl` on `gh-pages`:
      `rendered STAGING/claude-sleepy-babbage-ls90iz`, read back with
      `render-log.ts --read` (exit 0, 1 entry, 0 skipped). The wiring is not
      inferred from tests; it ran.
- [ ] merged
- [ ] the agent-memory entry, once there is room — bean `lnpe`. A six-line
      node evicted a TRAP from BOTH `ci-health-watcher` and
      `platform-boundary-guard`, so it was dropped rather than bought by
      archiving somebody else's entry. Nothing is lost: the discipline is in
      the skill, which is where AGENTS.md says it belongs.

## Related

| | |
|---|---|
| why the publish branch loses things | `plj1` |
| a closed PR is not an abandoned branch | `w2g5` |
| the slug path hazard | `fuzm` |
| the retired-record store, next tenant of `CARRIED_PREFIXES` | `6pfo` |
