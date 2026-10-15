---
name: lean-html-docs
user_invocable: true
description: >
  Build and publish the visualiser of a folio's declared `lean` directory: the
  package's doc-gen4 HTML render, staged under the folio's site and wrapped in
  the harness navbar and rail. Use when a folio's Lean docs are missing, stale,
  or published without the harness chrome, or when declaring a `lean`
  directory and its `coverage.visualiser`.
allowed-tools: Bash Read
graph-typologies:
  - lean
---

# Lean HTML docs — the `lean` directory's visualiser

A directory of graph typology `lean` holds a folio's Lean 4 formalisation:
Lake packages, their modules, the declarations a block's `lean.ref` points at.
What renders it is **doc-gen4**, not this platform. The platform's job is to
put that render inside the folio's published site with the same navbar and
rail every other page carries, so a reader moves between the paper, its
graphs and its Lean without leaving the harness.

Two Tools, run in order, governed by the process
`processes/content/lean-docs-publish.bpmn`:

| step | Tool | runs | cost |
|---|---|---|---|
| build | `lean-html-docs` | `adapters/paper/lean/lean-docs-build.sh` | Lake; thousands of modules for a Mathlib package |
| publish | `lean-render-publish` | `adapters/paper/lean/lean-render.ts` | a file pass; seconds when pruned |

## 1. Build the render — never on someone else's cache

```sh
# from the folio's checkout root
bash folio-assistant/folio-assistant-sci/adapters/paper/lean/lean-docs-build.sh \
  --lake-root folio/quantum-observable-universe/lean --lib QOU \
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

## 2. Publish it with the rail

```sh
bun run folio-assistant/folio-assistant-sci/adapters/paper/lean/lean-render.ts \
  --docs folio/quantum-observable-universe/lean/.lake/build/doc \
  --site _site --route lean --modules QOU,UGB,Fred2005 --home-label qou \
  --platform folio-assistant
```

Run it **after** the folio's site is built and **before** the chrome check and
deploy — the slot `stage-folio-local.ts` gives its own rail step. It reuses
that rail (`rail-standalone-pages.ts --foreign-site`), so the Lean pages carry
exactly the folio's chrome, and the pass is idempotent over pages already
railed.

What it adds before the rail runs, each for a measured reason:

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

## Declaring the directory

A folio declares each Lean package directory (or their common parent) with
graph typology `lean` and names the render as its visualiser. Because the
render is built at publish and never committed, the visualisation carries a
`writer` — the Tools' scripts — which is what makes it resolve:

```json
{
  "id": "lean",
  "path": "folio/quantum-observable-universe/lean/",
  "graphTypologies": ["lean"],
  "coverage": {
    "visualiser": [{
      "ref": "_site/lean/index.html",
      "title": "Lean",
      "writer": [
        "folio-assistant/folio-assistant-sci/adapters/paper/lean/lean-docs-build.sh",
        "folio-assistant/folio-assistant-sci/adapters/paper/lean/lean-render.ts"
      ]
    }]
  }
}
```

The kind is defined in folio-assistant-sci's `typologies/lean.json`, so the
folio's platform pin must reach a folio-assistant-sci that has it: an unknown
graph typology makes the whole declaration fail to parse.

## What this is not

- Not the formal-edge graph. Elaborated dependencies between `lean.ref`
  declarations are `lean-formal-edges`.
- Not the warm cache. Restoring and seeding oleans is `lean-cache-restore`
  (the `lean-cache` Tool); this skill only refuses to damage it.
