---
# folio-assistant-lk2a
title: check:workflow-refs sends the reader to bean bvuk, which is COMPLETED and archived — the finding is live, the attribution is stale
status: todo
type: bug
created_at: 2026-10-02T23:32:19Z
updated_at: 2026-10-02T23:32:19Z
parent: folio-assistant-0ipy
---

## Measured 2026-10-02, on a checkout of `main`

`check:workflow-refs` reports two callers that run an adjudication without
naming the answers it may give, and sends the reader to bean `bvuk`:

```
? processes/library/sample-import.bpmn  · Call_Refresh → Process_RefreshMaterialized: does not say
? processes/library/subscribe-kg.bpmn   · Call_Refresh → Process_RefreshMaterialized: does not say
2 caller(s) run an adjudication without naming the answers it may give. Not an
error — what each should ask is the open question in bean `bvuk`
```

**`bvuk` is `status: completed` and archived** —
`beans/defs/archive/folio-assistant-bvuk--one-outcome-gateway-five-different-questions-proce.md`.
The owner chose shape (4), "split at the judgement", and all **9** callers of
`Process_Adjudication` / `Process_CriterionAdjudication` now carry an
`adjudication codes=` or `accepts=` marker.

**The finding is live; the ATTRIBUTION is stale.** Both halves matter:

- the two callers really do not declare an answer set — that is not fixed;
- but their callee is **`Process_RefreshMaterialized`**, not an adjudication
  process, so `bvuk`'s resolution never covered them and never could.

So an agent that reads the advice, opens `bvuk`, finds it completed, and
concludes the finding is stale will close a real gap by mistake. An agent that
instead believes `bvuk` is open will re-enter a decision the owner already
made. **Both readings are wrong and the message produces them.** This is the
`AGENTS.md` rule applied to a tool's own output: *"a stale gap notice is worse
than none, because an agent that believes it either avoids the feature or
rebuilds it."*

Source of the stale pointer: `cat-harness/scripts/check-workflow-refs.ts:273`
(the advice string), with `bvuk` also named at lines 121 and 128 in the module
header, where it is correct as history.

## Done when
- [ ] line 273's advice names the open question for
      `Process_RefreshMaterialized`'s answer set, not `bvuk`
- [ ] a bean exists for that answer set, or the two callers declare one
- [ ] the header references to `bvuk` at 121/128 stay — they are history and
      are accurate as such
- [ ] check whether any OTHER advice string in the gate set points at a
      closed bean; this is a class, not one line
