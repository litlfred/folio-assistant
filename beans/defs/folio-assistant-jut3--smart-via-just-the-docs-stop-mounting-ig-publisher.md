---
# folio-assistant-jut3
title: 'SMART-* VIA JUST-THE-DOCS: stop mounting IG Publisher HTML; render input/pages from post-processed JSON-LD + metadata through the Jekyll pipeline'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T19:10:00Z
updated_at: 2026-09-21T23:06:21Z
parent: folio-assistant-yj32
---

## The owner's words, verbatim

Paraphrase would lose the sequencing and the scope, both of which constrain the
design:

> i want the smart-* mockups not to mount the existing rendered .html but use
> the IG Publisher+postporcessed json/jsonld +metadataindexing to reproduce the
> generated html in the justthedoc pipeline.
>
> i want the input/page(s)/ content to be rendered viajustthedocs pipeline. use
> metadataetc fro IG publisher to populate the variables jekyl processes.
>
> i want to slowly get rid of IG publisher in the publication/iteration pahse.
> you or sibling should be working on AST dump as cache of published IG. we can
> use this for iterative delta's (if we dont care about indexing/versioning so
> much in STAGING, we need full IG AST rereun)
>
> keep working asset types and pages until you get rendering parity-ish with IG
> publisher. get to MVP

And on ordering: *"do that after left navbar"* — so `hw9g` lands first.

## What this reverses

`smart-trust/docs/` is 20 finished HTML files produced by the IG Publisher and
**mounted verbatim** by `mount-instance-docs.ts`. This makes them Jekyll pages
instead: `input/pages/` as content, IG Publisher's post-processed JSON/JSON-LD
and metadata index as the variables Jekyll interpolates.

## Why it matters beyond looks

Mounted HTML is opaque to everything the harness does. It carries no front
matter, so the navbar, the language bar, the QA badges and the translation
surface all stop at its edge — `hw9g` exists precisely because a mounted page
gets no sidebar. Rendering through the pipeline makes a SMART Guideline page an
ordinary folio page.

**It also makes `hw9g` unnecessary for `smart-trust` specifically** — a Jekyll
page gets the real sidebar. `hw9g` is still needed for `who-iris`, which is a
deliberate replica of somebody else's site and must not wear just-the-docs'
layout. Worth stating so the rail is not later removed as redundant on the
strength of this bean alone.

## Three things to measure before designing anything

1. **What does the IG Publisher actually emit as data?** The JSON/JSON-LD and
   the metadata index — their shapes, and which Jekyll variables they can
   populate. Read the artefacts, do not infer from the HTML.
2. **What is in `input/pages/`** for `smart-trust`, and in what markup.
3. **What does parity mean here** — which asset types and page kinds the
   Publisher renders, so "parity-ish" has a checklist rather than a feeling.

## Sequenced after, not part of

The **AST dump as a cache of the published IG**, for iterative deltas. The
owner says a sibling may already be on it. Check before starting: three
duplications cost real work on 2026-09-21 (`y90d`, `lps0`, `u1iu`), and a
fourth was avoided only by asking first.

## Done when

- [x] The three measurements above, recorded with provenance
- [ ] `input/pages/` renders through just-the-docs with Publisher metadata
      populating the Jekyll variables
- [ ] A stated parity checklist (STATED 2026-09-22, see M3), and MVP declared
      against it rather than against an impression — the MVP call is the
      owner's, and the 19-page ceiling is a data limit, not an effort one
- [x] `smart-trust` no longer mounted as finished HTML — VERIFIED 2026-09-22
      on the deployed artefact, with a control; see the section below

## Round 1 landed — the pages are markdown (PR #825, issue #824, merged c8c25d0d11)

The **rendering** half, not the pipeline half. Verified on main rather than on
the branch:

| | before | after |
|---|---|---|
| `index.md` | 631 lines, 553 of them HTML | 197 lines, 110 |
| `<style>` | `body`, a colour scheme, `prefers-color-scheme` | 8 lines, four classes |
| artefact links | `./artifact/Name/` — all 19 would 404 once built | `.html`, 19 of 19 |
| representation links | joined `""` → `jsonxmlttlhtml` | ` · `, 70 runs, 0 run-ons |

THE TRAILING-SLASH DEFECT IS THE ONE WORTH CARRYING FORWARD, because it is
invisible from a checkout. `cat-harness/docs/_config.yml` sets no `permalink`,
so Jekyll emits `Name.html`; on disk the two spellings are the same file and
nothing local can tell them apart. The only assertion that catches it reads the
href out of the rendered page and resolves it back to a source file. Same shape
as #801 (a tile href right as data, wrong as a URL) and as the `toRootFor` test
#776 paid for, where the assertion restated the expression it was guarding.

`smart-trust/scripts/tests/pages-markdown.test.ts` pins all four, falsified by
planting each defect in the GENERATOR and regenerating: 20 / 19 / 20 / 19 tests
red respectively. Its first assertion is a vacuity guard, since every other one
loops over the page list.

## Still open — three of the four `Done when`

- [x] the three measurements, with provenance
- [ ] `input/pages/` through just-the-docs with Publisher metadata populating
      the Jekyll variables
- [ ] a stated parity checklist (STATED, M3); MVP declared against it — owner's call

The fourth — "smart-trust no longer mounted as finished HTML" — is now
ambiguous rather than done, and saying so is the point: the GENERATED pages are
Jekyll markdown, but they are still copied in by `mount-instance-docs.ts`
rather than built by Jekyll. Bean `2b5s` is the same question from the other
end and is waiting on the owner.

## The three measurements — 2026-09-22, with provenance

Taken from the artefacts, never inferred from rendered HTML, which is the rule
this bean set itself and the one round 1's trailing-slash defect was invisible
to.

### M1 — what the IG Publisher emits as data

Provenance: `smart-trust/fhir-artifact-index/index.json`, `$schema:
folio-fhir-artifact-index/v1`, read 2026-09-22 in this checkout.

It is **not** a Publisher run here. `source` says
`{kind: "gh-pages", of: "https://worldhealthorganization.github.io/smart-trust",
readAt: "2026-09-21"}` — reconstructed from WHO's published build. `provenance`
names the five upstream files every field came out of: `package.manifest.json`,
`canonicals.json`, `package.tgz!package/.index.json`, `artifacts.html`, and two
DAK enumerations.

**674 artefacts. Field coverage is the number that constrains the design:**

| field | on how many | |
|---|---|---|
| `key`, `resourceType`, `id`, `published`, `materialization` | **674** | all |
| `category`, `title` | 673 | |
| `description` | **219** | |
| `canonical`, `version`, `name` | 70 | |
| `dak` | **19** | |

- `published`: 673 carry all four of `json`/`xml`/`ttl`/`html`; one
  (`ImplementationGuide/smart.who.int.trust`) carries no `html`.
- `materialization.state`: **655 referenced, 19 materialized**.
- 9 `resourceType`s — `Endpoint` 453 and `Organization` 151 are 90 % of it.
- 7 categories, of which `Other` is **604**.
- 66 `dak` local paths + 3 `contexts` local paths = **69, all present on disk**,
  against 69 files under `dak/`. Exact accounting.

**The answer to the question the bean asks.** Of everything the index carries,
only **two** fields are prose a Jekyll variable would want: `title` (673) and
`description` (**219**). The rest is identity, URL or classification. So
*"use IG Publisher metadata to populate the variables Jekyll processes"* is
achievable — **for `title` in full, and for `description` on 219 of 674**. The
falsifier named in this round's brief therefore does **not** fire, but it comes
back with a limit that has to be designed around rather than discovered later:
**455 artefacts have no description to interpolate.**

### M2 — what is in `input/pages/`, and in what markup

**There is no `input/pages/` in this repository.** `smart-trust/` holds
`fhir-artifact-index/`, `docs/`, `scripts/`, `AGENTS.md`, `README.md` and
`smart-trust.json` — nothing else.

The pages are **generated, not authored**: `gen-smart-trust-pages.ts` builds
all 20 from `index.json`, and `smart-trust.json` says so in its own words
(*"Generated, never authored"*). So the owner's *"i want the input/page(s)/
content to be rendered via justthedocs pipeline"* has no local subject: the
narrative pages live in WHO's source IG, which this repository has never held.

**Whether upstream has narrative pages, and how many, COULD NOT BE DETERMINED
from here** — egress is blocked and no copy exists locally. Recorded as
undetermined, **not as zero**, because those are different facts and the second
is what a parity table would silently claim.

### M3 — what parity means, as a checklist rather than a feeling

| page kind | Publisher publishes | rendered here | gap |
|---|---|---|---|
| artefact detail | **673** | **19** | 654 |
| IG index / `artifacts.html` equivalent | ≥ 1 | 1 | — |
| narrative pages from `input/pages/` | **could not determine** | 0 | **undetermined** |

**The 19 is a ceiling set by the data, not by effort.** The generator's gate is
`if (!a.dak) continue` — a page exists for an artefact carrying a **DAK
sidecar**, and only 19 do. Reaching the other 654 is not more rendering work;
it needs either more sidecars ingested or a second page kind that renders an
artefact from `key`/`title`/`published` alone. That is a design decision for
the owner, not something to infer.

## Done-when 4 is DONE, and this bean says otherwise

The bean records the fourth as *"ambiguous rather than done"*: generated pages
are markdown, but *"still copied in by `mount-instance-docs.ts` rather than
built by Jekyll"*. **That is no longer true, and it was checked at the deployed
artefact rather than at the declaration.**

`smart-trust.json` declares `"composed": true`, and `composedInstances()` in
`cat-harness/scripts/compose-docs.ts:207` honours exactly that flag. A
declaration is a claim, so:

| | measured |
|---|---|
| `.html` files under `smart-trust/docs/` | **0** (20 `.md`) |
| pages served at `/smart-trust/` on `origin/gh-pages` | **20** |
| `side-bar` / `search-input` / `site-nav` / `nav-list` in the deployed page | 1 / 3 / 8 / 11 |
| `<title>` | `WHO SMART Trust — artefact index \| folio-assistant` |

**With the control**, because absence proves nothing on its own: `lang-bar` and
`aux-nav` are **0 on the site's own `index.html` too**, so their absence here is
site-wide and not a smart-trust defect. The deployed smart-trust page carries
*identical* chrome to the site's home page. It is built by Jekyll, not mounted.

### Two oracles agreeing by coincidence — pinned

The generator gates on `dak`; the index reports `materialization.state`. Both
give the same **19 keys today**, so the existing `toBe(19)` assertion is green
whichever property the generator reads, and would stay green if the gate were
switched to the other one. They are not the same question — a sidecar is *a
schema was published*, materialized is *the bytes are here*.

`pages-markdown.test.ts` now asserts the RELATION and the coincidence as a
coincidence. Falsified both ways against mutated in-memory copies rather than
by editing the read-only index: dropping one sidecar gives 18 vs 19 and adding
a stray one gives 20 vs 19, and the assertion fails in both directions.

Same shape as the two `folio:policy` oracles (bean `osyc`, same day). A count
confirmed twice can still be measuring two different things.

### One near-miss worth recording

The declared `localPath`s are **instance-relative**. Resolved from the
repository root they all fail, and the first sweep reported **69 missing
files** over a corpus where every one is present. Caught by the count matching
the files on disk exactly. Re-run from `smart-trust/`: 0 missing.

### The 654-page gap is really 51 + 604

M3's headline number is true and misleading on its own, so it is decomposed
here rather than quoted.

**`has canonical` ≡ `not Endpoint/Organization`** — asserted, not assumed:
the two sets are identical, 70 keys either way.

| | count | has a page | gap |
|---|---|---|---|
| conformance artefacts (carry `canonical`/`version`/`name`) | **70** | 19 | **51** |
| bulk registry entries (`Endpoint` 453, `Organization` 151) | **604** | 0 | 604 |

The 51:

    Requirements          29
    CodeSystem            15
    ActorDefinition        5
    ConceptMap             1
    ImplementationGuide    1

All 5 `StructureDefinition` and all 14 `ValueSet` already render — they are 19
of the 19 sidecar-bearing artefacts.

**This is what makes the MVP question answerable.** "654 pages behind the
Publisher" reads as a rendering backlog; 51 documents plus 604 registry rows is
a different decision, and 604 of those are `category: Other` bulk entries that
no reader opens individually. The gap that matters for a SMART Guideline reader
is **51**, and 45 of those 51 are Requirements and CodeSystems.
