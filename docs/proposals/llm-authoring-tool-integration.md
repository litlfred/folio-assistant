# Proposal — Lean tooling as skills and QA checks

**Status:** proposal · **Beans:** `3cw6` `36f8` `r0ax` (landed/in-flight),
`dm4g` `ajsu` `6xhf` `nimj` `7wda` `15gn` (proposed)

Where four external Lean tools — **Lean Atlas**, **Nazrin**, the
**Lean Refactor / Proof-Refactor** cluster, and **LeanDojo** — earn a
place in folio's agentic authoring and QA-sidecar workflows, and how
each one wires into the skills that already exist.

> On naming: "LeanRefiner" does not resolve to a real project. The work
> in that space is [Lean Refactor](https://arxiv.org/abs/2605.20244),
> [Proof-Refactor](https://arxiv.org/pdf/2606.03743), and
> [ProofOptimizer](https://arxiv.org/pdf/2510.15700); this proposal
> treats them as one cluster.

---

## 1. The integration contract

folio already has a repeatable way to absorb an external tool, used for
the lean-lsp MCP server and for the AlphaProof-Nexus rubric
(arXiv 2605.22763 → `proof-rater-*`, `proof-statement-integrity`). Every
tool below enters the same way, and **no tool becomes a hard dependency
of the interactive loop**:

```
capability probe          .claude/skills/capabilities/<tool>.json
        ↓                 (detection + `requires`, gates --check-deps)
cached audit artefact     docs/audits/<tool>.json
        ↓                 (--ingest JSONL, SHA-stamped, --stale reporter)
registered criterion      content/pipeline/qa-criteria-registry.ts
        ↓                 (automated + depends_on + extra_inputs)
checker or skill          qa-checkers-*.ts  |  skills/**/<skill>.md
        ↓
watcher axis              WATCHER_CRITERIA_BY_AXIS → integration-backlog
```

Four properties this buys, all of which are load-bearing:

1. **Absent tool ⇒ `n/a`, never a false pass.** `proof-lean-compiles`
   already models this. A checker that cannot get its data must say so.
2. **Stale cache ⇒ `n/a`.** Every artefact carries the source SHA at
   collection time (`lean_sha`), so a checker knows its input is stale
   without re-running the tool.
3. **Checker-logic change ⇒ auto-invalidation.** `script_hash` +
   `deps_hash` over `extra_inputs` invalidate downstream sidecar entries
   when the checker or its inputs move.
4. **Advisory by default.** These tools inform agent judgement. Only
   findings folio can defend mechanically are allowed to fail a build.

**Licensing:** LeanDojo is MIT. Atlas, Nazrin, and the refactor cluster
must be checked before anything is vendored.

---

## 2. Lean Atlas — the formal graph

[arXiv 2604.16347](https://arxiv.org/abs/2604.16347) ·
[NyxFoundation/lean-atlas](https://github.com/NyxFoundation/lean-atlas)

A Lake-integrated CLI that extracts constants and their dependencies,
classifies each edge as a **type dependency** (statement-level) or a
**value dependency** (proof-level), and exports JSON. Its core
algorithm, **Lean Compass**, computes the minimal set of
project-specific nodes whose *semantic* correctness can affect a chosen
target set (227 → 14 nodes in the paper's example).

This is the highest-value adoption, because it supplies something folio
structurally lacks: the formal dependency relation. `uses[]` is
editorial and always was — see `schemas/types.ts` and the
`uses-editorial-review` skill.

### Proposed checks

| Criterion | Kind | Severity | Notes |
|---|---|---|---|
| `uses-formal-coverage` | script | minor | **landed.** Formal deps outside the editorial cone = candidate exposition gaps. Advisory; `n/a` without the cache. |
| `proof-statement-dep-drift` | script | major | A block's **type**-level deps changed since its last `proof-narrative-lean-equiv` adjudication ⇒ the narrative may no longer match. Value-level changes do not trigger it. |
| `lean-ref-owns-decl` | script | major | Every `lean.ref` resolves to a decl Atlas actually saw, and no two blocks claim the same decl (`content-graph.ts` currently resolves ties first-writer-wins and does not adjudicate). |

### Proposed skills

- **`lean-atlas-ingest`** — run the Atlas CLI (or drive it agent-side),
  write `docs/audits/lean-atlas-deps.json`, report `--stale`. Mirrors
  `lean-compile-audit.ts` exactly.
- **`semantic-review-scoping`** — wrap Lean Compass: given target
  theorems, return the semantic-impact node set.

### Integration with existing skills

| Existing | How Atlas changes it |
|---|---|
| `content-graph` | Gains the formal edge set; graph questions become union-by-default (`content-graph.ts` shipped) |
| `detangler-integration-watcher` | Its metrics stay **editorial-only** — ordering is a reading-order question. Atlas does *not* feed graph energy or forward-ref checks |
| `critical-path-analysis` | Should switch to the **union**: "what blocks the paper" is an impact question, and today it sees only half the edges |
| `proof-status-tracking` | Atlas's per-constant metadata (confidence, proof progress) can be **projected from** `.qa.json`, making the Atlas viewer a human review UI over folio QA state |
| `proof-narrative-lean-equivalence` | Consumes `proof-statement-dep-drift` to know when a re-check is owed |
| `prepare-merge` | Adds an Atlas-staleness gate alongside `lean_build` |

---

## 3. Lean Compass — scoping the expensive axes

The costly criteria are all `automated: false`:
`proof-narrative-lean-equiv`, `proof-statement-integrity`, the four
vacuity criteria, the three `proof-rater-*`. Each costs agent turns, and
today a sweep has no principled order — it walks the corpus.

Compass gives a defensible order: for a target theorem set, which nodes'
semantic correctness can actually affect it.

### Proposed check

| Criterion | Kind | Severity | Notes |
|---|---|---|---|
| `proof-semantic-cone-reviewed` | script | major | Every node in a headline theorem's Compass cone has a **fresh** adjudication of the agent-checked criteria. Turns "did we review enough?" into a computed answer. |

### Integration with existing skills

| Existing | How Compass changes it |
|---|---|
| `integration-backlog` | Orders dispatch by semantic impact instead of corpus order — the single biggest agent-budget saving on offer |
| `proof-triage` | Cone membership becomes a triage input alongside complexity |
| `proof-integration-watcher` | Bounds re-adjudication after a change to the affected cone |
| `delivery-summary` | Can state review coverage against headline theorems, not raw block counts |

No schema change. Depends on §2.

---

## 4. Nazrin — a triviality oracle, not a prover

[arXiv 2602.18767](https://arxiv.org/html/2602.18767)

A GNN over a minimal Lean expression graph (`ExprGraph`) emitting
*atomic* tactics from a small fixed action space; trains and runs on
consumer hardware.

As a prover it will not beat the frontier model already in the loop.
**Inverted, it is valuable:** if a cheap CPU model closes a goal in a
handful of atomic tactics from cold, the statement probably carries no
content. That is exactly what folio's vacuity family exists to catch —
and five of its six criteria are `automated: false`, i.e. they burn
agent turns on every sweep.

### Proposed check

| Criterion | Kind | Severity | Notes |
|---|---|---|---|
| `proof-not-machine-trivial` | script | minor (`warn`) | Emits `atomic_steps_to_close` / `oracle_closed` to `metrics`. A closed goal is a **prompt for human review**, never a verdict — some genuine results are one-liners. |

### Integration with existing skills

| Existing | How Nazrin changes it |
|---|---|
| `lean-proof-vacuity-audit` | Gets a cheap pre-filter; the agent reads oracle-flagged blocks first instead of sweeping |
| `proof-rater-novelty` | `atomic_steps_to_close` is direct evidence for the novelty score |
| `proof-gap-audit` | `routine`-tagged gaps become candidates for oracle closure |
| `lean-build-fix` | Optional first attempt before spending agent turns |

**Gate on evaluation.** Measure the false-positive rate on the qou
corpus before adopting. Its entire value is that rate; if it flags
genuine content as trivial, it costs more attention than it saves.

---

## 5. Lean Refactor / Proof-Refactor — measurable simplification

[Lean Refactor](https://arxiv.org/abs/2605.20244) ·
[Proof-Refactor](https://arxiv.org/pdf/2606.03743)

`proof-simplifier` today has a hand-written anti-pattern table and an
MCP-first workflow, but **no cost measurement**. It references
`lean_profile_proof` and records nothing, so gains are judgement-only
and regressions are invisible.

Lean Refactor's real contribution is not a model — it is a **strategy
database**: refactoring strategies annotated with supported Lean/Mathlib
versions and expected compile-cost reduction, retrieved to steer a
*frozen* LLM. That is a data asset folio can grow incrementally, and it
is version-aware, which matters for a corpus that outlives Mathlib
releases. Proof-Refactor is built on Claude Code + lean-lsp-mcp — the
same stack — so its loop is the cheapest thing to lift.

### Proposed checks

| Criterion | Kind | Severity | Notes |
|---|---|---|---|
| `proof-compile-cost` | script | minor | Records `elab_ms` / `tactic_count` from `lean_profile_proof` into `metrics`. Pure measurement — makes refactor gains and regressions visible. |
| `proof-no-cost-regression` | script | major | A block's compile cost did not regress materially vs the prior commit without a statement change to justify it. |

### Proposed skill

- **`refactor-strategy-curator`** — maintain
  `content/pipeline/refactor-strategies/*.json` (pattern, version range,
  expected gain, evidence). Sibling to `lean-mathlibext-curator`, which
  already curates in the adjacent direction.

### Integration with existing skills

| Existing | How the refactor cluster changes it |
|---|---|
| `proof-simplifier` | Anti-pattern table becomes the seed of the versioned strategy DB; before/after cost replaces "estimate the reduction in proof length" |
| `proof-conciseness` | Shares the cost metric as its objective |
| `lean-mathlibext-curator` | Version metadata is the same problem; share the schema |
| `proof-integration-watcher` | Gains a cost-regression signal |
| `prepare-merge` | Cost regression becomes a reportable gate |

---

## 6. LeanDojo — deferred

[arXiv 2306.15626](https://arxiv.org/abs/2306.15626) · MIT

Gives a traced-repo artefact with premise-use annotations, a premise
index, and a programmatic `run_tac` environment. `formalizer` steps 3–4
currently use `lean_leansearch` / `lean_loogle` — network calls to
external services — so a local premise index would be offline-capable
and repo-specific.

Against: heavy full-build trace, Python-side against a Bun/TS pipeline,
version-pinned to specific Lean/Mathlib. **CI-only artefact if adopted
at all**, and likely redundant with leansearch/loogle for most folios.

**Recommendation: do not adopt now.** Revisit only if a folio hits real
leansearch/loogle latency or needs offline operation. ReProver as a
fallback tactic generator: skip — the frontier model in the loop is
better.

---

## 7. Workflow integration

### New watcher axis

`uses` joins `WATCHER_CRITERIA_BY_AXIS` (landed), so
`/integration-watch uses` and `/integration-backlog uses` work with no
further wiring. Atlas- and refactor-derived criteria extend the existing
`proof` axis rather than adding more.

### `prepare-merge`

Content-type-specific gates for a paper folio gain, in order of cost:

1. `qa_sweep --axis uses` — mechanical hygiene (already runnable)
2. Atlas staleness — is the formal graph fresh against the `.lean` tree?
3. Cost regression — did any proof get materially more expensive?

Each reports; none blocks until it has earned trust on a real corpus.

### Session start

`beans prime` already surfaces the work-plan. No change — these tools
are pipeline capabilities, not coordination mechanisms.

### Agent authoring loop

Where a tool enters the loop an author actually runs:

| Authoring moment | Skill | Tool |
|---|---|---|
| Writing a new block's `uses[]` | `uses-editorial-review` | — (editorial judgement, deliberately un-automated) |
| Formalising a statement | `formalizer` | LeanDojo premise index *(deferred)* |
| Filling a `sorry` | `lean-build-fix` | Nazrin first attempt |
| Reviewing a finished proof | `lean-proof-vacuity-audit` | Nazrin triviality flag |
| Tidying a proof cluster | `proof-simplifier` | Refactor strategy DB + cost metric |
| Deciding what to review next | `integration-backlog` | Lean Compass scoping |
| Checking exposition | `uses-editorial-review` | Atlas formal-coverage advisory |

---

## 8. Sequencing

| Order | Bean | Why here |
|---|---|---|
| 1 | `3cw6` `36f8` `r0ax` | **Landed.** Editorial/formal split + typed graph + `uses` axis. Everything else assumes it. |
| 2 | `dm4g` | Atlas ingest — supplies the formal edge set the graph is already shaped for |
| 3 | `ajsu` | Compass scoping — largest agent-budget saving, no schema change |
| 4 | `6xhf` | Staleness split — needs Atlas's type-vs-value classification |
| 5 | `7wda` | Refactor DB + cost metric — independent, can run in parallel |
| 6 | `nimj` | Nazrin — evaluate first, adopt only on a good false-positive rate |
| 7 | `15gn` | LeanDojo — deferred; revisit on evidence |

## 9. What could go wrong

- **`uses[]` pollution by good intentions.** The single largest risk.
  Once the formal graph is visible next to the editorial one, someone
  will want to sync them. Every artefact here says not to, in the
  criterion descriptions and the schema doc comment, because the code
  cannot enforce it.
- **Advisory findings hardening into gates.** `uses-formal-coverage`
  and `proof-not-machine-trivial` are `minor` deliberately. Promoting
  them without evidence would flood the backlog with correct-but-absent
  edges and one-line-but-genuine proofs.
- **Cache staleness read as cleanliness.** Mitigated structurally by
  `hasFormal` and the `n/a` posture, but every new checker has to
  re-earn it.
- **Version drift.** Atlas and Nazrin are pinned to Lean/Mathlib
  versions a folio will outgrow. The capability probe must fail closed.
