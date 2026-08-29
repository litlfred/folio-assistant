---
name: language-trap-agent-audit
description: Thorough per-block agentic audit of the ten language-trap categories (owner spec 2026-08-15) — full-context judgement over every prose-bearing content block, agent reviewer entries in the QA sidecar, small fixes applied inline, structural fixes flagged.
roles:
  - collaborator
---

# /language-trap-agent-audit — per-block agentic trap audit

The mechanical scanner (`content/pipeline/language-trap-audit.ts`)
emits high-recall *candidates*. This skill is the required second
layer: an agent reads **each block in full** and adjudicates **all
ten categories in context** — including traps the regexes cannot see
(a negation-contrast paraphrased without a comma, an aphorism that
matches no template, a pivot in fresh wording). Owner directive
2026-08-15: every prose-bearing block gets this analysis; the script
alone is not the audit.

## The ten categories

Severity `major` for the diagnostic five (1, 2, 5, 6, 7 — rare in
human scholarly drafting, near-universal in unedited model output);
`minor` for the density four (3, 4, 8, 9) and the corroborating one
(10), where the signal is concentration, not presence.

1. **Negation-contrast** — asserting by denying the opposite:
   "structural features, not afterthoughts"; "not X but Y"; "this is
   evolution, not a blank page". A human drafter states the positive
   claim. Judge in context: mathematical contrast that *is* the
   block's content is substantive (see false-positive classes).
2. **Rhetorical pivot** — setup-then-reframe: "that transformation is
   happening with or without a strategy; the question is whether it
   is governed." The second clause carries everything.
3. **Load-bearing em-dashes** — the spaced dash substituting for
   sentence structure (appending afterthoughts, dodging the
   comma-vs-full-stop choice). Ranges and true parentheticals are
   fine; density is the tell.
4. **Compulsive triples** — the reflex three-item list regardless of
   underlying content. Substantive three-element enumerations pass.
5. **Closing aphorism** — a quotable-sounding final line placed
   because documents "end with quotable lines".
6. **Meta-commentary** — narrating one's own emphasis: "note the
   framing", "we emphasize", "I want to underline", "the key
   takeaway". Place the emphasis; do not announce it. Plain
   "note that" is standard mathematical prose and passes.
7. **Thesis restatement** — a block-final sentence restating what the
   text already established ("This establishes …" as a closer).
   "This completes the proof" passes.
8. **Performed warmth** — personal register in institutional prose:
   "thank you", "we are excited", "journey".
9. **Superlative inflation** — maximum-strength claims without
   qualification: "most importantly", "near-universal", "single
   most", "our mandate is clear".
10. **Non-speakable syntax** — noun-heavy chains that parse on the
    page but stall aloud. Written for the eye, not the ear.

## False-positive classes (record as `pass` with a note)

- **Substantive mathematical contrast** — the distinction *is* the
  claim: "a fixed property of the base, not of the fibre" in a block
  whose content is exactly that separation; "not only compact but
  Hilbert–Schmidt" (strengthening); "states, not modes" where the
  terms are technically distinct.
- **Temporal status** — ", not yet carried out" is a factual scope
  statement, not manufactured emphasis.
- **Cross-reference closers** — "This establishes clause 1 of the
  comparison summary" pointing at another block is bookkeeping, not
  restatement.
- **Load-bearing disambiguation** — emphasis that prevents a real
  misreading (e.g. a symbol collision) is kept, but stated directly
  rather than narrated ("This 'fibre' is distinct from the fibre
  functor $\tau$", never "We emphasize that …").

## Per-block procedure

1. Read the block's `.md` in full, plus `title`/`kind` from the `.ts`.
2. Judge all ten categories on the whole text — do not limit
   attention to the script scanner's candidates.
3. **Small confirmed traps** (≤ 2 sentences, pure prose, no math and
   no meaning change): fix the `.md` directly. Keep the author's
   content; remove only the construction.
4. **Structural traps** (rewrites beyond 2 sentences, meaning at
   stake, or math-adjacent): do not edit; record `fail` with a
   concrete proposed fix in `notes`.
5. After any edit, confirm math delimiters still balance:
   `python3 -c "s=open('<file>').read(); assert s.count('\$\$')%2==0"`
   and re-read the changed sentences aloud-style for register.
6. Record the verdict for **every category** with the helper —
   run AFTER fixes so the entry certifies the fixed state:

   ```bash
   bun run content/pipeline/qa-agent-entry.ts \
     --block <block.md> --criterion trap-negation-contrast \
     --result pass|fail [--severity major|minor] \
     --evidence "<what was examined / found>" \
     --notes "<fix applied: before -> after | proposed: ...>" \
     --id "agent:<batch-id>"
   ```

   Entries APPEND to the criterion array; script candidates stay in
   place as provenance.

## Batch conventions

- Batches of ~25 blocks, grouped by chapter (mirrors
  `qa-agent-drain-queue.ts`). Disjoint file sets per concurrent agent.
- Agents in a shared tree do not commit; the coordinating session
  commits per completed batch:
  `qa(trap-drain): <chapter> batch <n> — <fixed>/<pass>/<flagged> [bean]`.
- Each agent returns a summary: per-criterion counts, list of applied
  fixes (before → after), list of flagged structural items.

## Relation to other audits

`trap-*` overlaps `voice-ai-slop` (category-H tells) and
`clarity-grad-style` (register) but measures different constructions;
verdicts are recorded under the `trap-*` criteria only. One-voice
Category-H authorization applies: mechanical fixes need no per-edit
author approval; structural rewrites do.
