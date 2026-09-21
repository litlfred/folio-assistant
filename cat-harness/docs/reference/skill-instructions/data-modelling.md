---
layout: default
title: 'Data modelling'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/data-modelling.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/data-modelling.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/data-modelling.md){: .fa-edit-source }

{% raw %}
# Data modelling — the entities, before the fields

**One question, and everything else follows from it:**

> **What are the things, and what is true of each of them exactly once?**

A model is wrong in a way no schema check can catch when a fact that belongs
to one thing is written on another. That is not a style complaint. This
repository has paid for it repeatedly and the shape is always the same:

- `fallbackCapabilityId` said *what substitutes for `lean-toolchain`* on five
  SKILLS. It is a fact about `lean-toolchain`. Five copies, and a change of
  substitute could be made four times (bean `sym3`).
- `fallbackRole` said *which role takes over* on a skill, when the BPMN
  already said it executably. One fact, two places, nothing asserting they
  agreed (bean `85e8`).
- `roles:` said *who performs this skill* in 114 files, in a vocabulary that
  resolved against nothing, for three months (bean `qif9`).

Each was a field on the wrong entity, or a second copy of a fact that already
had a home. **Modelling is the step that would have caught all three**, and
it costs an afternoon against the weeks those took to unwind.

## The procedure

### 1. Name the entities, as nouns a domain expert already uses

Not the tables you expect to build. If the people who do this work say
"attestation", the entity is Attestation, even when it will be stored beside
something else. A name you invented is a name nobody will look up.

**Stop when two candidate entities have the same identifier.** They are one
entity with two names, and carrying both is how a codebase ends up with a
Role registry and an actor-id vocabulary that do not resolve against each
other.

### 2. For each entity, say what identifies it

An entity with no identifier is an attribute of something else — that is the
test, and it is decisive. If you cannot say what makes two of these the *same
one*, you have found a field rather than a thing.

### 3. Put each fact on the entity it is about

For every fact, ask **whose property is this?** The question that settles the
hard cases:

> If this entity disappeared, would the fact still be true of anything?

*What substitutes for X* survives the disappearance of every skill that uses
X, so it belongs to X. *What this skill does when X is missing* does not —
it is the skill's.

### 4. State cardinality in both directions, and mean it

"One attestation per report" and "one report per attestation" are different
claims, and a model that states only the first cannot tell you whether a
re-signature is an update or a second row. Write both. Where the answer is
"many", say what ORDERS them or admits there is no order.

### 5. Say which facts are derived, and never store those

A derived fact stored is a cache, and an unvalidated cache is worse than no
cache. If a value can be computed from the model, computing it is the
declaration — see `85e8`, where the role a process falls back to was
recoverable from the diagram that executes it.

### 6. Declare it where a tool can read it

A model in prose is a proposal. A model in the declaration is a model. In this
repository that means a graph kind in `<name>.json`, a Zod schema under the
declared `schemas` directory, and a node kind that `kg-export` knows —
`placement` is the skill that decides which.

**And ship a reader in the same change.** Everything here that was only
documentation went inert within weeks; the three examples at the top of this
page are all of that kind. A field with no consumer is not a model, it is a
comment with punctuation.

### 7. Model VARIATION as inheritance, and earn a new kind with BEHAVIOUR

Two things are nearly the same. Do they get one type with a discriminator, two
types, or one type and an override?

> **A new KIND is earned by a BEHAVIOUR difference — a consumer has to DO
> something different. Everything else is an OVERRIDE on an inherited
> default.**

Owner's ruling, 2026-09-20: *"WHO should be able to override all theme
properties, just defaults to inherited. if it needs to name a new kind it
should if behaviour change."*

So the default posture is **inherit everything, override anything**. A variant
declares what it CHANGES; every unstated field comes from its parent. A variant
that states no new behaviour is not a new kind, however different it looks.

**The test is on the consumer, not the values.** Ask: *does any reader of this
model take a different code path?* Different colours, sizes, labels or
thresholds are the same behaviour with different inputs — one kind. Different
FIELDS, different units, or a field whose meaning changes — the reader must
branch, and that is a kind.

#### Worked, and it is worked because I got it wrong first

`Theme` dresses three surfaces: sticky notes, a website, a print publication.

| variant | kind? | why |
|---|---|---|
| `iris-web` vs the default web theme | **no** | different hex values, same fields. Nothing branches. An override. |
| `publication` vs `sticky` | **yes** | a sticky theme's geometry is `{minWidth, padding, fontScale}` across `laptop \| mobile \| card`; the WHO style guide states `A4 \| A5 \| A5 landscape` with trim size and margin, and no column width anywhere in 66 sections. `minWidth` means "before the grid reflows" — a fixed page does not reflow. A renderer MUST branch. |

The first draft reused `{minWidth, padding, fontScale}` for print, reading
`minWidth` as trim width. It would have typechecked and meant nothing: a
reader following the field name would have been told the wrong thing about a
real publication. **A shape that typechecks is not a shape that models.**

And the palette stays SHARED across all three kinds, which is the other half
of the rule. `theme.ts` exists because 106 hardcoded hex colours became 22
named properties; three kinds each with their own palette vocabulary would
reintroduce that one level up — three spellings of "accent colour", free to
disagree about what an accent is.

#### What inheritance costs, and what it must not hide

A required field stays required **after resolution**, never before. "All three
layouts, or invalid" is a property of the RESOLVED variant; a declaration that
states one and inherits two is complete. Checking requiredness on the
declaration instead is how inheritance turns into optionality by accident.

And an inherited value is still a fact somebody must be able to trace. A
variant that overrides a value **cites why**, the same as any other asserted
fact — otherwise the model records what the value is and loses where it came
from, which is the failure the `uses[]` rule exists to prevent elsewhere.

## What falsifies a model

Write these down as you go and check them at the end. A model nobody tried to
break is a diagram.

| test | what it catches |
|---|---|
| name two instances that differ only in a field you called an identifier | the identifier is not one |
| find a fact you would have to update in two places | it is on the wrong entity, or duplicated |
| find a relation whose cardinality changes under a plausible future | the model states today's data, not the domain |
| count the facts nothing reads | the part you modelled for its own sake |
| find two kinds whose consumers take the SAME code path | one of them is an override wearing a discriminator |
| find a required field a variant can never state | requiredness is being checked before resolution, not after |

## What this skill is NOT

**Not a storage design.** Tables, files, indices and formats come after, and a
model that assumed one of them has usually smuggled a storage constraint in as
a domain fact.

**Not domain content.** folio-assistant is the platform. A model of *clinical
recommendations*, *FHIR profiles* or any one folio's vocabulary belongs in
that folio — this skill is the procedure, and the procedure carries no
subject matter. See the platform-boundary rule in
[`placement`](placement.md).
{% endraw %}
