---
# folio-assistant-kgt5
title: Resolve the 12 remaining activity-names-skill findings and make the criterion gate
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:49:10Z
updated_at: 2026-09-18T22:49:10Z
---


Follow-on from `folio-assistant-uuhu`, which took 42 → 12. Measured against the
role graph rather than by reading the diagrams, which changed the answer twice.

**What the 12 were, and how each resolved:**

| finding | resolution |
|---|---|
| `Task_Commit`, `Task_VerifyAuthority` | lane role is `actedUpon` — derived `n/a`, no diagram edit |
| `Task_SubmitForReview`, `Task_RequestRevision` | → `staging-review`, already carried by `author` |
| `Task_TranslateInTool` | → `translation-manager`, already carried by `translator` |
| 4 × `S_*` (CRDM stakeholder) | `judgementOnly: true` on the role |
| 2 × `Task_DescribeChange` | `<folio:no-skill reason="…"/>` — intent origination |
| `Task_AppraiseGrade` | new `evidence-appraisal` skill, method-agnostic |

**Two corrections the measurement forced.** I had classified
`Task_VerifyAuthority` as a STRAWPERSON gap; it is in the *external registry*
lane, which is `actedUpon` — nobody performs it. And I was one commit from
giving `stakeholder` the CRDM skill, which would have overturned the decision
its own summary records: "carries no skills deliberately: sign-off is a
judgement, not a procedure". Prose in a summary did not stop that; the flag
does.

**The criterion now gates.** It was `minor` because it could not tell a
legitimate human step from a real gap. With three declarations — `actedUpon`,
`judgementOnly`, `<folio:no-skill reason>` — it can, so it is `major` and
`scripts/tests/activity-skill-coverage.test.ts` asserts zero. Not done by
switching CI to `kg:audit:strict`: that promotes every `major` criterion at
once and would redden a sibling branch for something its author never touched.

`kg:audit` is now **pass 265 / fail 0 / n/a 61 / unknown 0** — clean at every
severity, `:check` and `:strict` both green.
