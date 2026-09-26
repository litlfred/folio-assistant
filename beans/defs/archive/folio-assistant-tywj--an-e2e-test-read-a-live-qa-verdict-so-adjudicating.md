---
# folio-assistant-tywj
title: An e2e test read a live QA verdict, so adjudicating a finding reddened an unrelated UI test
status: completed
type: bug
priority: normal
created_at: 2026-09-19T01:38:05Z
updated_at: 2026-09-19T01:38:42Z
---

`tests/qa-panel.e2e.ts` served its block-family JSON straight out of the
published corpus, on the stated grounds that a hand-made fixture "can agree
with the code while the code disagrees with the corpus". That argument is about
**shape**, and it is right. But the spec was reading two different things out of
that file: the shape, and a **verdict** — which is live state the corpus is
supposed to stop holding.

Three assertions depended on the corpus still failing:

- the first row's criterion id (`voice-status-leak`),
- its `fail` chip and `critical` severity chip,
- the folded count, pinned as the literal `47`.

A fourth pinned the checker's own source hash, `5af6856733f3`, so editing a
checker reddened a UI test.

**What tripped it.** PR #302 adjudicated that finding away, correctly: the
block is titled "What is not built yet" and its body is a deliberate inventory
of gaps, so `**Not yet implemented:**` is its subject rather than a status leak.
The sidecar went `state: fail` → `state: pass`, `counts.fail` 1 → 0, and the
panel then had no failing row to put first. Measured: `c8fbad385` is the commit
that reddened it — NOT `d481db354` (the `2t41` checker change), which is where it
was noticed.

**Why it could not be derived on the fly.** Adjudication discards what it
overturns. The superseded criterion keeps no `severity` and no `evidence` in the
current file, only its script witness, so the failing document cannot be
reconstructed from the corpus. A frozen copy is the only option.

**Two things worth carrying forward.**

1. This is the same class as bean `nytj`'s "invisible to the CI of either
   contributing change" family, with a twist: both contributing changes were
   mine, in the same session, and each was individually green. #302 was green
   because the e2e gate did not exist yet on the branch it merged from; #321
   surfaced it. A merge queue does not catch this one either — nothing was
   concurrent. What it is, is a **test that measures live state**, and the only
   defence is not writing one.
2. `test-results/.last-run.json` was TRACKED and `test-results/` was not
   gitignored, which broke a `git stash` mid-investigation. Fixed here too.

## Done when

- [x] `tests/fixtures/block-with-one-failure.block.json` — frozen real generator
      output, provenance in `tests/fixtures/README.md`, regenerate-by-capture
      not by hand
- [x] every expected value read out of the document: criterion id, result,
      severity, folded count, witness id, checker hash, evidence line. No
      literals.
- [x] the header's anti-hand-made-fixture argument amended rather than deleted —
      it is right about shape and the amendment says which half it governs
- [x] `test-results/` gitignored and untracked; `playwright-report/` too
- [x] dead duplicate `timeout` key in `playwright.config.ts` removed (120000 was
      silently overridden by 180000 further down the same object literal)
- [x] `bunx playwright test` 42/42, `bun test` 2012/0, and all 20 static gates

## Four sessions, independently — and indexing is the other half

Noted 2026-09-19, reading the open PRs. #320 diagnosed and stood down
(recommending pin-by-id); #319 and #314 each fixed it by synthesising the
failure back into the live sidecar. `iumj` is the sibling bean for the general
pattern. This bean is the fourth instance, not a fifth defect — the overlap is
evidence about how easy the mistake is.

Two findings of theirs that my first pass did not have:

- **Indexing stands in for a verdict as silently as a literal does.** The
  generator sorts worst-first, so `criteria[0]` WAS the failing row — and
  `STALE_JSON` marked `criteria[0]` while the panel showed whatever it sorted
  first. #319 measured that after the adjudication those were different
  criteria, so the stale test asserted a badge on a row it had not marked and
  **passed**.
- **A generator-faithful fixture cannot test the panel's sort at all**, for the
  same reason: the failure is already first. #319 found it at 19 of 48 live.

Taken up: the served document is sorted **by criterion id** (failure at 42 of
48, so the sort assertion is about the panel), `STALE_JSON` marks by id, and
`FAIL_CRIT_ID` throws at load if the criterion leaves the fixture.

- [x] no index stands in for a verdict; every lookup is by id
- [x] the sort assertion exercises the panel, not the generator's ordering

## Merge with main: #320 landed its own fix, and this resolution keeps the stronger one

`main` moved between CI going green and the merge attempt. #320 landed
`84dd7503e` — *"test(qa-panel): derive the fixture's expectations instead of
pinning them"* — with bean `qjyi`. So the conflict is two fixes for one defect,
and the resolution had to pick rather than blend.

**Kept this branch's, for one measurable reason.** #320 synthesises the failing
row into **`criteria[0]`**, with the comment *"Replace the first criterion rather
than appending: the panel sorts worst-first itself, so a row appended at the end
still has to be hoisted, which is the behaviour under test."* The reasoning is
inverted: replacing at index 0 means **no hoisting is needed**, so the sort is
exactly what stops being tested. That is #319's second finding, restated — and
`STALE_JSON` marking `criteria[0]` remains index-based there too. This branch
serves the document sorted by criterion id, failure at **42 of 48**.

**Took #320's better point.** Reading the fixture live is what keeps its shape
honest, and freezing gives that up. Bought back with
`scripts/tests/qa-panel-fixture.test.ts`: shape checked against every published
`*.block.json`, verdict frozen. `n/a` and passing when no sidecars exist.

**Deferred to main on `.gitignore`.** This branch ignored `test-results/`
wholesale; main tracks `.last-run.json` deliberately (`bb28f8e`) and restored it
after a sibling deleted it. Main's reason is better, so `test-results/*/` stands
and the file is back. The stash hazard is recorded in the `.gitignore` comment
rather than fixed by overruling them.

- [x] conflict resolved keeping the version whose sort assertion bites
- [x] the property freezing gave up bought back by a shape-drift test
- [x] `qjyi` and `iumj` cross-referenced; no bean resolved but this one

## Second merge: #319 landed a better resolution, and this branch's is withdrawn

`main` moved again — #319 merged with `508f50242` *"Merge main, and resolve
qa-panel.e2e.ts by keeping the best of both"*, a third resolution of the same
file. It is better than this branch's, on the axis that matters most, and the
frozen fixture is withdrawn rather than defended.

**Their argument, which is correct.** Freezing the criterion freezes its
witness, so `scriptHash: "5af6856733f3"` becomes a literal that outlives the
checker. Change `qa-checkers-voice.ts`, re-run the sweep, and this branch's test
keeps passing while asserting a hash the corpus no longer holds — *"a fixture
drifting from the corpus is the exact defect this whole section exists to fix;
it must not be reintroduced one field down."* Reading the value out of the frozen
document rather than pinning it (which this branch did) makes the assertion
self-consistent, not correct: it stops saying anything about the checker that
actually ran.

**Every property this branch's version had, theirs also has**, arrived at more
cheaply:

| | this branch | #319's, on main |
|---|---|---|
| lookup by id, throws if absent | yes | yes |
| sort actually exercised | yes — re-sorted to 42/48 | yes — flipped **in place** at 19/48 |
| shape cannot drift from generator | via a separate drift test | intrinsic: read live |
| witness/hash tracks the real checker | **no** — frozen | **yes** |
| `evidence` not invented | yes — real capture | no — one literal string |

Only the last row favours this branch, and it is one string against a live hash.
Not worth a committed fixture plus a drift test to keep.

**Withdrawn:** `tests/fixtures/` (README + the captured sidecar) and
`scripts/tests/qa-panel-fixture.test.ts`, whose only subject was that fixture.
The drift test did earn its keep before being deleted — it failed on its first
run and found `changed`, a witness field written only for a stale witness, which
I would not have enumerated from memory. Recorded here because the finding
outlives the test.

**Kept from this branch**, none of it contested: the `.gitignore` reconciliation
with main's tracked `.last-run.json`, the dead duplicate `timeout` key in
`playwright.config.ts`, the TRAP in `content-pipeline-navigator`'s memory, and
this record.

- [x] resolution taken from #319, not from ownership of mine
- [x] fixture and drift test removed, with the one finding they produced kept
