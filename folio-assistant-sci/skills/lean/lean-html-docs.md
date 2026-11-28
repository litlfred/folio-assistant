---
name: lean-html-docs
user_invocable: true
description: >
  Build a folio's Lean render (the Lean knowledge-graph viewer made from
  doc-gen4's declaration data for its Lake packages), keep it on the folio's
  branch-mounted Lean store, and publish it under the folio's site wrapped in
  the harness navbar and rail. Use when a folio's Lean docs are
  missing, stale, or published without the harness chrome, or when declaring
  the Lean store a folio mounts.
allowed-tools: Bash Read
graph-typologies:
  - lean
---

# Lean HTML docs — a folio's Lean render, from its branch store to its site

What renders a folio's Lean 4 formalisation is **doc-gen4**, not this
platform. The platform's job is to keep that render, and to put it inside the
folio's published site with the same navbar and rail every other page
carries, so a reader moves between the paper, its graphs and its Lean without
leaving the harness.

Three places, and each step reads one and writes the next (owner,
2026-11-19: *"lean repo branch"*, *"needs to be mounted"*):

| what | where | who writes it | who reads it |
|---|---|---|---|
| the **source**: Lake packages, their modules, the declarations a block's `lean.ref` names | the folio's own tree, `folio/<paper>/lean/` | authors | the build (§1) |
| the **render**: the Lean KG viewer and its `data/` shards (doc-gen4's static HTML only as a fallback) | a branch store the folio declares, under `cat/folio-assistant-sci/`, mounted at a declared path (§Declaring the store) | the build, by `branch-store.ts push` (§2) | `state:mount`, then the publish (§3) and the document site's ∀ links |
| the **published pages** | the folio's site, at the route its declaration names (`lean/`) | the publish (§3), a site step | readers |

The render is never committed to the folio's main: it is derived, large, and
regenerated, so it lives on its branch the way the work-plan lives on
`cat/cat-harness/beans`.

The process `processes/content/lean-docs-publish.bpmn` governs the order:

| step | Tool / command | runs | cost |
|---|---|---|---|
| build | `lean-html-docs` | `adapters/paper/lean/lean-docs-build.sh` | Lake; thousands of modules for a Mathlib package |
| make the KG render | `lean-kg-publish` | `adapters/paper/lean/lean-kg-publish.ts` | seconds |
| store | `branch-store.ts push --id <id>` | `cat-harness-tools/scripts/branch-store.ts` | a splice onto the branch tip |
| mount | `state:mount` | `cat-harness-tools/scripts/state-mount.ts` | a checkout of the tip |
| publish | a site step | the folio's `site.build.siteSteps` (fallback: `lean-render.ts`) | a copy, railed by the site build |

The commands below write `<owner>/<repo>` and `<paper>` for the folio's own
values: `<owner>/<repo>` is `GITHUB_REPOSITORY` in CI, else the checkout's
`origin` (the rule `scripts/lib/paper-env.sh` and `defaultBlockActions`
follow), and `<paper>` is the document directory under `folio/`. Nothing
here names a repository.

## 1. Build the render — never on someone else's cache

```sh
# from the folio's checkout root
bash folio-assistant/folio-assistant-sci/adapters/paper/lean/lean-docs-build.sh \
  --lake-root folio/<paper>/lean --lib <Lib> \
  --platform folio-assistant --restore
```

The script refuses, rather than risks, three things — read its header for the
evidence behind each:

- **another `lake`/`lean` process running**: two Lake processes on one
  `.lake/` race on the same oleans;
- **a restored tree with no traces** (`.lake/RESTORED-NO-TRACES`): `:docs` is
  a Lake build, and Lake rebuilds an untraced olean, evicting the cache;
- **no warm cache**, unless `--allow-cold`: Mathlib from source is 30–60
  minutes before doc-gen4 starts.

doc-gen4 stays out of `main`'s lakefile (it adds heavy modules to every
build). A folio comments its `[[require]]` between `--- BEGIN doc-gen4` /
`--- END doc-gen4` sentinels; the script uncomments them for the build and
restores the lakefile on exit. It never runs `lake update`, so the folio's
`lake-manifest.json` must already list doc-gen4 at that rev.

Start with `--dry-run`: every guard runs and the `lake` command is printed.

## 2. Make the KG render and keep it on the branch store

THE visualiser is the Lean knowledge-graph viewer (owner, 2026-11-19: *"use
thin html and dynamic loading"*): doc-gen4 still elaborates, but what is kept
and published is one viewer page plus JSON shards it loads on demand, made by
`lean-kg-publish` from doc-gen4's per-module **declaration data**
(`.lake/build/doc-data/declaration-data-<Module>.bmp`). Write it straight into
the mounted store, then push the store:

```sh
bun run cat state:mount                       # or: branch-store.ts mount --id <id>
bun run folio-assistant/folio-assistant-sci/adapters/paper/lean/lean-kg-publish.ts \
  --doc-data folio/<paper>/lean/.lake/build/doc-data --site . --route <store path> \
  --modules <Lib>,… --content-root folio \
  --repo <owner>/<repo> --ref <sha> --content-prefix folio/ --no-rail
bun folio-assistant/cat-harness-tools/scripts/branch-store.ts push --id <id>
```

| file | what |
|---|---|
| `data/index.json` | modules, declaration counts, chunk counts, a content hash per module |
| `data/names.json` | every declaration name, for search; fetched on first search |
| `data/m/<Module>.jsonld` | the module node, `imports` edges, one node per declaration with `formalizes` edges to the blocks whose `lean.ref` names it |
| `data/m/<Module>.<k>.sig.json` | rendered signatures, 500 per chunk, fetched as cards scroll in |

Measured on qou: 3,011 modules, 53,565 declarations, 651 formalizing a block,
171 MB in 6,005 files, 13 s. The 12,804-declaration
`QOU.BraidKnot.AllKnownIsotopesUniqueness` opens on a target declaration in
about 2 s (it was a 55 MB HTML page in the static render).

doc-gen4's `style.css` styles bare `body`/`header`/`nav`/`main`; the publish
step keeps only its custom properties and signature rules, scoped under
`.lkg-sig`, so it cannot lay the viewer out as a doc-gen4 page or reach the rail.

The store is tip-keyed: the branch tip IS the current render, with a root
`manifest.json` (`state-manifest/v1`), and the push splices onto it without
ever forcing. A site build that follows needs no Lean toolchain and no warm
cache: it mounts the store.

## 3. Publish it at its route, with the rail

A step of the folio's declared site build (`site.build.siteSteps`, a package
script whose last argument is the built site), so `stage-local.ts` runs it for
the folio. It reads the MOUNTED store, never a Lake build directory, and
copies the viewer and its `data/` to `<site>/<route>/`, the route the
declaration's `coverage.visualiser` names. The site build's own rail pass
(`rail-standalone-pages.ts --foreign-site`), which runs after every site step,
puts the harness rail on the viewer page, so the rail's assets are the site's
own and nothing extra lands at the site root. With the store not mounted the
step has nothing to publish and must say so, not succeed quietly.

The document site's ∀ panel links each declaration to the viewer opened at it,
`<route>/#/m/<Module>/<name>`, using the render's `data/names.json` to find the
module (`folio-assistant-core/scripts/block-lean.ts`); a declaration the
render does not list gets no link.

## 4. Fallback: doc-gen4's static HTML

Not the default. When a store holds doc-gen4's static render instead
(`.lake/build/doc`, copied without Lake's `.hash`/`.trace` bookkeeping), the
site step stages it with `lean-render-publish`:

```sh
bun run folio-assistant/folio-assistant-sci/adapters/paper/lean/lean-render.ts \
  --docs <store path> --site _site --route lean --modules <Lib>,… --no-rail
```

(without `--no-rail` it runs the rail pass itself, `--platform <index root>`,
and is a standalone publish.) What it adds before the rail runs, each for a measured reason:

- leaves out Lake's `.hash`/`.trace` bookkeeping (4,646 files in qou's July
  render, more files than pages);
- marks doc-gen4's iframe navbar and its `find/` redirect
  `<meta name="folio-navbar" content="none">`, or a second rail is drawn
  inside the sidebar of every page;
- adds a layout shim, keyed on the rail being present: doc-gen4's header and
  sidebar are `position: fixed`, so the rail's body padding does not move them
  and the rail covered the sidebar (measured in Chromium: sidebar at 7.8 px
  under a 56 px rail; 63.8 px with the shim).

`--modules` keeps only the named module roots. Without it the folio publishes
Mathlib's docs too — qou: 4,193 pages, 533 MB, 347 s to stage and rail;
pruned: 34 pages, 29 MB, about 5 s. Pruning repoints every link into a
dropped module to the community mathlib4 docs, and **says what that costs**:
those docs are built from their Mathlib, not the folio's pin, and doc-gen4's
search index still lists pruned declarations, whose hits 404. Choose it
knowingly.

The script ends by asserting that every staged page is railed or declined
the rail; a page with neither fails it.

The ∀ panel then links doc-gen4's page for the declaration, read from the
render's `declarations/declaration-data.bmp`.

### Cache the doc-gen4 output, iterate per branches/ branch

The doc-gen4 run is the expensive part (qou: about 2 h 20 min on 4 cores, 15,151
Lake jobs). Its output is cached on an orphan branch, e.g. qou's
`lake-cache/qou-docgen4-v4-24-0` (doc HTML with Lake `.hash`/`.trace`,
doc-data, and doc-gen4's own build; ~160 MB in two parts, `MANIFEST.json`).
Restore it after the olean cache and `lake -R -Kenv=dev build <Lib>:docs`
re-renders only modules whose traces changed.

For a branches/ branch, publish an overlay against the main graph:

```sh
… lean-kg-publish.ts … --base https://<site>/lean/data
```

Only modules whose content hash differs from the base are written, plus
`data/overlay.json`; the viewer loads changed modules from the branch and the
rest from the base. A branch with no Lean change writes no module files.

## Declaring the store

A folio declares its Lean render as a directory of graph typology `lean`
whose content comes from a BRANCH, mounted the way `beans/` is, and names the
site route it is published at as its `coverage.visualiser`:

```json
{
  "id": "lean-docs",
  "path": "lean/",
  "scope": "repository",
  "source": { "kind": "branch", "branch": "cat/folio-assistant-sci/lean-docs", "keyedBy": "tip" },
  "graphTypologies": ["lean"],
  "coverage": { "visualiser": [{ "ref": "_site/lean/index.html", "title": "Lean" }] }
}
```

- `path` is where `state:mount` puts the branch's files, and it is gitignored:
  the render is never committed to main. The branch mirrors the checkout, so
  the render sits under `lean/` on it as well.
- `coverage.visualiser` is the route the publish step writes (`_site/<route>/`),
  and the route the document site's ∀ panel links each declaration's rendered
  page under (`folio-assistant-core/scripts/block-lean.ts`, which reads the
  render's `declarations/declaration-data.bmp` from the mount).
- The source is NOT declared here: it is the Lake packages already under
  `folio/<paper>/lean/`, which the folio's `folio` graph holds.

The kind is defined in folio-assistant-sci's `typologies/lean.json`, so the
folio's platform pin must reach a folio-assistant-sci that has it: an unknown
graph typology makes the whole declaration fail to parse. A folio's site
recipe that keeps an earlier `lean/` on its publish branch (`site.build.keep`)
publishes that copy instead of the mounted one: drop `lean` from `keep` once
the store holds the render.

## What this is not

- Not the formal-edge graph. Elaborated dependencies between `lean.ref`
  declarations are `lean-formal-edges`.
- Not the warm cache. Restoring and seeding oleans is `lean-cache-restore`
  (the `lean-cache` Tool); this skill only refuses to damage it.
