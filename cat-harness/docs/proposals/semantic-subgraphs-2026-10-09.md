---
title: "Semantic subgraphs: site chrome, themes, and concern groups a downstream can mount"
kind: proposal
summary: >-
  Owner, 2026-10-09, after who-iris's standalone site could not be composed without the whole of cat-harness's 97 MB docs graph: make the just-the-docs CHROME its own subgraph, make the THEMES beyond the light/dark/accessibility base their own subgraph, and carry the eight concern groups (`9umr`) through docs and code so a downstream mounts a concern, not a monolith. Measured: chrome is 4 generic includes, 8 CSS and 11 JS files and the theme keys of one config, referenced by path from ~130 files; the themes are 14 entries in one TypeScript list plus 45 art declarations (5.1 MB). A mount can name only top-level directory ids today. Four layout options for the concern groups; C is recommended: kind-first layout plus a TWO-PHASE mount (hydrated metadata of any named subgraph, review, then materialize a chosen set), which the owner described and which is three gaps from today (Tools have no hydrated index; mounts take no hydrated or nested ids; materialization takes whole top-level directories). Five owner decisions.
---

# Semantic subgraphs: site chrome, themes, and concern groups a downstream can mount

**Status: proposal, ruled 2026-10-09.** Slices 1 and 2 (chrome and themes),
Option A + C for slice 3, the concern names, and D1–D4 are all decided (the
two answer tables below). The `nn8e` follow-up is filed as work item `mo75` (G1–G3 and the concern names). Building
starts with stage 1.

> ## Rulings, owner, 2026-10-09
>
> | ruling | words |
> |---|---|
> | the chrome is a subgraph | *"go ahead with the cat-harness chrome subgraph"* |
> | the themes are a subgraph | *"put the themes (beyond light and dark) as their own seperate subgraph"* |
> | semantic subgraphs are wanted | *"can we further breakdown into semantic subgraphs? like doc-ingestion, SDLC, publication for docs and skills/tools and such? please reivew and propose some organizational options"* |

> ## Answers, owner, 2026-10-09 (second round)
>
> | | answer | what it settles |
> |---|---|---|
> | **Option A** | *"extend the current kind-first layout into docs/ and scripts/"* | ruled: `docs/<group>/` and `scripts/<group>/` join `skills/<group>/` and `processes/<group>/` |
> | **Option B** | *"n.... but should be able to name "sdcl" at top level to be list of ["docs/sdlc", "skills/sdlc"] or so..."* | concern-first DIRECTORIES are refused; a concern NAME at the top level, standing for the list of its kind-first members, is wanted (§4, "A concern is a name for a list") |
> | **Option C** | *"not sure what you mean"*, then after the plain-terms explanation: *"C y"* | ruled: the two-phase mount (hydrated metadata, review, a chosen set); G1–G3 are the work |
> | **D1** | *"explain more"*, then: *"parse-equal"* | ruled: the composed `_config.yml` must parse to the same settings; every other composed file stays byte-identical |
> | **D2** | *"y (or better a docs/ css package)"* | the harness pages' own JS/CSS stay in `docs/`, preferably as a declared package there rather than loose files in `assets/` |
> | **D3** | *"y"* | the base light/dark + high-contrast pair live in `site-chrome/` |
> | **D4** | *"ninth group"* | `publication` becomes the ninth concern group, a `9umr` amendment (§4, "The ninth group") |

1. TOC
{:toc}

---

## 0. Why now: a downstream could not build its own site

who-iris left `litlfred/folio-assistant` (cutover `g8jp`) without kg-separation
stages 7 and 12: nothing published `litlfred.github.io/who-iris/`, because
`/who-iris/` had only ever been a mount inside folio-assistant's
`docs-site.yml` build. Building it from who-iris's own repository with the
harness's tools found two walls, both measured 2026-10-09:

1. **`compose-docs.ts` takes all of `cat-harness/docs/` as the base layer.**
   `docsLayers` (`scripts/compose-docs.ts:174`) reads every `docs`-kind entry
   of `cat-harness.json`; there is one, `docs/`, so a who-iris build composed
   **3,456 files** of the harness's own pages to get a theme. The just-the-docs
   chrome is inside that directory and declared by nothing.
2. **A downstream mount can name only top-level directory ids.**
   `remote-mount.ts` builds `byId` from the raw top-level `directories`
   (`:358`) and refuses any other id at plan time (`:379–387`); it never calls
   `resolveDirectories`/`promoteFromWithin`, so a nested entry — `proposals`
   in `docs/docs.json`, `voices` in `skills/skills.json`, `openapi-scripts` in
   `openapi/graph.json` — cannot be mounted by name. Nested content arrives
   only with its whole parent.

So "mount the part you need" fails twice: the part is not declared, and a
declared part could not be named. Each slice below removes one wall.

## 1. What is there (measured 2026-10-09, `main` at `6ea9242`)

| concern of the corpus | where it is | grouped by concern today? |
|---|---|---|
| skills | `skills/<area>/<area>-core/…` — 14 areas, ~290 files | yes, nearly: areas ≈ the eight groups (`authoring` is the baselined exception, due under `content`) |
| processes | `processes/<group>/` — sdlc 29, kg 14, process 13, library 10, ui 4, content 3 | **yes** — `processes/processes.json` is `concern-groups/v1` |
| docs | `docs/` — 921 asset files (42 MB), ~170 authored pages in `doc-group`s, the rest generated | **no** — `docs.json` declares `doc-group`s (start, concepts, guides, process, fhir), not concern groups |
| code | `scripts/` 437 entries, `cat-harness-tools/scripts/` 154 | **no** — flat; by name ~40 ingestion, ~45 sdlc, ~60 publication, ~45 kg, ~45 QA, ~18 translation, ~7 theming |
| chrome | `docs/_config.yml`, `_includes/`, `_data/`, `assets/{css,js}`, `Gemfile` | not declared at all |
| themes | `schemas/themes.ts` (14 entries in `RAW`), `scripts/gen-themes-css.ts` → `docs/assets/css/themes.css`, 45 `landing-*` art declarations in `cat-harness.json` (5.1 MB) | not declared as a graph; who-iris already declares its own `themes/` as a `themes`-kind directory |

**The vocabulary already exists.** The eight concern groups are ruled
(`9umr`) and defined once, in `code-lists/concern-group.json`;
[Placement by concern group](placement-concern-groups-2026-10-01.html) §1.1
settles *concern is the sub-subgraph, layer is the instance*. The terms in the
owner's question map onto it without a new word:

| asked for | existing group | its definition |
|---|---|---|
| doc-ingestion | `library` | how a source is acquired, uploaded, described by metadata in the KG, and held in `library/` |
| SDLC | `sdlc` | how a change is planned, tracked, verified and shipped |
| publication | `ui` | how the corpus is rendered, **published** and presented: the docs site, viewers, boards and themes |
| skills / tools | `tools` | how a capability becomes a Tool node and an MCP service |

Whether `publication` deserves to be split out of `ui` is decision **D4**.

## 2. Slice 1 — the site chrome, `site-chrome/`

### 2.1 What is chrome, and what only looks like it

The survey read every file under `docs/_includes/` and `docs/_data/`. The
line is not the directory:

| file | verdict |
|---|---|
| `_includes/head_custom.html`, `footer_custom.html`, `nav_footer_custom.html`, `mermaid_config.js` | **chrome** — just-the-docs overrides any site uses |
| `assets/css/*` (8), `assets/js/*` (11 + `vendor/`) | **chrome**, except `work-plan.*`, `process-index.js`, `slice-sqlite*` and `kg-render.js`, which serve harness pages (decision **D2**) |
| `_config.yml`: `remote_theme`, `search_enabled`, `heading_anchors`, `color_scheme`, `mermaid`, `plugins`, Gemfile excludes | **chrome** |
| `_config.yml`: `title`, `description`, `baseurl: /folio-assistant`, `url`, `footer_content`, `keep_files`, the 30-odd `defaults` placing harness sections in the nav | **the harness's site identity and nav** — stays in `docs/` |
| `_includes/title.html`, `landing.html`, `harness_details.html` | harness templates reading `_data` — stay |
| `_includes/generated/*` (navbar, todo listing) | generated harness output — stays |
| `_data/*` (all six: `harness.json`, `instance-themes.json`, `stickies.json`, `node-kinds.json`, `translations.json`, `translation-qa.json`) | generated harness data — stays (`instance-themes.json` goes to slice 2) |

### 2.2 The shape

- A new top-level directory **`site-chrome/`**, declared in `cat-harness.json`
  with graph typology `docs` and concern `ui`, holding exactly the chrome rows
  above in their Jekyll-relative places (`site-chrome/_includes/…`,
  `site-chrome/assets/css/…`, `site-chrome/_config.yml`, `site-chrome/Gemfile`).
- **Top-level, not nested in `docs/docs.json`**, because of wall 2: until the
  mount resolves nested ids (slice 3), only a top-level id is mountable.
- `nav_footer_custom.html` includes the generated navbar; the chrome carries an
  **empty `_includes/generated/navbar-footer.html`** that `docs/` overrides, so
  a site with no harness pages still builds instead of failing on a missing
  include.
- `compose-docs` already composes several `docs`-kind layers in declaration
  order, later wins, with `_config.yml` merged (overlay keys win, objects
  merge, lists replace — the owner's rule of 2026-09-21). Declaring
  `site-chrome` **before** `docs` makes it the base and `docs/` its first
  overlay. No new mechanism.
- A downstream mounts `cat-harness` with
  `overrides: { "cat-harness": { directories: ["site-chrome", "schemas", "cat-harness-scripts", …] } }`
  and omits `docs`. `docsLayers` reports the absent `docs` layer as `missing`
  rather than failing; that is the path who-iris needs.

### 2.3 What it costs, measured

Files naming a chrome path today, across cat-harness, cat-harness-tools and
folio-assistant-core:

| path | files (tests) |
|---|---|
| `docs/_includes/head_custom` | 16 (5) |
| `docs/_includes/footer_custom` | 10 (2) |
| `docs/_includes/nav_footer_custom` | 7 (0) |
| `docs/_includes/mermaid_config` | 2 (0) |
| `docs/assets/css` | 23 (4) |
| `docs/assets/js` | 60 (5) |
| `docs/_config.yml` | 12 (1) |
| `docs/Gemfile` | 2 (1) |

Plus folio-assistant's `docs-site.yml`, `preview-site.sh`, and the generators
that WRITE into `assets/css` (`gen-themes-css`, `gen-avatars-css`,
`gen-navbar-geometry-css`). A path a script composes rather than spells will
not show in that count; `check:stale-paths` and `check:declared-paths` are the
net.

**The one property that must hold:** the tree `compose-docs --out` produces for
folio-assistant is the same before and after, file for file. `_config.yml` is
the exception that has to be argued: once two layers both carry one, the
merge round-trips YAML and the bytes change (comments go). The test is
**parse equality** of the composed config, plus byte identity of every other
file. If parse equality is not good enough — the published config is read by
a person — the alternative is that `docs/_config.yml` keeps its full content
and only a downstream's build merges (decision **D1**).

## 3. Slice 2 — the themes, `themes/`

### 3.1 The line: base versus theme

"Beyond light and dark" draws the line here:

| stays with the chrome (the BASE) | becomes the `themes` subgraph |
|---|---|
| just-the-docs `color_scheme` light/dark, which every page needs | `pale-sage`, `pale-sage-fade`, `dusty-carolina`, `dusty-carolina-fade` |
| `high-contrast-light`, `high-contrast-dark` — the owner's *"whatever needed accessibility"* (2026-09-19); a site that mounts no themes must still meet WCAG AA, so these are base, not decoration | `grumpy-cat`, `grumpy-cyborg-agents`, `bootstrap`, `operations` |
| | `engineer`, `library`, `analyst`, `architecture`, with their 45 `landing-*` art declarations (5.1 MB) |
| | the generated `themes.css` and `_data/instance-themes.json` |

### 3.2 The shape

- A new top-level directory **`themes/`** of graph typology `themes` (the kind
  exists; who-iris's `themes/` is the precedent), concern `ui`.
- The `RAW` list leaves `schemas/themes.ts` for **one `folio-theme` node per
  theme** in `themes/`, each beside its art. `schemas/theme.ts` (the SCHEMA)
  stays in `schemas/`; only the data moves. That also answers a standing
  question in `schemas/themes.ts` — it is tagged `@graphNode schema` while
  holding data, not a schema.
- The base pair stays code in `schemas/` (or in `site-chrome/`, decision
  **D3**), so `themeById` and `DEFAULT_THEME_ID` resolve with no `themes/`
  mounted.
- **The default is the open point.** `DEFAULT_THEME_ID` is `pale-sage`, the
  owner's pick to match the staging bar (confirmed on PR #405's preview,
  2026-09-19). Under this split pale-sage is a theme, not base. Proposed: the
  default is DECLARED by the `themes` subgraph and FALLS BACK to the base
  light/dark when it is not mounted, so folio-assistant's default is unchanged
  and who-iris (which declares its own themes) never needs cat-harness's.
- Readers to repoint: `gen-themes-css.ts`, `render-theme-sheet.ts`,
  `gen-docs-pages.ts`, `tools/index.ts`, `partition/instance-rules.ts`, and
  core's `scripts/platform.ts` re-export (16 files name the module in all,
  including generated indexes).

## 4. Slice 3 — concern groups through docs and code: four options

The goal the owner named: a downstream mounts **a concern** — "publication",
"SDLC", "doc ingestion" — across every kind (its skills, processes, docs,
code), not a whole harness and not a hand-made list of directories.

### Option A — kind-first, concern-second, everywhere (extend `9umr` as ruled)

`docs/<group>/`, `scripts/<group>/` and `cat-harness-tools/scripts/<group>/`
join `skills/<group>/` and `processes/<group>/`, each declared through
`concern-groups/v1` the way `processes/processes.json` already is.

- **For:** it is the ruled direction (§1.1 of the concern-groups proposal) and
  PR9 there (*"docs pages follow their subject"*) already plans the docs half.
- **Against:** it does nothing for mounting on its own — every group directory
  is NESTED, which is wall 2. And it is the largest move of code paths:
  ~430 scripts re-homed, every `bun run cat-harness/scripts/x.ts` invocation
  rewritten.

### Option B — concern-first top-level directories

`ui/{skills,processes,docs,scripts}`, `sdlc/{…}`, and so on, each a top-level
directory of graph typology `cat-harness` with a `graph.json` declaring its
kinds from within — the shape `openapi/` already has.

- **For:** mountable today by top-level id (`overrides.directories: ["ui"]`),
  and a concern is one directory, which is what "a semantic subgraph" sounds
  like.
- **Against:** it **reverses** the `9umr`/`1g4s` ruling that the KIND is the
  first path segment, so every kind's readers change, and `skills/` and
  `processes/` move again having just been grouped.

### Option C — Option A's layout, plus a two-phase mount: hydrated first, then a chosen set (recommended)

**In plain terms.** Today a downstream that wants anything from cat-harness
gets a whole top-level folder (all of `docs/`, all of `skills/`) as files.
Option C lets it ask in two steps instead: first *"tell me what is in
`skills/sdlc` and `tools/`"* and receive only the descriptions (one JSON-LD
file each, no code), then *"give me these three Tools and these two skills"*
and receive only those files, plus whatever code those Tools import. It is
a change to how things are FETCHED, and it works with Option A's layout; it
is not a third way of arranging folders.

> **Revised 2026-10-09** on the owner's correction: *"i thought we could mount
> unhydrated and mount hydrated on (sub-\*)graphs .... so you can do a workflow
> like 'load the tools/skills metadata, review the skills description and then
> materialize a set of Tools'"*. The first draft of this option was a
> `concerns: [...]` selector. A selector chooses by LABEL; the owner's workflow
> chooses by READING, and reading needs the metadata to arrive first. The
> selector survives as a convenience in step 2.

Keep the kind-first layout, and make a mount two-phase, the way a subscription
already is:

1. **Hydrated: the metadata of any named subgraph, nested or not.** The
   downstream takes `index.hydrated.jsonld` for `skills/`, `skills/sdlc`,
   `tools/` or `docs/proposals` — every node inline, typed, labelled and
   described, payloads as pointers. Nothing executable arrives, so nothing has
   to load.
2. **Review.** A person or an agent reads the descriptions and chooses: these
   six skills, these three Tools, this docs group.
3. **Materialized: exactly the chosen set**, plus its **import closure** for
   code (below). The mount plan names the nodes or nested subgraphs that were
   chosen; the lock (`index.lock.json`) records what they resolved to, as it
   already does for directories. `concerns: ["ui"]` is shorthand for "every
   member of that group", for a downstream that does not need to read first.

**What already exists, measured 2026-10-09** (work items `c1m4`, `fnx4`, `whlc`,
`nn8e` on `cat/cat-harness/beans`):

| step | for a SUBSCRIPTION (you read their content) | for a MOUNT (your code imports theirs) |
|---|---|---|
| 1 hydrated, nested subgraph | **exists** — `kg:materialize --nodes <sub> <path>` fetches `<docs>/subgraph/<HARNESS>/<path>/index.hydrated.jsonld`, validated against `SubgraphHydratedSchema` (`c1m4`, completed) | **missing** — named in `nn8e`'s done-when as a follow-up ("remote BRANCH mount of other repos' named subgraphs, hydrated vs not") and **never filed as a work item** |
| …for Tools | **missing** — `gen-subgraph-jsonld` publishes subgraphs for `kgDirectories(instance)`: `skills/`, `scenarios/`, `processes/` (170 hydrated files across layers today). `tools/` is not among them, so there is no Tools metadata to load | missing, as above |
| 3 materialize a chosen set | **partly** — `kg:materialize <sub> <subgraph>` copies a whole TOP-LEVEL declared directory through the five gates (`declaredDirectories` reads the raw top level); not a node set, not a nested subgraph | **missing** — `remote-mount.ts` takes top-level ids only (wall 2) |

So the owner's workflow is three gaps, not a new mechanism:

- **G1** — Tool nodes get a named subgraph and a hydrated index (`tools/` into
  what `gen-subgraph-jsonld` exports).
- **G2** — remote mount, phase 1: `hydrated: true` on a mount entry or
  override fetches a named subgraph's `index.hydrated.jsonld` at the pin
  instead of files (the `nn8e` follow-up, filed as work item `mo75`).
- **G3** — materialize a chosen set: nested subgraph ids and node ids resolve
  through `resolveDirectories`/the hydrated index rather than the raw top
  level, in both `remote-mount` and `kg:materialize`, with the code closure
  added for Tools.

- **For:** keeps the ruled layout; reuses the published `index.hydrated.jsonld`
  contract instead of inventing a selector language; the same two phases serve
  a subscription and a mount, so an agent learns one workflow.
- **Against:** a mount becomes a decision with a review step in it, so it is
  no longer a pure function of `index.config.json` — the CHOICE must be
  written back to the mount entry (the way a subscription's `subgraphs` list
  holds the choice and never the state), or a fresh clone cannot replay it.

### A concern is a name for a list (the owner's answer to Option B)

The folders stay kind-first (A). What the owner asked for instead of
concern-first folders is a NAME: `sdlc` at the top level standing for
`["docs/sdlc", "skills/sdlc", "processes/sdlc", "scripts/sdlc"]`. That is a
declaration, not a directory:

```jsonc
// cat-harness.json, beside "directories"
"concerns": {
  "sdlc":        ["docs/sdlc", "skills/sdlc", "processes/sdlc", "scripts/sdlc"],
  "publication": ["docs/publication", "skills/publication", "scripts/publication", "site-chrome"]
}
```

- **Derived, not hand-kept, where it can be.** Every `concern-groups/v1`
  declaration already names its members by group code, so the list for
  `sdlc` is computable from them; `concerns` is then only where a member does
  not sit at `<kind>/<group>/` (`site-chrome`, `themes`). `check:concern-groups`
  fails a list that disagrees with the members it can compute.
- **Mountable.** `overrides.cat-harness.directories: ["sdlc"]` expands to the
  list. That needs G3 (nested ids resolve), because every member is nested.
- **Same name everywhere.** The code is the concern-group code, so `sdlc` in a
  mount, a skill path and a docs path is one word.

### The ninth group: `publication` (D4)

Ruled 2026-10-09. The eight groups were ruled in `9umr`; this amends that
ruling, so it changes `code-lists/concern-group.json` and the definition of
`ui`, which today covers both:

| code | definition (proposed) |
|---|---|
| `ui` (narrowed) | how the corpus is PRESENTED to a reader: viewers, boards, themes, the site's look and navigation |
| `publication` (new) | how the corpus is BUILT AND SERVED: composing the docs layers, the site build, the publish branch, release sites at `/<version>/` and `/v<major>/`, the CDN, and publication verification |

Members that move to `publication`: from `ui`, `processes/ui/staging-render-log`;
from the flat `scripts/`, the publish and site-build scripts (`compose-docs`,
`mount-instance-docs`, `publish-gh-pages`, `publish-verify`, `minify-site`,
`search-split`, …). Candidates from OTHER groups, each a placement call to
make in its PR rather than here: the skills `instance-publication` (in `kg`
today) and `publish-verification` (in `sdlc` today). `site-chrome/`
is `ui`; the process that builds a site from it is `publication`.

### Option D — chrome and themes only

Do slices 1 and 2, leave the rest flat.

- **For:** smallest; unblocks who-iris.
- **Against:** the next downstream that wants "the SDLC concern" (a folio with
  its own merge gates) meets wall 2 again.

### The constraint every option meets: code does not subset like content

A concern's PAGES can be mounted alone, and so can any subgraph's METADATA
(step 1 above). Its SCRIPTS mostly cannot: a
publication script imports `schemas/cat-harness.ts`, which imports the
graph-typology registry, which imports bootstrap-tools — the import cone is
most of `schemas/`. So for code, step 3 must mount the chosen Tools'
scripts **plus their import closure**, which `check:tools-closure` already
computes for kg-separation stage 6. Mounting "publication" without that would
produce a checkout where `compose-docs.ts` is present and cannot load. This is
stated here because it is the cost Options A and C share, and Option B only
hides it inside the directory.

### Comparison

| | layout churn | mountable by concern | keeps `9umr` | code closure handled |
|---|---|---|---|---|
| A | large (docs + all scripts) | no | yes | n/a |
| B | largest (every kind) | yes, today | **no** | by directory, coarsely |
| C | as A, staged | yes — read, then choose | yes | yes, via `check:tools-closure` |
| D | small | no | yes | n/a |

## 5. Stages

| PR | what | gate |
|---|---|---|
| 1 | `site-chrome/` declared and populated; `compose-docs` base order; every path reader repointed | folio-assistant's composed tree identical except `_config.yml` parse-equal; `check:stale-paths`; `check:declared-paths` |
| 2 | `themes/` declared; `RAW` → one node per theme; art declarations move with their themes; default with fallback | `gen-themes-css --check` byte-identical `themes.css`; `theme-contrast` QA unchanged |
| 3 | G3 for top-level and nested subgraph ids in `remote-mount` | a downstream naming `site-chrome` + `themes` + code mounts and builds |
| 4 | who-iris publishes its own site from `site-chrome` + its own `themes/` (kg-separation stages 7 and 12 for who-iris) | the site at `litlfred.github.io/who-iris/` builds and every replica link resolves |
| 5 | G1: `tools/` exported as a named subgraph with `index.hydrated.jsonld` | `subgraph:jsonld:check`; the Tools' descriptions appear in the hydrated file |
| 6 | G2: hydrated mounts (work item `mo75`) | a downstream reads `tools/` metadata at a pin with no code mounted |
| 7 | G3 for node sets, with the code closure; then `concerns:` shorthand | "load tools metadata, review, materialize three Tools" runs end to end; `check:tools-closure` |
| 8+ | docs and scripts into their concern groups, one group per PR | `check:concern-groups` |

PRs 1–4 are the ruled slices and the who-iris unblock. 5+ wait on **D5**.

## 6. Decisions for the owner

| | question | proposed default |
|---|---|---|
| **D1** | Composed `_config.yml`: parse-equal acceptable, or must its bytes stay identical? (explained below) | parse-equal |
| **D2** | `work-plan.*`, `process-index.js`, `slice-sqlite*`, `kg-render.js`: chrome, or harness pages' assets that stay in `docs/`? | stay in `docs/` — they serve harness pages |
| **D3** | The base light/dark + high-contrast pair: code in `schemas/`, or nodes in `site-chrome/`? | `site-chrome/` — the base travels with the chrome that needs it |
| **D4** | Split `publication` out of `ui` as a ninth concern group? | no — `ui`'s definition already says "rendered, published and presented"; a ninth code is a `9umr` amendment |
| **D5** | Option A, B, C or D for slice 3 | **C** |

### D1, explained

Jekyll reads ONE `_config.yml`. After slice 1 there are two: `site-chrome/`'s
(theme keys) and `docs/`'s (title, `baseurl`, nav). `compose-docs` already
handles that case by **parsing both, merging, and writing the result back
out** (overlay keys win; owner's rule, 2026-09-21). Writing YAML back out
keeps every setting and value but drops the comments and may reorder keys.

- **Who sees it:** nobody reading the site. Jekyll consumes `_config.yml` and
  does not publish it. A difference shows on the site only if a SETTING
  differs, and parse equality is exactly the test that no setting differs.
- **Who would notice the bytes:** `compose-docs.test.ts`, which today pins
  "an empty overlay produces a byte-identical tree", and a person diffing the
  composed tree. Under parse-equal that test changes to "byte-identical for
  every file except `_config.yml`, which is parse-equal".
- **The alternative, if bytes must stay identical:** `docs/_config.yml` keeps
  its full content, theme keys included, and `site-chrome/_config.yml` is used
  only when no later layer has a config (a downstream like who-iris). Then
  folio-assistant's composed config is byte-identical, at the price of the
  theme keys living in two files that can drift — the duplication the merge
  rule exists to avoid.

## 7. What would change this

- If `compose-docs`'s merge of two `_config.yml` layers changes the published
  site in any way a reader sees (nav order, search), slice 1 keeps the whole
  config in `docs/` and only downstream builds merge (D1, other branch).
- If the import closure of `compose-docs.ts` + `mount-instance-docs.ts` turns
  out to be most of `scripts/` as well as `schemas/`, step 3 buys little for
  code: materializing "three Tools" would bring most of the harness anyway,
  and Option C should be scoped to content kinds plus metadata for Tools.
- If a second downstream (not who-iris) never asks for a concern, Option D is
  enough and slice 3 is not worth its churn.

## Related

- [Placement by concern group](placement-concern-groups-2026-10-01.html) — the
  ruled vocabulary and the kind-first layout this extends; its PR9 is this
  proposal's slice 3 for docs.
- [Separation arc](separation-arc-2026-10-01.html) — where MCP becomes a
  subgraph inside the `tools` group.
- [`kg-separation`](../reference/skill-instructions/kg-separation.html) — stages
  7, 10 and 12, which who-iris's cutover skipped.
