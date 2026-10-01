---
# folio-assistant-3432
title: 'BRANCH-ONLY RULING REQUEST: r0tm is a draft decision with a recommendation and a safe default, reachable from no ancestor of main'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T11:33:55Z
updated_at: 2026-10-01T06:51:19Z
parent: folio-assistant-ahvw
---

## The finding, and how it was measured

`beans/defs/folio-assistant-r0tm--adapters-closure-*.md` exists on exactly one
ref — `origin/claude/yj6r-adapters-closure-plan` — and its commit
(`974a0eac0ce`) is **not an ancestor of `origin/main`**:

    git merge-base --is-ancestor 974a0eac0ce origin/main   -> non-zero
    git branch -a --contains 974a0eac0ce                   -> that one branch

It is not an ordinary work item. Its front matter is `status: draft`, its title
is *"ruling request"*, and it carries a `## 6. Recommendation` with a marked
option A and a stated **safe default**. Its own body says *"Plan only — no
source file in this repository is changed by this work"*. So its entire purpose
is to put a decision in front of the owner — and the store the owner reads
cannot show it.

Provenance: four git commands against the fetched remote refs, 2026-09-30.

## Why this is the store's problem and not the sibling's

`AGENTS.md` gives one reason for the bean store being committed: *"`beans/` is
committed, so the plan survives a resume in a fresh container"* — and
`bean-coordination` adds the cross-session half, that a claim **announces**.
Both assume a sibling's beans become visible when its PR lands. A `draft`
ruling request breaks that assumption in the one case where it costs most: the
work is deliberately *not* landing, because it is waiting on the answer, so the
event that would publish the question is gated on the question.

A bean on an unmerged branch is normally fine and this bean does not claim
otherwise. What is not fine is a bean **whose type is a request to the owner**
being unreachable from the owner's own view.

## Done when

1. The `r0tm` ruling request reaches the owner — as an issue comment, a review
   question, or a bean on a landed branch. Which one is the owner's call.
2. A check reports beans that are `status: draft` **and** carry a
   recommendation/default section **and** exist on no ancestor of the default
   branch, with a denominator. `could not determine` is a finding, never green
   (`dh4f`).
3. `bean-coordination` says what a session owes a `draft` decision bean it does
   not intend to land soon.


## CORRECTION + RULING 2026-09-30 — the question DID reach the owner, twice

The owner chose **relay it here**, and carrying that out falsified part of this
bean's premise. Recorded rather than quietly dropped.

### What this bean got right

`r0tm` is on exactly one ref and its commit is not an ancestor of `origin/main`.
Re-verified. Its front matter is `status: draft`, it carries a
`## 6. Recommendation` with a marked option A and a stated safe default (D), and
its body says *"Plan only."* All as described.

### What it got wrong

The finding reads as though the question is unreachable from the owner's view.
It is not. `r0tm`'s own closing section says where it was put:

> Posted as a comment on issue #1558, the escape-tranche issue, 2026-09-30

and **PR #1581** — *"beans(r0tm): the adapters closure, planned"* — is OPEN
against #1558, which #1558 lists under `closed_by_pull_requests`. Issue #1558 is
open with 7 comments.

So the question reached the owner through **two** of the three channels this
bean's own done-when item 1 names as acceptable ("an issue comment, a review
question, or a bean on a landed branch"). Item 1 was already satisfied when this
bean was written.

**The store-visibility gap is real; the "cannot reach the owner" framing was
not.** A bean unreachable from `main` is invisible to a sibling SESSION reading
the committed store — which is a coordination cost, and the accurate statement
of the defect. It is not an owner-visibility cost, because a draft ruling
request that follows the convention posts to the issue as well.

### Done when — restated on the corrected finding

1. [x] The `r0tm` ruling request reaches the owner — **already done** via
       issue #1558's comment and PR #1581, before this bean existed. Relayed in
       chat as well, on the owner's ruling.
2. [ ] A check reports beans that are `status: draft` AND carry a
       recommendation/default section AND exist on no ancestor of the default
       branch, **with a denominator**. `could not determine` is a finding, never
       green (`dh4f`). Still worth building — for SIBLING visibility, which is
       the corrected subject.
3. [ ] `bean-coordination` says what a session owes a `draft` decision bean it
       does not intend to land soon. The answer `r0tm` demonstrates: post the
       question to the issue, and say on the bean where it was posted. That is a
       convention worth writing down because it WORKED here.

### The lesson

I wrote "the store the owner reads cannot show it" from the git measurement
alone, without checking the two channels the bean itself went on to list. The
measurement was right and the conclusion overreached — the same shape as
declaring a gate flappy without checking whether the base had moved
(bean `gm9g`, same session, same day).

## MEASURED 2026-09-30 — done-when 2 cannot be built before done-when 3, and here is the number that says so

Done-when 1 is closed (the question reached the owner twice). Attempting 2
first produced a finding about 2 itself.

### The check as specified would be vacuous by construction

Done-when 2 keys on `status: draft`. Measured over all **518** beans in
`beans/defs/` on this branch:

| status | beans |
|---|---|
| `completed` | 834 lines / — |
| `todo` | 189 |
| `in-progress` | 97 |
| `scrapped` | 29 |
| **`draft`** | **0** |

`draft` **is** a legal status — `cat-harness/schemas/tool-types.ts:36` has
`.enum(["draft", "todo", "in-progress", "completed", "scrapped"])` — and **not
one bean in the store has ever used it.** `r0tm` itself, the bean this one was
created about and whose own title calls it *"a draft decision"*, is
`status: todo`.

So a check keyed on `status: draft` reports `0 of 0` today and every day until
the convention changes, and reads **green** the whole time. That is bean `1xhc`
exactly — a gate that does not fire is indistinguishable from one that passed —
and it is worse here than usual, because the bean asking for the check is the
bean warning that a decision can go unseen.

(The status counts above are line counts from `grep -h '^status:'`, which
overcounts: beans quote each other's front matter in their bodies, so 1149
lines fall out of 518 files. The `draft: 0` figure is from a per-file front
matter parse, which is the only form that can be trusted here. Stating the
weaker measurement's shape rather than laundering it into a clean table.)

### Keying on prose instead swings the population by two orders of magnitude

If the check cannot read a status, the alternative is to recognise a ruling
request by its shape. Six recognisers over the **286** open beans, each also
filtered to "not present in `origin/main`'s tree":

| recogniser | open matches | not on main |
|---|---|---|
| heading `Recommendation` | 1 | 0 |
| heading `Options` | 20 | 0 |
| phrase `safe default` | 1 | 0 |
| phrase `ruling` | 63 | **1** |
| phrase `owner's call` / `owner's decision` | 48 | 0 |
| an unticked `- [ ]` box | 190 | **1** |

**1 to 190** depending on which form you recognise. That is bean `vq8g` — a
detector that recognises one form — stated as a number rather than a worry.

### And the single finding it does produce is a false positive

Both recognisers that fire on anything unreachable fire on the **same** bean:
`ybp4`, `in-progress`, *"ADAPTERS CLOSURE step 2/2"*. It matches `ruling`
because it **records** a ruling the owner already gave. It is not a ruling
request at all.

So the grep-based check would today report exactly one finding, and be wrong
about it. A report that is 0-for-1 precise on its only output is `oqdr` — a
report nobody reads — and it earns that reputation on its first run.

### Therefore: 3 before 2, and 2 reads the declaration

The ordering in this bean's own done-when list is backwards, and the measurement
is what shows it. **A decision bean must declare itself**, and then the check
reads the declaration instead of sniffing prose:

1. `bean-coordination` records the convention `r0tm` demonstrated — post the
   question to the issue, and say on the bean where it was posted (done-when 3).
   That convention is what mints the declared marker.
2. The check then reports beans carrying that marker, unreachable from the
   default branch, with a denominator — and `could not determine` stays a
   finding, never green (`dh4f`).

Written down rather than acted on, because renaming what a decision bean looks
like is a convention change and conventions here are the owner's. What is
asserted is only that building 2 first buys a green light over an empty set.

### Done when — restated a second time

1. [x] The `r0tm` ruling request reaches the owner.
2. [ ] The check — **blocked on 3**, and now for a measured reason rather than
       a preference: keyed on `status: draft` it is vacuous over 518 beans;
       keyed on prose it is 1-to-190 arbitrary and 0-for-1 precise.
3. [ ] `bean-coordination` records the convention, INCLUDING the declared
       marker 2 will read.

_2026-09-30T23:08:28Z_ — Claimed by claude/cool-fermi-htir5p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-09-30 — done-when 3 DONE; done-when 2 stays with the owner

`bean-coordination` now carries §"A DECISION bean you will not land soon — put
the question where a person reads": post the question to the issue, and say ON
THE BEAN where you posted it. Both halves, and the section records that it is
written down **because it worked here** — `r0tm` was answered because the
question sat on issue #1558 and PR #1581, not because anyone found the bean.

It also carries the two things NOT to rely on, with the measurements from this
bean: `status: draft` used by 0 of 518 beans though the schema allows it
(`1xhc`), and prose recognisers spanning 1 to 190 candidates (`vq8g`).

**Done-when 2 is not built, deliberately.** It needs a DECLARED marker for a
check to read, and minting one changes what a decision bean looks like — a
convention, and conventions here are the owner's. Recorded in the new section
as unanswered rather than decided, which is `surprise-to-corpus` pointed at my
own proposal: the agent does not write corpus guidance unasked.

- [x] 1. The `r0tm` ruling request reaches the owner.
- [ ] 2. The check — **blocked on a convention decision**, not on effort.
- [x] 3. `bean-coordination` records the convention.


## RULED 2026-10-01 — adopt `status: draft`; do not mint a new marker

The owner chose, from three options:

> **`status: draft`** — already in the schema enum, already offered by
> `beans create --status`, and used by **0 of 542** beans.

Re-measured on main `02f16ae98bb`: `todo` 195, `completed` 232, `in-progress`
106, `scrapped` 9, **`draft` 0**. Claiming it collides with nothing and needs no
schema change.

**This reverses my earlier reading of done-when 2, and the correction matters.**
I recorded that a check keyed on `status: draft` would be *"vacuous by
construction"* and concluded the done-when list was backwards. The vacuity
measurement was right — 0 of 518 then, 0 of 542 now — but the conclusion was
wrong. `draft` was not the wrong key; it was **an unclaimed one**, and an enum
member nothing uses is free to adopt rather than evidence against itself. A
measurement of the present tense is not a measurement of what the convention
should be.

So done-when 2 is buildable **exactly as originally written**, and needs no
declared marker beyond the one the schema has carried all along.

## Done when — restated

1. [x] The `r0tm` ruling request reaches the owner.
2. [ ] The check: beans that are `status: draft` AND carry a
       recommendation/default section AND exist on no ancestor of the default
       branch, with a denominator. `could not determine` is a finding, never
       green (`dh4f`).
3. [x] `bean-coordination` records the convention — to be amended with the
       `status: draft` half, which it currently does not name.
