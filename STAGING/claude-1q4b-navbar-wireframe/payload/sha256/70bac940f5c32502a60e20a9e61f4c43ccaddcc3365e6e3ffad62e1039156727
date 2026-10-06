---
# folio-assistant-riit
title: CONTRIBUTIONS AND VALIDATORS AS KG NODES (owner 2026-10-04)
status: completed
type: feature
priority: normal
created_at: 2026-10-04T17:42:33Z
updated_at: 2026-10-05T11:39:15Z
parent: folio-assistant-fs43
---

Owner, 2026-10-04, on the audit's open question (should `*/contributions.ts` become declared nodes?): **option 2, all of it as nodes, "+ validators need to be in KG too"**.

## What exists, measured 2026-10-04
- `schemas/contributions.ts` defines the contribution shapes in TypeScript: BlockKindContribution, AdapterContribution, ToolContribution, QaCheckerContribution, RendererContribution and PipelinePluginContribution. A dependency names one `contributes` module in its config, and `loadContributions` imports and calls it (smart-base and folio-assistant-sci do).
- A validator is today a STRING on a kind, e.g. `fhir-harness:schemas/ig-ast.ts#AstManifestSchema`, resolved by `schemas/kind-validator.ts` `parseValidatorRef`. It is not a node.

## The rule
Every contribution is a node in the contributing harness's KG, declared like `kinds/`, and every FUNCTION it needs is a reference `<harness>:<path>#<export>`. A validator is a node too: what it validates (a `$schema` family), the reference to its Zod export, and its owner. A kind's `nodeSchemas` then names validator NODES rather than carrying path strings.

## Done when
- [x] the owner agrees the node shapes for a validator and for each contribution type (one proposal, with the open choices put to them)
- [x] validators are nodes, and the validator names its family (ruling 2): 71 in cat-harness, 9 fhir-harness, 8 folio-assistant-core, 1 cat-openapi. The one exception is `models`: its code is in bootstrap-tools, another repository, so its string stays until bootstrap-tools declares the node
- [x] block kinds and adapters are nodes (sod4 #1 lands here: the paper block kinds first): steps 2a, 3 and 5
- [x] checkers, renderers, pipeline plugins and MCP tools are nodes referencing their code. Checkers and pipeline plugins are done (step 3b); MCP tools are Tool nodes served from the dependency tree (3c, #2082). No renderer is contributed anywhere, so there was none to convert; the shape's fate is in j00t.
- [x] `contributions.ts` modules are gone, or reduced to the code the nodes reference. No instance declares a `contributes` module; smart-base's went in step 5 and sci's in 3c. The loader branch that would still read one is j00t.

Raised by the audit, folio-assistant-sod4.

## 2026-10-04: the proposal, and the owner's three rulings

The proposal is `cat-harness/docs/proposals/contributions-as-nodes-2026-10-04.md`. The owner's rulings, each the recommended option:
1. one graph per contribution type;
2. a validator node names the `$schema` family it validates, and a kind lists only its families;
3. locale headings live in the translation graph, so a block-kind node carries only its English heading.

The order: validators, then block kinds and the adapter (sod4 #1), then checkers, renderers and pipeline plugins, then MCP tools, then delete the contributions.ts modules.


## 2026-10-04: step 2a — block kinds are discovered nodes (sod4 #1)

Owner rulings this step:
- Where the nodes live: *"2. Owners now"*. The 9 document kinds are in `folio-assistant-core/block-kinds/` and the 7 math kinds in `folio-assistant-sci/block-kinds/`. cat-harness's schemas read them upward through discovery; the alternative was keeping them in cat-harness until the schemas move.
- *"kinds need to be discoverable"* and *"not centrally managed"*.

What changed:
- `folio-block-kind/v1` (`schemas/block-kind-node.ts`) carries `kind`, `adapter`, `profile`, `builder?`, `labelPrefix`, `prefixEnforced`, `provable`, `folioType`, `docoType?`, `heading`, `headingPlural` and `indexRank?`.
- `block-kinds` is a meta-kind in BASE, with an avatar and the validator node `cat-harness/validators/block-kind-node.json`.
- `block-kinds.ts` DISCOVERS the kinds, and `BLOCK_KINDS` is no longer a literal. A kind two files declare is refused, naming both. A checkout with none is refused.
- `BlockKind` is now `Block["kind"]`, the TYPE read from code. The compile-time list proof is gone with the list. `block-kind-nodes.test.ts` checks that the typed kinds (BlockSchema's union members) equal the discovered kinds.
- Tables now read off the nodes:
  - `BLOCK_KINDS`, `MATH_BLOCK_KINDS` and `DOCUMENT_BLOCK_KINDS` (from `profile`), and `PAPER_BLOCK_KINDS`.
  - The builder map; `LABEL_PREFIXES` and `KNOWN_LABEL_PREFIXES`; `PROVABLE_LABEL_PREFIXES`.
  - jsonld's `BLOCK_KIND_TO_FOLIO_TYPE` and `BLOCK_KIND_TO_DOCO_TYPE`, and `KIND_PREFIXES`.
  - The English `KIND_HEADINGS`.
  - generate-index's plural headings, its INDEXED_KINDS and its reading order (`indexRank`).
- Behaviour kept: `prose` was never in LABEL_PREFIXES, so `prefixEnforced: false`. `figure` had no English heading row and fell back to "Figure", which the node now states.

Left, and why:
- **2b:** the five non-English heading locales move to the translation graph (owner's option 1).
- The per-kind Zod schemas and `BlockSchema`'s union are CODE in cat-harness/schemas/constraints.ts (option 3, not taken).
- About 6 pipeline audits spell `"thm:"`-style prefixes inline: conditional-class-banner-audit, audit-wiring, conjectural-propagation-audit and others.
- `CONTENT_ADAPTERS` and `ADAPTER_COMPANION_ROLES` belong to the adapter-node step.


## 2026-10-04: step 2b — block-kind headings are in the translation graph

- Each owning instance now declares `translations/` (graph kind `translation-sources`). In it, `<lang>/block-kinds.pot` and `.po` hold one entry per kind: `msgctxt "block-kind:<kind>"`, with the node's English `heading` as msgid.
  - folio-assistant-core holds the document kinds; folio-assistant-sci holds the math kinds.
  - Every string was moved verbatim from `KIND_HEADINGS`.
- `kindHeading(kind, locale)` takes English from the node. Other locales come from every declared `translation-sources` directory's `<lang>/block-kinds.po`, read lazily. The fallback for a kind with no node here is the title-cased name.
- `KIND_HEADINGS` is gone; it was the last per-kind table in cat-harness. `po-strings.ts` is a new leaf gettext reader. `declared-nodes.ts` gains `declaredDirectories`.
- **One behaviour change:** `figure` had no row in any locale, so it fell back to English everywhere. It now takes `diagram`'s rendering, since both read "Figure": es "Figura", ru "Рисунок", zh "图", ar "شكل". The fr rendering is "Figure" either way.
- **A precedent noted, not followed:** core's glossary catalogues sit in `cat-harness/translations/<lang>/glossary/`. These sit with their owners instead, per "Owners now" and "not centrally managed". Whether the glossary ones should move is the owner's call.


## 2026-10-04: catalogues moved to the semantically appropriate place

Owner, the same day: *"move things to semanticaly approropaite plce"*. This answers the glossary-precedent question left at step 2b.

- A glossary scheme's `.pot`/`.po` now live in the OWNER instance's declared `translations/`:
  - `folio-assistant-core--platform` and `glossary-page` (whose writer is core's `glossary-page.ts`) go to `folio-assistant-core/translations/<lang>/glossary/`;
  - `who-iris--who-terms` goes to `who-iris/translations/<lang>/glossary/`, which who-iris now declares.
  - All moves are `git mv`, so no strings changed.
- `glossary-pot.ts` places each template with `catalogueDir(name)`: the owner's directory, falling back to the platform's. Its `--check` reports a misplaced file, and names every fallback.
- `glossary-page.ts` reads every declared `translation-sources` directory.
- **Kept in `cat-harness/translations/`**, named by the check:
  - `bootstrap--terms`. bootstrap is a separate repository and declares no translation graph. Moving it needs a bootstrap PR, so it is not done from here.
  - `cat-harness--platform`, which is cat-harness's own.
- **Not yet moved:** the BPMN process catalogues (`cat-harness/translations/<lang>/processes/`) cover diagrams owned by several instances. The same rule applies, and they are next.


## 2026-10-04: step 3a — DAK kinds are nodes, scoped by the dependency tree

The owner chose the scope: *"1. Dependency tree"*. A folio sees the nodes of the instances it depends on.

- smart-base's 21 `dak` kinds are `folio-block-kind/v1` nodes in `smart-base/block-kinds/`.
  - For non-paper adapters, `profile` and the two heading fields are optional; a refine requires all three for paper-adapter kinds.
  - `dak-kinds.ts` and `dak-jsonld.ts` read their tables off the nodes.
  - `DakBlockKind` is now `DakBlock["kind"]`.
  - `contributions.ts` no longer returns `blockKinds`.
- `loadContributions` and `loadContributionsSync` register each dependency's DECLARED kinds through the same `orderedDependencies` walk. So DAK kinds reach exactly the folios that depend on smart-base.
  - Tested both ways: smart-ig gets all 21; folio-assistant-core gets none.
  - The sink decides what counts as built-in (`acceptsDeclaredKind`), so the harness-layer loader imports no content vocabulary. check:partition is at 0.
- Built-in paper and document kinds stay platform-wide. cat-harness's code types them, and the content profile governs which ones a folio may use. Scoping them by dependency too would need the schemas moved first (option 3 of the step-2 placement question, which the owner did not take).

## 2026-10-04: `uploads` is back in cat-harness's BASE, beside `library`

Owner, the same turn: *"uploads and library live in cat-harness as part of doc ingestion process"*.

- dmx1 had moved `uploads` to core's `kinds/`. That broke DEFAULT_DIRECTORIES' invariant, which `cat-harness.test.ts` asserts: the harness defaults `uploads/` but no longer knew the kind.
- The definition now sits in BASE again, with its avatar and tile icon. Its rationale is kept as a comment.


## 2026-10-04: step 3b — QA checkers and pipeline plugins are nodes

- Two new graphs, each a BASE meta-kind with an avatar and a validator node: `qa-checkers` (`folio-qa-checker/v1`: `criterion`, `check`) and `pipeline-plugins` (`folio-pipeline-plugin/v1`: `slot`, `implementation`). One graph per type, as the owner ruled.
- **A ref is the contributing instance's OWN code:** `path.ts#Export`. `OwnCodeRefSchema` refuses an `instance:` prefix or a `..` path.
  - The export is a TABLE keyed by the node's criterion or slot: the dispatch table each harness already keeps, so `tsc` checks every entry against its contract.
  - The node names the entry once, in data. `sourceFile`, which freshness is hashed over, is the ref's path.
- `loadContributions` and `loadContributionsSync` register them through the dependency walk (`registerDeclaredContributions`). A table entry is resolved with `require` and throws, naming the node, when the module, export or entry is missing.
- **folio-assistant-sci:** two checker nodes naming `COST_AUTOMATED_CHECKERS`, and four slot nodes naming the new `content/pipeline/plugin-slots.ts#PIPELINE_IMPLEMENTATIONS` (moved out of contributions.ts). Tested: the platform root gets all of them; folio-assistant-core gets none.
- **smart-base:** five checker nodes naming `DAK_AUTOMATED_CHECKERS`.
- Both contributions.ts modules no longer return `qaCheckers` or `pipelinePlugins`. sci's still returns `tools`, which is step 3c.
- `check:kind-validators` now `@covers qa-checkers, pipeline-plugins`: it loads the platform root's contributions, and every node must resolve (4 plugins, 7 checkers). audit:coverage reports both graphs as covered.



## 3c — owner rulings 2026-10-05

1. Tool registration comes from Tool nodes; the MCP adapter's static TOOL_GROUPS list is deleted.
2. The code moves to its owners now (option B). validate → core; render and lean → sci. A core node cannot point at cat-harness-tools code, because resolveImplementingPath only looks in the declarer and in the instances that need it.
3. The MCP adapter serves every Tool node in the folio's dependency tree, the same rule as the harness server. The three adapter copies duplicating src/tools (preferences, preview, check-deps) are deleted, after the adapter's preview spawn+unref fix is ported into src/tools/preview.ts. Preferences standardise on .folio-prefs.json (default, stated to the owner).

Work is on the local branch riit-3c-local, to be pushed after #2082 merges so its ready state is not reset.


## Step 5: owner ruling 2026-10-05 (option 1 of 3)

Content adapters become vocabulary nodes: a `content-adapters/` graph with one `folio-content-adapter/v1` node per block vocabulary, `paper` in folio-assistant-sci and `dak` in smart-base. Each node carries the name, the companion roles, and whether cat-harness's code types its blocks. CONTENT_ADAPTERS and ADAPTER_COMPANION_ROLES are derived from the nodes, and smart-base/contributions.ts drops its `adapter`. The server adapter classes stay as `contentAdapters` data in each `<instance>.json`. The two notions are kept separate because they do not line up: `document` has a class but no vocabulary, and `dak` has a vocabulary but no class.

Done in 317054c: paper.json (sci) and dak.json (smart-base); CONTENT_ADAPTERS and ADAPTER_COMPANION_ROLES are derived; the loader registers dak through the dependency tree; smart-base/contributions.ts is deleted. With this, the only contributes module left is sci's, which registers the lean_formal_edges tool group.

## 2026-10-05: closed
All three remaining boxes are measured done (above). #2082 merged green at fb1caf5. What riit leaves behind is the unused `contributes` config field and loader branch, which is filed as j00t rather than kept open here.
