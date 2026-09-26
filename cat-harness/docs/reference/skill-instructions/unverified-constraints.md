---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Never encode a constraint you have not verified'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/unverified-constraints.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/unverified-constraints.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/unverified-constraints.md){: .fa-edit-source }

{% raw %}
# Never encode a constraint you have not verified

Owner, 2026-09-19: **"dont encode rules against a working setup."**

## The asymmetry, which is the whole argument

A constraint in a schema, validator or gate is a **refusal**, and the two ways
it can be wrong are not symmetric:

| | what happens | who finds out |
|---|---|---|
| a **missing** constraint | a bad setup gets through | it fails at the point of use, with the real error |
| a **wrong** constraint | a good setup is refused at the gate | **nobody** — the message asserts the thing is impossible, and nobody investigates a settled question |

The second is the expensive one precisely because it looks like the system
working. Same asymmetry as rendering "could not check" as green
([`ci-health`](ci-health.md)): a confident wrong answer costs more than a
visible absence.

So an **asserted but unverified** constraint is left OUT of the gate and
written down as an open question. Not encoded "provisionally" — a provisional
refusal refuses exactly as hard as a permanent one.

## The test is the evidence, not the confidence

Encode either of these and nothing else:

- **An entailment of the mechanism.** GitHub Pages has no per-file media-type
  configuration; air-gapped compute cannot reach hosted inference. These follow
  from how the thing works, and you can say why.
- **Something measured here, with the command shown.** Not "someone said so",
  not what was true of one account, one plan or one version.

If you cannot produce one of those, you have a question, not a constraint.

## The worked case

`docs/proposals/deployment-topologies.md` §3 leaves `private repo` ×
`github-pages` **out** of its incompatibility table. Issue #363 states it as
flatly unavailable — but GitHub has offered Pages on private repositories on
paid plans, and the account's entitlement was never checked. Encoding #363's
claim would have refused a topology that may well work, with a message saying
it cannot.

The absence in that table is the rule being followed, not an oversight.

## It reads the same in both lanes

- A **watcher** must not render "could not check" as green.
- A **boundary guard** must not encode a constraint that refuses a folio
  nobody has tried.

Both are the same refusal to convert absence of evidence into a confident
answer.

## Related

| | |
|---|---|
| the three states, and never rendering the third as clean | [`ci-health`](ci-health.md) |
| where a new rule belongs before you write it | [`placement`](placement.md) |
| re-measure rather than quoting a number | [`uses-editorial-review`](uses-editorial-review.md) |
{% endraw %}
