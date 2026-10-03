---
# note on folio-assistant-gz47 from claude/lucid-shannon-o8zop1-gz47-fsh-guts
$schema: folio-bean-note/v1
bean: folio-assistant-gz47
branch: "claude/lucid-shannon-o8zop1-gz47-fsh-guts"
created: "2026-10-03"
---
## Batch 1 (fsh-guts): four real reads, not 23, now resolved through the declaration

## Batch 1 (fsh-guts): four real reads, not 23, now resolved through the declaration

Done 2026-10-03 by the Parcel B session (owner: option 1, "gz47 batch: fsh-guts").

**The measurement over-counted, as its note warned.** Of the 24 cross-instance fsh-guts hits, 50 lines were in `branch-mount.test.ts` alone. All of them were fixture data: a scratch repository the test builds, containing a directory it happens to name `fsh-guts`. That is correct and stays. The remaining hits split into:

| site | class | action |
|---|---|---|
| `check-uploads-retired.ts` `ARCHIVE = "fsh-guts/uploads"` | **production read** of the real trashcan | `archiveDir(base)`: `uploads/` inside the DECLARED trashcan. Undeclared means no archive, and two declared trashcans throw |
| `retired-skill-fields.test.ts` `roles → fsh-guts/retired/…` | test read of a real trashcan file | resolved through `fshGutsDirectory` |
| `activity-log.test.ts` `LOG_DIR.startsWith("fsh-guts/")` | test asserting the logs sit inside the trashcan | now asserts `LOG_DIR` resolves inside the DECLARED trashcan |
| `activity-log.test.ts` `.gitignore` contains `"fsh-guts/logs/"` | test of the ignore file | reads `LOG_DIR` rather than repeating it |
| fixture declarations (log-sweep, log-writer, check-retired-front-matter, fsh-guts-export, qa-sweep-content-only), e2e test data | fixtures | unchanged: they ARE the declaration |
| `log-entry.ts` `LOG_DIR = "fsh-guts/logs"` | documented constant: `.gitignore` cannot read a declaration, and logs stay local by 9c7h's design | unchanged |
| `staging-only-publish.test.ts` `"fsh-guts/"` | **not this class**: it names the trashcan's visualiser PAGE directory under docs, which does not move with the trashcan | unchanged (an edit was tried, and the falsifier below reverted it) |

**Falsified by simulating the move:** `mv fsh-guts trash-sim` plus the declaration's path, then the touched tests.
- Every resolved read followed the declaration.
- `staging-only-publish` still failed, which showed that test was about the page, not the trashcan, so the edit was reverted.
- The rewritten `LOG_DIR` test went RED, correctly: the constant cannot follow a move, and the old `startsWith` check would have stayed green.
- `uploads-retired.test.ts`'s fixture had MADE `fsh-guts/uploads/` without declaring it, and passed only because the reader spelled the same path. With the declaration removed, 2 tests go red.

Local: typecheck clean; regen 101 current, 0 regenerated; `bun run gates` 216 of 216.

**Lesson for the next batches:** classify a hit by what it READS (the real tree, or a fixture), not by its spelling. The measurement counts spelling.
