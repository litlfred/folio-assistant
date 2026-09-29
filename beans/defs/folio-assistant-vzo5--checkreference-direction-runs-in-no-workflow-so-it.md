---
# folio-assistant-vzo5
title: check:reference-direction runs in NO workflow, so its PENDING guard — the half its docblock calls enforced — fires nowhere
status: todo
type: bug
priority: high
created_at: 2026-09-29T22:16:35Z
updated_at: 2026-09-29T22:16:35Z
parent: folio-assistant-1xhc
---


Found by a goal-review sweep, 2026-09-29, on `origin/main` @ `35402147f55`.

`zhg2` shipped `check:reference-direction` (PR #1222, merged 2026-09-26) and
registered it in `gates.ts` as `kind: "report"` — advisory, deliberately,
because the wrong-direction count is 574 and *"a gate that fails on a backlog
is a gate somebody switches off"*. That reasoning is sound and is not what
this bean disputes.

What it disputes is the sentence beside it. The registration's own `reason`
says:

> What IS enforced on every run today, without waiting: the PENDING set,
> which fails on a stale entry, and the IMPORT half of the same arrow

**Nothing enforces it.** Measured:

```
$ grep -rn "reference-direction" .github/workflows/ | wc -l
0
$ bun run check:reference-direction >/dev/null 2>&1; echo $?
1
```

The script appears in **no workflow file**, so no CI run ever invokes it —
and it is exiting **1 right now** on a stale exemption:

```
✗ 1 PENDING entr(y/ies) no longer qualify — delete them:
    cat-harness/scripts/gen-object-model-uml.ts — now names ONE instance,
    so it has a destination and is not pending
```

A `kind: "report"` entry does not make the PENDING half enforced and the
wrong-direction half advisory. It makes the **whole script** advisory. The
two halves cannot have different enforcement while they share one exit code
and one registration.

## Why this is `1xhc` and not a wording nit

This epic's sentence is *a gate that does not fire is indistinguishable from
one that passed*. Here a check that fires nowhere is described, in the
repository's own registration table, as firing on every run — so a reader
looking for whether the PENDING set is guarded finds a confident yes and
stops. The stale entry above is the proof the guard is not there: it is
exactly the failure the prose promises to catch, sitting uncaught.

It is also the same shape as `9x9r` one level out. There, a check reported a
✓ because it asked a weaker question than the operator's. Here, a check
reports nothing at all because nothing asks it, while prose asserts it was
asked.

## Not proposing the fix

`zhg2`'s own Done-when is owner-gated (the ruling on 116 single-destination
files), and how to split enforcement is a design choice with at least two
shapes — a separate `check:reference-direction:pending` script wired as a
gate, or one script with a flag and two registrations. Naming one here would
be guessing at `zhg2`'s intent.

## Done when

- [ ] the PENDING staleness guard either runs in CI, or the registration's
      `reason` stops saying it does — whichever the owner rules
- [ ] the stale `gen-object-model-uml.ts` entry is resolved
- [ ] whatever is chosen, the claim and the wiring agree: no `reason` text
      describes enforcement that no workflow performs
