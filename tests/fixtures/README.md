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

## Four sessions found this independently, and two found more than I did

Worth recording, because the overlap is itself evidence about the defect rather
than noise:

- **PR #320** diagnosed it and deliberately did not apply a fix — *"it is #317's
  gate and #302's data, and loosening someone else's assertion is their call"* —
  and recommended pinning a criterion **by id rather than by position**.
- **PR #319** applied a fix and found **two latent bugs** in the process. The
  second is the one that mattered here: `voice-status-leak` sits at position 19
  of 48 in the live sidecar, so *"worst criterion first"* had been passing on
  **document order** — the generator sorts worst-first, so a panel that did no
  sorting at all would have passed. Its first finding is the same defect in
  `STALE_JSON`, which marked `criteria[0]`, asserted a stale badge on a row it
  had not marked, and passed.
- **PR #314** applied a fix too, and measured that **no criterion anywhere in
  the corpus carries `evidence` any more** — that assertion had outlived every
  input that could satisfy it, for every block. It filed the general pattern as
  bean `iumj`.

Both findings are taken up here. The document served to the page is sorted **by
criterion id**, which puts the failure at position 42 of 48 — a deliberate
deviation from generator output, and the only way the sort assertion is about
the panel rather than about its input. `STALE_JSON` marks by id. `FAIL_CRIT_ID`
throws at module load if the criterion leaves the fixture, rather than letting
every assertion retarget the first row of whatever remains.

The frozen fixture is also the only place `evidence` still exists, which is why
the verbatim-quoting assertion is still meaningful.

## Freezing gives up one property, and it is bought back

The e2e spec's header argues that a fixture read off disk cannot *"agree with
the code while the code disagrees with the corpus"*. That is right, and a frozen
copy gives it up: if `qa-witness` grows a field or renames one, this file would
go on satisfying a spec the generator no longer produces.

`scripts/tests/qa-panel-fixture.test.ts` is the other half. It checks this
document's **shape** against every published `*.block.json` — `$schema`, the
criterion fields, the witness fields — while the **verdict** stays frozen here.
A checkout with no published sidecars reports `n/a` and passes: "could not
compare" is not "compared and matched".

It earned its place on its first run, by failing. Three fields are written only
in a state the corpus is not currently in, so the live corpus cannot vouch for
them: `evidence` and `severity` (a failing criterion — #314 measured that no
criterion anywhere carries `evidence` any more) and **`changed`** (a stale
witness, and nothing is stale today). That third one I had not thought of, which
is exactly why the exemption list is derived from a measurement rather than
written from memory.

## Beans

`tywj` here; `qjyi` on `main` (#320's, which fixed it by synthesising the
failure into `criteria[0]`); `iumj` (#314's, for the general pattern). Four
sessions, three beans, one defect — cross-referenced rather than merged, so none
of the three reads as the whole story.
