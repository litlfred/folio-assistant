---
# folio-assistant-30hn
title: 'BPMN: 16 of 33 processes are strict by omission, not by decision'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T15:56:22Z
updated_at: 2026-09-20T14:26:05Z
parent: folio-assistant-1xhc
---


Found while auditing for `folio-assistant-haya`; recorded there in
[SDLC process audit §4](../../fsh-guts/proposals/sdlc-process-audit.md).

## The measurement

`processes/` holds 33 `.bpmn` files. 17 carry a
`<folio:policy enforcement="…">`; **16 do not.**

    grep -L 'folio:policy' processes/*.bpmn | wc -l   # 16

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

---

## Re-measured 2026-09-20 — and the number had grown, partly because of me

The bean says 16 of 33. It is now **14 of 41**, and the movement in both
directions is worth recording:

| | then | now |
|---|---|---|
| diagrams | 33 | **41** |
| undeclared | 16 | **14** |

Eight diagrams were added since the bean was filed and **six of them are
mine, from this session** (bean `7yvd`) — `docs-site-publish`,
`ci-health-watch`, `repository-health-watch`, `code-quality-gates`,
`jsonld-drift-check`, `atomic-mass-drift-check`. Every one shipped with no
`<folio:policy>`, so I widened the gap this bean exists to close while
working two beans away from it. That is the defect reproducing itself:
the attribute is easy to not type.

## Declared: the six I authored, each with its own reason

Not a sweep. The bean is explicit that *"a mechanical `enforcement="strict"`
on all 16 would record a decision nobody made, which is the defect, not the
fix"*, so these are the six where I had read the underlying workflow line by
line the same day and could actually decide.

All six are **strict**, which is what they already were by omission — so
nothing changes behaviourally, and that is the point: the file now records
the decision. The rule from [`bpmn-processes`](../../cat-harness/skills/workflow/bpmn-processes.md)
§"Strict by default" is the axis — base processes are strict, per-content-type
processes are advisory because their package owns what *adequate* means. These
six are platform-level CI processes, not content-type variants.

Each carries its own argument rather than a shared one:

| diagram | why strict, specifically |
|---|---|
| `docs-site-publish` | publishing is a FULL REPLACE and the two steps either side are the gate — bean `plj1` is what skipping either costs |
| `ci-health-watch` | one of three branches exists to FAIL the job on could-not-determine; advisory would permit reaching the clean path without the gateway that separates "nothing is red" from "nobody could look" |
| `repository-health-watch` | same gateway, plus: it REPORTS AND NEVER ACTS, and the absent removal task is `deletion-requires-confirmation` being followed rather than an omission |
| `code-quality-gates` | close to a tautology, which is why it is worth writing down — a diagram of the gate that was advisory about its own steps would be self-contradicting |
| `jsonld-drift-check` | one path, so strictness costs nothing; what it records is that regenerating WITHOUT diffing is not a permitted shortening |
| `atomic-mass-drift-check` | same, and the output a PROOF depends on |

Verified through `loadProcessModel`: all six report `enforcement: "strict"`.
56 gates pass.

## The remaining 14, untouched and listed

Left for their authors, per the bean's own route. Seven `crdm-*` diagrams are
**no longer** in this set — they have been declared since the bean was written.

```
bean-lifecycle          content-acquisition      content-change-review
feature-staging         human-translation-workflow  options-analysis
review-code             review-narrative         review-task
staging-render-log      theme-ui-review          translation-workflow
upstream-pin-watch      voice-review
```

`feature-staging` is the one I came closest to declaring — I added its
`<folio:job>` declarations this session and know its shape — but I did not
author it, and a policy decision on somebody else's process is theirs.

## Step 3 of the route is untouched and should stay a separate decision

*"Consider whether `process-model.ts` should keep defaulting."* Making the
attribute required is the stronger fix and it breaks every downstream
instance's diagrams. Nothing here moves it.
