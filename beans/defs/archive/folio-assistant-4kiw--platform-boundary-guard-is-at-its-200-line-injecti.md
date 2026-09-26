---
# folio-assistant-4kiw
title: platform-boundary-guard is at its 200-line injection budget, so a 14th entry evicts three TRAPs
status: completed
type: bug
priority: normal
created_at: 2026-09-19T09:29:50Z
updated_at: 2026-09-19T12:43:13Z
parent: folio-assistant-8jt6
---

Found 2026-09-19 while adding the memory node for the owner's rule
"dont encode rules against a working setup".

## Measured, this session

```
bun run agent-memory
  ci-health-watcher         8 entries, 154 lines
  platform-boundary-guard  13 entries, 204 lines
      ⚠ 4 line(s) over the harness's 200-line budget, and nothing past it
        is a memory entry — only the hand-written tail
```

So `platform-boundary-guard` is **exactly full**: its last entry ends at the
line the harness truncates at, and the only thing overflowing is the
hand-written `## Session log` tail, which is not injected anyway.

Adding one 70-line entry took it to **259 lines and pushed three TRAPs past
the cutoff** — *the schema cannot catch a profile violation*, *the README
generator that replaced the whole file*, and *three literals worth
recognising in new code*. The harness drops the overflow **silently**, so
the agent would have kept reporting for duty with three fewer traps and
nothing would have said so.

## Why `agent-memory:check` did not catch it

It exits 0. The budget is a **warning**, not a gate — which is correct for
the pre-existing 4-line overflow (a hand-written tail is not injected
knowledge) and wrong for this case (a dropped TRAP is). The check cannot
currently tell the two apart.

**That distinction is the actual fix**, and it is already computed: the
generator's own warning text separates "nothing past it is a memory entry"
from "N MEMORY ENTRY(S) fall past it". The second should fail the build.

## Consequence right now

The new node is tagged to `ci-health-watcher` (154 lines, room to spare)
rather than `platform-boundary-guard`, where it also belongs. The subject
overlap is genuine rather than a flag of convenience — that watcher's three
reporting rules ("could not check" is never green; a stale red is not a live
fire; `superseded` is not green) are all the same rule as "do not assert what
you have not verified". But it *should* reach both, and today it does not.

## Done when

- [x] `agent-memory:check` fails when a real memory ENTRY falls past the
      budget, and still only warns when the overflow is the hand-written tail
- [x] `platform-boundary-guard` is back under budget — by splitting, trimming
      or archiving, decided per entry and not by truncating whatever is last
- [x] `do-not-encode-a-rule-against-a-working-setup` is tagged to
      `platform-boundary-guard` as well, and that reference in its body is
      replaced by the tag

## Not doing now

Trimming existing entries. Every one is somebody's paid-for TRAP, and
choosing which to cut is not a side effect of an unrelated fix — it is the
work this bean exists for.

## CORRECTION, 2026-09-19 — the premise above overstates the gap

Checked before starting the fix, and the section "Why `agent-memory:check`
did not catch it" draws the wrong conclusion.

`scripts/tests/agent-memory.test.ts` already carries a LIVE assertion —
"this repo's own generated files are whole" — asserting `overflowEntries`
is empty for every agent. Re-created the 60-line probe and ran the suite:

    (fail) the budget check sees a TRUNCATED entry, not just a late heading
           > this repo's own generated files are whole
     22 pass, 3 fail

So `bun test` DOES catch a dropped entry, and it runs in the same
`Code-quality gates` job as `agent-memory:check`. **A TRAP could not have
silently dropped in CI.** The true statement is narrower: the command named
`:check` does not fail its own check, and what a contributor sees is an
assertion diff rather than a message saying what to do.

**Severity revised: ergonomics and defence in depth, not a hole.** Priority
dropped from high to normal. The remaining boxes stand on their own merits.

The methodological error is the reusable part: I inferred "nothing catches
this" from one command exiting 0, without running the suite against the
failing state. Same shape as the trap this bean's sibling records — asserting
something the machine never checked.

_2026-09-19T10:20:53Z_ — Cross-link from oe8l (PR #392): skills/folio-core/placement.md now carries, as a procedure, what five of platform-boundary-guard's entries carry as prose - the shape of every defect, adapter-vs-profile, compose-nothing-resolve-everything, the README generator, and could-not-determine as a third state. That is a trimming opportunity for the second 'Done when' box, and the cheapest kind: those entries can shrink to a summary plus a pointer at the skill without losing anything, because AGENTS.md already says the skill governs and the memory entry summarises. I did NOT do it in #392 - editing the nodes changes what gets truncated, and mixing a memory-budget change into a skill PR is the scope creep the skill itself argues against. Leaving it to whoever holds this bean.

_2026-09-19T10:46:38Z_ — Claimed on branch claude/4kiw-memory-pointer (worktree /home/user/wt-4kiw/folio-assistant). Working the second 'Done when' box: get platform-boundary-guard back under the 200-line injection budget by replacing entries that skills/folio-core/placement.md now supersedes with a pointer node, archiving rather than deleting.

_2026-09-19T10:52:57Z_ — Second 'Done when' box done on claude/4kiw-memory-pointer, PR #402. Measured `bun run agent-memory` 2026-09-19: before 13 entries / 201 lines (at the cap); after 10 entries / 157 lines, 43 under budget, no entry past the cut. Four entries archived (never deleted) because skills/folio-core/placement.md now carries them as procedure: the-shape-of-every-defect-here (Step 1, verbatim question), adapter-vs-profile (Step 3), compose-nothing-resolve-everything (Step 4), the-readme-generator-that-replaced-the-whole-file (worked failure). Each node records the quote that supersedes it. NOT archived: could-not-determine-is-a-third-state-everywhere (the skill has the three states but neither the qou nine-row simulator case nor the shallow-clone gh-pages case) and three-literals-worth-recognising-in-new-code (the skill covers 2 of the 3 literals; the map of twelve qou workflow filenames is absent). One short pointer entry replaces the four. Also pinned the archived-before-untagged ordering through the READER path, which was tested only at memoryForAgent: the flag is a string compare on front matter, so an unrecognised spelling returns the node live AND untagged and the untagged clause hands it to every agent. Third box (tag do-not-encode-a-rule-against-a-working-setup to platform-boundary-guard) still open, and there is now headroom for it.

_2026-09-19T10:57:05Z_ — RE-MEASURED after merging origin/main (14 commits) into claude/4kiw-memory-pointer. main had landed skills/folio-core/readme-sections.md and content-profiles.md, which carry, VERBATIM, the two entries I had recorded as 'not superseded' — including the nine-row simulator table, the shallow-clone publish ref, and all three literals. My PR body's reasoning was correct against placement.md at base ef2988728 and stale two hours later, which is this repo's own 're-measure, do not quote' rule turned on my own PR. The DECISION still stands, for a better reason: grepped, readme-sections.md and content-profiles.md carry ZERO of the concrete literals (QOU., folio-assistant/simulators, lakefile.toml, raw.githubusercontent.com, qou) — they are deliberately written folio-generically, which is the platform-boundary discipline applied to the skills themselves. placement.md carries 5 of them, which is why archiving against IT was right. So could-not-determine-is-a-third-state-everywhere, three-literals-worth-recognising-in-new-code and link-style-raw-is-not-the-private-repo-answer are COMPLEMENTARY to the new skills, not restatements: the skill has the rule, the memory entry has the string a reviewer greps for. A later agent archiving them against readme-sections.md would remove the only place those literals are written down for this agent. Recorded here rather than in the entries themselves, because it is meta and would cost injected budget.

_2026-09-19T12:41:43Z_ — Box 3 done, and with it the bean. 'do-not-encode-a-rule-against-a-working-setup' now carries platform-boundary-guard in its agents list, and the three-line prose note that said it BELONGS there but was not tagged — because the file was full — is gone, replaced by the tag itself. A rule pointed at by prose is a rule the generator does not enforce.

Measured with 'bun run agent-memory' on this branch, 2026-09-19T12:45Z:
  before  ci-health-watcher 187 lines, platform-boundary-guard 157 (10 entries)
  after   ci-health-watcher 187 lines, platform-boundary-guard 186 (11 entries)
MEMORY.md is 189 lines with the generated region closing at 182, and no entry heading falls beyond line 200. agent-memory:check exits 0.

ONE THING I GOT WRONG AND CORRECTED MID-EDIT, because it is the trap this bean is about. My first replacement note was seven lines where the old one was three, explaining WHY the entry had been untagged and how 4kiw cleared the budget. That pushed ci-health-watcher from 187 to 191 — the node is tagged to both agents, so every line I added was spent twice. Nine lines of headroom on an agent whose budget nothing else was consuming, purchased with the administrative history of a tag. Trimmed to three lines stating the rule in both lanes and nothing else; ci-health-watcher is back to exactly 187, unchanged by this work. The history belongs on this bean, which is where it now is. An injected memory entry should carry the rule, not the story of its own tagging.

Box 2 was already met and simply unticked — PR #402 archived what placement.md superseded and took the file to 157 lines, 43 under the cut. Ticked here with the measurement rather than on recollection.
