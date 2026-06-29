---
name: proof-narrative-lean-equivalence
roles: [collaborator, owner]
description: >
  For each content block with both a narrative proof (.md) and a
  Lean sibling (.lean), verify the two prove the same thing. Detect
  stub-weakening (Lean claims less than the paper), overreach (Lean
  claims more than the paper), hypothesis mismatches, and notation
  drift. Produces a structured equivalence report; no edits.
allowed-tools: Read Grep Glob Bash Agent
---

# Proof Narrative ↔ Lean Equivalence Audit

## Purpose

A content block with both `.md` (narrative) and `.lean` (formal)
siblings makes two parallel claims. They should be equivalent — the
Lean statement should faithfully capture what the paper asserts, and
the Lean proof should discharge the same obligation as the narrative
proof (or explicitly mark what's deferred via `-- Ref:` sorry).

In practice they drift:

- Lean has `theorem foo : True := trivial` as a placeholder while
  the narrative asserts something substantial
- Lean proves a special case (`n = 2`) while the narrative claims
  the general result
- Lean's hypotheses are stronger than the paper's (provable trivially,
  but not matching the paper's generality)
- Lean's conclusion is weaker (existence only, not uniqueness)
- Notation drift: paper uses $\varrho$, Lean uses `gamma`
- Hypothesis count mismatch: paper says "let X, Y, Z" and Lean's
  statement takes only X

This skill catches each case.

## When to Use This Skill

- Pre-merge review of a PR that touches both `.md` and `.lean`
- After a formalization pass, before claiming a block is "proved"
- Periodic audit (monthly) to check drift across the paper
- When `proof-status-tracking` marks a block as `mathlib_ok` but
  the narrative has been substantially revised
- **Not** for tactic-level Lean review — use `lean-proof-review`
  for that

## Relationship to `lean-proof-review`

`lean-proof-review` checks:
- Does the Lean build? (type correctness)
- Is the proof stylistically clean?
- Are axiom dependencies acceptable?

`proof-narrative-lean-equivalence` asks the different question:
- **Does the Lean statement faithfully capture what the paper
  claims?**

Both skills should run on Lean-bearing blocks; they catch different
failure modes.

## Heavy-proof discipline — Class E (NEW)

### Class E — Missing narrative proof (auto-finding)

Lean has a substantive proved theorem, but the sibling `.md` has no
`**Proof.**` narrative block for it. The block describes the claim
(maybe with a title in the `.ts` manifest, or with a math statement
in prose) but does not walk through the proof.

**Detection**: enumerate theorems / instances / definitions in the
`.lean` file. For each, search the `.md` for either:
- A `Proposition (Lean: \`theorem_name\`)` header, OR
- A `*Proof.*` block within 30 lines of the theorem statement.

If neither is present → **Class E finding**.

**Resolution**: write a `**Proof.**` block per `formalizer.md`'s
"Heavy-proof discipline" section. The narrative should cite the
Lean theorem name, give a 1–3 sentence sketch (longer for inductions
or case-splits), and mention the key Mathlib lemmas / tactics used.

This class catches the "Lean is comprehensive, paper narrative
covers the high-level claims but doesn't enumerate Lean theorems"
gap. The bridge must be explicit at the theorem level for every
proved Lean result.

**Audit output**: for each Class E finding, include the Lean
theorem name, file:line of the Lean proof, and the recommended
`.md` location where the proof block should be inserted.

## The four drift classes

### Class A — Stub weakening

Lean statement is trivial while narrative is substantial.

```lean
theorem lifting_obstruction : True := trivial
```

…when the narrative claims a non-trivial obstruction theorem.
**Always a finding.** The stub exists for CI purposes but the formal
claim is absent.

### Class B — Scope mismatch

Lean proves a special case; narrative claims the general one. E.g.
narrative: "for any $n \ge 1$"; Lean: `theorem foo (n : Nat)
(h : n = 3) : ...`.

### Class C — Hypothesis drift

Count or strength of hypotheses differs. E.g. narrative:
"let $(\mathbf{C}, A, \tau)$ be the ambient structure"; Lean:
`theorem foo (C : Category) : ...` — missing the rest of the ambient
structure as a hypothesis, possibly making the claim vacuously
stronger or unsound.

### Class D — Notation drift

The symbols don't match. Paper: $\varrho \colon \mathbf{1} \to A$;
Lean: `(gamma : 1 →  A)`. Mostly cosmetic but confuses readers
cross-referencing the two views.

## Workflow

### Phase 1 — Enumerate blocks with both siblings

```bash
find "content/<paper>" -name '*.lean' -print0 | \
while IFS= read -r -d '' leanfile; do
    md="${leanfile%.lean}.md"
    ts="${leanfile%.lean}.ts"
    [ -f "$md" ] && [ -f "$ts" ] && echo "$leanfile"
done > /tmp/dual-sibling-blocks.txt
wc -l /tmp/dual-sibling-blocks.txt
```

### Phase 2 — For each target, extract the two statements

From `.lean`:

- Identify the top-level `theorem` / `lemma` / `def` / `structure`
  matching the `lean.ref` URI in the `.ts` manifest (parse with
  `parseLeanRef()` from `folio-assistant/schemas/lean-packages.ts`)
- Record: name, type signature, hypotheses, conclusion,
  proof-term-or-tactic-body

From `.md`:

- The statement block (usually separated from the proof block in
  the content-object structure: `<block>.md` is the statement,
  `<block>-proof.md` is the proof)
- Record: stated hypotheses, conclusion, level of generality

### Phase 3 — Classify each block

Apply the four drift classes. A block can hit multiple classes at
once (e.g. stub weakening + notation drift).

Optionally use MCP tools for precision:

| Check | MCP tool |
|-------|---------|
| Extract Lean declaration type | `lean_declaration_file` + `lean_hover_info` |
| Confirm statement compiles | `lean_diagnostic_messages` |
| See what the proof actually shows | `lean_goal` at the end of the proof |

### Phase 4 — Produce report

One finding per drifted block. Equivalent pairs produce an implicit
"OK" line in the summary table.

## Output format

```
## Narrative ↔ Lean Equivalence Audit

### Summary

| Blocks audited | Equivalent | Class A | Class B | Class C | Class D |
|---------------:|-----------:|--------:|--------:|--------:|--------:|
| N | N | N | N | N | N |

### Drift findings

#### <block-label> — [A|B|C|D]

**Narrative statement** (`<block>.md` lines X-Y, verified-exists ✓):
> ...quoted statement...

**Lean statement** (`<block>.lean`, decl `<name>`):
```lean
theorem <name> ... := ...
```

**Drift**:
- [A] Lean body is `trivial` / `True` / `rfl` while narrative claims
  non-trivial obstruction
- [B] Lean takes `h : n = 3`; narrative says "for any $n$"
- [C] Lean hypothesis list misses the ambient structure hypothesis
- [D] `γ` in paper is `gamma` in Lean (should match the paper's
  register conventions, AGENTS.md §7)

**Fix options**:
1. Strengthen Lean statement to match narrative; add sorry with -- Ref:
2. Weaken narrative to match Lean (only if narrative was over-claiming)
3. Document the scope split: narrative is the conjectural goal,
   Lean formalizes the special case as `lem:<block>-special`

**Owner skill**: `formalizer` (to upgrade the Lean statement) or
`scientific-accuracy` (if narrative was over-claiming)

---

### Equivalent pairs (no findings)

(table of labels confirmed equivalent — can be compressed)

### Methodology note

- Blocks sampled: <deeply / representatively / exhaustively>
- Notation-drift detection: <manual / tag-based>
- Stub-weakening detection: filter Lean files where proof body is
  one of {`trivial`, `rfl`, `True.intro`, `exact (by sorry)` with
  trivial type}
```

## Heuristics for bulk detection

Most Class-A stubs can be found by:

```bash
# Lean files where the only substantive line after ":=" is trivial/rfl/True.intro
grep -rn ':= by \(rfl\|trivial\|True.intro\)' content/**/*.lean
grep -rn ': True :=' content/**/*.lean
```

Most Class-D notation drift is reported by comparing tags against the
paper's register conventions (AGENTS.md §7): blocks in a given topic
should use the canonical symbol for that topic, not an ASCII or
alternate-symbol stand-in. Compare each block's tags to the convention
table and flag mismatches.

A one-shot bulk scan can produce the Class-A count in under 30s.
Class-B/C require reading the statement pairs; use for sampled
blocks and extrapolate.

## Integration

- **Invoked by**: `proof-editor` during comprehensive review;
  `proof-status-tracking` before marking a block as "proved"
- **Feeds**: `formalizer` (to upgrade stubs), `ontologist` (for
  Class-D register violations), `scientific-accuracy` (if narrative
  over-claims)
- **Complements**: `lean-proof-review` (correctness),
  `proof-gap-audit` (missing content), `proof-exposition-review`
  (integrating new content into old proofs)

## Role gating

- **collaborator**: may invoke and may apply fixes via dispatch to
  `formalizer`/`ontologist`
- **reader**: may run in audit-only mode (no dispatch)

## Checklist

- [ ] Dual-sibling blocks enumerated
- [ ] Class-A stubs identified via bulk grep
- [ ] Class-B/C/D findings produced with quoted statements
- [ ] Each finding has verified file paths + line numbers
- [ ] Class-D findings cross-checked against AGENTS.md §7 register
- [ ] Report includes per-class counts
- [ ] GitHub blob URLs included (default `.md` per AGENTS.md)
- [ ] No edits made; fixes are proposed, not applied
