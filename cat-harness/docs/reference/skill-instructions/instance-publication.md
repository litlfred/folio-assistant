---
layout: default
title: 'instance-publication'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/instance-publication.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/instance-publication.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/instance-publication.md){: .fa-edit-source }

{% raw %}
# instance-publication — draft is a state, not an absence of one

> Skill id: `instance-publication` · Package: `folio-core` · Instance:
> `cat-harness` · Bean `9wb0`

The owner, 2026-09-23:

> all assets get a version and are in "draft" publication. formal publication
> process needs to be deinfed/neeeds tools/depends on instance

Three rules, and the third is what makes the first two safe.

## 1. Every asset carries a `version` — and the `id` is HELD

`version` is **universal**. Not only the publishable ones.

**It is enforced by `check:publishable`, not by the schema**, and that is a
measured decision rather than a weaker one: requiring it in the type breaks
**376 tests across 20+ files**, every fixture that builds a declaration
without it. A sweep that size hides a real regression among the noise, and the
property is delivered either way — all instances carry one, and a new instance
without a version fails the gate, **by name**, rather than as a parse error
somewhere in a fixture.

**`id` is a different story, and it is not shipped.** The owner ruled the
namespace `io.github.litlfred.folio-assistant.<name>`; it was minted into all
17 declarations and then **removed**, because the next ruling contradicts
writing it there at all:

> i want simplest so if someone wants to bootstrap a different harness, there
> is only one place to change. **ONE PLACE.**
>
> fork would only edit `bootstrap/README.md` and change ONE reference there.

A namespace written into 17 files is 17 places. So an id must be **derived**
from that single reference — and the reference does not exist yet.
`bootstrap/README.md` today carries **zero** outward references and its own
tests enforce that. Bean `iwtn` owns creating it.

Minting ids before then bakes the wrong scheme into something this schema
itself calls *stable forever, never reused*. The namespace rule below stands;
only its application waits.

This reverses what `instance-versioning.md` §3.1 originally shipped, which
**refused** them unless an instance declared `publishable: true`:

> refused while `publishable` is undeclared — a declared `version` reads as a
> published identity, and nobody has said this instance is published

That refusal rested on a premise the owner's ruling denies: that a version is
a *publication* claim. It is not. A version distinguishes snapshots of a thing;
whether anyone outside may depend on those snapshots is the separate question
below.

## 2. Publication is a STATE, and the state is `draft`

`publication` is not a boolean and never was one honestly. `draft` is the state
**everything is already in** — not an undecided-ness, not an absence.

**This is why the old model reported a fully-decided corpus as a worklist.**
`check:publishable` printed all 17 instances as `undecided`, correctly by its
own rules, because the model had no way to express the true thing. Seventeen
"nobody has looked" entries described a situation where the answer was known
for every one of them. A third state that cannot say what is true is not a
third state, it is a missing value.

Absence still means `draft`. Declaring `publication: "draft"` is legal and
says nothing extra; the field exists to reserve the axis and to make rule 3
testable rather than merely intended.

## 3. `published` is REFUSED by the schema, not merely reported

Because the process does not exist: *"needs to be deinfed/neeeds tools/depends
on instance."*

A flag nothing can verify is precisely the ceremony §3.1 was written against.
Accepting `published` today — even with a gate grumbling about it — would
rebuild that defect one name over, and a grumbling gate is a gate somebody
switches off. So a declaration setting `publication: "published"` **fails to
parse**, with the error naming what is missing.

> **Falsifier for this whole skill:** if `published` becomes settable by hand
> before any tool backs it, this is wrong and should be read again.

`depends on instance` is the part not yet designed. When the process arrives it
will be **per-instance** — what publishing means for `cat-harness` is not what
it means for a WHO IG mirror — so expect `publication` to gain a companion
naming that process, rather than to become a second boolean.

## The id namespace — one rule, no per-instance invention

Owner's ruling, 2026-09-23: **`io.github.litlfred.folio-assistant.<name>` for
all 17.**

The rule underneath it is mechanical: **reverse the host, append the path.**

| host + path | id |
|---|---|
| `litlfred.github.io/folio-assistant` | `io.github.litlfred.folio-assistant` |
| `smart.who.int/base` | `smart.who.int.base` |

The second row is not an example invented here — it is FHIR's actual published
package id for that IG, produced by the same rule. Following a convention that
already yields the right answer for a case we can check is worth more than a
scheme chosen for elegance.

An id is **stable forever and never reused**. That is the whole reason it was
ruled rather than derived quietly.

## A MIRROR NEVER TAKES ITS SUBJECT'S IDENTITY

The hardest question in the ruling, and the one most likely to be re-opened by
somebody who notices the ids "should" match.

`smart-trust` here is **not** the WHO SMART Trust IG. It is this repository's
reconstructed index *about* that IG. The two are different objects, and the
real upstream ids are already held — as **data**, in the right place:

```json
// smart-base/fhir-artifact-index/chrome.json, ingested at commit 26635f7b
{ "id": "smart.who.int.trust", "canonical": "http://smart.who.int/trust" }
```

Giving our instance `smart.who.int.trust` would claim our mirror **is** the
thing it mirrors. Anything resolving that id would then find two different
artefacts answering to it.

**The same reading governs `canonicalUrl`,** and `smart-base`'s own declaration
already said so before this skill existed:

> It is READ from upstream rather than chosen here, so it is a fact about
> smart-base and not a decision about where this staging directory publishes.

So `canonicalUrl` records the **subject**. It must not drive **our** identity.
A declaration that carries an upstream canonical is describing what it mirrors,
not asserting where it lives.

## What a consumer may assume of a draft

- **That the id is stable.** It is the one thing that does not move.
- **That the version distinguishes snapshots** — and nothing more. It carries
  no promise that a snapshot remains fetchable, or that anyone announced it.
- **Nothing about availability.** No registry, no tarball, no announcement.
  Draft is not "published somewhere quiet"; it is "the process that would make
  this depend-on-able has not been built".

An instance that wants to be depended upon from outside does not declare its
way there. It waits for the process, which is somebody's work and not a field.

## Do not

- **Do not infer a publication state from evidence.** A `canonicalUrl`, a
  GitHub Release, a Pages deployment or a `dependsOn` naming this instance are
  all things that exist for drafts too. Inferring from them is how a boolean
  defaulting to `false` erases the difference between "decided" and "nobody
  looked" — the defect §3.1 was right about even where its model was wrong.
- **Do not mint an id for something that already has one upstream.** Record
  theirs as data, mint ours under the namespace above, and keep them apart.
- **Do not restate this skill in a bean, a proposal or `AGENTS.md`.** `kn0t`
  restated `ig-publisher-reduction` and drifted from it in four places within a
  day, one of which would have let a phase be approved on an impression. Point
  here instead.
{% endraw %}
