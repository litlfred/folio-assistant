---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'A plan request stops at a signed-off plan'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-core/skills/content/requirements-planning/plan-request-gate.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/skills/content/requirements-planning/plan-request-gate.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-core/skills/content/requirements-planning/plan-request-gate.md){: .fa-edit-source data-fa-link="edit" data-src="folio-assistant-core/skills/content/requirements-planning/plan-request-gate.md" data-repo="litlfred/folio-assistant" }

{% raw %}
# A plan request stops at a signed-off plan

Issue [#2405](https://github.com/litlfred/folio-assistant/issues/2405), owner
2026-10-07, verbatim: *"if we make a request for a plan you should ALWAYS have
created a requirements document and work plan for us to review before
implementation. the links should shared to the user"*. Decisions accepted the
same day ([comment](https://github.com/litlfred/folio-assistant/issues/2405#issuecomment-6035163987)):
this **operation** lives in folio-assistant-core; the **methods** that say
how requirements are gathered (`crdm`, `spec-kit`) stay in cat-harness, and
each points here.

**The trigger incident.** A plan was given only in chat, and implementation
started ([litlfred/test#2](https://github.com/litlfred/test/pull/2)) before any
requirements document existed. The document was written afterwards. Nothing
was wrong with the plan; the owner had no artefact to review before work
began, and so no point at which to say no.

## The trigger — a request for a plan

Any of these, in the owner's or a stakeholder's words, is a plan request:

- "plan", "make a plan", "plan the …", "what's the plan for …"
- "approach", "what approach would you take"
- "proposal", "propose …", "draft a proposal"
- "how would you …"
- "come up with …"

**Always — content requests included.** "Plan the edits to chapter 3" is a
plan request exactly as "plan the new validator" is (decision 2). What
changes between them is which methodology governs, never whether the gate
applies.

A request to *do* a thing is not a plan request, and does not acquire one by
being large. That is the opening brief's job
([`opening-brief`](opening-brief.md)),
which is said in chat and does not stop.

## What to produce — two artefacts

1. **A requirements document.** Every requirement in it follows the ONE
   definition in [`requirement-definition`](requirement-definition.md): a
   statement, a conformance level, a source, at least one success criterion
   with its verification method, and a sign-off owner.
2. **A work plan.** Beans — one or more per requirement — each naming the
   `req:` statements it delivers and carrying a `## Done when` copied from
   their success criteria. The rule and the shape are in
   [`requirement-definition`](requirement-definition.md) §"The work plan is
   beans".

## Where they go — the methodology decides, the gate does not

Which methodology governs is decided by the existing fork in
[`crdm-detect`](crdm-detect.md) §"Which
requirements methodology". This skill does not re-decide it, and **never
blends the two** (`methodology-adoption`).

| methodology | requirements document | work plan |
|---|---|---|
| **crdm** — stakeholder-facing, the answer depends on a folio's subject | committed under the owning harness's `docs/proposals/` | beans on the same branch, linked from the document |
| **spec-kit** — platform capability, content-agnostic | the spec, posted as a comment on the governing issue (never a `specs/` directory — `spec-kit` says why) | beans, linked from the spec comment |

Either way the **issue** is the review surface: a CRDM document is linked
from a comment on it, a spec-kit spec IS a comment on it.

## Hand over both as permalinks (STRICT)

**Every link handed to the user is an absolute GitHub permalink:**

```
https://github.com/<owner>/<repo>/blob/<sha>/<path>
```

— with the commit **sha**, never a branch name, and never a repo-relative
path. Two reasons, both observed in the trigger session:

- **A repo-relative path is not a link.** `docs/proposals/x.md` in chat is
  clickable only when the reader's working directory is that repository, and
  a person reviewing from claude.ai or a phone has none.
- **A branch link moves.** The document the owner signs off must be the
  document that was reviewed; a link to `blob/<branch>/` shows whatever was
  pushed since. The sha pins it.

Get the sha after pushing: `git rev-parse HEAD`, then compose
`https://github.com/<owner>/<repo>/blob/<sha>/<path>`. An issue comment is
already absolute (`…/issues/<n>#issuecomment-<id>`). This binds every
hand-over — a turn report, a PR body, an issue comment — not only a plan;
[`turn-reporting`](turn-reporting.md)
rule 8 points here.

## Then STOP until sign-off is recorded on the issue (STRICT)

After posting both links, the agent **ends the turn**. The requirements
document is a requirement set at stage `proposed`
([`requirement-definition`](requirement-definition.md) §"The document is a
requirement set"). No implementation —
no schema edit, no script, no skill text, no content block — until sign-off
is **recorded on the issue**: a comment from the sign-off owner (or quoting
them verbatim, with date) saying the plan is approved, or approving it with
changes — and the decision is then **recorded** as a `requirement-signoff`
attestation that moves the set to `approved`, which `check:requirements`
refuses unless the signer is a human. Silence is not sign-off. A reaction is not sign-off. An approval in
chat is real but not yet recorded: the agent quotes it on the issue, dated,
before starting.

What is allowed before sign-off: the requirements document and its revisions
(`docs/proposals/` or the issue), the beans that ARE the work plan, and the
branch and draft PR that carry them —
[`continual-progress`](continual-progress.md)
still applies to the plan itself.

**This gate does not replace the methodology's own sign-off steps.** CRDM's
stakeholder sign-off (`crdm-signoff.bpmn`, `crdm-close.bpmn`) and spec-kit's
spec-before-code gate run unchanged; this is the point at which a plan
request reaches them, not a second set of them.

### A breach is detectable

The test that makes it so (issue #2405 scenario P1): **no commit outside
`docs/proposals/` and `beans/` lands on the branch before the sign-off
comment's timestamp.** Compare `git log --format='%cI %H' --name-only` on the
branch against the sign-off comment's `created_at`. Extending bean `4kq7`'s
spec-before-code gate to run that comparison mechanically is that bean's
work; until it lands, a reviewer runs it by hand.

## What this does NOT mean

- It does not mean every request gets a requirements document. Only a
  request **for a plan** does. A request to fix a typo is a fix.
- It does not mean the agent asks permission to write the plan. Writing it is
  the request; stopping comes after.
- It does not mean the plan must be long. A two-requirement plan with two
  beans is a plan, and is reviewed faster than a long one.

## Cross-references

- [`requirement-definition`](requirement-definition.md) — the one definition of a requirement, and the work-plan rule
- [`crdm-detect`](crdm-detect.md), [`spec-kit`](spec-kit.md) — the methods, which point here
- [`issue-working`](issue-working.md) — what an issue is for, against a PR and a bean
{% endraw %}
