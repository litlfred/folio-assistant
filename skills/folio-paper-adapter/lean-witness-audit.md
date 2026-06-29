---
name: lean-witness-audit
roles: [collaborator, owner]
description: >
  Audit computation scripts (typically Python) that produce witness statements
  for Lean formalization. Verify witnesses are complete, self-documenting, use
  paper notation, link to a content block, and emit Lean-compatible declarations.
  Detects staleness via script content hash and git commit SHA.
allowed-tools: Read Edit Bash Grep Glob
---

# Lean Witness Audit Skill

## Purpose

Audit computation scripts that produce witness statements
for Lean formalization. Ensure the witness output is complete,
self-documenting, uses the paper's notation, and maps directly to
Lean declarations.

A **witness** is the durable, machine-checkable record that a numerical
or symbolic computation underpinning a formalized result was actually
run, with what inputs, and what it produced. The witness links a content
block, the computation script, and the Lean declaration(s) the
computation supports.

## Unified Witness Infrastructure

### Python witness base (`witness_base.py`)

All new computation scripts should use the `WitnessBuilder` class:

```python
from witness_base import WitnessBuilder

w = WitnessBuilder("my-computation", engine="sympy")
w.set_description("Computes foo from bar")
w.set_content_block("prop:my-proposition")  # links to content block
w.add_assertion("MyConstant", computed=2.0298, expected=2.0298,
                tolerance=1e-10, source="ExternalRef")
w.add_parameter("q", q0)
w.add_data("extra_result", {"key": "value"})
w.save()  # → my-computation.witness.json
```

The builder automatically captures:
- **commitSha**: Git HEAD at computation time
- **scriptHash**: SHA-256 of the script file (for staleness detection)
- **scriptCommitSha**: Last commit that touched the script
- **computedAt**: ISO 8601 timestamp
- **engine** / **engineVersion**: Computation engine info
- **assertions**: Structured pass/fail checks with tolerances
- **contentBlock**: Link to the content block this witnesses

### Staleness detection

A witness is **stale** when:
1. The script's content hash has changed since the witness was generated
2. The script's git commit SHA has changed since the witness was generated

Check staleness:
```bash
# Single witness
python3 witness_base.py check-stale my-computation.witness.json

# All witnesses
python3 witness_base.py check-all

# Unified audit (Lean + Python)
bun run scripts/witness-audit.ts
```

### Legacy witness migration

Existing witnesses may use ad-hoc JSON schemas rather than the
structured `ComputationWitness` format. When modifying a legacy
computation script, migrate it to `witness_base.py`:

1. Replace manual `json.dump()` with `WitnessBuilder`
2. Add `w.set_content_block("label")` to link to the content block
3. Convert key results to `w.add_assertion()` calls
4. Move supplementary data to `w.add_data()`
5. Run the script to regenerate the witness with the new format

## When to invoke

- After any computation script that outputs `.witness.json` or
  `.lean.txt` files
- Before committing witness data
- When reviewing a computation that backs a formalized result

## Audit checklist

The checklist below is the **generic shape** of a witness audit. The
specific notation, inputs, and outputs are project-specific — build the
concrete tables for the paper at hand; the audit *structure* is what
generalises.

### 1. Notation compliance

- [ ] **No internal shorthand.** Every symbol must use the paper's
  canonical notation, not the computation script's internal variable
  names (e.g. the paper's `σ_i` not `s0`/`si`/`sigma(0)`; the paper's
  identity symbol, not `1` or `identity`). Maintain a notation map of
  internal-name → paper-symbol for the project.

- [ ] **Paper references.** Every formula must cite the content
  block label it comes from (`def:…`, `prop:…`, `thm:…`).

### 2. Completeness

- [ ] **All inputs stated.** The witness must list every parameter and
  derived constant the computation consumed.

- [ ] **Every computation step shown.** For a multi-step reduction /
  derivation, the witness must record: the input element (in paper
  notation), the element before each transformation, which rule fired,
  any cost/weight metric tracked, and the element after.

- [ ] **Final result.** Must include the final normal form / value with
  all metadata, plus any aggregate metrics (step counts, totals) and an
  identification against a known catalogue entry where applicable.

### 3. Lean compatibility

- [ ] **Declarations.** The witness must include Lean-compatible
  output — `def`/`theorem` declarations whose statements match the
  computed values, e.g.:
  - `def <name>_value : <Type> := ...`
  - `theorem <name>_is_normal_form : is_normal_form (<name>_value) := by ...`
  - `theorem <name>_metric : metric <name>_value = <value> := by ...`

- [ ] **Types match.** The Lean declarations must use the types from
  the paper's own Lean library, not ad-hoc types.

- [ ] **Witness JSON structure.** The `.witness.json` must have:
  - `computation`: string identifier
  - `timestamp`: ISO 8601
  - `parameters`: all input constants
  - any project-specific input structures (e.g. a relation set / ideal)
  - `steps`: array of step-by-step transformations
  - `normal_form` / `result`: the final value with all metadata

### 4. Provenance / variant tracking

- [ ] **Formation path.** When a result can arise via multiple paths
  with potentially different intermediate forms, state which path the
  witness records.

- [ ] **Ordering dependence.** If the construction order affects the
  result (different inputs for different orderings), document ALL
  orderings tested and which one is canonical (e.g. minimises the
  tracked metric).

### 5. Decomposition over a basis (when applicable)

- [ ] **Basis decomposition.** If the result is meaningfully decomposed
  over a catalogue / basis, list the basis elements and the computed
  coefficient against each.

- [ ] **Semantic labels.** Each basis coefficient should carry the
  paper's interpretation of that component.

- [ ] **Residual.** State the decomposition residual norm. A residual
  above tolerance means the result has components NOT in the chosen
  basis — flag these as genuinely new / unmodelled.

## Failure modes

- **Abbreviated notation**: Using internal script variable names instead
  of the paper's symbols makes the witness unreadable outside the
  computation context.

- **Missing inputs**: A witness without all inputs stated cannot be
  verified independently.

- **No Lean output**: The computation is not formalized unless it
  produces Lean-compatible declarations.

- **Silent steps**: If a transformation happens but isn't logged, the
  step/metric accounting is wrong.
