---
# note on folio-assistant-ho66 from claude/lucid-shannon-o8zop1-ho66
$schema: folio-bean-note/v1
bean: folio-assistant-ho66
branch: "claude/lucid-shannon-o8zop1-ho66"
created: "2026-10-03"
---
## Standalone measured with git per layer: 463 failing in 166 files, four root-cause clusters

Measured 2026-10-03 by the Parcel B session. `cat-harness`, `bootstrap` and `bootstrap-tools` were copied as tracked files into an empty directory, laid out as siblings, **each made a git repository** (as a clone is), with `node_modules` linked. Then `bun test` ran from `cat-harness/`.

## Result: 7907 pass, 52 skip, **463 fail** (8422 tests, 593 files)
#1896's `probeStandalone` measured 469 without `git init`. So the missing init is worth only 6; the earlier claim that it "inflates" the count was right but minor. Failures sit in **166 test files**, a long tail; the largest is `gates.test.ts` with 15.

## Root causes (error occurrences, not tests; they overlap)
| cluster | hits | subject the test asserts about | where it belongs |
|---|---|---|---|
| A. repo-root `.github/` | 77 | the AGGREGATE repo's CI workflows | root-instance tests |
| B. "no declared diagram named …" | ~70 | folio-assistant-core's processes (editing-hci-validation.bpmn, authoring-a-paper.bpmn, getting-started.bpmn, content-change-review.bpmn, folio-intent.dmn, …) | core's tests, or a fixture |
| C. repo-root files | ~14 | `.gitignore`, `AGENTS.md`, `requirements.txt`, `.gitattributes`, `.bun-version` | root-instance tests |
| D. sibling instances | ~25 | smart-base, beans, todos, fsh-guts, memory, who-iris, fhir-harness, cat-harness-tools | that instance's tests, or a fixture |
| E. the rest | — | assertion failures with no path message | to classify |

## Why this is a relocation program, not a bug list
The split proposal (cat-harness-tools-split-2026-10-01.md) says **every line of code leaves cat-harness**, these tests included, and **CI stays in the aggregate**, with cat-harness becoming a submodule at the same path. So clusters A and C test the aggregate, B tests core, and D tests the siblings. Most of the 463 are correct tests in the wrong layer.

**Sequencing hazard:** the planned code move puts cat-harness's tests in cat-harness-tools. Relocating them by layer before that move risks moving them twice.
