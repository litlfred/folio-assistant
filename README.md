# cat/cat-harness/health

Repository health reports for litlfred/cat-harness: the `health-report/v1` document the
daily sweep (`cat-harness-tools/test/health/run.ts`) writes, under `test/health/results/`. A
named-subgraph state branch, one per subgraph (owner, 2026-10-03, bean `laqs`:
"Keep per-graph branches"), declared on the `health` directory with
`source: { kind: "branch", branch: "cat/cat-harness/health", keyedBy: "tip" }` in
`cat-harness.json`.

- **Seeded** 2026-10-11T06:03:01Z from `main` at `c01ed737a02276e156ead8ab7df37258f31c7903`. Owner, 2026-10-11 (session
  01UC1NuEuSy1MBNpEhnDuiGj, 05:58:12Z): "move health to state branch now".
  `main` drops `test/health/results/` in the same change, so this branch is the only store.
- **Layout:** paths mirror the checkout (`test/health/results/**`); the root `manifest.json`
  (`state-manifest/v1`, `keyedBy: tip`) makes it a state branch.
- **Writes:** spliced onto the tip through `scripts/branch-store.ts`
  (`bun run cat state:mount`, then `bun run cat state:push`), never
  force-pushed, never merged into `main`.
