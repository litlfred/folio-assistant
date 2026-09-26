---
# folio-assistant-hqku
title: 'SWEEP SCOPE: is library/ active content? The declaration and the owner''s model disagree'
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:15:13Z
updated_at: 2026-09-20T17:34:44Z
parent: folio-assistant-zzmr
---

Raised while implementing *"qa-sweep skips fsh-guts"* / *"qasweep is only on
active/working content, unless explicit otherwise"* (owner, 2026-09-20).

That rule is now enforced from the declaration: a directory whose declared
graphs are all non-`content` is not walked. `fsh-guts` is `holds: "context"`,
so it is skipped with no directory name written down anywhere.

## The disagreement

`library/` declares **`holds: "content"`**, so the new rule WALKS it. But the
owner's own framing in `b5f0` names `library/` as the example of the *static*
KG, against the "Working / active / Dynamic" one:

> "this is a 'Working KG' or active or 'Dynamic'. otherwise it is static KG
> like in library/ (+/- if assets are materialized, KG regenerated from
> sources)"

So by the declaration `library/` is swept, and by the stated model it is the
canonical thing that should not be. One of the two is wrong and it is not
mine to pick.

## Why this is not just a naming quibble

`b5f0` §5 already argued the missing axis is **`derived`**, not `dynamic`, and
this is that argument arriving with a consequence attached:

| | rebuildable? | should a sweep judge it? |
|---|---|---|
| authored (`folio/`) | no | **yes** — it is the corpus |
| derived (`library/`, if regenerated from sources) | yes | probably not: a finding against it is a finding against its generator |
| retired (`fsh-guts/`) | n/a | no — settled, and now enforced |

`holds` cannot express the middle row: `library` and `folio` are both
`content`, and nothing distinguishes "somebody wrote this" from "a script
produced this from something else". The owner's parenthetical — *"+/- if
assets are materialized, KG regenerated from sources"* — is exactly that
distinction, and it has no home in the schema.

## Measured, so the stakes are known

On this instance, the new default changes **nothing**: `walkBlocks` yields
**123** blocks with the skip and **123** without, because `fsh-guts/` holds no
block manifests. The whole question is therefore about future corpora, and
about qou, where `library/` is large.

**Not acted on.** Changing `library`'s declared layer would move it out of the
rendered/derived content story in ways beyond a sweep, and adding a `derived`
layer is a schema change touching every graph kind.

## Done when

- [ ] **owner:** is `library/` active content a sweep should judge, or derived
      material it should skip?
- [ ] if skip: is that a new `derived` layer (`b5f0` §5), or a re-declaration
      of `library` as `context`?


---

*2026-09-20* — **Answered and implemented. The owner's two sentences settled
both rows, and the second answer was forced rather than chosen.**

## The ruling

> *"library is static (only if we materialize assets or not)"*
> *"can duplicate asset into a folio and work there"*

So: `library/` is read, never worked in place. To change an asset you
**duplicate it into the folio** and work there. A sweep must skip it.

## Why NOT `context`, which is what "static" sounds like

`context` carries *"a step that writes to it is a defect, not an update"* —
and **`document-ingestion.bpmn` writes `library/`**. Declaring it `context`
would have made a declared process a defect by the axis's own rule. Checked
against the diagram, not assumed, and the test asserts it against the file.

## Why NOT `content`, which is what it was

The sweep rule, same day: *"qasweep is only on active/working content."* A QA
finding against a derived section is a finding against its **generator**, so a
sweep that judges `library/` sends a reviewer to fix the wrong file.

## So: a fourth layer, which is the skill's own instruction

This bean argued `holds` could not express the middle row, and it was right.
The skill's two supporting questions **disagree** here — *"does it stand on
its own?"* says content (a section still reads), *"regenerate or re-author?"*
says regenerate — and its instruction for that case is to **say so rather than
picking**. `derived` is saying so.

`GraphLayer` gains `"derived"`; `library.holds` becomes it; `isDerivedGraph`
joins its three siblings. **The bean over-estimated the cost**: it feared "a
schema change touching every graph kind", and the change is additive — only
the kind that wants the new value moves. `graphLayer`'s own docstring had
already anticipated it: *"so that adding a fourth value later is one edit here
rather than a search for every `=== \"state\"`"*.

## Measured before changing, because the bean warned this reached wider

It does not. The layer predicates `isContentGraph` / `isContextGraph` /
`isStateGraph` are referenced **only from tests**; the single behavioural
consumer of `holds` is the sweep walk in `qa-utils.ts`. And `library` is
already `renderable: false`, so the rendered/derived story the bean worried
about is untouched. One behavioural effect, and it is the intended one.

## What it buys, and what it does not mean

`library/` leaves the sweep **with no directory name written down anywhere** —
the same way `fsh-guts/` did. A hardcoded skip was the alternative, and a
hardcoded path is what the declaration exists to remove.

`derived` is **not** "unimportant" and **not** "uncommitted". `library/` is L1
corpus, committed and greppable, and every KG reference to a source still
resolves through it. The layer says where a *finding* belongs, not what the
material is worth — recorded in the skill, because that is the reading a later
agent will get wrong.

## Ratcheted

Reverting `library` to `content` fails 2 tests; setting it to `context` fails
2, one of them the elimination asserted against `document-ingestion.bpmn`. The
skill's `content` example was **"a library section"** and is now a folio
chapter, with the correction stated rather than silently swapped.

---

## Re-asked, and re-confirmed with a carve-out — 2026-09-20, later the same day

**A second session asked the owner this question without knowing it had already
been answered and implemented above.** It read the bean from a branch that
predated this merge, framed it as open, and was told the opposite: *"active
content — sweeps judge it."*

That answer is **not** in force. Put back to the owner with both readings side
by side, the ruling is:

> **`derived` stays. Sweeps still skip `library/`. AND a fidelity check may
> read it.**

### Why the earlier answer survives a second look

The argument above is the one the re-ask never put to the owner, and it is the
load-bearing one: *a QA finding against a derived section is a finding against
its **generator***. A sweep that judges `library/` sends a reviewer to fix the
wrong file. Nothing about that changed, and the ratchet is real — reverting
`library.holds` to `content` fails 2 tests, `context` fails 2 more.

### What the carve-out adds, and what it does not

A check may verify the **ingestion is faithful** — pages present, OCR coverage,
the manifest matching the directory, an image claimed and absent. It may not
judge the **prose**, which belongs to another publisher and whose findings
would never be actionable here.

`image-verdicts.json` is already exactly this shape and is the precedent
rather than a new idea.

**This does not reopen `holds`.** `derived` is the layer, the sweep walk in
`qa-utils.ts` still skips it, and a fidelity check is a distinct consumer that
reads the graph deliberately — which is what `derived` permits and `state`
would not. A later agent reading only the carve-out must not conclude the layer
moved: it did not.

### Recorded so a third session does not re-ask

Two sessions have now asked this on one day and got opposite answers, because
the second could not see the first. The bean is `completed` and the ruling
above is the whole of it.
