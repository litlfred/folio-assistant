---
# folio-assistant-28k2
title: 'Turn reports: gloss and link every bean, always show staging links, say what to review'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:05:07Z
updated_at: 2026-09-18T17:07:14Z
---

Three gaps in AGENTS.md §"Say which bean you are on — every turn", all three demonstrated by a real report on 2026-09-18.

The failing report, verbatim:

> **worked** `fa/fsch` — Green on all three workflows. Also corrected the PR
> body, which had drifted from the code after your detangle instruction.

1. **Bare bean ids are opaque.** `fa/nvbr` and `fa/rnfl` were listed as next
   with no gloss and no link, so the reader cannot tell what either is without
   opening the store — which the low-dexterity interaction profile makes
   expensive.
2. **No staging link when asking for review.** The agent asked for review and
   made the reader go find the preview themselves. AGENTS.md already records
   (PR #178, 2026-09-16) that withholding the artefact makes assessment harder,
   not safer; the same logic applies to not linking it.
3. **Not enough context to act.** "Green on all three workflows" says the PR
   is not broken. It does not say what the PR DOES, what to look at, or what
   judgement is wanted — so the reader has to reconstruct the ask.

Root cause of (3) is partly the rule itself: the section caps entries at
"up to 50 words", which reads as a budget to spend rather than a floor to
clear, and rewards exactly the terseness being complained about.
