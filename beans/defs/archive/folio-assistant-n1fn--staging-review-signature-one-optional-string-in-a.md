---
# folio-assistant-n1fn
title: 'STAGING-REVIEW SIGNATURE: one optional string in, a list of URLs with what to review out'
status: completed
type: task
priority: normal
created_at: 2026-09-21T16:52:08Z
updated_at: 2026-09-21T17:12:59Z
parent: folio-assistant-ahvw
---


Issue: https://github.com/litlfred/folio-assistant/issues/748 — owner request,
2026-09-21, kept verbatim:

> update skills on discusion during staging deployment... send back to user a
> list of URLs to access in staging (make formal skill) input = string 0,1 user
> request to see staging environment. output = list of urls, markdown exlpaing
> what is in URLs, what to review

## Measured before starting — the skill ALREADY EXISTS, and my first move broke it

`skills/folio-core/staging-review.md` is 288 lines and substantial: the
before/after model, the three observable states, the retention policy, and the
rule that a staging URL is LOOKED UP in the publish ref rather than composed
from a source path.

**I wrote a new skill of the same name over it before checking.** `git status`
reported the file as *modified* rather than *untracked*, which is the only
reason it surfaced within the minute. Restored from `HEAD` and extended.
`deletion-requires-confirmation` is the rule that covers it, and the lesson is
narrower than "read before writing": **an overwrite is a deletion wearing a
write's clothes**, and the check that catches it is asking git what the path
already is, not asking the filesystem whether something is in the way.

## What was actually missing

Not the content — the **signature**. The skill is invoked by the CRDM workflow,
by authoring review sessions, and now by a person typing `/staging-review`, and
each caller re-derives what to pass and what comes back.

## Done when

- [x] input declared: string, cardinality `0,1`, kept verbatim, NARROWS and
      never adds, and an ask matching nothing that changed is said rather than
      answered with the whole preview
- [x] output declared: start-here line, before/after table, what could not be
      checked — every part required, an absent part stated rather than dropped
- [x] the third column carries WHAT TO REVIEW, mapped from changed file to
      published surface, with the interaction named where a change is only
      visible after one (`rptk`: two days behind a tile nobody clicked)
- [x] the third state: a changed page absent from the publish ref is a
      FINDING; a change with no rendered surface is the useful answer
- [x] `/staging-review` exists as a command
- [ ] used once end to end, on a real preview, and the output checked against
      the served tree rather than against the source

## Deliberately NOT added

A second URL-composition rule. The skill already says a URL is looked up in
`gh-pages` and never composed, with the measured failure behind it. Restating
it in the new section would be two statements of one rule, free to drift —
the migration debt `AGENTS.md`'s own banner describes.


## The bean that broke the gate it was opened under

`bun run gates` went red on push 1 with one failure: *"every open bean belongs
to an epic > the real corpus passes"*. **This bean was the orphan** — created
with `beans create "<title>"`, which takes a title and nothing else, so it
landed parentless and went straight to the roadmap's Miscellaneous section.

Parented to `ahvw` (PROCESS: how an agent decides what it does), which is where
a skill about how an agent hands a preview to a reviewer belongs — not `o3xy`,
which is the rendered site's own accessibility, and not `yj32`.

**The failure is a small one with a general shape**: `beans create` is the one
step in this workflow whose output is invisible until a gate reads the whole
corpus. `todo-manager` already carries §"Check before you create" for the
duplicate case; the parent case has the same cause — the CLI's one-argument
form is the convenient one and it produces an incomplete node every time.


## The second gate failure, and it is a trade rather than a bug

`bun run gates` reported TWO failures on push 1, not one. The orphan above was
the first; the second was `kg:audit:check`, on a **stale sidecar** for the
skill this bean edits — `test/results/kg-qa/skills/folio-core/staging-review.kg-qa.json`.
Refreshed with `bun run kg:audit`; the check now exits 0.

**What the refreshed sidecar records is worth stating rather than burying.**
`skill-is-brief` was ALREADY failing at 289 lines against a corpus p75 of 279,
and this change takes it to **365**. So the addition widened an existing
`major` finding by 76 lines. Not a new failure, and not one `kg:audit:check`
gates on (it fails on `critical` or a stale sidecar; `kg:audit:strict` is what
adds `major`) — but making an open finding worse is not the same as leaving it
alone, and the sidecar is now the honest record of both numbers.

I tried to trim it and saved ONE line, because what I cut was wording rather
than content. Recorded that way instead of claiming a tightening: all four
added subsections are the contract the owner asked for — the input, the output,
what to review, and the third state — and none of them is restatement of what
the file already carried. The length is the price of the contract being in the
skill rather than in each caller.

**If the owner would rather have brevity**, the cut is the justification prose
around the tables, not the tables. That is a call about this repository's house
style, not about this bean.


## Used it once, and its first use found a defect in ITS OWN OUTPUT

The staging preview for #749 deployed at 16:54 and the skill was run against
it with no narrowing ask. It produced the start-here line, two rows, and four
could-not-check items — and **one of the four was wrong**.

I reported the preview as *"one commit behind"*: the bot's comment named
`3894c41`, the branch head was `037812c7`. Checked instead of asserted, and
the comparison is a category error. On a `pull_request` trigger the stage job
builds `refs/pull/749/merge`, so the commit the comment names is

    5ed8f9cc9 220233c76 037812c7c
    Merge 037812c7c into 220233c76

— my head merged into main, an object that is not in my clone and **never**
equals my head. Comparing the two reports a stale preview on every PR, forever.
The preview was current.

**The right check is the merge commit's SECOND PARENT.** Added to the skill as
§"The commit in the bot's comment is NOT your branch head", with the two
commands. It is the same fact `gates` exists around — CI tests the merge, and
so does the preview — which is why the error is worth 20 lines rather than a
footnote.

Two things about this are worth keeping. The skill **had no rule here at all**,
right or wrong: the wrong instruction was in the draft I overwrote and
reverted, so nothing told me not to make the mistake, and nothing would have
told the next agent either. And the defect surfaced because the skill makes the
agent state what it could not check — a report with no third section would have
carried the same error silently.
