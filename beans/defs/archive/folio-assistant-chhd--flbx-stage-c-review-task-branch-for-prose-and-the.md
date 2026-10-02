---
# folio-assistant-chhd
title: 'flbx stage C: review-task branch for prose and the code it describes, calling adjudication'
status: completed
type: task
priority: normal
created_at: 2026-09-23T10:38:11Z
updated_at: 2026-09-23T13:31:33Z
parent: folio-assistant-flbx
---

Issue #1042, R4 R5. After stages B and A. General narrative-asserts-code skill with no Lean specifics; proof-narrative-lean-equivalence re-pointed as its Lean specialisation; checker/reviewer disagreement calls Process_Adjudication.

## Done when
- [x] stages B and A merged (#1065, #1072)
- [x] review-task gains the branch; skill written; Lean skill re-pointed
- [x] kg:audit, render and gates green

## Summary of Changes

PR #1086. review-task.bpmn's GW_Kind gains a third branch, "prose and the
code it describes", calling the new narrative-code-review.bpmn (read the
pair checks' findings → anything open? → re-read → attest with a reason /
raise a finding against the wrong side / call Process_Adjudication on a
disagreement with a checker). Fixes the "goes through both" wording that
an exclusive gateway could not honour. New general skill
narrative-asserts-code; proof-narrative-lean-equivalence marked as its
Lean specialisation. kg:audit 0 findings on both diagrams.
