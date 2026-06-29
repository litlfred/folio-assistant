---
name: lean-completeness-audit
roles: [collaborator, owner]
description: >
  Audit Lean formalization completeness across all papers: verify Lake
  project setup, check import coverage, identify missing .lean files for
  content blocks that require them, report formalization gaps, and
  detect stale witnesses.
allowed-tools: Read Bash Grep Glob Agent
---

# Lean Completeness Audit Skill

## Role

Verify that every paper's Lean formalization is structurally complete:
correct Lake project setup, all required imports present, content
blocks that require `.lean` files have them, and all witnesses are
current (not stale).

## When to Use This Skill

- "audit lean completeness"
- "check lean coverage"
- "which blocks are missing lean files?"
- "verify lean project setup"
- "formalization gaps"
- "stale witnesses" / "witness staleness"
- After adding a new paper or chapter
- Before tagging a release
- After modifying any `.lean` or `.py` computation file

## Automated Audit Scripts

### Deep Lean audit (chapter-by-chapter)

```bash
bun run scripts/lean-audit.ts            # console report
bun run scripts/lean-audit.ts --json     # JSON for programmatic use
bun run scripts/lean-audit.ts --chapter ch5  # filter to one chapter
bun run scripts/lean-audit.ts --strict   # exit 1 on uncited sorry
bun run scripts/lean-audit.ts --strict --check-axioms  # also fail on axioms
bun run scripts/lean-audit.ts --help     # full CLI reference
```

This script produces:
- Sorry inventory with citation checking
- Trivial truth detection (`True := by trivial` placeholders)
- Axiom inventory
- Witness staleness (commit SHA comparison)
- Chapter-by-chapter breakdown

### Unified witness staleness audit (Lean + Python)

```bash
bun run scripts/witness-audit.ts             # full audit
bun run scripts/witness-audit.ts --lean-only # only Lean witnesses
bun run scripts/witness-audit.ts --py-only   # only Python witnesses
bun run scripts/witness-audit.ts --json      # JSON output
```

### Lean witness management

```bash
bun run scripts/lean-witness.ts status   # show all witness statuses
bun run scripts/lean-witness.ts check <file>  # check single file
bun run scripts/lean-witness.ts stamp <file>  # create witness after build
```

### Python witness staleness

```bash
cd computations
python3 witness_base.py check-all        # check all Python witnesses
python3 witness_base.py check-stale <file>  # check single witness
```

## Audit Steps

### 1. Lake Project Discovery

Verify every paper with `.lean` files has a proper Lake project:

```bash
./scripts/lean-build-all.sh  # discovers via lean-toolchain files
```

**Required files** in each `content/<paper>/lean/`:
- `lakefile.toml` — Lake project config
- `lean-toolchain` — pinned Lean version
- Root module file (e.g., `MyPaper.lean`)

**Cross-checks**:
- All `lean-toolchain` files pin the same Lean version
- All `lakefile.toml` files pin the same Mathlib commit hash
- `srcDir` in lakefile matches the directory structure

### 2. Import Graph Completeness

For each paper, verify the root module transitively imports all `.lean`
files in the project:

```bash
# List all .lean files
find content/<paper>/lean/ -name '*.lean' -not -path '*/.lake/*' | sort

# Check root module imports
cat content/<paper>/lean/<Root>.lean
```

Any `.lean` file not reachable from the root module won't be built.

### 3. Content Block → Lean Coverage

Cross-reference content `.ts` manifests against `.lean` files.
Per AGENTS.md rules:

| Block kind | `.lean` required? |
|-----------|------------------|
| `definition` | **Yes** (enforced) |
| `theorem`, `lemma`, `proposition`, `corollary` | Expected (warning) |
| `conjecture`, `example`, `remark` | Optional |

For each paper:

```bash
# Find all content blocks with lean declarations
cd content/<paper>
grep -r '"lean"' --include='*.ts' -l | sort
```

Check that each `lean.ref` URI in a `.ts` manifest (form `"<pkg>:<Decl>"`,
parse with `parseLeanRef()`) has a corresponding
declaration in the `.lean` files.

### 4. Cross-Paper Import Audit

Check for stale cross-paper imports (an import to a module that was
moved to another paper):

```bash
# In each paper's .lean files, find imports referencing other papers
grep -rn '^import' content/*/lean/ --include='*.lean' | grep -v '.lake'
```

Flag any import that references a module from a different paper's
namespace (these need cross-paper Lake dependencies or should be removed).

### 5. Import Explicitness Audit

Check that `.lean` files explicitly import the Mathlib modules they use,
rather than relying on transitive imports (which break when upstream
imports change):

```bash
# Find files using tactics without explicit imports
for f in $(find content/*/lean/ -name '*.lean' -not -path '*/.lake/*'); do
  uses_omega=$(grep -l '\bomega\b' "$f" 2>/dev/null)
  imports_omega=$(grep -l 'Mathlib.Tactic.Omega' "$f" 2>/dev/null)
  if [ -n "$uses_omega" ] && [ -z "$imports_omega" ]; then
    echo "MISSING: $f uses omega but doesn't import Mathlib.Tactic.Omega"
  fi
done
```

Key Mathlib features that should be explicitly imported when used:

| Feature | Required import |
|---------|----------------|
| `Nat.Prime` | `Mathlib.Data.Nat.Prime.Basic` |
| `Nat.Coprime`, `Nat.gcd` | `Mathlib.Data.Nat.GCD.Basic` |
| `omega` tactic | `Mathlib.Tactic.Omega` |
| `norm_num` tactic | `Mathlib.Tactic.NormNum` |
| `positivity` tactic | `Mathlib.Tactic.Positivity` |
| `field_simp` tactic | `Mathlib.Tactic.FieldSimp` |
| `linarith`/`nlinarith` | `Mathlib.Tactic.Linarith` |
| `ring` tactic | `Mathlib.Tactic.Ring` |
| `Real.sqrt` | `Mathlib.Analysis.SpecialFunctions.Pow.Real` |

### 6. Sorry Audit

List all `sorry` occurrences and verify each has a bibliographic citation:

```bash
grep -rn 'sorry' content/*/lean/ --include='*.lean' | grep -v '.lake'
```

Per AGENTS.md: every `sorry` must have a `-- Ref: [key]` comment.

#### §3b-cond conditional-class carve-out (do NOT discharge these)

Per AGENTS.md §3b-cond, a `sorry` inside a Lean `class` body **is the
conjectural input** — it is permanent by design, NOT a missing-proof
gap. Maintain a catalogue of class-body sorries so a sweep can
distinguish them from missing proofs.

Before flagging a sorry as missing proof:

1. Scroll up from the `sorry` line until you hit either `class <Name>`
   (catalogued — leave alone) or `theorem | lemma | def | instance`
   (regular sorry — verify `-- Ref:` annotation).
2. For class-body sorries, check the catalog. If the class name is
   listed, it's expected; move on.
3. If a class-body sorry is NOT in the catalog, it was added after the
   catalog was generated — regenerate the catalog before triaging.

**Counting caveat:** use `\bsorry\b(?!-)` rather than `\bsorry\b` so the
docstring phrase `sorry-free` is not over-counted (it is a common
false-positive cluster).

#### `proof-objects.json` staleness warning

A `proof-objects.json` extractor that reads generated LaTeX artefacts
(`chapters/*.tex`) can produce 0 objects in a content-object-based repo,
leaving the committed file frozen with placeholder `kind: '?'` /
`status: '?'`. **Do NOT rely on `proof-objects.json` as a current status
source.** Use direct grep for axiom / sorry counts and the catalogue
references above for §3b-cond class sorries.

### 7. Trivial Truth Audit

Detect placeholder proofs that prove `True` instead of the actual statement:

```bash
grep -rn 'True\s*:=\s*by\s*trivial' content/ --include='*.lean' | grep -v '.lake'
```

These are **not genuine proofs** — the theorem statement is `True` (always
provable), not the actual mathematical claim. They must be either:
- Replaced with the correct statement and proof
- Converted to comments / documentation
- Removed entirely

See `lean-proof-vacuity-audit.md` for the full vacuous-proof family.

### 8. Build Verification

Run builds for all papers:

```bash
./scripts/lean-build-all.sh
```

Report:
- Papers that build cleanly (0 errors, 0 sorry)
- Papers that build with sorry (warnings only)
- Papers that fail to build (errors)

### 9. Witness Staleness Audit

After a successful build, stamp witnesses and check for staleness:

```bash
# Stamp a witness after successful Lean build
bun run scripts/lean-witness.ts stamp <lean-file>

# Check if witnesses are current
bun run scripts/witness-audit.ts
```

**Staleness criteria for Lean witnesses:**
- Content hash of `.lean` file has changed since witness was stamped
- Git commit SHA of the file has changed since witness was stamped

**Staleness criteria for Python computation witnesses:**
- Script content hash has changed since witness was generated
- Script's git commit SHA has changed since witness was generated

**Witness infrastructure for Python scripts:**
New computations should use `witness_base.py`:

```python
from witness_base import WitnessBuilder

w = WitnessBuilder("my-computation", engine="sympy")
w.set_description("Computes X from Y")
w.set_content_block("prop:my-proposition")
w.add_assertion("result", computed=1.234, expected=1.234, tolerance=1e-6)
w.save()  # writes my-computation.witness.json with commitSha tracking
```

Legacy witnesses (without `engine`/`commitSha`/`assertions`) should be
migrated to use `witness_base.py` when the computation is next modified.

## Output Format

```markdown
## Lean Completeness Audit

### Project Setup
| Paper | lakefile | toolchain | root module | status |
|-------|---------|-----------|-------------|--------|
| my-paper | ✓ | v4.24.0 | MyPaper.lean | ✓ |

### Build Status
| Paper | errors | warnings | sorry count |
|-------|--------|----------|-------------|

### Missing Lean Files
| Paper | Block | Kind | Label | Status |
|-------|-------|------|-------|--------|

### Stale Imports
(list any cross-paper imports that need attention)

### Sorry Without Citation
(list any sorry missing -- Ref: comment)

### Trivial Truths (Placeholders)
(list any `True := by trivial` declarations)

### Witness Staleness
| Type | Total | Current | Stale | Pending |
|------|-------|---------|-------|---------|
| Lean | N | N | N | N |
| Python | N | N (structured) | N | N (legacy) |
```

## Checklist

- [ ] All papers with .lean files have Lake projects
- [ ] All lean-toolchain files agree on version
- [ ] All lakefile.toml files pin same Mathlib commit
- [ ] Root modules import all project .lean files
- [ ] Definition blocks all have corresponding .lean files
- [ ] No stale cross-paper imports
- [ ] All sorry have bibliographic citations
- [ ] No trivial truth placeholders (True := by trivial)
- [ ] All papers build (at least with warnings)
- [ ] All Lean witnesses are current (not stale)
- [ ] All Python computation witnesses are current (not stale)
- [ ] Legacy Python witnesses identified for migration to witness_base.py
