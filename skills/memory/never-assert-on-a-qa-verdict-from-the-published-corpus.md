---
$schema: folio-memory/v1
id: never-assert-on-a-qa-verdict-from-the-published-corpus
label: trap
summary: "never assert on a QA VERDICT from the published corpus"
createdAt: 2026-09-19
roles:
  - build-pipeline
  - validation-pipeline
agents:
  - content-pipeline-navigator
---
`docs/assets/qa/**` is live state. A test that reads a verdict out of it breaks
when somebody fixes or adjudicates the finding — which is the system working.

Measured 2026-09-19 (bean `tywj`): `tests/qa-panel.e2e.ts` read
`what-is-not-built-yet.block.json` and asserted the first row was
`voice-status-leak` / `fail` / `critical`, the folded count was the literal
`47`, and the checker hash was the literal `5af6856733f3`. An agent
adjudication in `c8fbad385` turned that criterion `pass`, and four assertions
went red for reasons unrelated to the panel. The literal hash also meant any
edit to a checker reddened a UI test.

**Read the document live; flip the ONE criterion you are testing, by id, where
it sits.** The settled answer (#319, on `main`) reads the real sidecar, finds the
criterion by id, throws if it has left the corpus, sets `result`/`severity`/
`evidence`, and keeps only the script witness — so the checker hash the spec
asserts is still the corpus's own.

**Do NOT freeze a captured copy.** I tried that and withdrew it: freezing the
criterion freezes its witness, so the `scriptHash` literal outlives the checker
and the spec keeps passing while asserting a hash the corpus no longer holds.
Same defect one field down. Reading the value out of the frozen document instead
of pinning it makes the assertion self-consistent, not correct.

**Flip it IN PLACE, never hoist it to `criteria[0]`.** The generator already
sorts worst-first, so a failure at index 0 means the panel's own sort is
untested — a panel that sorted nothing would pass. At 19 of 48 the row has to be
lifted past nineteen quiet ones.

**Adjudication is lossy** — a criterion the agent overturned keeps no `severity`
and no `evidence`, only the script witness. So `evidence` has to be written as a
literal; that one string is the accepted cost.

**Three fields exist only in a state the corpus is not in**, so no live sidecar
can vouch for them: `severity` and `evidence` (a failing criterion — #314
measured that NO criterion in the corpus carries `evidence` any more) and
`changed` (a stale witness; nothing is stale today). That third one was found by
a drift test on its first run, not from memory.
