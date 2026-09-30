---
# folio-assistant-m4s1
title: 'TRANSLATION CATALOGUES: 36 (locale, page) .po files must be AUTHORED — the templates now exist, nobody has been ASKED, and #1399 is held on it'
status: todo
type: bug
created_at: 2026-09-26T16:58:29Z
updated_at: 2026-09-26T16:58:29Z
parent: folio-assistant-1xhc
blocking:
    - folio-assistant-tbdg
---

Created 2026-09-26 on the owner's explicit decision: **hold PR #1399 until the
catalogues exist, and make sure that work exists.** It did not. This bean is the
"make sure it exists" half.

## Why nothing tracked it, which is the interesting part

Three beans circle this subject and none of them ASKS for the work:

| bean | what it is | why it is not this |
|---|---|---|
| `ngxj` | the owner ruling out recording the absence | a decision, not a task |
| `f6r1` | **completed** — can a `.po` be DERIVED from an already-published translated page? | answered no (19 of 27 provably not, 8 undetermined, 0 demonstrated). A closed question about a DIFFERENT route |
| `tbdg` | main is RED on translation-drift | a bug report on the symptom |

So the gate has been red on `main` since 2026-09-25, three beans describe the
red accurately, and **not one of them is a request to do the thing that clears
it.** A subject can be thoroughly documented and still have no owner, and the
documentation is what makes that hard to notice: every reader arrives at a bean
that explains the situation and none that assigns it.

## The set, DERIVED and not written down

36 (locale, page) pairs over 8 pages. Re-derive it with
`bun run translation:pot -- --json` rather than quoting this table, which is
a snapshot:

| page | locales |
|---|---|
| `agentic-harness` | ar es fr ru zh |
| `architecture` | ar es fr ru zh |
| `beans-and-todos` | ar es fr ru zh |
| `document-ingestion` | ar es fr ru zh |
| `evidence` | ar es fr ru zh |
| `getting-started` | **zh only** — the other four have a catalogue |
| `publication-workflow` | ar es fr ru zh |
| `skills` | ar es fr ru zh |

Note it is 36 and not the 27 `tbdg` records, and not the 25 an earlier session
worked from: the set MOVES as pages are published and as catalogues land, which
is why `needingCatalogue()` derives it from the drift gate's own findings.

## The input exists now; the output is the whole of the remaining work

`translations/<locale>/<page>.pot` is written for every one of them —
`bun run translation:pot`, 62 templates owned, `translation:pot:check` wired into
CI ahead of the drift check. Before 2026-09-26 not one of these pages had a
`.pot` OR a `.po` in any locale, so the work could not have been handed to
anybody. That blocker is gone.

## AUTHORING is not blocked, and this must not be confused with `f6r1`

`f6r1` proved that a catalogue cannot be reverse-engineered from a finished
translated page, because source and translation yield different segment counts
(18 cases) and one locale translates a repeated msgid two different ways.
**That is a statement about derivation, not about translation.** Writing a `.po`
from the `.pot` is an ordinary translation task and nothing here has shown it to
be impossible or even hard.

Anyone reading `f6r1` as "the catalogues cannot be produced" has read it as one
claim wider than it is, and this bean exists partly to stop that: the reason
these do not exist is that **nobody has been asked**, not that it cannot be done.

## The route issue #206 already authorises, and the one decision it needs

Issue #206, in the owner's own words, sets up exactly this:

> *"there are official and unofficial translations. official means human
> adjudication/sign-off has happened. unofficial = agentic starting with `.po`
> translations if any"*

So an **agent may author the unofficial `.po`**, and human sign-off is what makes
it official. That is an available path, it clears the gate, and it does not
invent a policy.

What it needs first is the owner's word, for a reason that is not procedural: the
published pages in these locales ALREADY EXIST. A fresh agentic translation of
the `.pot` would produce a catalogue that does not match the page a reader sees —
which is `f6r1`'s segment-count finding arriving from the other direction. So
the real question is which of the two the catalogue should agree with, and that
is a content decision rather than a translation one.

## What must NOT be done

Adding the 36 to `UNCATALOGED`. `tbdg` settles it and the register's own docblock
settles it: *"these are a BACKLOG, not a policy"*. It would turn a backlog of 2
into 38 in one commit, which is retiring a working gate by filling its exemption
list — the same act as quarantining a test.

## Done when

- [ ] the owner has chosen between (a) agentic unofficial `.po` authored from the
      `.pot`, pending their sign-off, and (b) waiting for human translation.
      MEASURED AFTER: the choice is recorded here in their words, with a date
- [ ] if (a): the catalogue agrees with a stated one of {the `.pot`, the
      published page}, and which one is recorded. Not left to whichever the tool
      happened to produce
- [ ] `bun run translation:drift:check` exits 0 with `UNCATALOGED` no longer than
      it is today. MEASURED AFTER: the count of `UNCATALOGED` entries before and
      after are equal
- [ ] PR #1399 is unblocked — it is held on this bean by the owner's decision of
      2026-09-26 and on nothing else; 2 of 162 gates red, both this one cause
