---
title: "cmsl — the 23 directories cat-harness declares but does not hold"
description: "Why each exists, which way its arrow points, and the options for moving the declaration or reversing the arrow. Measured 2026-09-30 for bean cmsl."
---

# The 23 directories cat-harness declares but does not hold

> **Status, 2026-10-01: option A is built** (placement PR0, bean `ejye`).
> Steps 1–3 landed together: folio-assistant-sci declares `skills/lean/` and
> `skills/data/` from within its own `skills/skills.json`; the root instance
> declares Group 1 and `needs` every staged instance; cat-harness declares no
> `scope: "repository"` entry; corpus-wide tools ask
> `checkoutDirectories` / `corpusDirectoriesForGraph`; and
> `check:instance-graph` refuses a new mirror or an unstaged instance. The
> falsifier below is kept as a test
> (`scripts/tests/placement-pr0-mechanisms.test.ts`). The rest of this page
> is the analysis as it stood when the option was chosen.

Owner, 2026-09-30, on bean `cmsl`: *"analyze and characterize the 23 externals.
why? options for relocation/changing arrow directions? schema issues/location
issues?"* Every number below was measured on this branch after merging `main`
at `164bb7f93d`; the commands are in bean `cmsl`.

## What an "external" is

An entry in `cat-harness/cat-harness.json` with `scope: "repository"`: its
`path` resolves against the **repository root**, not against `cat-harness/`.
There are **24** such entries today (the bean's "23" plus `fsh-guts`, which
predates it). They fall into three groups that have nothing in common but the
flag.

## Group 1 — checkout-level state, at the repo root (7)

| id | path | kinds | other declarer | id refs in code |
|---|---|---|---|---|
| `beans` | `beans/` | beans | none | 72 |
| `todos` | `todos/` | todos | none | 32 |
| `fsh-guts` | `fsh-guts/` | fsh-guts | none | 30 |
| `memory` | `memory/` | memory, waiver | none | 10 |
| `issue-marks` | `issue-marks/` | issue-marks | none | 8 |
| `interaction` | `interaction/` | interaction | none | 4 |
| `root-docs` | `docs/` | docs | none | 2 |

**Why they exist.** They are the harness's own state and context — the work
plan, agent memory, the interaction profile — and they live at the root because
they belong to the **checkout**, shared by every instance in it, not to the
`cat-harness/` subtree. Nothing else declares them, so these are **not
duplicates**: they are the only declaration these graphs have.

**The issue is location, not duplication.** The root instance
(`folio-assistant.json`, the checkout) declares only `uploads` and `root-tools`.
The directories that are physically the checkout's are declared by the
platform, which is why they need the repository scope at all.

## Group 2 — another instance's content (16)

| owner (its `needs`) | cat-harness id → owner's id | kinds | `dependents` (cat-harness / owner) |
|---|---|---|---|
| folio-assistant-core (→ cat-harness) | `folio-assistant-core-library` → `core-library` | library | skip / skip |
| | `folio-assistant-core-methodologies` → `core-methodologies` | methodology | skip / skip |
| | `folio-assistant-core-skills` → `core-skills` | skills | skip / skip |
| | `folio-assist-core-schemas` → `core-schemas` | schemas, cat-harness | skip / skip |
| | `folio-assistant-core-processes` → `core-processes` | processes | skip / skip |
| fhir-harness (→ core) | `fhir-ig-skills` → `fhir-ig-skills` | skills | skip / **reproduce** |
| smart-base (→ fhir-harness) | `smart-base-library` → `library` | library | reproduce / reproduce |
| | `smart-base-methodologies` → `methodologies` | methodology | skip / skip |
| | `smart-base-processes` → `processes` | processes | skip / skip |
| who-iris (→ core) | `who-iris-library` → `library` | library | skip / **reproduce** |
| | `who-iris-skills` → `who-iris-skills` | skills | skip / skip |
| agent-skills (→ core) | `agent-skills-library` → `library` | library | skip / **reproduce** |
| folio-assistant-sci (→ core) | `folio-assistant-sci-library` → `library` | library | skip / **reproduce** |
| | `folio-assistant-sci-methodologies` → `sci-methodologies` | methodology | skip / skip |
| large-datasets (→ core) | `large-datasets-skills` → `large-datasets-skills` | skills | skip / skip |
| | `large-datasets-schemas` → `large-datasets-schemas` | schemas, cat-harness | skip / skip |

**Why they exist.** cat-harness is the platform that builds the site and runs
the corpus-wide tools, and those tools ask cat-harness's declaration for "every
directory of kind K": **19 of the repository's 60** `directoriesForGraph` call
sites ask for `library` alone (the summary drain, the library viewer, the L1
check, LSI, …). The mirrors are what make "every library" mean every library.
Their ids are referenced 0–3 times each — they are reached **by kind**, not by
name.

**The arrow points the wrong way, for all 16.** Every owner needs cat-harness,
directly (core) or through core (all the others). A platform that names its
dependents in its own declaration knows its users — the reverse of the
dependency. It is also the genericity defect this repository names first: the
platform carrying folio-specific paths.

**And they have drifted.** 5 of 16 carry a different id from the owner's own
entry; 4 disagree with the owner on `dependents`. One physical directory
therefore appears as two `Directory` nodes with two ids in two exported
documents.

## Group 3 — declared only by cat-harness, owned by an instance (1)

`folio-assistant-sci-lean-skills` → `folio-assistant-sci/skills/lean/`, kind
`skills`. folio-assistant-sci does **not** declare it. Nothing else gives it a
home, so removing the mirror would orphan it. This one is a **location/ownership
defect in folio-assistant-sci's declaration**, independent of the rest.

## Why a `dependencies` block cannot express it

`needs` is the dependency arrow and all 16 owners already point at cat-harness.
Adding the reverse closes a cycle for core, fhir-harness and smart-base
directly, and for the rest through core. What cat-harness does is **read** its
dependents, which is not depending on them.

## Options

| | what changes | arrow | cost | risk |
|---|---|---|---|---|
| **A. The checkout aggregates** | The root instance (`folio-assistant.json`) takes the aggregator role: it `needs` every instance it stages, and declares Group 1 as its own (they are at its root). Corpus-wide tools resolve a kind over the **root's dependency overlay** (`orderedDependencies` + each dependency's own directories), the mechanism `resolveSkillDirs` already uses for skills. cat-harness keeps only `cat-harness/…`. Group 3 moves into folio-assistant-sci's declaration. | **correct**: the checkout depends on what it contains; nobody depends on the checkout; the platform names no folio | one helper (`checkoutDirectoriesForGraph(kind)`), then the ~25 corpus-wide call sites switch to it; the 24 mirrors are deleted; Group-1 id references are unchanged (same ids, new declarer) | the largest change; a consumer that SHOULD be instance-scoped but was silently aggregating shows up as a behaviour change — which is the point, and each one is a finding |
| **B. `reads` list on cat-harness** | `reads: ["who-iris#library", …]` replaces the 16 mirrors; resolved through each owner's declaration, so ids and kinds cannot drift | still upward, but explicit | small: one field, one resolver | the platform still names every folio; a new folio must edit the platform to be seen |
| **C. Pointer entries** | each mirror becomes `ownedBy: "<instance>#<id>"`, no path/kind restated | still upward | smallest | same as B, plus one entry per directory remains |
| **D. Physical relocation** | move Group 1 into `cat-harness/` | n/a | beans CLI config, every state path, 72+ references | churn with no arrow benefit; Group 2 unaffected |

**Recommendation: A**, in three separately reviewable steps: (1) Group 3 —
folio-assistant-sci declares its own `skills/lean/` (tiny, independent); (2)
Group 1 — the root instance declares the checkout-level state it physically
holds (ids unchanged); (3) Group 2 — the overlay helper, the call-site switch,
the mirrors removed, and a check that refuses a `scope: repository` entry
whose path another instance's declaration covers.

**Falsifier for A.** If a corpus-wide tool must run from a checkout whose root
instance does NOT stage the other instances — e.g. cat-harness split into its
own repository and run against one folio — the root overlay is that folio's
dependencies only, and the tool sees less than today. That is arguably correct
(it sees what that checkout contains), but it is a behaviour change to confirm
before step 3.
