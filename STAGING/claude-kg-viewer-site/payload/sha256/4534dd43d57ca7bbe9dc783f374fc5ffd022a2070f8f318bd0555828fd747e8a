---
# folio-assistant-6gme
$schema: bean/1.0.0
title: 'Remaining single-instance kinds have no viewer: scenarios, policies, UML, test plan, tool releases, vocab mapping, voice vendors, waivers, substrate snapshots, basic CDN site, Lean packages, bootstrap-tools skills'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-23T08:00:00Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

Measured live: Scenarios ×3, and one row each for Policies, UML, Test plan, Tool releases, Vocab mapping, Voice vendors, Waivers, Substrate snapshots, Basic CDN site (C@T Harness), Lean packages (folio-assistant-sci; a doc-gen4 viewer exists as the `lean-html-docs` skill), Skills (Bootstrap tools only — other harnesses' skills link).

Triage each: link an existing page (UML has rendered diagrams; Lean has doc-gen4), build, or exempt.
## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".

## 2026-10-20 — ten rows closed (drain coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

Owner ruling (every kind gets a viewer) applied in the instances this session can push to. "No viewer yet" rows under harnesses 20 → 10 in the composed index. Tools half in litlfred/cat-harness-tools#469, declarations in litlfred/cat-harness#380 (merge tools first).

- **Declared an existing viewer:** UML (auto-docs' uml listing), Voice vendors (voices page).
- **Listing viewer added to state-viewer** (registry layout, per instance + hub): Scenarios (also closes smart-base, bootstrap-tools, bootstrap rows), Policies (.jsonld), Test plan, Tool releases, Vocab mapping, Substrate snapshots (honest but empty: no committed `<id>.substrate.json`).
- **Waiver:** already closed by the memory viewer.

## Owner decision — basic-cdn-site (cat-harness `site/`, stored on gh-pages)

Nothing on disk renders it; declaring its kind-description page would not be a viewer.
1. **(recommended)** Build a small publish-time page that reads the gh-pages branch and lists its routes (~100–150 lines + Tool + builtAtPublish).
2. Exempt it (`renderExemption.of: ["visualiser"]` on cat-harness): it is the published site itself, which a reader already browses.
Default if no answer: 1, when next picked up.

## Out of this session's push scope — what each needs
- **bootstrap-tools Skills:** auto-docs reads only instances stacked ON cat-harness (`known-skills.ts` `stackedOn: root`); bootstrap-tools is below. Either widen auto-docs to dependencies (isolation-policy call) or exempt.
- **smart-base External schemas:** `gen-external-schemas-viz.ts` reads only its own harness's registry; needs a per-instance page.
- **smart-base / smart-immunizations L1 extraction:** no Tool renders `l1-extraction`.
- **smart-base / who-iris Themes:** no Tool renders `themes`.
- **folio-assistant-sci Lean:** declare a visualiser over the doc-gen4 output (`lean-html-docs` skill) via a Tool that renders `lean`.
- **smart-trust IG AST, OpenAPI:** no viewer; declaration or build in smart-trust / fhir-harness.

## OWNER, 2026-10-20 (owner, structured question, 2026-10-20 ~18:00Z; session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6) — basic-cdn-site

**"Build route listing"**: a publish-time page listing the site's routes (with a Tool and a builtAtPublish entry), not an exemption.

## 2026-10-22 — `basic-cdn-site` route listing landed and deployed on `gh-pages`
- `basic-cdn-site` viewer (`site-viewer` / `cat-harness-tools/scripts/gen-site-viz.ts`, `cat-harness-tools#494`) and declaration (`cat-harness/cat-harness.json` `visualisers` `"id": "site"` + `builtAtPublish` `docs/en/cat-harness/site/`, `cat-harness#390`) landed on `main` and are live on `gh-pages` (`ec00fd2438`).
- Of the 13 rows named in this bean's title/body, **11 are now live** (`scenarios` ×3, `policies`, `UML`, `test plan`, `tool releases`, `vocab mapping`, `voice vendors`, `waivers`, `substrate snapshots`, `basic CDN site`). Only 2 cross-repo items remain: `folio-assistant-sci` `lean` and `bootstrap-tools` `skills`.

## 2026-10-22 — claimed by lane B2 (session https://claude.ai/code/session_01Kymnx79TxWvxVoLzcAjBRr): themes portion

Themes viewer: litlfred/cat-harness-tools#554 (`theme:viz` / `theme:viz:check`, covering the platform's themes plus each instance's declared themes) and a cat-harness PR (the theme-viewer Tool, the `themes` visualiser and the builtAtPublish entry; it needs #554 first). The l1-extraction listing is NOT part of this claim. Under the owner ruling of 2026-10-16 it is smart-base's own Tool `l1-extraction-pages` (draft cat-harness#323), which lane S holds.

_2026-10-23T08:17:00Z_ — Progress update:
- `litlfred/cat-harness-tools#554` (`theme:viz` / `theme:viz:check`, `ceb3750849`), `litlfred/cat-harness-tools#565` (`14bcf899c3`), and `litlfred/cat-harness#417` (`Build the instance themes at publish`, `5c541ea29d`) are merged; `litlfred/cat-harness#414` (`themes visualiser: Tool, route and built page (6gme)`) is open in CI.
- `litlfred/folio-assistant-sci#21` (`lean: dynamic visualiser over knowledge-graph shards (doc-gen4 doc-data → JSON-LD), with STAGING overlays`, `f7f766b188`) is merged on `folio-assistant-sci` `main`, adding the `lean-kg-publish` Tool (`tools/lean-kg-publish/lean-kg-publish.ts`) and `adapters/paper/lean/lean-kg-viewer/`.
- `litlfred/cat-harness-tools#571` (`c726de2`) opened: `scripts/harness-tiles.ts` now honours directory-level `coverage.exempt.visualiser` alongside instance-level `renderExemption`, so `folio-assistant-sci`'s `sci-lean` template directory (`folio-assistant-sci.json` line 181) renders `"no viewer by design"` (`Not a gap`) instead of `"no viewer yet"`, agreeing with `check-subgraph-coverage.ts`.
