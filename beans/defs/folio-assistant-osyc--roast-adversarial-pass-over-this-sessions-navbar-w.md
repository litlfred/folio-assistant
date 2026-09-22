---
# folio-assistant-osyc
title: 'ROAST: adversarial pass over this session''s navbar work, the skill-reachability bean, and the claims made to the owner'
status: todo
type: task
priority: normal
parent: folio-assistant-vuip
created_at: 2026-09-21T21:43:53Z
updated_at: 2026-09-21T21:43:53Z
---

## What

Owner, 2026-09-21: *"queue roast"* — queued, not started, per the standing
instruction to queue a new task rather than pivot.

An adversarial pass over what this session produced and, more usefully, over
what it CLAIMED. Scope is deliberately the session rather than a file, because
the failures worth finding here were failures of verification and of reading,
not of code.

## Where to aim it — the session's own record of being wrong

This is not a list of suspicions. Each is something that already went wrong
once, which makes the neighbourhood worth searching:

1. **"The interfaces ARE done."** Said to the owner about the library
   visualiser on the strength of the projection data and the page source. The
   page's script did not parse — 224 chars, "loading…" — and #805 found it, not
   me. **Ask of every other "verified" claim in this session: did I check the
   artefact, or something upstream of it?**
2. **`hidden` read as absent.** Cost a full round and a test file whose three
   rigorous assertions defended the wrong design. **Where else did I take a
   word as a spec?**
3. **Three sweeps corrupted** by mutating the tree while `bun run gates` ran —
   twice by concurrent runs, once by `git merge`. One produced a phantom
   failure I nearly reported as real. **Any other result quoted in this session
   from a sweep that was not alone?**
4. **A `"docs"` literal composed by hand** in the same file as
   `publishedDocsPrefix()`, written by me, that session, for that purpose.
5. **A predicted collision that was wrong** — I told the owner
   `nav_footer_custom.html` was where #791 and I would conflict. They do not
   touch it. The prediction was cheap to check and I checked it only after
   `/coordinate` made me.
6. **Two tests that matched their own explanatory comments** — one found
   `display: none` in the prose saying why it is not used, one found
   `img[src$=...]` the same way. Both my own.

## What a roast should NOT do

Re-litigate settled owner rulings. `reminder now, gate later` on
`decision-request`, white figures in BOTH schemes, the split-by-layer
sequencing with `603s` — these were decided with reasons on the record. A roast
that reopens them is arguing with the author, not auditing the work.

## Done when

- [ ] Every "verified"/"measured" claim made to the owner this session is
      traced to what was actually observed, and the ones that were inferred
      are named
- [ ] The numbers quoted in beans `sjic`, `j6t3` and `2b5s` are re-measured
      rather than re-quoted
- [ ] Findings are severity-ranked, and a finding that cannot be reproduced is
      recorded as unreproduced rather than dropped


## 2026-09-22 — item 2 done by another session; items 1 and 3 need this session's record

A different session (`017MEZnJxx7WeekiNCabx4hx`) re-measured the numbers this
bean asks about. **Not claiming the bean**: items 1 and 3 are about claims made
to the owner in the 2026-09-21 session, and tracing those needs that session's
own transcript, which this one does not have. Recording what IS checkable from
the tree, ranked as the bean asks.

### MAJOR — `sjic`'s deliverable already exists on `main`

`lib/navbar.ts` is the shared component the bean asks for, and
`lib/harness-rail.ts` imports and re-exports it — **verified by import, not by
its comment**. The bean is still `todo` in the ready queue, so the next agent
to pick it up rebuilds it. Its file path is stale too (`harness-rail.ts` moved
into `lib/`). Detail on that bean.

Not established: whether the Jekyll/theme half is also unified. Said rather
than assumed.

### MAJOR — `j6t3`'s "4 reachable" is 3, and the fourth is the inverse defect

The 4 counted `.claude/commands/*.md` FILES, not skills reachable by name.
Matching by name gives **3**. The fourth, `prepare-merge`, is a working command
whose skill declares **no front matter at all** — invocable by a human,
invisible to any enumeration of `user_invocable` skills. The same
declared-vs-reachable mismatch the bean is about, running the other way, which
the bean's own Option A would neither produce nor notice. (Also 34 → **35**;
`main` gained one.)

### MINOR — `2b5s`'s totals are exact; its breakdown does not sum

1,378 / 11 / 1,367 and the three per-entry figures all verify against `find`.
The corpus breakdown lists the tree-wide `.png` count (26, of which 3 are
already counted as pages) and omits 6 `.json`, so its rows total 1,364 against
its own stated 1,367. The argument is unaffected; a reader acting on the table
double-counts 3 and misses 6.

### UNREPRODUCED — recorded rather than dropped, per this bean's own rule

Item 1 ("every verified/measured claim traced to what was observed") and item 3
as it applies to the 2026-09-21 session's claims. The specific failures this
bean lists — the library viewer's unparsed script, `hidden` read as absent, the
three corrupted sweeps, the hand-composed `"docs"` literal, the wrong collision
prediction, the two self-matching tests — are about that session's work and its
record. They are **not checked here**, and that is a gap in this report rather
than a clean result.
