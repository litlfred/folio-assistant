---
# folio-assistant-5ge1
title: 'MERGE GATE IS SPECIFIED AS BLOCKING, OWNER RULED WARN-ONLY: reconcile merge-gate-2026-10-02.md and nok9 with the 2026-10-02 ruling'
status: completed
type: bug
priority: normal
created_at: 2026-10-02T23:32:19Z
updated_at: 2026-10-03T00:02:20Z
parent: folio-assistant-0ipy
---

## The conflict, both sides measured 2026-10-02

**The owner ruled WARN:** asked how to handle agentic code review before merge,
the owner answered — *"do ingesion and analsysi. then propose. dont want hard
gate (at least not for now, lots of backlog on content nodes) but do want
warn."* Two reasons given, and the second is the binding one: a hard gate over
a content backlog blocks work that was already queued.

**The repository specifies BLOCKING.**
`cat-harness/docs/proposals/merge-gate-2026-10-02.md` (28,547 bytes, written
2026-10-02) states the opposite in at least three places:

| where | what it says |
|---|---|
| the ready-to-merge definition | "no blocking RED FLAGS from any agentic review" |
| §"`unknown` blocks" | "A review that could not cover the diff, a toolchain …" |
| §5.1 | a table headed *"Which gates block"* |

Epic `nok9` ("MERGE GATE: agentic adversarial review") and bean `w8jq` carry
the same blocking G3/G4 shape.

**SETTLED by the owner, 2026-10-03.** The question was put with both dates and
the answer was: *"warn only. proposal predates ruling, update it."* So the
proposal is a **stale document**, not a disagreement — the ask came first, the
ruling supersedes it, and the fix is to correct the document rather than to
reopen the decision.

## What a warn-only form looks like, from the evidence

From the CodeAgent analysis (arXiv 2402.02172v5), and the pattern is already
in this repository rather than invented:

- **Follow `dependency-advisories` in `code-quality-gates.yml`** — exit 0 in
  every state, and keep *found-nothing*, *found-something* and *could not
  determine* distinct in the output. **Do NOT use `continue-on-error`**: that
  file records it as already reversed once.
- **Render a blocking-weight finding as "would have blocked"** rather than
  blocking. That is what makes a later promotion decidable: it collects the
  data a hard gate would need, which the current blocking spec cannot do
  because nothing runs yet.
- `qa-review.ts` already separates a FINDING (severity) from a DECISION
  (weight: blocking / suggestion / praise). The warn form needs no new
  vocabulary — only a rule that weight never reaches the exit code.

## Why the paper does not justify blocking anyway

Independent of the owner's ruling, CodeAgent cannot carry a blocking gate:
its vulnerability ground truth is CIRCULAR (labels were built by running
CodeAgent over the 3,545 samples and manually verifying what IT flagged), its
headline 92.96% vs 51.42% is precision over a SMALLER flag set (483 flags,
fewer than every baseline), and its consistency/format F1 scores sit at or
below what an always-positive classifier scores on its own class imbalance
(82.1% and 87.4% positive; always-positive gives ~90.1 / ~93.3 F1 against
CodeAgent's 93.16 / 94.07).

The one thing it DOES weakly support is the repo's own rule that a blocking
finding must carry evidence: under the paper's own annotation, **49% of
GPT-4's flags went unconfirmed**.

## Done when
- [x] owner says whether the proposal post-dates the ruling or pre-dates it —
      **2026-10-03: pre-dates. Stale, so update it.**
- [x] `merge-gate-2026-10-02.md` carries the warn-only form: new **§1.1**
      ("Superseded, same day"), the frontmatter summary, the status block with
      a pointer to §1.1, principle **§4.2** (was "`unknown` blocks"), and
      **§5.1** rows G3/G4 (were `yes`)
- [x] `nok9`, `w8jq` and `abmq` reconciled — `abmq` as well, since it defined a
      RED FLAG as a finding that "blocks the merge"
- [x] the warn form names `dependency-advisories` as its pattern and the three
      distinct output states
- [x] `xqdi` (compile gates) deliberately NOT changed — flagged in `nok9` as an
      interpretation, and **confirmed by the owner 2026-10-03: "g5-g7 blocking
      is right, leave it."** The hedge is now a recorded decision, so the next
      agent does not reopen it
- [x] the promotion criterion is split out rather than left hanging here — it
      is its own bean under `nok9`, because it needs a warn-only phase to run
      first and so cannot be done by this reconciliation

## What the amendment says, in one line each

- **The review warns; the deterministic gates do not change.** G3/G4 → warn.
  G1 (CI green per job), G2 (the head HAS a run), G8 (`regen` on the train
  result) and H (the owner's "merge it") stay blocking, because the ruling was
  about agentic review and not about whether CI ran.
- **Scope read narrowly and flagged.** G5–G7 (Lean builds, SUSHI compiles,
  JSON-LD renders) are unchanged: deterministic, named separately in the
  original ask, and "backlog on content nodes" is not an argument about
  whether Lean compiles. Named in `nok9` as an interpretation to correct, not
  as an instruction.
- **`unknown` survives the ruling untouched.** A warn-only gate that collapses
  *could-not-determine* into *found-nothing* is this repository's recurring
  defect — three instances measured on 2026-10-02 alone (`0qjq` vacuous CI
  pass, `zjm1` vacuous `clean`, `gtx4` defaulted provenance). Exit 0 with
  `unknown` on the record; never exit 0 with silence.
- **The vocabulary did not have to change.** `weight: blocking` keeps its
  meaning in `schemas/qa-review.ts` — what the reviewer asks of the gate —
  and only the gate's response changed. A taxonomy needing a rewrite because
  enforcement changed would have been the wrong taxonomy.

## Summary of Changes

Owner settled it 2026-10-03: the proposal **pre-dates** the ruling, so it was
stale rather than in disagreement, and the fix was to correct the document.

**`cat-harness/docs/proposals/merge-gate-2026-10-02.md`** — five edits:

1. new **§1.1 "Superseded, same day"**, carrying the ruling verbatim with both
   dates, the backlog reason, and a table of what changed against what did not;
2. **frontmatter `summary`** — dropped "blocks until resolved or overridden";
3. **status block** — amended, with a pointer telling a reader to take §1.1
   before §4 or §5;
4. **§4 principle 2** — was "**`unknown` blocks**", now "`unknown` is never
   green, and under warn-only never a pass either", keeping the third state;
5. **§5.1** — rows **G3** and **G4** moved from `**yes**` to `**no — warn**`,
   plus a note on why a warn still fails loudly on `unknown` and on what the
   promotion criterion must be.

**The owner's own ask in §1 was left verbatim.** It is the record of what was
asked; the ruling supersedes it rather than rewriting history.

**Beans reconciled:** `nok9` (epic — plus the scope interpretation, flagged for
correction), `w8jq` (the "required check" is now a reporter: still required to
exist and SHA-bound, no longer holding the merge), and `abmq` — which needed it
too, since it defined a RED FLAG as a finding that *"blocks the merge"*.

**Deliberately not changed:** `xqdi`, the content-type compile gates. G5–G7 are
deterministic, the original ask named them separately from the review, and
"backlog on content nodes" is not an argument about whether Lean compiles. That
reading is flagged in `nok9` as an interpretation the owner can correct in one
line.

**Split out:** `h1uq` — warn → block needs a measured false-positive rate, no
paper reports one for any LLM judge, and only a warn-only phase can produce
it.

**One process slip, recorded because the rule is explicit.** This bean was
marked `completed` while it still carried an unchecked Done-when item. The
beans guide permits completion only with none left. Corrected by moving that
item into `h1uq`, which is where it belonged anyway — it cannot be done by this
reconciliation.

## Addendum, 2026-10-03 — the scope reading was confirmed

The one judgement this reconciliation had to make was how far the warn-only
ruling reached. It was recorded as an interpretation rather than acted on
silently, and the owner then confirmed it: **"g5-g7 blocking is right, leave
it."**

Worth keeping because it names the boundary: **deterministic-vs-judged, not
blocking-vs-warning.** A compile gate has one right answer a machine settles;
an adversarial review has an unknown error rate (`h1uq`). Collapsing them
would have demoted the compile gates along with the review — which is what
"soften the merge gate" would have produced, and is not what was ruled.

