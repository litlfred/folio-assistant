---
# note on folio-assistant-apcg from claude/placement-pr6-apcg
$schema: folio-bean-note/v1
bean: folio-assistant-apcg
branch: "claude/placement-pr6-apcg"
created: "2026-10-04"
---
## Five catch-ups, vqlp closed, four findings filed, and why the ready-to-merge label was removed

State of this PR as of `e42f946362`, written here because the Merge Manager is in another account's session and a bean note is the channel that does not depend on who is reading which thread.

## Catch-ups: five, in one session

| merged | conflicts | authored | how |
|---|---|---|---|
| `main@8f0f606050` | 60 | 2 | both resolved — see below |
| `main@12b916e9a5` | 126 | 0 | all generated, `-X theirs`, one settled regen |
| the branch tip `a3338581d3` | 22 | 0 | `-X ours` — same main from the same ancestor; mine is the regenerated side |
| `main@bcc8df4ab5` | 15 | 0 | all generated (six subgraph READMEs among them) |
| `main@39ba2fbdd5` | 26 | 0 | all generated |
| the bot's tip `260f9c1262` | 8 | 0 | `-X ours`, plus five modify/delete conflicts resolved by KEEPING the files (bean `5hox`) |

Mergeability was read with `git merge-tree --write-tree origin/main HEAD` each time, never `mergeable_state`. Every generated-conflict resolution was preceded by checking that every conflicting path really is generated — by path, or by the file's own banner for the four that are not obvious (`scripts/README.md`, `test/README.md`, `test/attestations/README.md`, `declared-path-baseline.json`).

## The two authored conflicts, and why neither needed the owner

- `scripts/check-uploads-retired.ts` — main replaced the spelled `ARCHIVE = "fsh-guts/uploads"` with `archiveDir(base)`, which resolves through the `fsh-guts` declaration (bean `gz47`). Every call site in the merged file already called `archiveDir()`; this branch's constant was referenced nowhere else. Dead code after the merge, not a choice.
- `skills/library/library-core/library-ingestion.md` — main added one section (the owner's role-threshold ruling of 2026-10-03) in a region this branch had moved to `folio-assistant-core/skills/library/ingestion/l1-document-ingestion.md`. Neither side could be taken whole: main's loses the split, this branch's loses the ruling. The section is inserted verbatim at `l1-document-ingestion.md:600`, between the same two anchors it sat between on main.

A sibling's push resolved the first one too and got a comment line right that I got wrong (`library-ingestion/uploads-retirement.md`, not main's pre-split `library-ingestion`). Adopted verbatim; it sits under a `declared-path-literal:` marker, so `check:declared-paths` would have caught it.

## Owner's blocker, closed: bean `vqlp`

`Process_Ingestion` — the one process this placement keeps in the harness — was presented by no docs page section once `the-pipeline` was repointed at core's refinement. That took a REAL failure out of the roll-up: `qa-witness` `fail` went 23 → 22, because `role-carries-activity-skill` (*"Task_Place: needs skill upload-routes, but its lane's role user does not carry it"*) had no bundle to be recorded against. A failure going missing, not being fixed.

Fixed by hanging the diagram on the EXISTING `uploads-and-library-are-two-stages-of-one-pipeline` section rather than a new one. A new section adds a heading, and `translation-drift.ts`'s `shapeOf` compares heading shape — all five localised pages went to *"13 heading(s) in the source, 12 here"*, against a `KNOWN_DRIFT` the module calls *"the goal state, not a lapse"*. Owner's ruling, 2026-10-04. Result: `Presented on` restored, unpresented count 72 → 71, `fail` back to 23, `translation:drift:check` reports no new drift, no translation guessed. No new BPMN was needed.

## Three findings recorded as beans rather than fixed here

- **`loxz`** — `regen` reported `audit:coverage:strict` among *"113 current"* while the artefact on disk differed from what its writer produces. Its check is judge mode over a `qa-reports` baseline, not a byte comparison. **"0 unrepaired" is not evidence that every generated artefact matches its writer.** The `1xhc` family, narrower and worse: the step fired and answered a different question than the pairing implies.
- **`0kbt`** — `gen-docs-pages` projects the QA tile BEFORE the orphan sweep deletes witness files whose section no longer exists, so one run after a section is renamed publishes a count including a file it just deleted (`files=146 fail=24` against a tree holding 145 summing to 23). The inflated bucket was a `fail`.
- **`4z5o`** — generated GitHub *edit* URLs for a cross-instance figure read `edit/main/../folio-assistant-core/…`; GitHub does not normalise `..` there. 13 on main, 18 here: pre-existing, amplified by this branch, not created by it.

Plus **`t5j5`**, the owner's ruling that `kg-audit` should resolve a call activity across instances instead of reading `unknown` — separate PR.

## The operational lesson, now on #2074

`state:mount` belongs after **every** base merge, not once per worktree. Running `regen` on a correctly merged, submodule-initialised, freshly installed tree with `fsh-guts/` unmounted produced `CAP REACHED … the tree is NOT settled` and two findings that were both the missing mount — one of them phrased *"the declared writer is not a writer; fix the pairing, not the artefact"*, which would have sent the next person to edit the gate table. 19 minutes of wall clock. Mounted: 113 current, 0 regenerated, settled in one pass.

## Do not merge on the label

This PR carried a `ready-to-merge` label from an earlier round while four mains went by. I removed it. A label survives its branch going stale; a `ready: <head sha>` comment does not, because it names the head it was true of. Treat the absence of that comment as the signal.
