---
# folio-assistant-jut3
title: 'SMART-* VIA JUST-THE-DOCS: stop mounting IG Publisher HTML; render input/pages from post-processed JSON-LD + metadata through the Jekyll pipeline'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T19:10:00Z
updated_at: 2026-10-01T12:37:45Z
parent: folio-assistant-uhkv
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

## FULL PARITY — the owner's call, 2026-09-22

Asked with the decomposition above in hand and a recommendation to render the
70 conformance artefacts and leave the 604 registry rows as index rows. The
owner chose **all 674**. Recorded as a decision, with its cost, so the
reasoning does not have to be reconstructed from the diff.

**Built:** 676 pages — the index, **674 artefact pages** (one per artefact),
and **1 category page**.

### The category page exists because the owner's earlier ruling still holds

`INLINE_LIMIT` is 100, set 2026-09-21 after the first build put the index at
524 KB with one category 90 % of it. Full parity does not repeal that. So an
over-limit category now gets **its own page** rather than an inline table, and
the index links to it.

That block used to read *"None carries a DAK API sidecar, so none has an
artefact page; they are reachable from the IG's own `artifacts.html`."* **Both
halves stopped being true**, and a sentence sending a reader upstream for pages
this site publishes is worse than no sentence — `pb04` pointed at prose.

| | before | after |
|---|---|---|
| `index.md` | 48 001 B | **50 579 B** |
| `category/Other.md` | — | **413 084 B** |
| artefact pages | 19 | **674** |
| `docs/` total | ~90 KB | **3.2 MB** |

**The 413 KB page is the honest cost of the choice.** It is opt-in — a reader
clicks through to it — so the front page stays at 50 KB and the owner's
original complaint does not return. Said rather than buried.

### Four defects the change would have shipped, all caught

1. **674 pages, 19 links.** The index's row renderer read
   `a.dak ? link : plain`. Removing only the generation gate would have
   produced every page and linked a thirty-fifth of them.
2. **`pages.size - 1` counted artefact pages.** Right while the index was the
   only non-artefact page; wrong the moment a category page joined it — it
   reported **675 artefact pages over a corpus of 674**. Now counted from the
   page map by prefix.
3. **655 pages of four `*not published for this artefact*` rows.** The DAK
   table is worth a screen when there are sidecars and is noise otherwise. The
   absence is now one line — **stated**, not omitted, because a missing section
   reads as *nobody looked*.
4. **A `..` at a depth nothing tested.** A category page's links are
   `../artifact/…`; getting that wrong is exactly issue #824's defect — right
   on disk, 404 once built — one level down from where the existing assertions
   looked.

### The reachability invariant replaced a count

`hrefs.length === artifactFiles.length` cannot hold any more: the index links
70 of 674 and the `Other` page links the rest. Asserting the index alone would
now assert that the split did not happen.

So the **union** is asserted, in both directions — an artefact page nothing
links is as much a defect as a link to a page that is not there, and only the
second 404s loudly; the first just never gets visited. With a vacuity guard
that the split actually happened, since the union test would otherwise pass
over an empty category set.

**Falsified by planting each defect in the GENERATOR and regenerating**, which
is this test file's own convention:

| planted | result |
|---|---|
| category links lose the `..` | **2 fail** (and 606 tests vanish — the vacuity guard is what caught that) |
| index points at the category with a trailing slash | **1 fail** |
| one artefact gets no page | **3 fail** |
| restored | **4056 pass / 0 fail** |

### The two-oracle test survives, for a different reason

Neither `dak` nor `materialization.state` gates page generation any more. The
assertion stays because both still drive what a page **says** — the DAK section
and the materialization tag. The day they diverge, a page claims a sidecar for
something whose bytes are elsewhere.

`bun run gates` **122/122**, `bun test smart-trust/` **4056 pass / 0 fail**.

`docs:auto` had to be regenerated: its viewer index counts these pages, and
`gates` caught it stale at 122. The sweep's own `✗ 1 of 122` line is what said
so — the wrapper's exit code read 0.

### Verified on the BUILD — the one check a local run structurally cannot make

The category page's links are `../artifact/…`. On disk that string and a wrong
one are both just text; the difference appears only once Jekyll has emitted the
tree. Issue #824's second defect was exactly this, one level up, and it shipped.

Measured against the staging deploy on `origin/gh-pages`
(`STAGING/claude-determined-euler-gqhkk0/`, build `d2c27b2`):

| | |
|---|---|
| pages built under `smart-trust/` | **676** — 674 artefact + 1 category + 1 index |
| `../artifact/…` links on the built `category/Other.html` | **604** |
| ...resolving to a file that exists in the BUILT tree | **604** |
| ...that would 404 | **0** |
| built page size | 600 390 B |

Sample href, taken from the built HTML rather than from the generator:
`../artifact/Endpoint-GDHCNParticipantDID-ALB-All.html`.

**And the `loading` count was chased rather than waved through.** The page
carries 2 occurrences, which is the signature of this session's roast finding
#1 — the library visualiser that passed every upstream check and shipped as
224 chars of `loading…`. Both are the staging harness's own banner
(`— loading build details…`), and the control settles it: the canonical home
page carries **3**. Not that defect. Checked because the cost of assuming it
was fine is the exact failure this session spent a bean on.



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, and no holder recorded; the sessions that held theme C (rendered site) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.


_2026-09-29_ — **Re-parented `yj32` → `uhkv`** by subject, per todo-manager §"WHICH parent" (owner choice '1 2 3' on the LSI epic-filing proposal, bean ansc). Rendering the smart-* IGs through Jekyll is SMART-stack work; yj32 stays the interface epic.

## M2 re-measured 2026-10-01: upstream `input/pages` is now DETERMINED

Provenance: `WorldHealthOrganization/smart-trust` at `30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0` (2026-09-29), shallow anonymous clone. Session https://claude.ai/code/session_01DnFZtVpff4o7puqWazGvKN. The 2026-09-22 entry said *could not determine*; this replaces that with a number, and does not mean it was zero.

| | |
|---|---|
| narrative pages (`input/pagecontent/*.md`) | **42**, 4 506 lines |
| page tree | `sushi-config.yaml` `pages:`, nested 3 deep (Home / Business Requirements / Data Models and Exchange / …) |
| pages with **no** Liquid at all | **22** of 42 |
| Liquid tags used | `include` 54, `assign` 6, `unless` 6, `for` 1; **no** `sql`, **no** `[[[ ]]]` links |
| `include` targets | other pagecontent pages (~20, transclusion), `img.html` ×10, two PlantUML-generated SVGs (`input/images-source/*.plantuml`), and `list-structuremaps.xhtml` (×1, **Publisher-generated**, not in source) |
| `site.data` reads | `site.data.fhir.packageId` ×2, `site.data.info.exclude{xml,json,ttl}` (`downloads.md` only) |
| images | 45 png, 5 svg, plus docx/pdf/pptx downloads under `input/images/` |
| licence | `CC-BY-SA-3.0-IGO` (`sushi-config.yaml`) |

**What this says about feasibility.** The Liquid surface is small and almost entirely `include`. Of the Publisher-only inputs, only three need supplying from Publisher metadata:
- `site.data.fhir.*`, which the artefact index can provide;
- `site.data.info.*`;
- one generated fragment, `list-structuremaps.xhtml`.

Rendering 42 pages through just-the-docs is therefore a bounded job. The falsifier would have been heavy use of `sql` or `[[[ ]]]`, and it does not fire.

**The decision this exposes, which is the owner's:** where the 42 pages come from. The options are a committed snapshot (licence CC-BY-SA, attribution required), a submodule, or a fetch at build time. The repository boundary rule (*platform, not content*) applies to `smart-trust/` as a mock-up instance. Nothing is vendored until that is decided.

## 2026-10-01: narrative pages, a duplicate built and reverted

**What happened.** A round 2 built a second renderer for the 42 narrative pages (`ingest-ig-pages.ts`, `narrative-pages.ts`, a new graph kind `ig-page-sources`, and `smart-trust/docs/pages/`). It went in as `464df76` and was reverted in the next commit. **Bean `bamf` (#1670) and `u3cd` (#1701) already render the IG's narrative pages through just-the-docs**, as their own site at `/smart-trust/ig/` (`fhir-harness/scripts/build-ig-site.ts`, `stage-ig-sites.ts`). They also copy images, render the PlantUML diagrams and populate `site.data.fhir`. Nothing in this bean pointed at `bamf`, and nothing was searched before building. The duplicate was found when its pages failed staging's `check:duplicate-ids`: WHO's own source repeats `{#execute_rule}`, `{#get_valuesets_api}` and `routine_sync`, and `bamf`'s post-build `--dedupe-ids` already renames those.

**What was kept.** The owner's ruling is honoured through `bamf`. `fhir-artifact-index/menu.json` was re-ingested from `litlfred/smart-trust` at `30d55b36`, so `stage-ig-sites.ts`, which clones `menu.json`'s `source.of` at `source.ref`, now builds `/smart-trust/ig/` from the fork.

**Still true from round 2.** Two upstream defects worth fixing on the fork:
1. `{{PARTICIPANT_CODE}}` sits in prose in five pages, so the Publisher most likely renders it empty.
2. `feedback.md` derives `github.com/WorldHealthOrganization/trust`, but the repository is `smart-trust`.

**Done-when item 2** (`input/pages/` through just-the-docs with Publisher metadata) is met by `bamf`, not by this bean's work. The **parity checklist / MVP** call is the owner's, still open.

## Owner ruling 2026-10-01: branding means logos only

Asked how far *"just dont want branding"* reaches, with three options: logos only; no WHO identity at all; or colours only. The owner chose **1, logos only**.

- **No WHO logo** on any page. This is the generator's existing rule: *"until published under WHO, colour carries the identity and the wordmark is set in type"*.
- **WHO's colour theme stays.** That is `7h3u`'s `themes/upstream/who.css` (#1682).
- **The plain-text "WHO SMART Trust" name in titles stays.**

Nothing changes in the rendered output. Recorded so the next agent doesn't re-ask.

## 2026-10-01: both upstream defects fixed on the fork

The two defects are fixed in https://github.com/litlfred/smart-trust/pull/2 (draft, `69f0662`), on the owner's instruction:
- `{{PARTICIPANT_CODE}}` is replaced by `**$participant**`;
- the feedback link now prepends `smart-`.

SUSHI could not run in that session, because `packages.fhir.org` was unreachable. On the owner's choice, the fork's `fhirbuild` CI runs SUSHI and the IG Publisher on the PR, and nothing merges until it is green. Once it merges, re-ingest `menu.json` at the new fork commit so `/smart-trust/ig/` picks up the fix.

## 2026-10-01: fork fix merged; staging re-pinned

https://github.com/litlfred/smart-trust/pull/2 merged as `25771f6` after both IG builds went green. `menu.json` was re-ingested at `25771f6`, so `/smart-trust/ig/` now builds with both defects fixed.

## Parity checklist, measured (2026-10-01)

The P0 rule from the skill (`ig-publisher-reduction`, owner approval 2026-09-30) is a **strict** page-set match: every page the Publisher renders counts, and one we cannot render is a gap, not an exception.

**Provenance**
- **Publisher side:** `litlfred/smart-trust` `gh-pages` root, a full IG Publisher build of `main` at `25771f6`: 3,548 root `.html` pages, file tree read without blobs.
- **Our side:** `folio-assistant` `gh-pages` `STAGING/claude-wonderful-curie-gbfeuy/smart-trust/`: 728 pages. That is 674 artefact pages, 1 index, 1 category page, 5 menu sections, and 47 under `ig/` (`bamf`: 42 narrative pages plus 5 menu sections).

| page kind (Publisher) | Publisher | ours | gap | what it needs |
|---|---:|---:|---:|---|
| narrative page (`pages:` tree) | 35 | 35 | **0** | done (`bamf`) |
| artefact main page | 673 | 673 | **0** | done (`gen-smart-trust-pages`) |
| artefact not in our index | 4 | 0 | 4 | **index is stale** (read 2026-09-21; the `IRL` participant was added since). Re-ingest, no new rendering. |
| representation view `.json/.xml/.ttl.html` | 2,004 | 0 | 2,004 | the resource bytes. 655 of 674 are `referenced`, not held, so this needs materialisation, and P2 (which representations survive) decides it first |
| `.change.history` tab | 668 | 0 | 668 | per-artefact history. Not in any export the index reads, so **data-limited** until the fork or AST exports it |
| `-testing` tab | 69 | 0 | 69 | test-plan data per artefact; source not yet identified |
| profile tabs: `-definitions`, `-mappings`, `-examples`, `.profile.json/xml/ttl`, `.profile.history` | 35 | 0 | 35 | StructureDefinition snapshots for the 5 profiles, from the package (materialisation) |
| DAK `.schema.json` / `.jsonld` views (smart-base post-processing) | 33 | 0 | 33 | the DAK post-processing outputs, already produced by the fork's CI |
| IG-level generated: `artifacts`, `toc`, `qa`, `qa-dep`, `qa-ipreview`, `qa-tx`, `qa-txservers`, `qa.min`, `searchform`, `history`, `smart.liquid` | 11 | 0 (our index is an `artifacts` equivalent at another URL) | 11 | `artifacts` and `toc` are derivable from the index and the page tree; `qa*` need the Publisher's QA output; `searchform` needs a search index; `history` needs the package history |
| **total** | **3,548** | **708 matched** | **2,840** | |

**Reading it**
- The two page kinds a reader reads, narrative pages and artefact main pages, are at **full parity**.
- 2,004 of the 2,840 gaps (71 %) are representation views. They wait on P2's decision about which representations survive, and are not rendering work.
- The next biggest gap, 668 change-history tabs, is **data-limited**: no export carries that history. By the skill's own rule it belongs on the fork's ask list rather than here.
- **Cheap and in reach now:** 4 stale artefacts (re-ingest), `artifacts`/`toc` (derivable), and 33 DAK views (outputs already exist).

**The MVP call against this table is the owner's**, and so is whether representation views wait for P2.

## 2026-10-01: parity step 1 — index re-ingested from the fork

`ingest:ig` was re-run over `litlfred/smart-trust` `gh-pages` (`9bd9643`, the deploy of `main` `25771f6`), with `--base https://litlfred.github.io/smart-trust`, following the owner's ruling that the fork is the source.

- **Result:** 678 artefacts. The 4 `IRL` artefacts were added and none removed. The DAK sidecars still cover 19 materialised artefacts; their only change is the expansion timestamp.
- **Changed fields:** `materialization.provenance.upstream` now points at the fork; one upstream description changed ("test city" became "TEST CITY").
- **Checks:** `ingest:ig:check` passes against that checkout, and `check:materialized-fixity` verifies 272 artefacts with 0 edited.
- **Parity gap closed:** "artefact not in our index" goes from 4 to 0.
- **Lesson:** the first attempt skipped `gh-pages`' subfolders (`schemas/`, `openapi/`) and silently dropped every DAK schema sidecar. The ingest reported it as a thinner index (`schema=0`), and it was caught by comparing with the previous counts.

## 2026-10-01: parity step 2 — `toc` and `artifacts` generated

`build-ig-site.ts` now writes the two Publisher-generated IG-level pages from data the build already holds, and reports them under `generated`, separately from source pages.

- **`toc`:** the `pages:` tree, nested. A page that neither exists nor is generated is listed as text, not as a link.
- **`artifacts`:** every artefact from the instance's index, grouped by category, linking to `../artifact/<stem>.html`. It is written only when the instance holds both an index and `docs/artifact/` (`stage-ig-sites.ts` `artifactsFor`). It takes the menu's "Artifact Index" slot.
- **Shared naming rule:** the page-name rule moved to `artifactPageName` in `fhir-artifact-index.ts`, so the writer (`gen-smart-trust-pages`) and this linker cannot disagree.
- **Verified** on a local stage of the fork at `25771f6`: 678 of 678 artefact links and 36 of 36 toc links resolve, and both pages parse as strict Liquid.
- **Parity:** the IG-level generated pages go from 11 missing to 9 (`qa*`, `searchform` and `history` remain).

## 2026-10-01: phased-transition review — P0 restatement (APPROVED, see below)

**The conflict.** Approved P0 says *"strictly: a page the Publisher renders from data it does not export is a gap, not an exception"*. But:
- P2 (also approved) drops XML and Turtle, so 1,331 representation-view pages can never be P0 matches; under P2 they are refusals.
- The skill's own "not settled" section says a data-limited page kind *"belongs on the fork's ask rather than on the parity list"*, which covers the 668 change-history tabs.

As written, P0 cannot pass before P2 and the fork are done, and that inverts the phase order.

**Proposed wording for P0's page-set criterion.** Every page the Publisher renders for the IG is accounted for as **exactly one** of:
- **matched:** this site renders it;
- **refused under P2:** an XML or Turtle representation view, recorded in P2's refusal list;
- **on the fork's ask:** rendered from data the Publisher does not export, listed with the data it needs.

A page in none of the three is a **gap**, and P0 passes only with zero gaps. Strictness is kept, since nothing is silently excepted; it just stops counting the other phases' work as P0's.

The skill (`ig-publisher-reduction.md`) is **not edited** until the owner approves this wording.

**Opened in the same review:** `ha24` (P1), `ntyj` (P2) and `h3tx` (P4). P1 and P2 are blocked by `qrnz` (second IG, needed for the combined view); P4 is blocked by `a9tx`.

## Owner ruling 2026-10-01: every phase renders equivalent to the standard IG render

In the owner's words: *"each phase needs to render equivalent to existing IG standard render"*.

This is an invariant across **all** phases, not just P0's exit criterion. Whatever a phase changes in the pipeline, its output must stay equivalent to the IG Publisher's standard render of the same IG. The measured reference is `jut3`'s parity table: the Publisher's page set, by page kind.

**Open tension, put to the owner:** P2 as approved drops XML/Turtle ("recorded as a refusal"). Under this invariant, a refused representation is a difference from the standard render.

## Owner ruling 2026-10-01: P2 kept as approved

In the owner's words: *"Keep P2 as approved: drop XML and Turtle, and treat the refusal record as an accepted"*, the option offered as *"…accepted, documented difference from the standard render"*.

- XML and Turtle representation views (1,331 pages on smart-trust) are **not rendered**.
- Each one is recorded as a refusal. That record is the **accepted, documented exception** to the cross-phase rule that every phase renders equivalent to the standard IG render.
- JSON views remain in scope (673 pages).

_2026-10-01T12:16:24Z_ — Claimed by claude/wonderful-curie-gbfeuy — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Owner ruling 2026-10-01: P0 restatement approved

The owner answered *"1y"* to the restatement above: every Publisher page is
**matched**, **refused under P2**, or **on the fork's ask**, and P0 passes with
zero pages in none of them. `ig-publisher-reduction`'s P0 row now carries it,
with the reason under "Approved by the owner".

Against the parity table: narrative (35) and artefact main pages (673) are
matched, and `toc` and `artifacts` are matched as of PR #1766. XML/TTL views
(1,331) are P2 refusals once `ntyj` records them. Change history (668) goes on
the fork's ask. Still to place: JSON views (673), DAK views (33), profile tabs
(35), `-testing` (69), and the other IG-level pages (9).

## 2026-10-01: DAK view pages — 33 rendered, 8 equivalent, two upstream divergences found

`gen-smart-trust-pages` now writes the Publisher's `<Name>.schema.json.html`
(19) and `<Name>.jsonld.html` (14). Each is the raw file, published beside
the page, plus a page that is `smart-trust/scripts/templates/dak-view.liquid`
over `page.dak`, computed by `smart-trust/scripts/dak-views.ts`. The work is in
smart-trust, not fhir-harness, because a DAK is WHO's. The displayed text is
`JSON.stringify(parsed, null, 2)`, as the Publisher's page fetches and shows
it. That is not always the file's own bytes: JavaScript puts integer-like keys
first, which affects 3 of the 33 files.

**Checked against the Publisher** (Jekyll build vs the fork's `gh-pages` at
`9bd9643`): **8 of 33 equivalent.** The other 25 differ for reasons outside
this renderer:

1. **Two different schemas per ValueSet or model upstream.** The view page
   fetches the ROOT `<Name>.schema.json`, written by `smart-base`'s current
   `generate_valueset_schemas.py` (`e151a4d`): values are Coding objects with
   `system` and `code`. `schemas/<Name>.schema.json`, which `dak-api.html`
   links and this index holds, is the older format, where values are IRI
   strings. Both come from the same deploy and carry the same `$id`. All 19
   schema pages show different text for this reason.
2. **The Publisher's tab bars are inconsistent**, which comes from the DAK
   post-processing that injects the tabs:
   - 12 pages list JSON Schema / JSON-LD twice;
   - 8 schema pages have no JSON-LD tab, though their JSON-LD page links back
     to them;
   - the 5 StructureDefinition pages carry SD tabs (`Content`,
     `Detailed Descriptions`, `Mappings`) instead of `Narrative Content`.

Ours renders one consistent tab bar. Which schema copy to show, and whether
to reproduce the tab defects, are the owner's calls.

## Owner ruling 2026-10-01: show the root schema; DAK views now equivalent

The owner answered *"do 1"*: the view pages show the root copy. The ingest
now reads every schema, displays and OpenAPI sidecar from the root first and
falls back to `schemas/`. It reports each pair that differs; on the fork that
is all 52 pairs. The fork's own `dak-api.html` links the root copies too, so
`schemas/` is the stale one.

After re-ingest, with the file now fetched client-side (bean `680p`), **all 33
DAK view pages display exactly what the Publisher's pages display**
(Chromium, via Playwright). The tab-bar differences remain and are the second
decision.

## 2026-10-01: `dak-api.html` replicated as its own page

The owner asked to *"replicate dak-api.html seperately"*. The page lives at
`/smart-trust/dak-api.html`.

- **Ingest.** The hub is the region of the published `dak-api.html` between
  its `DAK_API_HUB_START`/`END` markers, which smart-base's
  `generate_dak_api_hub.py` writes after the Publisher has run. The IG's source
  page holds only a placeholder. The ingest keeps the fragment verbatim as
  `fhir-artifact-index/dak/dak-api-hub.html` and records it as `dakApiHub`.
- **Page.** `templates/ig-pages/dak-api.liquid` plus `dak-hub.js`. The loader
  fetches the fragment from the served graph and re-points each link through a
  map `dakHubLinks` computes: artefact pages go under `artifact/`, held DAK
  files to the served graph, and the rest to the Publisher's copy.
- **Checked in Chromium:** the text is identical to the Publisher's hub
  (8,735 characters). All 53 on-site links resolve; 9 go to the Publisher.
  Those 9 are `openapi/index.html`, the enumeration schemas, and three pages
  the Publisher never wrote (`ValueSets-enumeration.html`,
  `LogicalModels-enumeration.html`, `LogicalModels.html`). Those three are
  upstream dead links, kept visibly as the Publisher's.

**Parity correction.** The parity table counted the IG site's narrative
`dak-api` page as matched. It is not: our `/smart-trust/ig/dak-api.html`
renders the source page, which holds only the `<!-- DAK_API_CONTENT -->`
placeholder, and lacks the hub. That page is now a gap for P0, to be closed
by pointing it at the replica or by injecting the hub as a DAK overlay. The
overlay belongs in smart-base, not fhir-harness.

## 2026-10-01: the DAK API section on artefact pages — 14 of 14 equivalent

smart-base's post-processing (`_generate_html_content`) appends "API
Information" and "Endpoints" to each ValueSet's Publisher page. It builds them
from the ValueSet's OpenAPI sidecar, and it skips logical models.

- **Our version.** The artefact page carries a host element, and
  `dak-openapi.js` builds the same elements, classes, text, fallbacks and
  style in the browser, from the OpenAPI file in the served graph (bean
  `680p`).
- **Checked in Chromium:** all 14 Publisher pages carrying the section show
  identical displayed text and element structure. A test pins the page set to
  exactly the ValueSets with a held OpenAPI file.
- **The owner's v1.7.2 PDF** (`StructureDefinition-COSEHeader`) shows the
  section, plus a "Schema Definition" block, on a StructureDefinition page.
  The current generator omits "Schema Definition" on purpose ("intentionally
  omitted … to avoid duplicate content") and skips logical models. So the
  fork's 1.8.0 render, with no section on the 5 StructureDefinition pages, is
  current upstream behaviour, and ours matches it.
- **A whitespace trap, met and fixed.** The template is appended to an
  artefact page. A whitespace-stripping opening tag glued its `<div>` onto the
  page's last table row, and kramdown printed it as text. This template
  therefore opens with an unstripped comment tag; the
  README reader accepts both forms.

## 2026-10-01: the IG site's `dak-api` page, and 672 JSON views — both equivalent

The owner chose `1 2 3`: close the IG site's `dak-api` gap, then build the JSON
views, then write the P2 refusal record.

**1. The IG site's `dak-api` page.** Its source holds only `<!-- DAK_API_CONTENT -->`.
- `build-ig-site` gained a **generic** `fills` option: content a post-processing step writes at a marker. A fill puts its body there and adds its data to the page's front matter. It knows a marker and a template, never whose post-processing wrote them, and it reports fills it could not place.
- `stage-ig-sites` passes the DAK hub fill, built by `dakHubFill` in `dak-views.ts`.
- The page is now its own source plus the hub, which is what the Publisher published.
- **Checked in Chromium** on a staged IG site: the source intro is present, the hub text is identical to the Publisher's, and all 53 links resolve.
- just-the-docs sets `h4` in uppercase and the hub's card titles are `h4`, so a style rule scoped to the hub restores the Publisher's case.

**2. JSON views: 672 of 672 equivalent.**
- The Publisher writes `<Name>.json.html` for every artefact except the ImplementationGuide and StructureDefinitions, which get `.profile.json.html`.
- Its page fetches `<Name>.json` and shows `JSON.stringify(parsed, null, 2)`. Ours fetches the IG's **`package.tgz`, held in the served graph** (228 KB; `--materialize-package`, new index field `package`). The browser gunzips it, walks the tar and reads the resource (`resource-views.ts`, `json-view.liquid`, `resource-json.js`), rather than copying 672 resource files. 677 of the 678 package resources are JSON-equal to the published `.json`.
- **Checked in Chromium:** all 672 show identical JSON, status line and heading.
- The Publisher's status line uses `colsd` for drafts and `colsi` otherwise, with the same text.
- **Not reproduced:** all 672 Publisher headings start with `": "`, an empty type label in its template. Ours drop it, by the same rule as the tab bars. Recorded with the other upstream defects in bean `g4oc`.
- The DAK view pages' JSON tab now points to this site's JSON view, but only where that page is written; smart-base holds no package, so its pages are unchanged.

## 2026-10-01: change history, testing and profile tabs — 756 of 756 equivalent (10 left)

The owner chose `1 2 3` again: change history, profile tabs, testing tabs.

**Change history is not data-limited, so the parity table was wrong.** All
672 Publisher `.change.history.html` pages on smart-trust state no history,
just a heading and one sentence. Measured on all 672: the heading is
`name ?? title ?? id`, then " - Change History"; the sentence is
`History of changes for <id> .`. They are rendered now, and they come off the
fork's ask.

**The tab pages, generic in `resource-views.ts`.** The resource facts the
Publisher states (`name`, `experimental`, `kind`, `status`, `date`) are read at
generation time from the held `package.tgz`, the same copy the JSON views
fetch. One template, `tab-page.liquid`, renders them. Each page states only
what the Publisher's does:
- **`-testing`** is written only while the IG holds no TestPlan and no
  TestScript, because otherwise the Publisher's page would list them.
- **`-examples`** is written only while no resource claims the model in
  `meta.profile`.

**Checked against the fork's `gh-pages`** (Jekyll build, main-content text):

| page kind | pages | equivalent |
|---|---:|---:|
| `.change.history` | 672 | 672 |
| `-testing` | 69 | 69 |
| logical model `.profile.history` | 5 | 5 |
| logical model `-examples` | 5 | 5 |
| logical model `.profile.json` (Chromium, JSON + status + heading) | 5 | 5 |

**Left:** `-definitions` and `-mappings` for the 5 logical models (10 pages).
They are the Publisher's element tables (Key / Differential / Snapshot)
rendered from each StructureDefinition's snapshot, which is real rendering
work rather than a sentence. That is the next slice.

## Owner ruling 2026-10-02: the Publisher's QA output is left as is

Owner, on converting `qa.xml` to JSON for a client-side QA page: *"fhir qa.xml? other things rely on it downstream... outside of this project. leave as is."*

- **`qa.xml` is a FHIR Bundle of OperationOutcomes, and consumers outside this project read it.** It is not one of the per-artefact XML representations P2 refuses. The P2 record (`p2-refusals.qa-results.json`) does not list it and must not.
- **The QA files are the Publisher's own, so this pipeline does not re-render, convert or drop them.** That covers `qa.html`, `qa.min.html`, `qa.xml`, `qa.json`, `qa.txt`, `qa.compare.txt`, `qa-tx`, `qa-txservers`, `qa-dep` and `qa-ipreview`. Where a Publisher run exists, they are published from its output byte for byte.
- **Parity table:** the `qa*` pages move from "missing" to **passed through from the Publisher, by owner ruling**. They are not a render this pipeline owes.
- **Still open:** `searchform` and `history` among the IG-level pages.
