---
# folio-assistant-30hn
title: 'BPMN: 16 of 33 processes are strict by omission, not by decision'
status: todo
type: task
priority: normal
created_at: 2026-09-19T15:56:22Z
updated_at: 2026-09-19T15:56:22Z
parent: folio-assistant-1xhc
---


Found while auditing for `folio-assistant-haya`; recorded there in
[SDLC process audit §4](../../fsh-guts/proposals/sdlc-process-audit.md).

## The measurement

`skills/workflows/` holds 33 `.bpmn` files. 17 carry a
`<folio:policy enforcement="…">`; **16 do not.**

    grep -L 'folio:policy' skills/workflows/*.bpmn | wc -l   # 16

`src/workflow/process-model.ts:502` reads

    const enforcement = declared === "advisory" ? "advisory" : "strict";

so those 16 are **strict by omission**.

| declared | count |
|---|---|
| `strict`, explicitly | 6 |
| `advisory`, explicitly | 11 |
| `strict`, by omission | 16 |

## Why this is worth a bean and not a shrug

The default is the *safe* direction, so nothing is currently mis-gated and
this is not a bug report. The cost is that the file no longer records a
decision.

Every one of the seven `crdm-*` diagrams is in the undeclared set — the
processes governing how a feature reaches the codebase are strict because
nobody typed the attribute. The first time somebody wants one of them
advisory, there is no way to tell from the file whether strictness was
chosen and should be argued with, or was never considered.

That is the same shape as the defects this repository keeps paying for: a
determined value and an absent one rendering identically. `ci-health`'s
"could not check is never green", the QA third state, `publication.host`
absent meaning *has not said* rather than `github-pages`.

## Route

1. Read each of the 16 and decide what it should be. This is judgement per
   diagram, not a sweep — a mechanical `enforcement="strict"` on all 16
   would record a decision nobody made, which is the defect, not the fix.
2. Write the attribute.
3. Consider whether `process-model.ts` should keep defaulting. Making the
   attribute required is the stronger fix and it breaks every downstream
   instance's diagrams, so it is a separate decision from this one.

## Done when

- [ ] each of the 16 carries an explicit `<folio:policy enforcement>`, chosen
      per diagram rather than swept
- [ ] `bun test` and `bun run check:workflow-policy` are green
- [ ] whether to require the attribute is decided and written down, either way
