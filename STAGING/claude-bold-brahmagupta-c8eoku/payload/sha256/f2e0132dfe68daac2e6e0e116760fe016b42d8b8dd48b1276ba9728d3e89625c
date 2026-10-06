---
name: smart-guideline-create
description: >
  Somebody asked for a new WHO SMART Guideline (an IG built on smart-base, or
  a DAK that will feed one). Specialises fhir-ig-create: the same three facts,
  the same numbered question with the same default (stage it inside this
  repository first), and the same routes, plus what the owner ruled for SMART
  guidelines during the 2026-10 separation: every guideline repository
  instantiates smart-base identically, forks under litlfred come before any
  WHO repository, the identity comes from the declaration and never from the
  directory, and the WHO template's theme and chrome come from smart-base by
  `needs`, never copied. Use whenever a user asks to create, start or set up a
  SMART Guideline, a SMART IG, a WHO IG or a DAK.
---

# smart-guideline-create

> Skill id: `smart-guideline-create` · Package: `authoring-who-smart-guidelines`
> Specialises [`fhir-ig-create`](../../../../fhir-harness/skills/fhir-ig-base/fhir-ig-create.md) ·
> Bean `3tza`

Owner, 2026-10-06: *"when asked to create a new FHIR IG or Smart Guideline,
that can either be done in a new repo or within the folio of an existing
harnessed repo."*

**Run `fhir-ig-create` and change only what is below.** Its facts, its decision
table, its question and its default (`in-repo`, a staged sub-KG) all hold for a
SMART guideline. What this skill adds is what is WHO's, which the FHIR layer
must not know (its `AGENTS.md`, `check:fhir-harness-exclusions`).

## What changes

### 1. A fifth fact: which level is being started

A SMART guideline is L1 narrative, an L2 DAK, or an L3 IG
([`smart-stack-layering`](smart-stack-layering.md)), and they are not a chain.
Ask it as one more numbered question, only when the request did not say:

> What are you starting with?
>
> 1. **The FHIR IG (L3)** *(recommended)*. The level the pipeline builds today.
> 2. **The DAK (L2)**: the ten components. Its document kind is still being
>    built (bean `qvxh`), so this starts as plain authoring.
> 3. **An L1 narrative document** from the smart-base library.
> 4. **Tell me more.**
>
> **Default if you do not answer: 1.**

An L1 or DAK start is a document kind inside smart-base, authored with
[`l2-dak-authoring`](l2-dak-authoring.md) or as an L1 document, not a new
instance. Only the IG (option 1) goes through the routes below.

### 2. The declaration `needs` the IG-publication layer, not fhir-harness

Where `fhir-ig-create` writes `needs: ["fhir-harness"]`, a SMART guideline
needs the layer every ingested guideline already needs: copy the `needs` of
an existing staged guideline's declaration rather than typing a name. That
layer brings smart-base, and through it the WHO template's theme and chrome
(stage D, bean `kg83`). **Never copy a theme or a `chrome.json` into the new
instance**: chrome is keyed to the template, not to one guideline (Q4).

### 3. The layout is the same in every repository

Owner, 2026-10-01 (#1767, Q1 and Q2) and 2026-10-02 (bean `rbz3`, answer "2"):
every guideline repository instantiates smart-base **the same way**.

| at the repository root | under `smart-base/` |
|---|---|
| the IG source as WHO publishes it (`sushi-config.yaml`, `input/`), unchanged | this guideline's data: its declaration, artefact index, menu, generated pages, QA results |
| `smart-base.config.json` | |

So while the guideline is staged in place (route `in-repo`), its directory is
already that `smart-base/` data directory, under whatever path `livesAt`
names. When it leaves, the directory becomes `smart-base/` in the new
repository, and **nothing may key on the directory name**: the fork rehearsal
measured every page changing when it did (2,153 of them), and the fix
(`853f9532`) took the identity from the declaration's `name`. Check a new
generator for that before it ships.

### 4. A new repository is a litlfred fork first

Owner, 2026-10-02: *"use forks litlfred/smart-* as staging before we do it on
WHO reps"*. So in route `new-repo`, and in `sub-kg-lifecycle`'s stage 8, the
planned `repository` is `litlfred/<name>`, a fork of the WHO repository when
one exists. Moving to a `WorldHealthOrganization/*` repository is a later,
separate owner decision, never part of this skill. The question before
creating is the same one, with the same default ("not yet").

### 5. Pages are generated with the WHO labels passed in

The page generator is fhir-harness's and knows nothing of WHO; the WHO names
are configuration. Model the new instance's `<name>:pages` script on an
existing guideline's in the root `package.json`: `--publish-note`,
`--sidecar-label "DAK API"`, `--label` and `--chrome-owner smart-base`.

## What does not change

The import seam (`<name>/platform.ts`), the separation guard, `seed:ready`,
the two owner confirmations and the fresh-clone check are all
[`sub-kg-lifecycle`](../../../../cat-harness/skills/kg/graph-management/sub-kg-lifecycle.md)'s,
and apply to a SMART guideline unchanged. This is where they were learned:
bean `n3ni`, stages A to F.

## Anti-patterns

1. **A per-guideline harness.** smart-base is the harness; a guideline is an
   instance of it. `smart-stack-layering` §"Two consequences" says why.
2. **Creating under `WorldHealthOrganization/` first.** The forks are the
   staging ground, by the owner's ruling.
3. **Copying the WHO theme into the guideline** to make a page look right.
   It arrives by `needs`.
