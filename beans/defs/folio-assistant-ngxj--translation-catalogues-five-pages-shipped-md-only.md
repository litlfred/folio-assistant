---
# folio-assistant-ngxj
title: 'TRANSLATION CATALOGUES: five pages shipped .md-only, so translation:drift holds every open PR red — and it is a regression in t8g3''s own practice'
status: todo
type: bug
priority: high
created_at: 2026-09-26T06:46:02Z
updated_at: 2026-09-26T06:46:02Z
parent: folio-assistant-1xhc
---

## NOT a claim on `t8g3`'s work

This bean is the **gate blocker and the measurement**, not the translation work.
`t8g3` (issue #206) is `in-progress` and its campaign is somebody else's to run;
`bean-coordination` §"Mid-flight is still off limits" applies and nothing here
may be closed by producing catalogues on their behalf. It exists so the next
agent hitting a red queue finds the measurement instead of re-deriving it — which
this session did four times over on other subjects.

## Measured 2026-09-26 against `origin/main` (`70a8650125`)

`translation:drift` reports **35 translations compared, 25 findings, 0 could not
be read, 2 uncatalogued-and-recorded**. That reconciles exactly, so the 25 are
identified rather than merely counted:

| page | translated `.md` | `.po` catalogue |
|---|---|---|
| `index` | 5 locales | **ar es fr ru zh** — complete |
| `guides/agent-onboarding` | 5 locales | ar fr ru only; `es` + `zh` are the 2 already in `UNCATALOGED` since 2026-09-20 |
| `getting-started` | 5 locales | none |
| `installation` | 5 locales | none |
| `content-types` | 5 locales | none |
| `contributing` | 5 locales | none |
| `accessibility` | 5 locales | none |

8 catalogued + 2 recorded + **25 missing** = 35.

## The finding: it is a REGRESSION, not a missing requirement

The two earliest pages produced catalogues. The five from the 2026-09-26 batches
did not:

    translations/fr/index.po             2026-09-19  c25761d2cf
    translations/fr/agent-onboarding.po  2026-09-21  01680d0387

    docs/fr/getting-started.md           2026-09-26  d4eaa1a26e
    docs/fr/installation.md              2026-09-26  2c08353da2
    docs/fr/content-types.md             2026-09-26  2c08353da2
    docs/fr/contributing.md              2026-09-26  7a2d4d377b
    docs/fr/accessibility.md             2026-09-26  7a2d4d377b

So the workflow that produced `index` and `agent-onboarding` did the right thing,
and something changed between then and `#1368` / `#1371` / `#1374`. **That is the
part worth telling them** — a practice that worked twice and then stopped is a
different problem from a requirement nobody knew about, and it has a different
fix.

**The two definitions of done have diverged.** #206's progress tables mark a page
✅ when its translated `.md` exists; the gate asks whether the translation has a
`.po`. Neither is wrong and nothing reconciles them, which is how five pages
shipped green by one measure and red by the other.

## Why it is worth interrupting for

CI checks the MERGE of each PR's head into `main`, so every open PR inherits the
failure. Of **24** open PRs, all **11** with a gate run in the two hours to
2026-09-26 05:50 are red and **none** is green. The cost is not one red PR: it is
that nobody can establish their own branch is sound, because inherited red looks
identical to their own.

## Recording the 25 in `UNCATALOGED` was considered and DECLINED

Three sessions refused it independently, and correctly. I was one of them — I
added 25 entries and withdrew them in `3b82cfa82e`. It is one of the two remedies
the gate's own error offers, and dated entries cannot become policy, so the
objection is not that it is forbidden but that the notes would be **about a
sibling's live campaign** and would contradict the tree as soon as catalogues
land.

The owner ruled on 2026-09-26 for the catalogues rather than the backlog, so the
ask is blocking. Posted as issue #206 comment `5844010805`.

## Waiting on

A person, not a process — stated with an expiry per `bean-blocking`:

| | |
|---|---|
| waits on | the `t8g3` campaign supplying 25 `.po` catalogues, or saying they cannot be derived |
| asked | issue #206 comment `5844010805`, 2026-09-26 |
| expiry | 48 h. After that this goes back to the owner with "no answer" as the new fact, NOT to a unilateral `UNCATALOGED` entry |
| handoff | the owner decides again; the three options are on the triage page and option 2 becomes live only on their instruction |

## Done when

- [ ] The 25 catalogues exist, **or** the campaign states on #206 that they
      cannot be derived from a finished translation without inventing the
      segmentation — the reason the two existing `UNCATALOGED` entries give
- [ ] `translation:drift:check` exits 0 on `origin/main`, re-measured in a clean
      worktree rather than inferred from a PR going green
- [ ] The two definitions of done are reconciled somewhere an author adding a
      translation will meet it — a page is not done because its `.md` renders.
      This is the half that stops a third recurrence, and it is not satisfied by
      supplying the 25
- [ ] `v625`'s open item (*"`translation:drift:check`'s 25 … are somebody's"*) can
      point here rather than at nobody

---

## 2026-09-26, later: the recording was landed and then REVERTED, citing this decision

A sibling recorded all 25 in `UNCATALOGED` (`#1381`) and it merged, which briefly
took `translation-drift` to 18 pass / 0 fail and made this bean's ask look moot. It
was then undone: `e9f30a78c1` — **"Revert the 25 UNCATALOGED entries — they
collided with a decision and with PR #1381"**.

So the owner's choice was honoured by the corpus rather than only by the sessions
that read it. Measured after, in a clean worktree at `origin/main` `e925d8ec81`:

    UNCATALOGED                     2 entries (the pre-existing agent-onboarding pair)
    translation:drift:check          25 findings, exit 1
    translation-drift.test.ts        17 pass / 1 fail

Identical to the state this bean was opened on. **Nothing about the ask changed,
and nothing about the measurement needs re-deriving** — the per-page table above
and the regression evidence (`index.po` 2026-09-19, `agent-onboarding.po`
2026-09-21, then five `.md`-only batches on 2026-09-26) are unaffected by who
recorded what in between.

The one thing that DID change is the strength of the record: an agent reading this
bean now has a merged commit saying the recording route was taken and withdrawn,
so it does not have to re-litigate option 2 from scratch. Recording is still
available and still only on the owner's own instruction.

