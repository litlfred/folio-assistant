---
title: "Derived-graph dependencies"
kind: proposal
bean: folio-assistant-nama
summary: >-
  A directory declaration says what a directory holds and where it is stored,
  but never what it is computed FROM. So regen, the main publish workflow and
  the staging cone cannot know that a change to the IG AST cache invalidates
  the IG pages, or that the IG pages feed the published site. This proposes one
  edge, `derivedFrom`, on the derived directory, resolved and checked the way a
  document kind's `computedFrom` already is; a topological rendering order
  computed from it; and, until it exists, declaration order as the rule, with a
  check that flags a consumer declared before its source.
---

# Derived-graph dependencies

Owner, 2026-10-04:

> *"bean up missing dependency logic on derived graphs (e.g. ig-docs, gh-pages,
> lean-cache, fhir-ast). may need to walk dependencies between derived content
> (e.g. fhir-ast is dependency of ig-docs). not sure graph schema has that
> yet... these are rendered sub-graphs. so we can use order that subgraphs
> declared as rendering order for now maybe"*

## What exists — measured 2026-10-04, `main@63ec4fff`

**No edge between directories says one is computed from another.**

- **Not on the directory.** `ContentDirectorySchema` (`schemas/cat-harness.ts`)
  carries `id`, `path`, `scope`, `graphKinds`, `coverage`, `readOnly`,
  `summaries`, `theme`, `source`, `storage`, `prefix` and `passThrough`.
  `source` and `storage` say where a directory's content is *stored* (a
  directory, or a branch keyed by commit, tip or route). Neither says what the
  content is *derived from*.
- **Only at a finer grain.** A document kind's section has `computedFrom`, a
  list of declared graph ids (bean `qvxh`). `check:document-kind-sources`
  resolves each id across `needs`. That is the right shape, one level down:
  per section, not per directory.
- **Proposed, never built.** Proposal #1966 (merged) recommended "A. `rendersTo`
  on the source graph". The owner then ruled *"auto-docs is one declared
  subgraph, with declared sub-sub-graphs per writer"*. No `rendersTo` exists in
  the schema.

**The `derived` layer is under-declared.** Nine directories across all
instances are in it: six `library/` entries, `uml/`, `subscriptions/` and
smart-trust's `openapi/`. Missing from it:

| what | where it is today | why it is derived |
|---|---|---|
| the IG pages (`<ig>/docs/`) | graph kind `docs` (layer `content`) | written wholly by `gen-ig-pages` from the artefact index; seeded to `cat/fhir-harness/ig-docs` (bean `lbz8`) |
| the artefact index (`<ig>/fhir-artifact-index/`) | kind `fhir-artifact-index` (layer `content`) | ingested from the IG's *published* output (`ingest:ig`, re-derived by `ingest:ig:check`) |
| the IG AST cache ("fhir-ast") | **not declared as a graph**. Its SCHEMA exists (`fhir-harness/schemas/ig-ast.ts` plus generated JSON Schemas, bean `l0lq`), and its branch family `cat/fhir-harness/fhir-ast/` is registered in `special-branches.json` | computed by the Publisher fork from the IG source |
| the Lean build cache ("lean-cache") | **not declared as a graph**. An orphan-branch family `cat/folio-assistant-sci/lake-cache/<package>-<toolchain>`, refreshed by `lake-cache-refresh.yml`, registered in `special-branches.json`; no schema for its contents | computed by `lake build` from the Lean sources |
| the published site (`gh-pages`) | **not declared as a graph**. A registered special branch, built by `docs-site.yml` and `feature-staging.yml`; no layout schema | composed from every renderable graph |

So in the chain the owner named, **fhir-ast → ig-docs → gh-pages**, every member exists as a branch, and one (fhir-ast) already has a schema. **None is declared as a graph, and there is no edge anywhere.** The node schemas are bean `folio-assistant-lehh` (owner: *"was an AST schema somewhere. pickup. add schemas for lean-cache … and gh-pages too"*). The two route branches `cat/fhir-harness/ig-docs` and `cat/cat-harness/uml-overview` are not yet registered in `special-branches.json`.

**Who would read it.** All three of these walk dependencies today by
convention or by hand:

- **`regen`** (`regen-after-merge.ts`) runs verify/write pairs with inputs
  declared *per gate* (15 of 114 declare inputs), not per graph.
- **The staging cut** (`feature-staging.yml`, `compose-docs.ts`
  `carriedInstances()`) is a path-prefix match. It drops smart-trust from a
  preview when `gen-ig-pages.ts` changes (bean `4j86`).
- **The main publish job** for route branches (bean `lbz8`) does not exist yet,
  and will need to know what to republish after a merge.

## Proposal

### 1. One edge, on the DERIVED side: `derivedFrom`

```jsonc
// smart-trust/smart-trust.json
{ "id": "smart-trust-docs", "path": "docs/", "graphKinds": ["docs"],
  "derivedFrom": ["smart-trust-artifact-index", "fhir-ig-chrome"] }
```

- **A list of directory ids, resolved across `needs`**, exactly as
  `computedFrom` is. An id the instance neither declares nor inherits is
  refused. One resolver serves both, so the two cannot disagree about what
  "reachable" means.
- **On the derived side, not the source side (the inverse of #1966's
  `rendersTo`).** The derived graph's writer is what knows its inputs. A Tool
  owns its own `satisfies` for the same reason (`bpmn-processes` §"There is no
  `tool` element"). A source-side `rendersTo` would make every upstream graph
  enumerate consumers in instances it cannot see: smart-trust's index would
  have to name fhir-harness's pages, which is the wrong direction for the
  layering gates.
- **Directory granularity, deliberately.** File-level reachability inside a
  graph belongs to the staging cone (bean `4j86`), which combines these edges
  with the generators' import closures. This edge answers only "which graphs
  can invalidate this one".
- **Generators are code, not graphs.** The staging cone reaches a generator by
  its import closure. So `derivedFrom` names data graphs only, and "IG pages
  depend on `gen-ig-pages.ts`" is left to the cone. That keeps code from being
  declared twice.

### 2. Declare the missing nodes

- **`ig-ast`** in fhir-harness: the AST cache, `derived`. Its node schema is the existing `ig-ast.ts`, picked up rather than restated, and its storage is the `cat/fhir-harness/fhir-ast/` family.
- **`lake-cache`** in folio-assistant-sci: Lake's build output, `derived`, stored on the `cat/folio-assistant-sci/lake-cache/<package>-<toolchain>` family. It needs a new schema for what a cache branch holds. The owner said "lean-cache"; the existing family is `lake-cache`, and renaming it is the owner's call.
- **`site`**: the published composition (`gh-pages`), `derived`. It needs a new layout schema (root, previews, per-IG sub-sites), and its `derivedFrom` lists every renderable graph that composes it.
- **Re-layer** the IG pages and the artefact index as `derived`, which is the
  only layer their rules allow (#1966's `library/` argument: a QA finding
  against a derived page is a finding against its generator).

### 3. Order: computed when the edges exist, declared until then

- **Interim (the owner's rule).** The order in which directories are declared
  is their rendering order. A new check, part of the gate below, flags any
  directory that names, via `derivedFrom`, a source declared AFTER it, so the
  interim rule fails loudly rather than rendering stale.
- **Target.** A topological order over `derivedFrom`, across instances in the
  `needs` order that `dependency-order.ts` already computes. A cycle is
  refused.

### 4. The gate: `check:derived-from`

- Every `derivedFrom` id resolves, using the same resolver as
  `check:document-kind-sources`.
- No cycles.
- While the interim rule applies, no consumer is declared before a source in
  the same instance.
- Every directory in the `derived` layer either names `derivedFrom` or says
  why not, in a field the gate reads. A `library/` is derived from an
  *external* publication, which is not a declared graph. Absence must be a
  statement, not silence.

## What would falsify this

- **A derived graph whose inputs cannot be named at directory grain.** For
  example, a page set derived from a *subset* of an index, where invalidating
  on any change over-builds badly. Then the edge needs a selector, and that is
  the staging cone's job (`4j86`), not this schema's.
- **An edge that cannot resolve across `needs`,** because the source sits in an
  instance the consumer does not need. That is the chrome case, already met in
  `ig-chrome.ts`: *"there is no `needs` path from smart-trust to smart-base."*
  Such an edge would show a real layering gap. The gate should **report** it as
  that, rather than this proposal inventing a `needs` edge to make it resolve.

## Owner rulings, 2026-10-04 — all three decided

1. **Edge direction: `derivedFrom`, on the derived graph** (option 1 of 3).
   The writer of a derived graph names its inputs, and edges point down the
   stack.
2. **Re-layer both the IG pages and the artefact index as `derived`**
   (option 1 of 3). They leave the content sweep, and findings go to their
   generators, as `library/` did (bean `hqku`).
3. **An edge across a missing `needs` path is a RATCHET** (option 1 of 3). The
   gate reports it as a layering gap in a baseline with a reason; a new gap
   fails, and a cleared one shrinks the baseline. The chrome dependency is
   declared, and the gap stays visible.

## Not in scope

- Building any of it in this note. The schema change follows, now that the
  owner has answered.
- File-level reachability (bean `4j86`) and the main publish workflow (bean
  `lbz8`). Both consume this edge, and neither is designed here.
