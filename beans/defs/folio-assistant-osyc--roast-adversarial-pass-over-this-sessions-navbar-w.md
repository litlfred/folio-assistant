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

