---
layout: default
title: Remark Audit
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/remark-audit.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/remark-audit.md) — do not edit here.

{% raw %}
# Remark Audit Skill

## Principle

**No dangling remarks.** Every `remark` block must be the interpretive
layer of a provable mathematical statement. The provable statement lives
in a `proposition`, `lemma`, `theorem`, or `corollary` block with Lean
formalization. The remark provides domain interpretation, examples,
simulations, and narrative — but cannot exist without the formal backbone.

### Block structure hierarchy

```
proposition/lemma/theorem/corollary  ← Lean formalization (provable)
  └── proof                          ← Lean proof
  └── remark (interprets: label)     ← Domain interpretation, examples
        └── simulator (optional)     ← Interactive visualization
        └── prose (optional)         ← Reader-facing narrative

prose                                ← No logical content (intros, abstracts)
```

### The two kinds of narrative

| Block kind | Has provable content? | Example |
|------------|----------------------|---------|
| `remark`   | **Yes** — interprets a prop/lem/thm | "Operator X as a form of averaging" |
| `prose`    | **No** — reader-facing only | Chapter introduction, abstract, notation conventions |

**Decision rule**: If the text makes a claim that could in principle be
stated as a Lean `theorem` or `proposition`, it belongs in a `remark`
with an `interprets` link to the formal statement. If it is purely
expository (no falsifiable claim), it is `prose`.

## What `interprets` means

The `interprets` field on a `RemarkBlock` is the label of the
provable block that this remark interprets. It establishes a formal
dependency:

```typescript
remark({
  label: "rem:some-decomposition",
  interprets: "prop:some-decomposition-identity",  // ← the formal statement
  title: "The decomposition into channels",
  uses: ["def:some-quantity", "def:some-parameter"],
});
```

The remark's `.md` file contains the domain interpretation, examples,
tables, and narrative. The proposition's `.lean` file contains the
Lean proof. They are complementary views of the same mathematical fact.

## Audit procedure

### Phase 1: Find dangling remarks

```bash
# List all remark blocks
cd content && grep -rl '"remark"' --include='*.ts' | sort

# For each remark, check if it has `interprets` field
# If not → DANGLING (needs formalization or reclassification)
```

A dangling remark is one that:
1. Has no `interprets` field, AND
2. Makes claims that could be formalized (not pure glossary or notation)

### Phase 2: Classify each dangling remark

For each dangling remark, determine:

| Classification | Action |
|---------------|--------|
| **Has provable content** | Extract the formal statement → create prop/lem/thm + Lean stub → add `interprets` link |
| **Pure glossary** (terminology wrapper) | Keep as remark with tag `"glossary"` — no `interprets` needed |
| **Pure exposition** (no falsifiable claim) | Reclassify as `prose` |
| **Speculative** (interesting but unproved) | Reclassify as `conjecture` |

### Phase 3: Formalize the provable content

For each remark upgraded to have an `interprets` target:

1. **State the proposition** in formal terms (no domain jargon).
   Identify exactly which objects, morphisms, and properties are involved.

2. **Create the Lean stub** with `sorry` and `-- Ref:` citation.

3. **Write the `.md` for the proposition** — pure math, no interpretation.

4. **Keep the remark `.md`** — domain interpretation, examples, simulations.

### Phase 4: Domain ↔ Formal term audit

For each remark, check for **ambiguous terms** that conflate informal
domain language with the formal (categorical / mathematical) object it
is supposed to denote. A remark that uses a domain term must cross-reference
the formal definition that gives that term its precise meaning.

For each domain term used in a remark, verify:

- **Is the term defined formally?** The domain word should map to a
  specific object, morphism, or property that has a `definition` block
  (and ideally a Lean declaration).
- **Which definition is referenced?** The remark's `uses[]` (or an inline
  `[text](#label)` cross-ref) must point to that formal definition.
- **Is the claimed property proved?** If the remark asserts that the
  domain phenomenon corresponds to a formal property (an involution, a
  decomposition, a vanishing), that property should be stated and
  formalized in the block the remark `interprets`.

Build a project-specific glossary mapping each recurring domain term to
its formal counterpart (the project's notation register / glossary chapter
is the source of truth). Flag any domain term used in a remark without a
cross-reference to its formal definition.

## Constraint rule

The following constraint is added to `constraints.ts`:

```typescript
{
  id: "remark-interprets",
  description: "Remark should have `interprets` linking to a provable block",
  appliesTo: ["remark"],
  severity: "warning",
  check: (block, ctx) => {
    // Skip glossary remarks (terminology wrappers)
    if (block.tags?.includes("glossary")) return null;
    // Skip if interprets is set
    if (block.interprets) return null;
    return `Remark "${block.label}" has no \`interprets\` field. ` +
      `Either add a provable block it interprets, reclassify as prose, ` +
      `or add tag "glossary" if it's a terminology wrapper.`;
  },
}
```

## Output format

```
## Remark Audit: <paper-name>

### Dangling Remarks (no `interprets`)
- **rem:foo** — <classification>: <action needed>

### Ambiguous Terms
- **rem:bar** uses "<domain term>" without a formal definition → needs ref to def:<formal-counterpart>

### Reclassifications
- **rem:baz** → prose (no provable content)
- **rem:qux** → conjecture (speculative, not proved)

### Summary
- Remarks audited: N
- Dangling: N | Glossary: N | Prose candidates: N | Conjecture candidates: N
- Fully linked: N / N
```

## Integration

- Runs **after** `content-block-review` (which checks structural integrity)
- Feeds into `formalizer` (dangling remarks become formalization targets)
- Feeds into `proof-triage` (prioritize provable content extraction)
- Complements `content-validation` (which checks schema + AST)
{% endraw %}
