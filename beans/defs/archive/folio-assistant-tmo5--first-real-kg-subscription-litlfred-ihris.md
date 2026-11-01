---
# folio-assistant-tmo5
$schema: bean/1.0.0
title: 'First real KG subscription: litlfred/ihris'
status: completed
type: task
priority: normal
created_at: 2026-10-29T12:20:00Z
updated_at: 2026-10-30T15:05:00Z
parent: folio-assistant-fnx4
---

## Parent

folio-assistant-fnx4

## Why

fnx4's own "Done when" box "first real subscription: `litlfred/ihris`" is unchecked, and no instance declares a real subscription yet. All earlier children are completed, so this records the remaining work as an open child for `check:bean-rollup`.

## Done when
- [x] an instance declares a `subscriptions` entry for `litlfred/ihris` and it materialises (`litlfred/cat-harness-tools#889`, `litlfred/cat-harness#730`)

_2026-10-30T12:45Z_ — Owner, 2026-10-30 12:39Z (card "A. Apply all"): go ahead with the litlfred/ihris subscription. Gap G11 is settled by moving slice 7 to slice 5's snapshot-directory layout. This needs a session with litlfred/ihris attached. (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

_2026-10-30T13:50Z_ — PRs opened and verified:
- **`litlfred/cat-harness-tools#889`** (`claude/kg-ihris-subscription-cat-harness-tools`, commit `da968f6`):
  - **Gap G11 settled**: `kg:instantiate` (slice 7) now places a chosen harness's state directories under `<snapshot dir>/<subscription>/harnesses/<harness>/` (`harnessHomeOf` in `scripts/kg-parts.ts`, re-exported from `scripts/kg-subscribe.ts`, replacing `harnessHome(root, harness)` in `scripts/kg-instantiate.ts`).
  - **`partRecordsIn`** (`scripts/kg-subscribe.ts`): recognises `harnesses/<harness>/` directories as `homes` rather than flagging them as `strays`, so `kg:materialize:check` and `subscriptions-viz` stay clean when a harness is instantiated (while a loose file directly under `harnesses/` is still flagged as a stray).
  - **`knownSubstrates`** (`scripts/subscriptions-viz.ts`): derives an `exists` row (source `"subscription"`, titled from the cached snapshot) for each `subscriptions` entry so `ihris` remains in the known-substrates registry after moving from `associatedHarnesses` to `subscriptions`.
  - **`scripts/tests/associated-harness-config.test.ts`**: asserts `cat-harness` relates `ihris` **exactly once** (`associated + subscribed === 1`), passing both before and after `litlfred/cat-harness#730` merges.
- **`litlfred/cat-harness#730`** (`claude/kg-ihris-subscription-cat-harness`, commit `0a71ca8`, merge after `cat-harness-tools#889`):
  - Declares the first real `subscriptions` entry in `cat-harness.json`: `id: "ihris"`, `repository: "litlfred/ihris"`, `ref: "7a89f67282f53c1ace2e1cfe4d913ebfad466783"`, `subgraphs: ["skills"]`, `assets: { policy: "on-demand" }`, `harnesses: []` (per the owner's 2026-09-23 ruling not to publish `ihris` under `/folio-assistant/ihris/`), and removes the `associatedHarnesses` entry for `ihris`.
  - Commits `subscriptions/ihris.substrate.json` written by `bun run cat kg:subscribe` (`sha256: ae697819db3dc74156ad5f607a3d93a3e26527d1b811de9a7ed3960d6cd4df65`, 11 subgraphs, 1 harness) and updates `subscriptions/README.md` and `skills/library/large-datasets/kg-subscription.md` for the G11 layout.
  - Materialisation verified on `ihris` `skills` (`63862` bytes, `18` files at `7a89f67282f5`, tree digest `1dab8f68…`); no upstream bytes committed pending owner decisions on the four person gates (`ihris` carries no root licence).
  - Verified: `141 pass / 0 fail` across the 6 KG subscription/instantiation test suites, `tsc --noEmit` clean, and `kg:subscribe:check`, `kg:materialize:check`, `check:materialized-fixity`, and `subscriptions:viz:check` all green.

_2026-10-30T15:05Z_ — Done. cat-harness declares the `ihris` subscription (cat-harness#730, 91c7116). Its `skills` subgraph is materialised in cat-harness#744 (854d7ac): 18 files, 63,862 bytes, tree digest 1dab8f68…, ihris at 7a89f67, purpose both, all four gates permitted on the owner's card of 2026-10-30 14:52Z. G11 was fixed in cat-harness-tools#889, and the panel shows subscribed harnesses (tools#894, cat-harness#735). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)
