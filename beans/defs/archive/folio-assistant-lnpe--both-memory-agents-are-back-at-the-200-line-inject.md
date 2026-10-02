---
# folio-assistant-lnpe
title: Both memory agents are back at the 200-line injection budget, so any new entry evicts a TRAP
status: completed
type: bug
parent: folio-assistant-8jt6
created_at: 2026-09-20T07:32:20Z
updated_at: 2026-09-20T07:32:20Z
---


Found 2026-09-20 while adding a memory node for the render log (bean `5mg5`,
PR #473). **A six-line entry was enough to evict a TRAP from both agents.**

## Measured, with `bun run agent-memory`

| | ci-health-watcher | platform-boundary-guard |
|---|---|---|
| 2026-09-19T12:45Z, when `4kiw` closed | 187 lines | 186 lines (11 entries) |
| 2026-09-20, before my node | **208** (11 entries) | **207** (12 entries) |
| with a 26-line node added | 234 (12) | 233 (13) |
| with that node cut to 6 lines | 218 (12) | 217 (13) |

At 208/207 the overflow is *only the hand-written tail*, which is why
`agent-memory:check` exits 0 today. Adding ANY entry moves a real one past the
cut, and the check correctly refuses:

- ci-health-watcher would drop `TRAP — two workflows fail BY DESIGN here; do
  not "fix" them by dispatching`
- platform-boundary-guard would drop `TRAP — three literals worth recognising
  in new code`

Both are entries `4kiw` explicitly decided NOT to archive, with reasons: they
carry the concrete literals (`QOU.`, `folio-assistant/simulators`,
`lakefile.toml`, `raw.githubusercontent.com`) that the superseding skills are
deliberately written folio-generically to avoid.

## What I did NOT do, and why

I **dropped my own entry** rather than archive somebody else's. Choosing which
existing entry goes is a durable-artefact decision
(`deletion-requires-confirmation`), and `4kiw` is on record having weighed
exactly these two and kept them. Nothing was lost: the fact lives in
`skills/folio-core/render-logging.md`, which is where AGENTS.md says the
discipline belongs — the memory entry only summarises.

`4kiw` is **completed and stays completed**. Its boxes were met and measured;
this is a recurrence at a rate of roughly 21 lines a day across both agents,
which is a different problem from the one it fixed.

## Done when

- [ ] the growth rate is understood — 21 lines in one day is either normal
      churn or one session's over-long entries, and the two want different
      answers
- [ ] both agents are under 200 with headroom, by ARCHIVING (never deleting)
      what a skill now supersedes, with the superseding quote recorded on each
      archived node as `4kiw` did
- [ ] the render-log entry is re-added once there is room

## Related

| | |
|---|---|
| the previous round, and its reasoning | `4kiw` |
| the entry waiting for room | `5mg5` |

_2026-09-20T10:55Z_ — **Two of this bean's own claims were wrong, and the
measurements that correct them also say what the remedy costs.**

## "Roughly 21 lines a day" was wrong — it was ONE entry, once

Tracked by reading the generated file's line count at each commit that touched
it, rather than by dividing a difference by a day:

```
09-19 12:43   185 lines   4kiw closed here
09-19 15:45   188         +3
09-20 04:42   206         +18   <- one commit, one entry
09-20 09:42   206         unchanged since
```

The +18 is a single STABLE entry — *"top level = bootstrap/ + one dir per repo
+ beans/ todos/ fsh-guts/, which stay because they ARE the instance's memory"*.
This is not a churn rate that needs a policy. It is one long entry.

## The two eviction candidates are NOT superseded — checked, not assumed

`4kiw`'s warning applies exactly. Grepped `directory-conventions.md` for the
18-line entry's literals: **one** mention of `fsh-guts`, **zero** of "working
memory", `scope: "repository"` or `bootstrap/`, and it does not carry the
owner's criterion at all (*memory beats never-overlaid*). Archiving it would
delete the only written record of why those four directories are top-level.

## The state is better than the warning sounds

The generated region ends at line **199** against a 200 budget — the entries
FIT. What falls past the cut is hand-written boilerplate: a `## Session log`
heading and its instruction, which reads *"Keep under ~200 lines — prune the
log, never the TRAPs."* The guidance on managing the budget was the thing the
budget evicted.

## What was done, and what it bought

Compacted the hand-written head and tail of BOTH files — boilerplate only, no
fact dropped, **no TRAP touched**:

| | before | after |
|---|---|---|
| platform-boundary-guard | 8 over | **3 over** |
| ci-health-watcher | 7 over | **4 over** |

## And the number this bean was missing

**An entry costs ~8 rendered lines minimum** — heading, blank, ~5 body lines,
blank. Measured by adding the render-log entry back: at 3–4 lines over it
still pushed a TRAP past the cut on both agents, so it was removed again.

So the remaining boxes need **≥8 lines of headroom**, not "some". That is a
target somebody can act on, which "get under budget" was not.

## Done when — revised

- [x] the growth is understood: one 18-line entry, not a rate
- [x] the candidates checked for supersession — both fail, and must stay
- [x] boilerplate compacted, 4–5 lines recovered, no TRAP touched
- [x] **≥8 lines** freed — 14–16, by PROMOTING the rule to a skill
- [x] the render-log entry re-added

_2026-09-20T11:50Z_ — Done, and the remedy was none of the three this bean
listed.

## The archiving strategy was exhausted, which is itself the finding

`4kiw`'s move was *archive what a skill now supersedes*. Checked all three
large entries against the skills — **none is superseded**. No skill carries
`directory-conventions`' missing literals, and **no skill at all carried**
*"never encode an unverified constraint"*, the 29-line TRAP tagged to BOTH
agents and therefore costing 58 lines of budget.

At that point "archive what a skill supersedes" has nothing left to offer, and
the obvious next step — shorten somebody's entry on my own judgement — is the
one this bean was right to hesitate over.

## The move that was available all along

`AGENTS.md`'s own banner: *"a rule that exists only in `AGENTS.md` is a rule
with no home — not in the generated reference, not in the published skill docs,
and not found by an agent that went looking for the skill first."*

**That is equally true of a rule that exists only in agent memory.** The
29-line entry was carrying a genuine platform rule that no skill stated. So
the rule was promoted to `skills/folio-core/unverified-constraints.md` — the
asymmetry table, the evidence test, the `deployment-topologies` §3 worked case,
and the both-lanes note — and the memory entry became a 10-line pointer, which
is exactly what `4kiw` did once `placement.md` existed.

Nothing was lost, and the rule is now in the generated reference and findable
by `skill_list`, where it never was.

| | before | after |
|---|---|---|
| ci-health-watcher | 207 (7 over) | **200** |
| platform-boundary-guard | 206 (8 over) | **199** |

Both under budget with the render-log entry BACK IN.

## The reusable rule, which is the part worth keeping

> **When an entry is not superseded by a skill, that is a missing skill, not a
> stuck budget.** Write the skill, then the entry becomes a pointer.

Headroom is a side effect. The real gain is that a rule nobody could find by
asking for a skill is now one somebody can.

## Caught on the way

The new skill carried `roles:` in its front matter, copied from the shape of
older skills. A gate that landed on `main` this morning refuses it: `roles:` is
RETIRED from skill markdown — 325 annotations across 140 files, read by nothing
and dangling from its first commit — while staying a live axis in a
`folio-memory/v1` entry. Removed. Two hours older and I would have copied a
field that is still there in every neighbour.
