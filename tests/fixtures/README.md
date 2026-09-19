# e2e fixtures

One file, and it exists for a reason worth reading before adding a second.

## `block-with-one-failure.block.json`

A `qa-witness/v1` block sidecar with exactly one failing criterion
(`voice-status-leak`, `critical`), 22 passes and 25 n/a.

**Provenance.** Real generator output, not hand-made: `bun run qa:sweep` over
`content/docs/` followed by the witness publish step, captured at commit
`55ee7ca0` from
`docs/assets/qa/crdm-methodology/what-is-not-built-yet.block.json`. Regenerate
it by taking that file from a tree where the block still fails, never by
editing this one by hand — the whole point is that the shape is the
generator's.

**Why frozen.** `tests/qa-panel.e2e.ts` read the live corpus file, because a
hand-made fixture can agree with the code while the code disagrees with the
generator. But it was reading *two* things from it: the shape, which is what
that argument is about, and a **verdict**, which is live state. An agent
adjudication in PR #302 overturned the failure — correctly; the block's subject
is an inventory of gaps, so "**Not yet implemented:**" is its topic rather than
a status leak — and three assertions about how the panel renders a failure went
red for a reason that had nothing to do with the panel.

It cannot be derived on the fly either: adjudication discards what it
overturns, so the superseded criterion keeps no `severity` and no `evidence` in
the current file, only its script witness. There is nothing left to promote
back into force.

The same test derives its `stale` variant from this document in-process, for
the same reason and with the same note: whether a hash comparison yields
`stale` is settled in `qa-witness.test.ts`; what belongs in the e2e spec is
whether the panel *renders* that state.

**Do not add expected values to this file's consumers as literals.** The spec
reads the criterion id, its result, its severity, the folded count, the witness
id, the checker hash and the evidence line out of this document, so it asserts
that the panel shows what the sidecar records. Pinning the checker hash as a
literal is what made an edit to a checker red an unrelated UI test.
