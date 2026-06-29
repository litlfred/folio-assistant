---
name: integration-audit
roles: [collaborator, owner]
user_invocable: true
description: >
  Sidecar-invalidation utility for the integration-watcher pipeline.
  Adds mechanical QA fields (script-reviewer entries) to per-block
  `.qa.json` sidecars and marks the existing entries stale so the
  next `qa-sweep` re-evaluates them. Use when a checker bug is
  fixed in a QA checker module (downstream "fresh" entries are
  now incorrect) or when a registry update adds a criterion the
  block hasn't been audited under.
allowed-tools: Read Edit Write Bash Grep Glob AskUserQuestion
---

# /integration-audit — invalidate + re-audit the sidecar pipeline

A maintenance command for the multi-axis QA-sidecar pipeline (`voice`,
`proof`, `canonical`, `compute`, `detangler`, `bibliography`, …). The
two sibling commands — `/integration-watch` (read-side monitor) and
`/integration-backlog` (write-side drain) — both **consume** the
sidecars. This skill **maintains** them.

## When to invoke

- **After a checker bug fix.** Example: a regex was missing the `u`
  flag. Once fixed, every block previously audited under the buggy
  checker has the wrong `result` cached in its sidecar. Re-audit by
  invalidating the affected criterion's entries.
- **After a registry update.** A new criterion lands in
  `qa-criteria-registry.ts`. Existing sidecars don't include it.
  Invalidate forces the sweep to write fresh entries.
- **After a formal-layer / toolchain bump.** Proof criteria (e.g.
  `proof-build-green`, `proof-no-axiom-growth`) may change outcome
  without any block-source change. Invalidate them.
- **For periodic re-validation.** Some criteria (especially agent-kind
  ones) drift over time. Re-running confirms freshness.

## Argument grammar

```
/integration-audit                                 → ask which axis / criterion
/integration-audit one-voice                       → invalidate all one-voice entries
/integration-audit proof                           → invalidate all proof entries
/integration-audit all                             → invalidate every criterion across all axes
/integration-audit voice-emoji-content             → just that one criterion
/integration-audit voice-emoji-content,bib-cite-resolves
                                                   → multiple criteria, comma-separated
```

Args are validated against `qa-criteria-registry.ts` and
`WATCHER_CRITERIA_BY_AXIS`. Unknown IDs are rejected with a helpful
list of valid IDs.

## Behaviour

For each resolved criterion:

1. **Scan** every `.qa.json` sidecar in `content/<paper>/*/*.qa.json`
   for entries matching the criterion ID.
2. **Mark stale** by deleting the entry's `field_hash` (or by appending
   a sentinel `result: "n/a"` script entry that supersedes the
   historical entries). The `qa-utils.entryIsFresh` check will then
   return `false`, and `qa-sweep` will re-evaluate the criterion on next
   run.
3. **Run `qa-sweep --only <criterion-list>`** to repopulate the sidecars
   with fresh entries.
4. **Diff** the before/after counts — surface the delta to the user
   (e.g. `voice-emoji-content: 8 → 11 fails` after the regex fix caught
   previously-missed glyphs).

## Per-criterion invalidation strategy

| Criterion kind | Strategy |
|----------------|----------|
| Pure script (`automated: true`) | Delete every `kind: "script"` reviewer entry; sweep re-runs the checker on the next pass. |
| Agent-only (`automated: false`) | Default: leave entries untouched (the script run won't reproduce them). Pass `--include-agent` to also delete `kind: "agent"` entries — the user must then dispatch the agent manually (typically via `/integration-backlog <axis>`). |
| Human (`kind: "human"`) | **Always preserved.** Human adjudications are the final authority and never auto-invalidated. |

## Implementation

Backed by a CLI script `content/pipeline/integration-audit.ts` that:

- Walks every `.qa.json` under `content/<paper>/` via `walkBlocks`.
- For each criterion in the invalidation set:
  - Deletes every `kind: "script"` reviewer entry (regardless of
    `result`).
  - Also deletes `kind: "agent"` entries when `--include-agent` is
    passed.
  - Preserves all `kind: "human"` entries.
  - Removes the criterion key from `report.criteria` entirely if no
    entries remain.
- **Automatically re-runs `qa-sweep --only <criterion-list>`** as a
  child process (via `spawnSync`) to repopulate the sidecars, unless
  `--no-sweep` or `--dry-run` is passed.

## Persistence

Logs every invalidation run to `.beans/integration-audit-ledger.md`:

```markdown
### 2026-05-20T14:50Z — voice-emoji-content
- reason: emoji-regex u-flag fix (commit 186a31fe)
- scope: 1920 sidecars scanned
- entries invalidated: 8 script-reviewer entries
- post-sweep delta: 8 → 11 fails (3 newly-caught from colour glyphs)
- next: /integration-backlog one-voice
```

## AskUserQuestion (no-argument case)

🟡 [Yellow Circle] Waiting on user — pick the axis or criterion to
invalidate.

| Option | Trade-off |
|--------|-----------|
| `one-voice` | Most common — re-audit voice + fit + framework criteria. Risk: low; sweep is fast even at corpus scale. |
| `proof` | Re-audit the proof criteria. Risk: medium — `proof-build-green` requires the formal-layer toolchain; `proof-lean-compiles` uses an LSP diagnostics cache; falls back to last cached artefacts. |
| `canonical` | Re-audit derivation-discipline criteria. Risk: low. |
| `compute` | Re-audit compute-wiring criteria. Risk: low — runs the compute-audit scan. |
| `detangler` | Re-audit structural criteria. Risk: low. |
| `bibliography` | Re-audit block-level bib criteria. Risk: low — reads `bib-qa.json`. |
| `all` | Full re-audit across all axes. Risk: medium — sweep takes longer. |

Multi-select, default `multiSelect: true` per AGENTS.md accessibility
convention.

## Integration

- **Built on**: `integration-watcher` (the audit pipeline this skill
  maintains)
- **Sibling commands**:
  - [`/integration-watch`](integration-watch.md) — read-only monitor
    over the sidecars
  - [`/integration-backlog`](integration-backlog.md) — write-side drain
    of the open findings
- **CLI**: `content/pipeline/integration-audit.ts`

## Examples

```
User: /integration-audit
→ multi-chip AskUserQuestion (axes + `all`); user picks one or more.

User: /integration-audit voice-emoji-content
→ Invalidates sidecars' voice-emoji entries, re-runs sweep, reports
  delta quickly.

User: /integration-audit proof
→ Invalidates the proof criteria × all sidecars. Sweep runs the
  formal-layer-side checkers and writes fresh entries.

User: /integration-audit all
→ Full re-audit. Useful after a major checker refactor.
```
