---
# folio-assistant-hqku
title: 'SWEEP SCOPE: is library/ active content? The declaration and the owner''s model disagree'
status: todo
type: task
created_at: 2026-09-20T16:15:13Z
updated_at: 2026-09-20T16:15:13Z
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
