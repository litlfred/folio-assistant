---
# folio-assistant-sfhr
title: 'STORE DEFECTS the check does not see: an empty in-progress body, a title that ate its Done-when, a blocker on a scrapped bean'
status: completed
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-21T21:34:26Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`beans check` passes ("No link issues found"), and three beans are unreadable by the tooling or by a person: `70c7` is `in-progress` with an EMPTY body (front matter only); `52dz`'s `title: |-` block swallowed the first ~10 lines of its body, including a `## Done when` with three unchecked boxes; `nvbr` is "blocked on bean `fsch`", which is `scrapped` in the archive.

## The gap
todo-manager says a bean carries its Done-when and its blockers; nothing checks that a bean HAS a body, that its title is one line, or that a prose blocker names a live bean. The link check covers front-matter links only.

## Done when
- [x] A check reports: empty body on an open bean, multi-line title, and a "blocked on `<id>`" in prose whose target is scrapped or completed

*Ticked IN PLACE 2026-09-21.* `check:bean-bodies` shipped in PR #589 and
reports all three. A ticked copy had been appended at the foot of this file
instead — this bean's own subject, in the bean that added the detector for it,
and invisible to that detector until it learned that a `---` rule ends the
canonical section too.

- [ ] The three beans above are repaired by their owners (this bean does not edit them)

---

_2026-09-20T19:00Z_ — **Done-when 1 landed** (PR #589, issue #588).
`bun run check:bean-bodies` reports all three: an empty body on an open bean, a
`title:` block scalar that continues into the body, and a prose ``blocked on
`id` `` whose target is `completed` or `scrapped`. It found `70c7`, `52dz` and
`nvbr` exactly as this bean describes them, **and five more beside them** —
`1r0p`, `d5f1`, `ktt2`, `rnfl` and `y1w9`, all blocked on a bean that is closed.

Two false-positive classes were measured and closed rather than tolerated. The
id must be **in a code span and id-shaped**: a bare word matched *"blocked on
there being a dataset"*, *"blocked on effort"* and five others. And a match
**inside a quotation** is skipped — this bean quotes `nvbr`'s blocker, and the
first draft reported that as `sfhr`'s own dead blocker, which would have made
the check's first finding a misreading of its own specification.

Baselined at the eight the store has, per this bean's own instruction that they
are repaired **by their owners**: a NEW defect fails, the backlog is listed, and
a baseline entry that stops matching is reported as stale so the file shrinks.
Wired into `code-quality-gates.yml`.

- [x] A check reports: empty body on an open bean, multi-line title, and a "blocked on `<id>`" in prose whose target is scrapped or completed
- [ ] The three beans above are repaired by their owners (this bean does not edit them)

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5.* — **The duplicated checklist
has a reader, and it found the defect in six OPEN beans including this
session's own.**

## Three candidate rules measured and rejected before this one

My premise going in was wrong, and the measurement is what corrected it. I
assumed the defect was a second `## Done when` heading. It is not:

| candidate | findings | why it fails |
|---|---|---|
| more than one `## Done when` heading | **34 beans** | the real `bbbl` case had NO second heading — the copy was appended bare at the foot |
| any checklist item below the canonical section | **57 beans** | recording a NEW open item in a dated entry is this store's ordinary idiom, on my own beans included |
| a later item that restates a canonical one | **33 beans / 75 items** | a progress note quoting the item it has just satisfied reads identically |

Falsified first, as `7iog` was: a duplicated checklist planted in a bean
passed `check:bean-bodies` with exit 0.

## What separates the defect is an ASYMMETRY, and the bean said it outright

> the ticks were appended as a SECOND copy of the checklist at the foot of the
> file, so the canonical `## Done when` still read 0 of 2 and any reader or
> tool consulting it saw an untouched bean

So the rule is: **a later item that is TICKED while the canonical item it
restates is still OPEN.** A note restating an already-ticked item agrees with
the canonical section; an unticked later item is a new open item. Neither
misleads anyone, and neither is reported.

Containment rather than equality, because the real copies are not verbatim —
`fgnw`'s dropped a parenthetical and `9x17`'s paraphrased ("schema validation
as its operation" for "schema validation and profile check as DISTINCT
operations"). An equality test passes over both.

## The findings are real — verified by hand, not by score

`7u3g`: canonical reads **0 of 5** while a copy at line 97 reads 4 ticked.
`0hi8` and `9x17` the same. Even the weakest-scoring match at 0.78 is the same
defect paraphrased. Six OPEN beans: `0hi8`, `81t5`, `b963`, `ivfw`, `jbx2`,
`xgd8`.

**`b963` was mine, so it was repaired rather than baselined** — ticked IN
PLACE, with the evidence (`check:command-paths` merged in #604 and passing on
main over every fenced command). It carried three ticked copies below two open
canonical boxes, which is this defect at its most self-referential: the bean
whose subject is *a claim that stopped being true* was making one.

The other five are baselined, with `sfhr`'s own rule — their owners repair
them, and the check fails only on a NEW one.

## Also: this check had no tests at all

It shipped in #589 untested. 13 now, of which exactly **two** go red when the
rule is stubbed out — the other six are false-positive guards that must pass
either way, one per rejected candidate above.

- [x] `check:bean-bodies` reports a duplicated checklist — the `bbbl` defect's
      remaining half
- [ ] The five baselined `shadow-checklist` beans are repaired by their owners
      (this bean does not edit them)

*Issue link, recorded 2026-09-21.* **[#639](https://github.com/litlfred/folio-assistant/issues/639)** — the shadow-checklist detector.

Written down because `check:bean-issue-links` found it missing, and the defect is this epic's own: an issue was opened FROM this bean and the link was never carried back, so the work plan could not reach the issue from the bean. `oh78` names exactly that, and it happened four times in the session working `oh78`.

---

## 2026-09-21 — the closed-bean question, answered with a number

It sat as *"raised, not decided"* because nobody had measured it. Measured now,
and **the dates decide it, not the count**:

| | |
|---|---|
| CLOSED beans carrying the shape | **30** (75 items), against 3 open |
| **ARCHIVED** beans carrying it | **0 of 219** — and archived beans are the OLD ones |
| last updated 2026-09-20 | **21** |
| last updated 2026-09-21 | 9 |
| this check shipped (#589) | **2026-09-21** |

So it is neither sediment nor a trend. It is a **one-day burst on 2026-09-20** —
the 54-merge window `vlhk` describes — and this check shipped the day after, in
response to it. The zero across 219 archived beans is what rules out "it has
always been like this".

### Decided: closed beans are COUNTED, never failed

**Every bean is open before it is closed**, so the open-bean rule already
prevents recurrence. Extending it backwards would add **75 baseline entries,
all belonging to other owners, for work already finished** — and a completed
bean's unticked checklist misleads nobody about what to do next, because its
`status` says `completed` and dominates.

That is the same argument I made on `vzur` four hours ago and would be
contradicting here: **a gate that is red on arrival is not a gate.**

### But not silent, either

`closedWithShadow` is reported every run. *"Not scanned"* and *"none there"*
must not look alike — the three-state rule this repository applies everywhere
else. A **rising** number means the open-bean gate is being evaded; a flat one
means the burst is history. A measurement that lives only in a bean is a
printed verdict: gone, and unaskable later.

### The other open item is NOT mine

*"The five baselined `shadow-checklist` beans are repaired by their owners."*
Two already are — `ivfw` and `jbx2` are gone from the baseline, which is the
shrink rule working. Three remain: `0hi8`, `81t5`, `xgd8`. **I own none of
them**, and this check's own output says so in as many words:

> Outstanding defects are repaired by the bean's OWNER, not by this check and
> not by whoever ran it.

Left open, and it is the only thing standing between `sfhr` and done.

### Noticed while measuring, not touched

Six `dead-blocker` findings the issue does not mention — four beans blocked on
`68dt` (`completed`), two on `fsch` (`scrapped`), one on `qif9` (`completed`) —
plus a `folded-title` (`52dz`) and an `empty-body` (`70c7`). All baselined, all
other owners'.

`bun run gates` — 93 of 93.

---

## 2026-09-21 — the last item, and the baseline shrank 11 → 8

The owner authorised repairing the three that remained. `ivfw` and `jbx2` had
already been done by their owners; `b963` was repaired when this bean shipped.

**Each was a different shape of the same defect, and none was carelessness:**

| bean | what was actually there |
|---|---|
| `0hi8` | a **deliberate status report** with reasoning — two items verified, the third argued open on the merits. The canonical list simply never caught up |
| `81t5` | **THREE** checklists. The last declared itself *"REPLACES both lists above"* — so the authoritative list was the one nobody consults |
| `xgd8` | a revision sitting **160 lines below** the list every reader and tool reads |

In every case the author's verdicts are unchanged. **What moved is which list a
reader finds first** — which is the whole of what this bean is about.

`0hi8`'s second item stays open on purpose, and its reasoning is worth keeping:
a generic static server fails `compound-extension-wins` because every OS table
resolves `.schema.json` to `application/json`, and declaring Caddy would
*"assert conformance nobody measured"*.

### The baseline shrank rather than fossilised

The check reported all three entries **stale** and kept failing until they were
removed: 11 → 8. That is the shrink rule doing its job, not a tidy-up.

`sfhr` is complete.
