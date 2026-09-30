---
# folio-assistant-tlj9
title: 'PARENT INTEGRITY: a bean''s body names a parent its front matter does not carry (4ccr), so a goal''s open count is wrong'
status: todo
type: task
created_at: 2026-09-30T11:33:55Z
parent: folio-assistant-ahvw
updated_at: 2026-09-30T11:33:55Z
---

## The finding, and how it was measured

`beans/defs/folio-assistant-4ccr--*.md` is an epic — *"WIREFRAME FINDINGS:
usability and accessibility defects the as-is wireframes observed (#1023)"*. Its
front matter carries **no `parent` field**. Its body, line 19, says in prose:

> It belongs to the rendered-surface stream, `folio-assistant-10uc` (navbar,
> visualisers, stickies).

`10uc` is *"STREAM 2/3: GOAL 2 — the rendered surface"*, itself parented to
`p5wm`, which is GOAL 2. So the bean states its own placement in a sentence and
declares nothing, which means every consumer that walks `parent` — a goal's open
count, a roadmap, this review's own queue — omits `4ccr` and everything under
it from GOAL 2.

Provenance: read out of the two files on `claude/cool-fermi-htir5p` at parity
with `origin/main`, 2026-09-30. Nothing here is inferred from a count printed by
a tool.

## Why it is not just a typo in one bean

The same shape has now been paid for three times in three days, each time with a
different carrier and the same mechanism — **a declaration and its subject
drift, and nothing compares them**:

| carrier | declares | subject | caught by |
|---|---|---|---|
| bean front matter | `parent` | the body's own prose | nothing |
| script docblock | `@covers <kind>` | the directories the script resolves | nothing (bean `z6xd`) |
| script docblock | *"nothing runs `--check` in CI"* | `code-quality-gates.yml` | nothing (bean `q885`) |
| `AGENTS.md` | claims about code | the code | `check:agents-claims` |

The last row is the precedent: bean `77ex` established exactly this for
`AGENTS.md` and shipped a checker. The three above are the same defect one layer
in, on carriers that checker does not read.

**What this bean does NOT claim.** The three carriers need three different
parsers — front matter is YAML, `@covers` is a docblock tag, the CI claim is
prose. They share the *shape*, not the mechanism, so this is not a request for
one check over all three. Rolling them into one would be the
over-generalisation `generalise-the-fix` warns about.

## Done when

1. `4ccr` carries `parent: folio-assistant-10uc`, or a recorded reason why the
   prose is wrong and the empty parent is right. **This changes GOAL 2's open
   count, so it is the owner's call, not this bean's** — see the review that
   opened it.
2. A check fails on a bean whose body names `folio-assistant-<id>` as its parent
   in prose while its front matter carries a different parent or none. Scoped to
   that one phrasing, because a detector recognising one form and calling the
   corpus clean is the `vq8g` defect.
3. The check is falsified before it ships: plant the defect on a scratch bean,
   watch it fire, restore, watch it pass.


---

## 2026-09-30 — Done-when #1 done, by the owner's ruling

The owner chose, from four options: *"Reparent 4ccr, then gate ob3m + generalise
v8n5"*. So `4ccr` now carries `parent: folio-assistant-10uc`.

**Measured before and after, not asserted.** GOAL 2 (`p5wm`) went from
**38 descendants / 28 open** to **68 / 52** — the +24 predicted from `4ccr`'s
own subtree (29 descendants, 23 open, plus `4ccr` itself). The prediction and
the result agree, which is the only reason to trust either.

`10uc`'s title still reads *"39 open beans"*, matching neither figure. That is a
count in prose, which is a claim rather than evidence — left for whoever owns
`10uc` rather than edited here.

Done-when #2 (a check for a bean whose body names a parent its front matter does
not carry) and #3 (its falsification) remain open.


---

## 2026-09-30, later — the reparent is BLOCKED, and the blocker is a second instance of this bean's own defect

The owner ruled "reparent 4ccr". I did, CI went red, and the reason is
`check:bean-parents`:

    ✗ folio-assistant-4ccr: `parent: folio-assistant-10uc` is a task,
      not a milestone, epic or feature

Reverted, and `check:bean-parents` is back to exit 0. **The ruling is not
carried out** and must not be recorded as done.

### Why no target works, measured

`check-bean-parents.ts` permits a parent of type `milestone`, `epic` or
`feature`, and adds one rule for epics: *"AN EPIC HANGS FROM A GOAL, and from
nothing else"* — `b.type === "epic"` requires `p.type === "milestone"`.

| bean | type | usable as `4ccr`'s parent? |
|---|---|---|
| `4ccr` | **epic** | — its parent must be a `milestone` |
| `10uc` | **task** | no: `task` is not a permitted parent type at all |
| `p5wm` (GOAL 2) | **bug** | no |
| `yg29` (GOAL 3) | **bug** | no |
| `vuip` (GOAL 1) | `milestone` | yes by type, wrong goal |

So GOAL 2 has **no milestone anywhere in its line**, and an epic cannot hang
from anything else.

### The finding, and it is this bean's own class again

`todo-manager` §"A GOAL is a `milestone` bean" is quoted by the check's own
error message. `p5wm` is titled *"GOAL 2: ..."* and typed **`bug`**; `yg29` is
titled *"GOAL 3: ..."* and typed **`bug`**. Only `vuip` is a `milestone`.

That is exactly this bean's subject — **a declaration and its subject drift, and
nothing compares them** — one level up: the title says GOAL, the type says bug,
and `check:bean-parents` only notices when something tries to hang off it. Two
of the three goals this session's review was organised around are not, to the
store, goals at all.

### Not fixed here, deliberately

Every route requires retyping a bean that is not mine and reshapes the roadmap:
retype `p5wm` to `milestone` (then `4ccr` hangs off it directly), or retype
`4ccr` to `feature` **and** `10uc` to `epic`. The owner's ruling authorised a
reparent, not a retype, and `bean-coordination` does not let an agent decide
another bean's type on its own initiative. Put to the owner instead.
