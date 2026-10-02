---
# folio-assistant-w4tq
title: 'Adversarial pass over this session''s own numeric claims — six re-run, one wrong when written'
status: completed
type: task
priority: normal
created_at: 2026-09-21T23:30:00Z
updated_at: 2026-09-21T23:40:00Z
parent: folio-assistant-vuip
---

In the spirit of `osyc` — *"an adversarial pass over what this session
produced and, more usefully, over what it CLAIMED"* — but aimed at this
session rather than the navbar one, because that is where the context is.

**The reason to aim it here:** this session made **four** substring-counting
errors in one sitting (`zq3f`'s 235, `k8rc`'s 344, `x4a6`'s "57 readers", and
an "85 importers" that was comment text). Each produced a *plausible number*
rather than an error, which is precisely why each survived into a bean before
anything parsed it. Four merged PRs now carry counts.

## Method

Re-run each landed claim against today's `main`, with the tool I would use
now rather than the one I used then. Not re-litigating conclusions — only the
numbers, and only where a number is load-bearing.

## Results

| claim | then | now | verdict |
|---|---|---|---|
| `vzur` — stale paths after the sweep | 0 | 0 | **holds** |
| `vzur` — declaration-claims corpus | 5 (2 generic, 3 concrete) | 5 (4 generic, 1 concrete) | total holds; **split is stale** |
| `vzur` — "of fifteen declarations only `cat-harness` sets `stub`" | 15 | 14 | **WRONG WHEN WRITTEN — 13** |
| `zq3f` — sidecars carrying the criterion, all `n/a` | 122 + 235 mentions | 122 + 235, all `n/a` | **holds exactly** |
| `k8rc` — runtime class after the fix | 4 | 5 | drift, and the 5th is **correct** |
| `x4a6` — call sites reaching the registration | 31 of 31 | **35 of 35** | conclusion **robust** as the corpus grew |

## The one real error, and it is the session's own signature mistake

*"Of fifteen declarations only `cat-harness` sets `stub`."* There were **13**.

My probe matched any JSON carrying `name` and `directories`, which swept in
`beans/beans.json` and `todos/todos.json` — bean-graph declarations whose stem
is not their `name`. `findDeclarationFile` requires stem to EQUAL the declared
name, and **I had read that contract earlier in the same session** before
writing a probe that ignored it.

Counting things that match a SHAPE rather than things that satisfy the
CONTRACT — the fifth instance of one error in one session.

**The substantive claim survives**: exactly one instance sets a `stub` and it
equals its `name`. The count was decoration on a sound argument.

## The finding worth keeping

**The wrong number did not reach the skill.**
`directory-conventions.md` says *"today all of them but `cat-harness`"* and
quotes no figure, so nothing there needed correcting — while the bean and the
PR body, which are free prose, carried the error.

That is this repository's own rule — **never quote a count from prose** —
working exactly as written, on the session that was busy breaking the same
rule four other times. The rule is not about tidiness; it is a containment
boundary, and it held.

## A near-miss, recorded because I nearly reported it

`k8rc`'s runtime class went 4 → 5 and I was about to report *"the class is
creeping back, which is evidence for the gate"*. It is not: the new occurrence
is `mount-instance-docs.ts:393`, Jekyll's `_data/harness.json`, which must not
be renamed and is correct. **No regression.** Checking before claiming is the
whole of this bean's method, applied to itself one step from failing.

## Summary of Changes

- `vzur` corrected in place with the count, the cause, and where it did not land.
- No skill changed — none carried the number.
- `x4a6` and `zq3f` re-verified and need no edit.
