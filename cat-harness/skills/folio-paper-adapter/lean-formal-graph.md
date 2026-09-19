---
name: lean-formal-graph
roles: [reader, collaborator, owner]
user_invocable: true
description: >
  Build and query the FORMAL dependency graph — what a proof actually
  invokes, derived from `lean.ref`. Distinct from `uses[]`, which is
  editorial. Use for impact analysis, exposition gaps, and declaration
  ownership.
allowed-tools: Bash Read
---

# Lean formal dependency graph

## The relation this skill owns

A block participates in two dependency relations. This skill owns the
**formal** one — what a proof actually invokes, machine-derived from
`lean.ref`. The **editorial** relation (`uses[]`, what a reader must
have read) is owned by `uses-editorial-review`.

**Never write formal dependencies into `uses[]`.** They answer different
questions and diverge legitimately in both directions.

## Get a graph

```sh
# Does one exist yet?
bun run content/pipeline/content-graph.ts content/<paper>
```

If it reports `cache ABSENT — formal graph unavailable`, populate it:

```sh
# Preferred: Lean Atlas (elaborated, authoritative)
scripts/install-lean-atlas.sh          # provisions the Lake require
lake exe atlas graph-data --output /tmp/atlas.json --pretty
# → adapt to folio's JSONL, then:
bun run content/pipeline/lean-atlas-ingest.ts --ingest /tmp/deps.jsonl

# Fallback: no Lean toolchain needed
bun run content/pipeline/lean-atlas-ingest.ts --scan content/<paper>
bun run content/pipeline/lean-atlas-ingest.ts --stale
```

## Know which source you have — it changes what you may claim

| `formalSource` | What it is | What you may conclude |
|---|---|---|
| `atlas` | Elaborated. Real type/value split. | Authoritative |
| `scan` | Syntactic. Misses `simp`/instance/unfolding deps; can over-report a coincidental name. | Indicative — a missed edge SHRINKS results, which is the dangerous direction |
| absent | No graph | `n/a`. **Not** "no dependencies" |

The last row is the one agents get wrong. An empty formal edge set means
the data was unavailable, not that the corpus has no formal structure.
Say which you have.

## Type vs value edges

- **type** — the declaration's *signature* mentions the target. Changing
  the target changes what this block **claims**.
- **value** — only the *proof term* mentions it. Changing the target
  changes how the block is **justified**, not what it says.

That split is why a proof-body rewrite no longer invalidates
statement-level QA (`lean_granularity: "statement"`), and why the
semantic cone propagates over type edges only.

## What to use it for

| Question | How |
|---|---|
| What breaks if this changes? | `g.cone(label)` — the **union**, the default |
| What must a reader read first? | `g.cone(label, "editorial")` — a different question |
| Is the narrative leaving a gap? | `uses-formal-coverage` (advisory; most formal-only edges are correct) |
| Who owns this declaration? | `g.declOwners` / `lean-ref-owns-decl` |
| What should I review first? | `semantic-review-scoping` |

## Declaration ownership

A declaration can be attached to only **one** block. When two claim it,
the loser silently forfeits its formal edges.

`lean-ref-owns-decl` audits this, and deliberately does **not** flag a
`prop:x` + `prf:x` pair sharing a decl — that is legitimate and common.
Only two *statement-bearing* blocks colliding is a defect. In practice
those are copy-paste errors, and they are worth fixing on sight: a real
corpus had a "Unital subset" definition pointing at a Gröbner-basis
declaration.

## Interaction with other skills

| Skill | Interaction |
|---|---|
| `uses-editorial-review` | Owns the editorial relation; consumes the advisory coverage signal |
| `semantic-review-scoping` | Consumes type edges to bound agent review |
| `detangler-integration-watcher` | Editorial-only by design — do not feed it formal edges |
| `critical-path-analysis` | Uses the union; impact is a union question |
| `lean-cache-restore` | Restore oleans before any Lean work |
