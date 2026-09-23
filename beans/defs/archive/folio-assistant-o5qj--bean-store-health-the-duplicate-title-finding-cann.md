---
# folio-assistant-o5qj
title: 'BEAN-STORE HEALTH: the duplicate-title finding cannot be cleared by following its own action — scrapped beans stay in the group'
status: completed
type: bug
priority: high
created_at: 2026-09-23T14:57:56Z
updated_at: 2026-09-23T15:06:02Z
parent: folio-assistant-1xhc
---


`bean-store`'s `bean-duplicate-title-groups` finding is `major` with a
deliberately zero tolerance — *"Any duplicate at all is the leading edge of
that, so there is no tolerance band."* Its action is precise:

> Keep the earliest, and set each of the others to `scrapped` with a note
> naming the one that survives. **Never `beans delete`** — a scrapped bean
> records a considered rejection, a deleted one leaves a sibling unable to tell
> abandonment from accident.

**Following that action does not clear the finding.** `byTitle` in
`cat-harness/test/health/checks.ts` buckets EVERY bean, whatever its status, and
`dupGroups` keeps any bucket with more than one member. A scrapped duplicate is
still a member, so the group survives its own remedy.

## Measured, not reasoned

- `folio-assistant-qa1p` was set to `scrapped` at **2026-09-22T08:58:46Z**,
  with a body naming `2yyh` as the survivor — the prescribed action, applied
  exactly.
- Issue #860's health snapshot, produced **2026-09-23T06:58:47Z**, 22 hours
  later, still reports:

  > **major** — 2 beans share the title "SMART-BASE HARNESS: the WHO
  > digital-health corpus, its methodologies and its voices": folio-assistant-2yyh,
  > folio-assistant-qa1p.

So the remedy was applied, and the finding is unchanged.

## Why this costs more than one stale line

#860 **closes automatically once every check is clean**. A `major` finding that
no permitted action can clear keeps that issue open forever, and every other
finding on it inherits the staleness — which is `1xhc`'s shape one level up: a
signal that cannot go green stops being read.

And the only state that WOULD clear it under the present logic is
`beans delete`, which the action itself forbids and
`deletion-requires-confirmation` forbids again. The check therefore asks for a
state it treats as unchanged, and rejects the one state that would satisfy it.

## The rule that fits what the finding is for

Its basis is about ACCIDENTAL duplicates polluting the plan — *"an unguarded
re-run in `qou` produced 14,688 duplicates, which starved the idle-backlog
policy of signal and collided with 15 real ids."* A bean deliberately
`scrapped` with a note naming its survivor is a duplicate that has been
**adjudicated**: it pollutes nothing and is the record the skill asks for.

So: a group is a duplicate when **more than one of its members is not
`scrapped`**. `completed` still counts — an open bean duplicating finished work
is a real duplicate and the signal worth keeping.

## Reported, never silently dropped

An adjudicated group must not simply vanish, or "no duplicate was ever created"
and "every duplicate was resolved" become the same reading — the `dh4f` shape.
A second measurement counts them and nothing thresholds it, which is the
pattern this file already argues for at `bean-claimed`:

> REPORTED EVEN THOUGH NOTHING THRESHOLDS IT, and that is the point.

## Done when

- [x] A group whose only live member is one bean does not fire the finding
- [x] `scrapped` is the status that adjudicates; `completed` still counts as live
- [x] Adjudicated groups are measured and reported, thresholded by nothing
- [x] The finding names the LIVE beans, since those are what an action touches
- [x] Tests cover both directions, including a group that is half-adjudicated
- [x] Verified against the real store: `2yyh`/`qa1p` stops firing

Parent `1xhc`. Surfaced from [#860](https://github.com/litlfred/folio-assistant/issues/860).

## Verified against the real store — 2026-09-23

`bun run health` on this tree:

    bean-duplicate-title-groups             = 0   (was 1)
    bean-duplicate-title-groups-adjudicated = 1
    bean-store major findings               = 0   (was 1)

The `2yyh` / `qa1p` pair stops firing, and the group it belongs to is still
counted rather than gone. `bun run gates` — 135 of 135.
