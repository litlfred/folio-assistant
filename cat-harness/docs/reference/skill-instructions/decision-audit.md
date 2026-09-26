---
layout: default
title: 'A decision is not a finding, and neither is a substitute for the other'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/decision-audit.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/decision-audit.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/decision-audit.md){: .fa-edit-source }

{% raw %}
# A decision is not a finding, and neither is a substitute for the other

A **finding** is an observation — a checker, an agent or a person saw something.
A **decision** is an act *about* a set of findings: approve, request changes,
reject. The gate reads the decision; the record has to carry both, because the
interesting cases are exactly where they disagree.

Schema: [`schemas/qa-review.ts`](../../schemas/qa-review.ts).

## Overruling is recorded, not erased

A finding is immutable once raised. To disagree with one, **overrule it in the
decision** — the finding stays where it was, and the overrule names an audit
note saying why. Editing or deleting the finding instead leaves the next reader
unable to tell a defect that was considered and accepted from one nobody saw.

`checkReview` enforces the two halves of that:

- a decision carries **at least one** audit note — why this outcome, not another;
- an `approve` over a `critical` or `blocking` finding that is **not** overruled
  is a reported problem. Overrule it with a note, or do not approve.

## Two axes, and you say which one you are speaking on

`critical | major | minor` is what kind of breakage it is — a machine can assign
it. `blocking | suggestion | praise` is what you are asking of the gate — only
judgement can. They do not map onto each other: a checker has no way to say
`praise`, because its only good outcome is silence.

So a mechanical finding carries a severity, a human finding carries a weight,
and neither gets defaulted into the other.

## Writing the note

Three sentences is usually enough. Say what you decided, what you decided it
*over*, and what makes that safe. Then cite.

> The `lean-ref-resolves` failure on `thm:transfer-bound` is stale: the
> declaration moved to `Folio.Transfer` in the refactor and the checker's index
> predates it. The Lake build is green on the current head, which is the
> question the criterion was asking. Overruled; the criterion's index is the
> thing to fix, tracked separately.
>
> cites: `test/results/lean-build.witness.json`; `content/ch3/thm-transfer-bound.qa.json` @ `lean-ref-resolves`

**A rationale with no citation is an assertion**, so `cites` may not be empty.
Cite the node, not a description of it: a witness under `test/results/`,
another finding, a `.qa.json` / `.kg-qa.json` / `.script-qa.json` sidecar, a
block label, a file range, a bib key, a workflow instance under
`beans/workflows/`.

## The agent assembles the citations; the human is still the author

Searching the corpus for what supports a rationale is clerical work and an agent
should do it. Given a decision and the findings it is about, propose citations
and say what each one shows:

1. Start from the finding's own `evidence` and walk what it points at.
2. Look for a witness that answers the same question the criterion was asking —
   a green build, a passing round-trip, a recomputed number.
3. Look for a prior decision on the same criterion; a standing overrule is
   usually the right precedent to cite.
4. Quote at the locator, so a citation that goes stale is visible as stale.

Record yourself in `proposed_by`, never in `author`. The reasoning belongs to
whoever made the decision, and a tool appearing as its author misattributes a
judgement to something that did not make one.

## Citations you could not resolve are not citations you checked

`resolveCitations` returns `resolved`, `dangling` or `not-checked`, and
`not-checked` is what you get with no corpus resolver, or from a resolver that
could not answer — a shallow clone, an absent submodule. Report it as its own
state. A note whose citations were never checked is not a note whose citations
are good.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Content Change and Review](../../processes/content-change-review.html) | Approve |
| [CRDM close-out](../../processes/crdm-close.html) | Confirm all criteria met |
| [CRDM Phase 5 — beans and sign-off](../../processes/crdm-signoff.html) | Sign off on requirements |
| [Editing and HCI validation](../../processes/editing-hci-validation.html) | Review the findings; Record the decision and its audit note |
| [Options analysis](../../processes/options-analysis.html) | Record the recommendation AND the rejected options |
| [Adopting an upstream version bump](../../processes/upstream-version-adoption.html) | Adopt, hold or decline |

